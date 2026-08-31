// Athlete schema tests [T-24, T-25]
import { describe, it, expect } from 'vitest';
import { validateSessionCheckIn, sessionCheckInSchema, completeSessionPayload } from './schema';

describe('Session check-in validation [T-25]', () => {
  describe('Valid check-ins', () => {
    it('accepts valid check-in with required fields', () => {
      const data = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        rpe: 6,
        actualDurationMinutes: 45,
      };

      const result = validateSessionCheckIn(data);
      expect(result.valid).toBe(true);
      expect(result.data?.rpe).toBe(6);
    });

    it('accepts check-in with pain reporting', () => {
      const data = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        rpe: 5,
        actualDurationMinutes: 50,
        painReported: true,
        painSeverity: 'MILD',
      };

      const result = validateSessionCheckIn(data);
      expect(result.valid).toBe(true);
      expect(result.data?.painSeverity).toBe('MILD');
    });

    it('accepts check-in with mobility limitations [PRD 7.3]', () => {
      const data = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        rpe: 4,
        actualDurationMinutes: 40,
        mobilityReported: true,
        mobilityLimitations: ['KNEES', 'LOWER_BACK'],
      };

      const result = validateSessionCheckIn(data);
      expect(result.valid).toBe(true);
      expect(result.data?.mobilityLimitations).toContain('KNEES');
    });

    it('accepts check-in with substitutions performed', () => {
      const data = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        rpe: 7,
        actualDurationMinutes: 60,
        substitutionsPerformed: ['Rowing', 'SkiErg'],
        notes: 'Knee was tight so skipped SkiErg and did Rowing instead',
      };

      const result = validateSessionCheckIn(data);
      expect(result.valid).toBe(true);
      expect(result.data?.substitutionsPerformed).toHaveLength(2);
      expect(result.data?.notes).toContain('Knee');
    });
  });

  describe('RPE validation [T-25]', () => {
    it('rejects RPE below 1', () => {
      const data = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        rpe: 0,
        actualDurationMinutes: 45,
      };

      const result = validateSessionCheckIn(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'rpe')).toBe(true);
    });

    it('rejects RPE above 10', () => {
      const data = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        rpe: 11,
        actualDurationMinutes: 45,
      };

      const result = validateSessionCheckIn(data);
      expect(result.valid).toBe(false);
    });

    it('accepts all valid RPE values 1-10', () => {
      for (let rpe = 1; rpe <= 10; rpe++) {
        const data = {
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          rpe,
          actualDurationMinutes: 45,
        };

        const result = validateSessionCheckIn(data);
        expect(result.valid).toBe(true);
      }
    });
  });

  describe('Duration validation [T-25]', () => {
    it('accepts 0 minutes (skipped session)', () => {
      const data = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        rpe: 1,
        actualDurationMinutes: 0,
      };

      const result = validateSessionCheckIn(data);
      expect(result.valid).toBe(true);
    });

    it('rejects negative duration', () => {
      const data = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        rpe: 5,
        actualDurationMinutes: -1,
      };

      const result = validateSessionCheckIn(data);
      expect(result.valid).toBe(false);
    });

    it('accepts duration up to 600 minutes (10 hours)', () => {
      const data = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        rpe: 5,
        actualDurationMinutes: 600,
      };

      const result = validateSessionCheckIn(data);
      expect(result.valid).toBe(true);
    });
  });

  describe('Session ID validation [T-25]', () => {
    it('rejects invalid UUID', () => {
      const data = {
        sessionId: 'not-a-uuid',
        rpe: 5,
        actualDurationMinutes: 45,
      };

      const result = validateSessionCheckIn(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'sessionId')).toBe(true);
    });
  });

  describe('Notes field [T-25]', () => {
    it('accepts notes up to 1000 characters', () => {
      const longNotes = 'a'.repeat(1000);
      const data = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        rpe: 5,
        actualDurationMinutes: 45,
        notes: longNotes,
      };

      const result = validateSessionCheckIn(data);
      expect(result.valid).toBe(true);
    });

    it('rejects notes exceeding 1000 characters', () => {
      const tooLongNotes = 'a'.repeat(1001);
      const data = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        rpe: 5,
        actualDurationMinutes: 45,
        notes: tooLongNotes,
      };

      const result = validateSessionCheckIn(data);
      expect(result.valid).toBe(false);
    });
  });

  describe('Complete session payload validation', () => {
    it('validates complete session payload', () => {
      const payload = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        rpe: 7,
        actualDurationMinutes: 50,
        painReported: false,
        painSeverity: 'NONE',
        mobilityReported: false,
        mobilityLimitations: [],
        substitutionsPerformed: [],
      };

      const result = completeSessionPayload.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects payload with invalid pain severity', () => {
      const payload = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        rpe: 5,
        actualDurationMinutes: 45,
        painReported: true,
        painSeverity: 'EXTREME', // Invalid
        mobilityReported: false,
        mobilityLimitations: [],
        substitutionsPerformed: [],
      };

      const result = completeSessionPayload.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });
});
