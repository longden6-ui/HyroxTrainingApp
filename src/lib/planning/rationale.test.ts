// Rationale and traceability tests [T-21]
import { describe, it, expect } from 'vitest';
import { generateSessionRationale, generatePlanRationale, verifyTraceability, reconstructSessionOrigin } from './rationale';

describe('Rationale and Traceability [T-21]', () => {
  describe('Session rationale generation [FR-G09]', () => {
    it('generates rationale for running session', () => {
      const rationale = generateSessionRationale(
        'session-1',
        'template-running-1',
        '1.2',
        'ruleset-v2',
        'DEVELOPMENT',
        'RUNNING',
        35,
        ['SkiErg', 'Rowing', 'WallBalls'],
      );

      expect(rationale.purpose).toContain('aerobic');
      expect(rationale.purpose.toLowerCase()).toContain('development');
      expect(rationale.templateVersion).toBe('1.2');
      expect(rationale.ruleSetVersion).toBe('ruleset-v2');
    });

    it('generates rationale for station skill with ranked emphasis [US-02]', () => {
      const rationale = generateSessionRationale(
        'session-2',
        'template-skierg',
        '1.0',
        'ruleset-v2',
        'RACE_SPECIFIC',
        'STATION_SKILL',
        40,
        ['SkiErg', 'Rowing', 'WallBalls'],
        'SkiErg', // Rank 1 station
      );

      expect(rationale.athleteContext).toContain('ranked #1');
      expect(rationale.purpose).toContain('HYROX station');
    });

    it('generates rationale for rank 2 station', () => {
      const rationale = generateSessionRationale(
        'session-3',
        'template-rowing',
        '1.1',
        'ruleset-v2',
        'RACE_SPECIFIC',
        'STATION_SKILL',
        35,
        ['SkiErg', 'Rowing', 'WallBalls'],
        'Rowing', // Rank 2
      );

      expect(rationale.athleteContext).toContain('ranked #2');
    });

    it('adds age context for older athletes', () => {
      const rationale = generateSessionRationale(
        'session-4',
        'template-strength',
        '1.0',
        'ruleset-v2',
        'FOUNDATION',
        'STRENGTH',
        48,
        ['SkiErg', 'Rowing', 'WallBalls'],
      );

      expect(rationale.athleteContext).toContain('age');
      expect(rationale.athleteContext).toContain('mobility');
    });
  });

  describe('Plan rationale generation [FR-G09]', () => {
    it('generates plan rationale with athlete context', () => {
      const rationale = generatePlanRationale(
        'plan-1',
        35,
        80,
        '2026-11-24',
        'MEN_INDIVIDUAL_OPEN',
        ['SkiErg', 'Rowing', 'WallBalls'],
        600,
        'ruleset-v2',
        'standards-2026',
        84,
      );

      expect(rationale.generationRationale).toContain('MEN_INDIVIDUAL_OPEN');
      expect(rationale.generationRationale).toContain('SkiErg');
      expect(rationale.generationRationale).toContain('600 minutes/week');
      expect(rationale.assumptions.athleteAge).toBe(35);
      expect(rationale.assumptions.athleteWeightKg).toBe(80);
    });

    it('includes age-adjusted note for older athletes', () => {
      const rationale = generatePlanRationale(
        'plan-2',
        48,
        85,
        '2026-11-24',
        'MEN_INDIVIDUAL_OPEN',
        ['SkiErg', 'Rowing', 'WallBalls'],
        500,
        'ruleset-v2',
        'standards-2026',
        77,
      );

      expect(rationale.generationRationale).toContain('Age-adjusted');
      expect(rationale.generationRationale).toContain('48 years');
    });

    it('snapshots assumptions for reproducibility [PRD 12.4]', () => {
      const rationale = generatePlanRationale(
        'plan-3',
        42,
        82,
        '2026-11-24',
        'WOMEN_INDIVIDUAL_OPEN',
        ['Rowing', 'WallBalls', 'TireFlip'],
        550,
        'ruleset-v2-1',
        'standards-2026',
        80,
      );

      expect(rationale.assumptions.competitionDate).toBe('2026-11-24');
      expect(rationale.assumptions.rankedStations).toEqual(['Rowing', 'WallBalls', 'TireFlip']);
      expect(rationale.ruleSetVersion).toBe('ruleset-v2-1');
    });
  });

  describe('Traceability verification [T-21]', () => {
    it('verifies complete traceability', () => {
      const rationale = {
        sessionId: 'session-1',
        purpose: 'Build aerobic fitness',
        templateId: 'template-1',
        templateVersion: '1.2',
        ruleSetVersion: 'ruleset-v2',
        athleteContext: 'Your ranked hardest station',
      };

      const result = verifyTraceability(rationale);

      expect(result.traceable).toBe(true);
      expect(result.missingFields).toHaveLength(0);
    });

    it('detects missing traceability fields', () => {
      const rationale = {
        sessionId: 'session-1',
        purpose: '',
        templateId: 'template-1',
        templateVersion: '1.2',
        ruleSetVersion: 'ruleset-v2',
        athleteContext: '',
      };

      const result = verifyTraceability(rationale);

      expect(result.traceable).toBe(false);
      expect(result.missingFields).toContain('purpose');
    });
  });

  describe('Session origin reconstruction [T-21]', () => {
    it('reconstructs template and ruleset snapshot', () => {
      const rationale = {
        sessionId: 'session-42',
        purpose: 'SkiErg technique work during race-specific phase',
        templateId: 'template-skierg',
        templateVersion: '2.1',
        ruleSetVersion: 'ruleset-v3-1',
        athleteContext: 'Your hardest station',
      };

      const origin = reconstructSessionOrigin(rationale);

      expect(origin.templateSnapshot).toBe('template-skierg@2.1');
      expect(origin.ruleSetSnapshot).toBe('ruleset@ruleset-v3-1');
      expect(origin.explanation).toContain('template-skierg');
      expect(origin.explanation).toContain('ruleset-v3-1');
    });

    it('enables reproducibility audit trail [PRD 12.4]', () => {
      const rationale = {
        sessionId: 'session-abc',
        purpose: 'Strength and power development',
        templateId: 'template-strength-1',
        templateVersion: '1.5',
        ruleSetVersion: 'ruleset-v2-3',
        athleteContext: 'Age-adjusted progressive load',
      };

      const origin = reconstructSessionOrigin(rationale);

      // Given this snapshot, we can audit which version generated it
      expect(origin.templateSnapshot).toMatch(/^template-strength-1@1.5$/);
      expect(origin.ruleSetSnapshot).toMatch(/^ruleset@ruleset-v2-3$/);
    });
  });
});
