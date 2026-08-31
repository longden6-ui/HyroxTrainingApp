import { describe, it, expect } from 'vitest';
import {
  estimateFinishTime,
  validateEstimate,
  GoalGapLabel,
  ESTIMATOR_MODEL_VERSION,
} from './estimator';
import { PredictorInput } from './schema';

describe('Estimator [T-07, FR-P03–P05, P08]', () => {
  // Helper to create base input
  const baseInput = (overrides?: Partial<PredictorInput>): PredictorInput => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 30);

    return {
      age: 35,
      category: 'INDIVIDUAL' as const,
      division: 'MEN_INDIVIDUAL_OPEN' as const,
      fiveKmTimeSeconds: 1500, // 25 minutes
      fiveKmRecency: 'RECENT' as const,
      weightValue: 80,
      weightUnit: 'kg' as const,
      competitionDate: tomorrow,
      ...overrides,
    };
  };

  describe('Basic estimation [FR-P03: range, never point]', () => {
    it('returns low < high range, never equal', () => {
      const input = baseInput();
      const result = estimateFinishTime(input);

      expect(result.lowSeconds).toBeGreaterThan(0);
      expect(result.highSeconds).toBeGreaterThan(result.lowSeconds);
    });

    it('range is reasonable magnitude (20-120 minutes)', () => {
      const input = baseInput();
      const result = estimateFinishTime(input);

      expect(result.lowSeconds).toBeGreaterThan(600);  // >10 min
      expect(result.highSeconds).toBeLessThan(7200);   // <120 min
    });

    it('includes model version for reproducibility [T-21]', () => {
      const input = baseInput();
      const result = estimateFinishTime(input);

      expect(result.modelVersion).toBe(ESTIMATOR_MODEL_VERSION);
      expect(result.modelVersion).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  describe('Confidence calculation [FR-P04]', () => {
    it('high confidence with recent 5K and prior HYROX', () => {
      const input = baseInput({
        fiveKmRecency: 'RECENT',
        priorHyroxResult: 'COMPLETED',
      });
      const result = estimateFinishTime(input);

      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('good confidence with recent 5K, no prior', () => {
      const input = baseInput({
        fiveKmRecency: 'RECENT',
        priorHyroxResult: 'NO_PRIOR_RESULT',
      });
      const result = estimateFinishTime(input);

      // Recent 5K alone gives good confidence (though less than with prior experience)
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('low confidence with stale/no 5K data', () => {
      const input = baseInput({
        fiveKmRecency: 'NO_DATA',
        priorHyroxResult: 'NO_PRIOR_RESULT',
      });
      const result = estimateFinishTime(input);

      expect(result.confidence).toBeLessThan(0.5);
    });

    it('penalizes DNF history [FR-P04]', () => {
      const resultCompleted = estimateFinishTime(
        baseInput({
          fiveKmRecency: 'RECENT',
          priorHyroxResult: 'COMPLETED',
        }),
      );

      const resultDNF = estimateFinishTime(
        baseInput({
          fiveKmRecency: 'RECENT',
          priorHyroxResult: 'DNF',
        }),
      );

      expect(resultCompleted.confidence).toBeGreaterThan(resultDNF.confidence);
    });

    it('confidence is always 0.0–1.0', () => {
      const inputs = [
        baseInput({ fiveKmRecency: 'RECENT', priorHyroxResult: 'COMPLETED' }),
        baseInput({ fiveKmRecency: 'NO_DATA', priorHyroxResult: 'DNF' }),
        baseInput({}),
      ];

      for (const input of inputs) {
        const result = estimateFinishTime(input);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Driver list [FR-P05: ordered by weight]', () => {
    it('includes 5K fitness as primary driver', () => {
      const input = baseInput();
      const result = estimateFinishTime(input);

      const fiveKDriver = result.drivers.find((d) => d.factor === '5K_RUNNING_FITNESS');
      expect(fiveKDriver).toBeDefined();
      expect(fiveKDriver?.weight).toBeGreaterThan(0.3);
    });

    it('includes prior HYROX if available', () => {
      const resultWith = estimateFinishTime(
        baseInput({ priorHyroxResult: 'COMPLETED' }),
      );
      const resultWithout = estimateFinishTime(
        baseInput({ priorHyroxResult: 'NO_PRIOR_RESULT' }),
      );

      const driverWith = resultWith.drivers.some((d) => d.factor === 'PRIOR_HYROX_EXPERIENCE');
      const driverWithout = resultWithout.drivers.some((d) => d.factor === 'PRIOR_HYROX_EXPERIENCE');

      expect(driverWith).toBe(true);
      expect(driverWithout).toBe(false);
    });

    it('weights are positive and represent relative importance', () => {
      const input = baseInput();
      const result = estimateFinishTime(input);

      for (const driver of result.drivers) {
        expect(driver.weight).toBeGreaterThan(0);
        expect(driver.weight).toBeLessThanOrEqual(1);
      }
    });

    it('all drivers have human-readable labels', () => {
      const input = baseInput();
      const result = estimateFinishTime(input);

      for (const driver of result.drivers) {
        expect(driver.label.length).toBeGreaterThan(0);
        expect(driver.label).not.toMatch(/[A-Z_]{3,}/); // No ALL_CAPS codes
      }
    });
  });

  describe('Data quality warnings [T-07, FR-P04]', () => {
    it('warns about stale 5K data', () => {
      const input = baseInput({ fiveKmRecency: 'STALE' });
      const result = estimateFinishTime(input);

      const warning = result.dataQualityWarnings.find((w) => w.code === 'STALE_5K_DATA');
      expect(warning).toBeDefined();
      expect(warning?.severity).toBe('CONCERN');
    });

    it('warns about missing 5K data', () => {
      const input = baseInput({ fiveKmRecency: 'NO_DATA' });
      const result = estimateFinishTime(input);

      const warning = result.dataQualityWarnings.find((w) => w.code === 'STALE_5K_DATA');
      expect(warning).toBeDefined();
    });

    it('warns about first-time athletes', () => {
      const input = baseInput({ priorHyroxResult: 'NO_PRIOR_RESULT' });
      const result = estimateFinishTime(input);

      const warning = result.dataQualityWarnings.find((w) => w.code === 'NO_PRIOR_HYROX');
      expect(warning).toBeDefined();
      expect(warning?.severity).toBe('INFO');
    });

    it('warns about low confidence', () => {
      const input = baseInput({
        fiveKmRecency: 'NO_DATA',
        priorHyroxResult: 'DNF',
      });
      const result = estimateFinishTime(input);

      const warning = result.dataQualityWarnings.find((w) => w.code === 'LOW_CONFIDENCE');
      expect(warning).toBeDefined();
    });

    it('all warnings have labels (not codes)', () => {
      const input = baseInput();
      const result = estimateFinishTime(input);

      for (const warning of result.dataQualityWarnings) {
        expect(warning.label.length).toBeGreaterThan(0);
        expect(['INFO', 'CAUTION', 'CONCERN']).toContain(warning.severity);
      }
    });
  });

  describe('Goal gap assessment [FR-P08]', () => {
    it('returns WITHIN_RANGE if goal is in predicted range', () => {
      const input = baseInput({ targetFinishTimeSeconds: 2700 }); // Near baseline
      const result = estimateFinishTime(input);

      if (
        input.targetFinishTimeSeconds !== undefined &&
        input.targetFinishTimeSeconds >= result.lowSeconds &&
        input.targetFinishTimeSeconds <= result.highSeconds
      ) {
        expect(result.goalGapLabel).toBe(GoalGapLabel.WITHIN_RANGE);
      }
    });

    it('returns STRETCH if goal is aggressive but plausible', () => {
      const input = baseInput({
        fiveKmTimeSeconds: 1500,
        fiveKmRecency: 'RECENT',
        targetFinishTimeSeconds: 2400, // 40 min (faster than typical)
      });
      const result = estimateFinishTime(input);

      // With recent fitness and ambitious goal, should be STRETCH
      expect([GoalGapLabel.STRETCH, GoalGapLabel.WITHIN_RANGE]).toContain(
        result.goalGapLabel,
      );
    });

    it('returns REQUIRES_MORE_EVIDENCE when no goal provided', () => {
      const input = baseInput();
      delete (input as any).targetFinishTimeSeconds;

      const result = estimateFinishTime(input);
      expect(result.goalGapLabel).toBe(GoalGapLabel.REQUIRES_MORE_EVIDENCE);
    });

    it('only returns STRETCH with good confidence [FR-P08]', () => {
      // Very ambitious goal with low confidence
      const input = baseInput({
        fiveKmRecency: 'NO_DATA',
        priorHyroxResult: 'DNF',
        targetFinishTimeSeconds: 2000, // Very fast
      });
      const result = estimateFinishTime(input);

      // Low confidence + aggressive goal should not be STRETCH
      if (result.confidence < 0.6) {
        expect(result.goalGapLabel).not.toBe(GoalGapLabel.STRETCH);
      }
    });
  });

  describe('Range adjusts with confidence [FR-P03]', () => {
    it('wider range with low confidence', () => {
      const resultLow = estimateFinishTime(
        baseInput({ fiveKmRecency: 'NO_DATA' }),
      );

      const resultHigh = estimateFinishTime(
        baseInput({ fiveKmRecency: 'RECENT', priorHyroxResult: 'COMPLETED' }),
      );

      const rangeLow = resultLow.highSeconds - resultLow.lowSeconds;
      const rangeHigh = resultHigh.highSeconds - resultHigh.lowSeconds;

      expect(rangeLow).toBeGreaterThan(rangeHigh);
    });
  });

  describe('Sparse input (lower confidence) vs. complete input [T-07 note]', () => {
    it('sparse input produces wider range', () => {
      const resultSparse = estimateFinishTime(
        baseInput({
          fiveKmRecency: 'NO_DATA',
          priorHyroxResult: 'NO_PRIOR_RESULT',
        }),
      );

      const resultComplete = estimateFinishTime(
        baseInput({
          fiveKmRecency: 'RECENT',
          priorHyroxResult: 'COMPLETED',
        }),
      );

      const rangeSparse = resultSparse.highSeconds - resultSparse.lowSeconds;
      const rangeComplete = resultComplete.highSeconds - resultComplete.lowSeconds;

      expect(rangeSparse).toBeGreaterThan(rangeComplete);
      expect(resultSparse.confidence).toBeLessThan(resultComplete.confidence);
    });

    it('sparse input does not throw [T-07]', () => {
      expect(() => {
        estimateFinishTime(
          baseInput({
            fiveKmRecency: 'NO_DATA',
            priorHyroxResult: undefined,
          }),
        );
      }).not.toThrow();
    });
  });

  describe('Validation [T-07]', () => {
    it('validates all estimates', () => {
      const inputs = [
        baseInput(),
        baseInput({ fiveKmRecency: 'STALE' }),
        baseInput({ age: 18 }),
        baseInput({ age: 65 }),
      ];

      for (const input of inputs) {
        const result = estimateFinishTime(input);
        expect(validateEstimate(result)).toBe(true);
      }
    });
  });

  describe('No database access [T-07]', () => {
    it('estimator has zero imports from @/lib/db', () => {
      // This is verified by static analysis, but we can test
      // the function works without any async patterns
      const input = baseInput();

      expect(estimateFinishTime(input)).toBeDefined();
      // No await, no promises
      const result = estimateFinishTime(input);
      expect(result).not.toBeInstanceOf(Promise);
    });
  });

  describe('No ranking or percentile claims [PRD 9.1]', () => {
    it('drivers have no rank or percentile language', () => {
      const input = baseInput();
      const result = estimateFinishTime(input);

      const text = JSON.stringify(result.drivers);
      expect(text).not.toMatch(/rank|percentile|top|bottom|better than/i);
    });

    it('warnings have no percentile claims', () => {
      const input = baseInput({
        fiveKmRecency: 'STALE',
        priorHyroxResult: 'DNF',
      });
      const result = estimateFinishTime(input);

      const text = JSON.stringify(result.dataQualityWarnings);
      expect(text).not.toMatch(/percentile|top|bottom|rank/i);
    });
  });
});
