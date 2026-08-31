// Onboarding schema validation tests [T-14]
import { describe, it, expect } from 'vitest';
import { validateStep1, validateStep2, validateStep3, validateStep4, validateStep5, validateStep6 } from './schema';

describe('Onboarding Schema Validation', () => {
  const athleteId = 'athlete-123';

  describe('Step 1: Ranked stations', () => {
    it('accepts three unique stations', () => {
      const result = validateStep1({
        athleteId,
        stationRank1: 'SkiErg',
        stationRank2: 'Rowing',
        stationRank3: 'WallBalls',
      });
      expect(result.success).toBe(true);
    });

    it('rejects duplicate stations', () => {
      const result = validateStep1({
        athleteId,
        stationRank1: 'SkiErg',
        stationRank2: 'SkiErg',
        stationRank3: 'Rowing',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing stations', () => {
      const result = validateStep1({
        athleteId,
        stationRank1: 'SkiErg',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Step 2: Athletic background', () => {
    it('accepts valid input', () => {
      const result = validateStep2({
        athleteId,
        athleticBackground: 'COMPETITIVE',
        currentWeeklyLoadMinutes: 240,
      });
      expect(result.success).toBe(true);
    });

    it('accepts zero weekly load', () => {
      const result = validateStep2({
        athleteId,
        athleticBackground: 'SEDENTARY',
        currentWeeklyLoadMinutes: 0,
      });
      expect(result.success).toBe(true);
    });

    it('rejects negative load', () => {
      const result = validateStep2({
        athleteId,
        athleticBackground: 'COMPETITIVE',
        currentWeeklyLoadMinutes: -1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Step 3: Work pattern', () => {
    it('accepts valid work patterns', () => {
      const patterns = ['SEDENTARY', 'LIGHT', 'MODERATE', 'HEAVY'];
      patterns.forEach((pattern) => {
        const result = validateStep3({
          athleteId,
          workPattern: pattern,
          physicalDemand: 'MODERATE',
        });
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid work pattern', () => {
      const result = validateStep3({
        athleteId,
        workPattern: 'INVALID',
        physicalDemand: 'MODERATE',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Step 4: Mobility screening', () => {
    it('accepts unrestricted mobility', () => {
      const result = validateStep4({
        athleteId,
        mobilityStatus: 'UNRESTRICTED',
        activePain: false,
      });
      expect(result.success).toBe(true);
    });

    it('accepts limited mobility with no pain', () => {
      const result = validateStep4({
        athleteId,
        mobilityStatus: 'LIMITED_MOBILITY',
        activePain: false,
      });
      expect(result.success).toBe(true);
    });

    it('accepts pain flag with details', () => {
      const result = validateStep4({
        athleteId,
        mobilityStatus: 'LIMITED_MOBILITY',
        activePain: true,
        painDetails: 'Knee pain from prior injury',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Step 5: Equipment', () => {
    it('accepts equipment array', () => {
      const result = validateStep5({
        athleteId,
        equipment: ['Barbell', 'Dumbbell', 'Treadmill'],
      });
      expect(result.success).toBe(true);
    });

    it('accepts empty equipment array', () => {
      const result = validateStep5({
        athleteId,
        equipment: [],
      });
      expect(result.success).toBe(true);
    });

    it('defaults to empty array if missing', () => {
      const result = validateStep5({
        athleteId,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Step 6: Availability', () => {
    it('accepts availability for all days', () => {
      const result = validateStep6({
        athleteId,
        availabilityByDay: {
          MONDAY: 60,
          TUESDAY: 60,
          WEDNESDAY: 60,
          THURSDAY: 60,
          FRIDAY: 60,
          SATURDAY: 90,
          SUNDAY: 120,
        },
      });
      expect(result.success).toBe(true);
    });

    it('accepts partial days', () => {
      const result = validateStep6({
        athleteId,
        availabilityByDay: {
          MONDAY: 60,
          WEDNESDAY: 90,
        },
      });
      expect(result.success).toBe(true);
    });

    it('accepts zero minutes on a day', () => {
      const result = validateStep6({
        athleteId,
        availabilityByDay: {
          MONDAY: 0,
        },
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid day names', () => {
      const result = validateStep6({
        athleteId,
        availabilityByDay: {
          INVALID_DAY: 60,
        } as any,
      });
      expect(result.success).toBe(false);
    });
  });
});
