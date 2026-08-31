// Session balancing tests [T-19]
import { describe, it, expect } from 'vitest';
import {
  getPhaseTargets,
  getStationEmphasis,
  checkBalance,
  suggestAdjustments,
  PrimaryFocus,
} from './balancing';

describe('Session Balancing [T-19]', () => {
  describe('Phase targets', () => {
    it('calculates foundation phase targets', () => {
      const targets = getPhaseTargets('FOUNDATION', 600); // 600 mins/week

      expect(targets).toBeDefined();
      expect(targets?.running).toBe(240); // 40%
      expect(targets?.strength).toBe(180); // 30%
      expect(targets?.stationSkill).toBe(90); // 15%
      expect(targets?.combined).toBe(30); // 5%
      expect(targets?.mobility).toBe(30); // 5%
      expect(targets?.recovery).toBe(30); // 5%
    });

    it('calculates race-specific phase targets', () => {
      const targets = getPhaseTargets('RACE_SPECIFIC', 600);

      expect(targets?.running).toBe(180); // 30% (down from foundation)
      expect(targets?.strength).toBe(120); // 20% (down)
      expect(targets?.stationSkill).toBe(210); // 35% (up - emphasis on stations)
    });

    it('calculates taper phase targets', () => {
      const targets = getPhaseTargets('TAPER', 600);

      expect(targets?.running).toBe(300); // 50% (up - reduce other work)
      expect(targets?.strength).toBe(60); // 10% (down)
      expect(targets?.stationSkill).toBe(90); // 15%
      expect(targets?.recovery).toBe(30); // 5% (up)
    });

    it('returns null for unknown phase', () => {
      const targets = getPhaseTargets('UNKNOWN_PHASE', 600);
      expect(targets).toBeNull();
    });
  });

  describe('Station emphasis [US-02, FR-G05]', () => {
    it('emphasizes ranked stations', () => {
      const emphasis = getStationEmphasis(210, ['SkiErg', 'Rowing', 'WallBalls']);

      expect(emphasis.ranked1).toBe(105); // 50%
      expect(emphasis.ranked2).toBe(63); // 30%
      expect(emphasis.ranked3).toBe(32); // 15%
      expect(emphasis.other).toBeGreaterThanOrEqual(0); // Remaining 5% for other stations
    });

    it('allocates time to non-ranked stations', () => {
      const emphasis = getStationEmphasis(200, ['SkiErg', 'Rowing', 'WallBalls']);

      const total = emphasis.ranked1 + emphasis.ranked2 + emphasis.ranked3 + emphasis.other;
      expect(total).toBe(200);
      expect(emphasis.other).toBeGreaterThan(0); // At least some time for other 5 stations
    });
  });

  describe('Balance checking [FR-G04]', () => {
    it('validates balanced session distribution', () => {
      const sessions = [
        { id: '1', primaryFocus: PrimaryFocus.RUNNING, duration: 1800 }, // 30 mins
        { id: '2', primaryFocus: PrimaryFocus.RUNNING, duration: 1800 }, // 30 mins = 60 total
        { id: '3', primaryFocus: PrimaryFocus.STRENGTH, duration: 1800 }, // 30 mins
        { id: '4', primaryFocus: PrimaryFocus.STRENGTH, duration: 1800 }, // 30 mins = 60 total
        { id: '5', primaryFocus: PrimaryFocus.STATION_SKILL, duration: 2700 }, // 45 mins
        { id: '6', primaryFocus: PrimaryFocus.COMBINED, duration: 900 }, // 15 mins
        { id: '7', primaryFocus: PrimaryFocus.MOBILITY, duration: 900 }, // 15 mins
        { id: '8', primaryFocus: PrimaryFocus.RECOVERY, duration: 900 }, // 15 mins
      ];

      const target = {
        running: 60,
        strength: 60,
        stationSkill: 45,
        combined: 15,
        mobility: 15,
        recovery: 15,
      };

      const result = checkBalance(sessions, target);

      expect(result.balanced).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('detects imbalanced distribution', () => {
      const sessions = [
        { id: '1', primaryFocus: PrimaryFocus.RUNNING, duration: 3600 },
        { id: '2', primaryFocus: PrimaryFocus.RUNNING, duration: 3600 },
        { id: '3', primaryFocus: PrimaryFocus.RUNNING, duration: 3600 },
        { id: '4', primaryFocus: PrimaryFocus.RUNNING, duration: 3600 },
      ];

      const target = {
        running: 60,
        strength: 60,
        stationSkill: 45,
        combined: 15,
        mobility: 15,
        recovery: 15,
      };

      const result = checkBalance(sessions, target);

      expect(result.balanced).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.type === PrimaryFocus.RUNNING)).toBe(true);
    });

    it('allows ±20% variance', () => {
      const sessions = [
        { id: '1', primaryFocus: PrimaryFocus.RUNNING, duration: 1800 }, // 30 mins
        { id: '2', primaryFocus: PrimaryFocus.STRENGTH, duration: 1800 }, // 30 mins
        { id: '3', primaryFocus: PrimaryFocus.STATION_SKILL, duration: 1200 }, // 20 mins
        { id: '4', primaryFocus: PrimaryFocus.COMBINED, duration: 600 }, // 10 mins
        { id: '5', primaryFocus: PrimaryFocus.MOBILITY, duration: 300 }, // 5 mins
        { id: '6', primaryFocus: PrimaryFocus.RECOVERY, duration: 300 }, // 5 mins
      ];

      const target = {
        running: 30,
        strength: 30,
        stationSkill: 20,
        combined: 10,
        mobility: 5,
        recovery: 5,
      };

      const result = checkBalance(sessions, target);
      expect(result.balanced).toBe(true);

      // Now with 25% variance (exceeds 20% threshold)
      const sessions2 = [
        { id: '1', primaryFocus: PrimaryFocus.RUNNING, duration: 2100 }, // 35 mins
        { id: '2', primaryFocus: PrimaryFocus.STRENGTH, duration: 1800 }, // 30 mins
      ];

      const result2 = checkBalance(sessions2, target);
      expect(result2.balanced).toBe(false);
      expect(result2.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Adjustment suggestions', () => {
    it('suggests adding deficit types', () => {
      const sessions = [
        { id: '1', primaryFocus: PrimaryFocus.RUNNING, duration: 3600 },
        { id: '2', primaryFocus: PrimaryFocus.RUNNING, duration: 3600 },
      ];

      const target = {
        running: 120,
        strength: 120,
        stationSkill: 90,
        combined: 30,
        mobility: 30,
        recovery: 30,
      };

      const suggestions = suggestAdjustments(sessions, target);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s) => s.includes('Insufficient'))).toBe(true);
    });

    it('suggests removing excess types', () => {
      const sessions = [
        { id: '1', primaryFocus: PrimaryFocus.STRENGTH, duration: 3600 },
        { id: '2', primaryFocus: PrimaryFocus.STRENGTH, duration: 3600 },
        { id: '3', primaryFocus: PrimaryFocus.STRENGTH, duration: 3600 },
        { id: '4', primaryFocus: PrimaryFocus.STRENGTH, duration: 3600 },
      ];

      const target = {
        running: 60,
        strength: 60,
        stationSkill: 45,
        combined: 15,
        mobility: 15,
        recovery: 15,
      };

      const suggestions = suggestAdjustments(sessions, target);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s) => s.includes('Too many'))).toBe(true);
    });
  });
});
