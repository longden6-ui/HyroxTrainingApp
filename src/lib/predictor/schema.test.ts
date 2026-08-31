import { describe, it, expect } from 'vitest';
import { validatePredictorInput, PredictorInput } from './schema';

describe('Predictor Input Validation [T-06, US-01]', () => {
  // Helper to create a valid input
  const validInput = (overrides?: Partial<PredictorInput>) => {
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
      competitionDate: tomorrow.toISOString(),
      ...overrides,
    };
  };

  describe('Happy path: valid complete input', () => {
    it('accepts fully specified input', () => {
      const input = validInput({
        targetFinishTimeSeconds: 2700,
        priorHyroxResult: 'COMPLETED',
      });

      const result = validatePredictorInput(input);
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toEqual({});
    });

    it('accepts minimal input (no target, no prior)', () => {
      const input = validInput();
      const result = validatePredictorInput(input);

      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('Age validation', () => {
    it('rejects age < 16 [T-06 open question 5]', () => {
      const input = validInput({ age: 15 });
      const result = validatePredictorInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors.age).toMatch(/16 or older/i);
    });

    it('rejects age > 120', () => {
      const input = validInput({ age: 121 });
      const result = validatePredictorInput(input);

      expect(result.valid).toBe(false);
    });

    it('accepts edge case: age 16', () => {
      const input = validInput({ age: 16 });
      const result = validatePredictorInput(input);

      expect(result.valid).toBe(true);
    });

    it('rejects non-integer age', () => {
      const input = validInput({ age: 35.5 } as any);
      const result = validatePredictorInput(input);

      expect(result.valid).toBe(false);
    });
  });

  describe('5K time validation', () => {
    it('rejects 5K < 15 minutes', () => {
      const input = validInput({ fiveKmTimeSeconds: 899 });
      const result = validatePredictorInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors.fiveKmTimeSeconds).toMatch(/realistic/i);
    });

    it('rejects 5K > 60 minutes', () => {
      const input = validInput({ fiveKmTimeSeconds: 3601 });
      const result = validatePredictorInput(input);

      expect(result.valid).toBe(false);
    });

    it('accepts edge cases: 15 min and 60 min', () => {
      expect(validatePredictorInput(validInput({ fiveKmTimeSeconds: 900 })).valid).toBe(true);
      expect(validatePredictorInput(validInput({ fiveKmTimeSeconds: 3600 })).valid).toBe(true);
    });

    it('rejects non-integer 5K time', () => {
      const input = validInput({ fiveKmTimeSeconds: 1500.5 } as any);
      const result = validatePredictorInput(input);

      expect(result.valid).toBe(false);
    });
  });

  describe('Weight validation', () => {
    it('converts kg to grams and validates bounds', () => {
      const input = validInput({ weightValue: 80, weightUnit: 'kg' });
      const result = validatePredictorInput(input);

      expect(result.valid).toBe(true);
      expect(result.data?.weightValue).toBe(80000); // grams
    });

    it('converts lb to grams and validates bounds', () => {
      const input = validInput({ weightValue: 176.4, weightUnit: 'lb' });
      const result = validatePredictorInput(input);

      expect(result.valid).toBe(true);
      expect(result.data?.weightValue).toBeCloseTo(80000, -1); // ~80kg
    });

    it('rejects weight below minimum (30 kg)', () => {
      const input = validInput({ weightValue: 29.9, weightUnit: 'kg' });
      const result = validatePredictorInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors.weightValue).toMatch(/between.*kg/i);
    });

    it('rejects weight above maximum (200 kg)', () => {
      const input = validInput({ weightValue: 200.1, weightUnit: 'kg' });
      const result = validatePredictorInput(input);

      expect(result.valid).toBe(false);
    });

    it('rejects negative or zero weight', () => {
      expect(validatePredictorInput(validInput({ weightValue: 0 })).valid).toBe(false);
      expect(validatePredictorInput(validInput({ weightValue: -80 })).valid).toBe(false);
    });
  });

  describe('Competition date validation [T-06, T-17 open question 13]', () => {
    it('rejects past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const input = validInput({ competitionDate: yesterday.toISOString() });
      const result = validatePredictorInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors.competitionDate).toMatch(/at least 1 day away/i);
    });

    it('rejects dates > 365 days in future [T-06 open question 13]', () => {
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 366);

      const input = validInput({ competitionDate: farFuture.toISOString() });
      const result = validatePredictorInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors.competitionDate).toMatch(/planning horizon/i);
    });

    it('accepts edge cases: 1 day and 365 days away', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 365);

      expect(validatePredictorInput(validInput({ competitionDate: tomorrow.toISOString() })).valid).toBe(true);
      expect(validatePredictorInput(validInput({ competitionDate: farFuture.toISOString() })).valid).toBe(true);
    });
  });

  describe('Target time validation (optional)', () => {
    it('accepts omitted target time', () => {
      const input = validInput();
      delete (input as any).targetFinishTimeSeconds;

      const result = validatePredictorInput(input);
      expect(result.valid).toBe(true);
    });

    it('rejects target < 15 minutes', () => {
      const input = validInput({ targetFinishTimeSeconds: 899 });
      const result = validatePredictorInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors.targetFinishTimeSeconds).toMatch(/15 minutes/i);
    });

    it('rejects target > 4 hours', () => {
      const input = validInput({ targetFinishTimeSeconds: 14401 });
      const result = validatePredictorInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors.targetFinishTimeSeconds).toMatch(/4 hours/i);
    });

    it('accepts edge cases: 15 min and 4 hours', () => {
      expect(validatePredictorInput(validInput({ targetFinishTimeSeconds: 900 })).valid).toBe(true);
      expect(validatePredictorInput(validInput({ targetFinishTimeSeconds: 14400 })).valid).toBe(true);
    });
  });

  describe('Recency band validation', () => {
    const validRecencies = ['RECENT', '3_MONTHS', '6_MONTHS', 'STALE', 'NO_DATA'];

    for (const recency of validRecencies) {
      it(`accepts recency: ${recency}`, () => {
        const input = validInput({ fiveKmRecency: recency as any });
        const result = validatePredictorInput(input);

        expect(result.valid).toBe(true);
      });
    }

    it('rejects invalid recency', () => {
      const input = validInput({ fiveKmRecency: 'INVALID' as any });
      const result = validatePredictorInput(input);

      expect(result.valid).toBe(false);
    });
  });

  describe('Division validation', () => {
    it('rejects invalid division', () => {
      const input = validInput({ division: 'INVALID_DIVISION' as any });
      const result = validatePredictorInput(input);

      expect(result.valid).toBe(false);
    });

    it('accepts all valid divisions', () => {
      const divisions = [
        'WOMEN_INDIVIDUAL_OPEN',
        'MEN_INDIVIDUAL_OPEN',
        'WOMEN_INDIVIDUAL_PRO',
        'MEN_INDIVIDUAL_PRO',
        'MIXED_TEAM',
      ];

      for (const div of divisions) {
        const input = validInput({ division: div as any });
        const result = validatePredictorInput(input);

        expect(result.valid).toBe(true);
      }
    });
  });

  describe('Error reporting [US-01 criterion 2]', () => {
    it('reports field-level errors, not thrown exception', () => {
      const invalidInput = {
        age: -5,
        fiveKmTimeSeconds: 0,
        weightValue: -80,
        competitionDate: 'invalid-date',
        division: 'INVALID',
        fiveKmRecency: 'INVALID',
      };

      const result = validatePredictorInput(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
    });

    it('includes human-readable error messages', () => {
      const input = validInput({ age: 10 });
      const result = validatePredictorInput(input);

      expect(result.errors.age).toBeTruthy();
      expect(result.errors.age.length).toBeGreaterThan(0);
    });
  });

  describe('Multiple validation errors [US-01 criterion 2]', () => {
    it('captures multiple errors at once', () => {
      const input = validInput({
        age: -5,
        fiveKmTimeSeconds: 100,
        weightValue: 0,
      });

      const result = validatePredictorInput(input);

      expect(result.valid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThanOrEqual(3);
    });
  });
});
