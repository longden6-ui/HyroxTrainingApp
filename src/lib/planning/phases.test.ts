// Phase calculation tests [T-17]
import { describe, it, expect } from 'vitest';
import { calculateTrainingPhases, getPhaseForDate } from './phases';

describe('Phase Calculation [T-17]', () => {
  describe('Normal planning horizon', () => {
    it('calculates phases for 12-week training plan', () => {
      const start = new Date('2026-09-01T00:00:00Z');
      const race = new Date('2026-11-24T00:00:00Z'); // 84 days later
      const result = calculateTrainingPhases(start, race);

      expect(result.success).toBe(true);
      expect(result.phases).toBeDefined();

      if (result.phases) {
        expect(result.phases.foundationStart.getTime()).toBeLessThanOrEqual(start.getTime() + 86400000); // Within 1 day
        expect(result.phases.raceDate.getTime()).toBeLessThanOrEqual(race.getTime() + 86400000);
        // Should have all 6 phases
        expect(result.phases.foundationEnd <= result.phases.developmentStart).toBe(true);
        expect(result.phases.developmentEnd <= result.phases.raceSpecificStart).toBe(true);
        expect(result.phases.raceSpecificEnd <= result.phases.peakStart).toBe(true);
        expect(result.phases.peakEnd <= result.phases.taperStart).toBe(true);
        expect(result.phases.taperEnd <= result.phases.raceWeekStart).toBe(true);
      }
    });

    it('calculates phases for 16-week training plan', () => {
      const start = new Date('2026-08-01T00:00:00Z');
      const race = new Date('2026-11-14T00:00:00Z'); // 105 days later
      const result = calculateTrainingPhases(start, race);

      expect(result.success).toBe(true);
      expect(result.phases).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('rejects race date before start date', () => {
      const start = new Date('2026-11-01T00:00:00Z');
      const race = new Date('2026-09-01T00:00:00Z');
      const result = calculateTrainingPhases(start, race);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Start date must be before race date');
    });

    it('rejects same start and race date', () => {
      const date = new Date('2026-09-01T00:00:00Z');
      const result = calculateTrainingPhases(date, date);

      expect(result.success).toBe(false);
    });

    it('rejects horizon too short (less than 57 days minimum)', () => {
      const start = new Date('2026-09-01');
      const race = new Date('2026-09-15T00:00:00Z'); // 14 days later
      const result = calculateTrainingPhases(start, race);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient planning horizon');
    });

    it('accepts minimum viable horizon (77 days)', () => {
      const start = new Date('2026-09-01T00:00:00Z');
      const race = new Date('2026-11-17T00:00:00Z'); // Exactly 77 days
      const result = calculateTrainingPhases(start, race);

      expect(result.success).toBe(true);
    });

    // TODO: Debug 40-week horizon allocation edge case
    // it('accepts very long horizon (40 weeks)', () => {
    //   const start = new Date('2026-01-01T00:00:00Z');
    //   const race = new Date('2026-10-22T00:00:00Z'); // 294 days later, ~42 weeks
    //   const result = calculateTrainingPhases(start, race);
    //   expect(result.success).toBe(true);
    // });
  });

  describe('No zero-length phases', () => {
    it('ensures all phases have positive length', () => {
      const start = new Date('2026-09-01T00:00:00Z');
      const race = new Date('2026-11-24T00:00:00Z'); // 84 days
      const result = calculateTrainingPhases(start, race);

      expect(result.success).toBe(true);

      if (result.phases) {
        const phases = [
          {
            name: 'Foundation',
            start: result.phases.foundationStart,
            end: result.phases.foundationEnd,
          },
          {
            name: 'Development',
            start: result.phases.developmentStart,
            end: result.phases.developmentEnd,
          },
          {
            name: 'Race Specific',
            start: result.phases.raceSpecificStart,
            end: result.phases.raceSpecificEnd,
          },
          { name: 'Peak', start: result.phases.peakStart, end: result.phases.peakEnd },
          { name: 'Taper', start: result.phases.taperStart, end: result.phases.taperEnd },
          { name: 'Race Week', start: result.phases.raceWeekStart, end: result.phases.raceDate },
        ];

        phases.forEach((phase) => {
          const days = Math.floor((phase.end.getTime() - phase.start.getTime()) / (1000 * 60 * 60 * 24));
          expect(days).toBeGreaterThan(0);
        });
      }
    });
  });

  describe('No overlapping phases', () => {
    it('ensures phases do not overlap', () => {
      const start = new Date('2026-09-01T00:00:00Z');
      const race = new Date('2026-11-24T00:00:00Z');
      const result = calculateTrainingPhases(start, race);

      expect(result.success).toBe(true);

      if (result.phases) {
        const phases = [
          { end: result.phases.foundationEnd, nextStart: result.phases.developmentStart },
          { end: result.phases.developmentEnd, nextStart: result.phases.raceSpecificStart },
          { end: result.phases.raceSpecificEnd, nextStart: result.phases.peakStart },
          { end: result.phases.peakEnd, nextStart: result.phases.taperStart },
          { end: result.phases.taperEnd, nextStart: result.phases.raceWeekStart },
        ];

        phases.forEach((adjacentPhases) => {
          expect(adjacentPhases.end <= adjacentPhases.nextStart).toBe(true);
        });
      }
    });
  });

  describe('getPhaseForDate', () => {
    it('identifies phase for a given date', () => {
      const start = new Date('2026-09-01T00:00:00Z');
      const race = new Date('2026-11-24T00:00:00Z');
      const result = calculateTrainingPhases(start, race);

      expect(result.success).toBe(true);

      if (result.phases) {
        const foundationMid = new Date('2026-09-15T00:00:00Z');
        expect(getPhaseForDate(foundationMid, result.phases)).toBe('FOUNDATION');

        const developmentMid = new Date('2026-10-01T00:00:00Z');
        expect(getPhaseForDate(developmentMid, result.phases)).toBe('DEVELOPMENT');

        const raceDay = race;
        expect(getPhaseForDate(raceDay, result.phases)).toBe('RACE_WEEK');
      }
    });

    it('returns null for date outside plan', () => {
      const start = new Date('2026-09-01T00:00:00Z');
      const race = new Date('2026-11-24T00:00:00Z');
      const result = calculateTrainingPhases(start, race);

      expect(result.success).toBe(true);

      if (result.phases) {
        const beforeStart = new Date('2026-08-01T00:00:00Z');
        expect(getPhaseForDate(beforeStart, result.phases)).toBeNull();

        const afterRace = new Date('2026-12-01T00:00:00Z');
        expect(getPhaseForDate(afterRace, result.phases)).toBeNull();
      }
    });
  });
});
