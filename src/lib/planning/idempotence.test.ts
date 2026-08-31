// Idempotence tests [T-22]
import { describe, it, expect } from 'vitest';
import {
  hashPlanInputs,
  hashVersions,
  createPlanHash,
  verifyIdempotence,
  createPlanGeneration,
  isPlanStillValid,
} from './idempotence';

describe('Plan Idempotence [T-22]', () => {
  const baseInputs = {
    athleteAge: 35,
    athleteWeightKg: 80,
    competitionDate: '2026-11-24',
    division: 'MEN_INDIVIDUAL_OPEN',
    fiveKmTimeSeconds: 1500,
    rankedStations: ['SkiErg', 'Rowing', 'WallBalls'],
    availabilityByDay: {
      MONDAY: 60,
      TUESDAY: 60,
      WEDNESDAY: 60,
      THURSDAY: 60,
      FRIDAY: 60,
      SATURDAY: 120,
      SUNDAY: 120,
    },
    priorHyroxResult: 'COMPLETED',
  };

  const baseVersions = {
    templateIds: ['template-1', 'template-2', 'template-3'],
    templateVersions: ['1.0', '1.0', '1.0'],
    ruleSetVersion: 'ruleset-v2',
    eventStandardSetVersion: 'standards-2026',
  };

  describe('Input hashing [T-22]', () => {
    it('produces consistent hash for same inputs', () => {
      const hash1 = hashPlanInputs(baseInputs);
      const hash2 = hashPlanInputs(baseInputs);

      expect(hash1).toBe(hash2);
    });

    it('produces different hash for different inputs', () => {
      const modified = { ...baseInputs, athleteAge: 40 };
      const hash1 = hashPlanInputs(baseInputs);
      const hash2 = hashPlanInputs(modified);

      expect(hash1).not.toBe(hash2);
    });

    it('is invariant to ranked station order [T-22]', () => {
      const inputs1 = { ...baseInputs, rankedStations: ['SkiErg', 'Rowing', 'WallBalls'] };
      const inputs2 = { ...baseInputs, rankedStations: ['WallBalls', 'SkiErg', 'Rowing'] };

      // Hashes should be same (stations sorted canonically)
      const hash1 = hashPlanInputs(inputs1);
      const hash2 = hashPlanInputs(inputs2);

      expect(hash1).toBe(hash2);
    });
  });

  describe('Version hashing [T-22]', () => {
    it('produces consistent hash for same versions', () => {
      const hash1 = hashVersions(baseVersions);
      const hash2 = hashVersions(baseVersions);

      expect(hash1).toBe(hash2);
    });

    it('produces different hash for different versions [PRD 12.1]', () => {
      const modified = { ...baseVersions, ruleSetVersion: 'ruleset-v3' };
      const hash1 = hashVersions(baseVersions);
      const hash2 = hashVersions(modified);

      expect(hash1).not.toBe(hash2);
    });

    it('is invariant to template order', () => {
      const versions1 = {
        ...baseVersions,
        templateIds: ['template-1', 'template-2', 'template-3'],
      };
      const versions2 = {
        ...baseVersions,
        templateIds: ['template-3', 'template-1', 'template-2'],
      };

      // Hashes should be same (sorted canonically)
      const hash1 = hashVersions(versions1);
      const hash2 = hashVersions(versions2);

      expect(hash1).toBe(hash2);
    });
  });

  describe('Plan idempotence verification [PRD 12.1]', () => {
    it('detects when plans are idempotent', () => {
      const plan1Hash = 'abc123';
      const plan2Hash = 'abc123';

      const result = verifyIdempotence(plan1Hash, plan2Hash, baseInputs, baseInputs, baseVersions, baseVersions);

      expect(result.idempotent).toBe(true);
      expect(result.inputsMatch).toBe(true);
      expect(result.versionsMatch).toBe(true);
      expect(result.planHashMatch).toBe(true);
    });

    it('detects when inputs differ', () => {
      const plan1Hash = 'abc123';
      const plan2Hash = 'abc123';
      const modifiedInputs = { ...baseInputs, athleteAge: 45 };

      const result = verifyIdempotence(plan1Hash, plan2Hash, baseInputs, modifiedInputs, baseVersions, baseVersions);

      expect(result.idempotent).toBe(false);
      expect(result.inputsMatch).toBe(false);
    });

    it('detects when versions differ', () => {
      const plan1Hash = 'abc123';
      const plan2Hash = 'abc123';
      const modifiedVersions = { ...baseVersions, ruleSetVersion: 'ruleset-v3' };

      const result = verifyIdempotence(plan1Hash, plan2Hash, baseInputs, baseInputs, baseVersions, modifiedVersions);

      expect(result.idempotent).toBe(false);
      expect(result.versionsMatch).toBe(false);
    });
  });

  describe('Plan generation tracking [T-22]', () => {
    it('creates generation metadata with hashes', () => {
      const generation = createPlanGeneration(baseInputs, baseVersions);

      expect(generation.inputsHash).toBeDefined();
      expect(generation.versionsHash).toBeDefined();
      expect(generation.combinedHash).toBeDefined();
      expect(generation.generatedAt).toBeDefined();
      expect(generation.combinedHash.length).toBeLessThanOrEqual(16);
    });

    it('produces stable hashes across generations [PRD 12.1]', () => {
      const gen1 = createPlanGeneration(baseInputs, baseVersions);
      const gen2 = createPlanGeneration(baseInputs, baseVersions);

      expect(gen1.inputsHash).toBe(gen2.inputsHash);
      expect(gen1.versionsHash).toBe(gen2.versionsHash);
      expect(gen1.combinedHash).toBe(gen2.combinedHash);
    });
  });

  describe('Plan validity check [T-22]', () => {
    it('confirms plan is valid with same inputs and versions', () => {
      const planHash = createPlanHash(
        hashPlanInputs(baseInputs),
        hashVersions(baseVersions),
      );

      const isValid = isPlanStillValid(planHash, baseInputs, baseVersions);

      expect(isValid).toBe(true);
    });

    it('detects when inputs have changed', () => {
      const planHash = createPlanHash(
        hashPlanInputs(baseInputs),
        hashVersions(baseVersions),
      );
      const modifiedInputs = { ...baseInputs, athleteWeightKg: 85 };

      const isValid = isPlanStillValid(planHash, modifiedInputs, baseVersions);

      expect(isValid).toBe(false);
    });

    it('detects when versions have changed', () => {
      const planHash = createPlanHash(
        hashPlanInputs(baseInputs),
        hashVersions(baseVersions),
      );
      const modifiedVersions = { ...baseVersions, ruleSetVersion: 'ruleset-v3' };

      const isValid = isPlanStillValid(planHash, baseInputs, modifiedVersions);

      expect(isValid).toBe(false);
    });
  });
});
