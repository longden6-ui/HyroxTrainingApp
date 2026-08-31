// Guardrail rule enforcement tests [T-20]
import { describe, it, expect } from 'vitest';
import { validatePlanAgainstGuardrails } from './guardrails';

describe('Guardrail Layer [T-20]', () => {
  const baseRuleset = {
    maxProgressionIncrease: 10,
    minRecoveryDaysPerWeek: 2,
    taperReductionPercent: 30,
    maxOccupationalLoad: 50,
    allowedEquipment: ['Barbell', 'Dumbbell', 'Treadmill'],
    maxConsecutiveHardDays: 1,
    approved: true,
    approvedBy: 'Dr. Coach',
    approvedAt: '2026-08-31',
  };

  describe('Constraint 4: Unapproved RuleSet gate [T-20]', () => {
    it('refuses unapproved ruleset', () => {
      const plan = {
        sessions: [],
        startDate: new Date('2026-09-01'),
        raceDate: new Date('2026-11-24'),
        phase: 'FOUNDATION',
      };

      const unapprovedRuleset = { ...baseRuleset, approved: false };
      const result = validatePlanAgainstGuardrails(plan, unapprovedRuleset);

      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.ruleId === 'UNAPPROVED_RULESET')).toBe(true);
    });
  });

  describe('Rule 1: No post-race sessions [Constraint 3]', () => {
    it('allows sessions before race date', () => {
      const plan = {
        sessions: [
          {
            id: 'session-1',
            date: new Date('2026-11-23'),
            duration: 1800,
            intensity: 'EASY' as const,
            primaryFocus: 'RUNNING',
            isRecovery: false,
          },
        ],
        startDate: new Date('2026-09-01'),
        raceDate: new Date('2026-11-24'),
        phase: 'TAPER',
      };

      const result = validatePlanAgainstGuardrails(plan, baseRuleset);
      const postRaceViolations = result.violations.filter((v) => v.ruleId === 'NO_POST_RACE_SESSIONS');

      expect(postRaceViolations).toHaveLength(0);
    });

    it('rejects sessions on race date', () => {
      const plan = {
        sessions: [
          {
            id: 'session-1',
            date: new Date('2026-11-24'),
            duration: 1800,
            intensity: 'EASY' as const,
            primaryFocus: 'RUNNING',
            isRecovery: false,
          },
        ],
        startDate: new Date('2026-09-01'),
        raceDate: new Date('2026-11-24'),
        phase: 'RACE_WEEK',
      };

      const result = validatePlanAgainstGuardrails(plan, baseRuleset);
      const postRaceViolations = result.violations.filter((v) => v.ruleId === 'NO_POST_RACE_SESSIONS');

      expect(postRaceViolations.length).toBeGreaterThan(0);
    });
  });

  describe('Rule 2: Progression caps [FR-G02]', () => {
    it('allows gradual progression', () => {
      const plan = {
        sessions: [
          // Week 0: 3600 seconds = 1 hour
          {
            id: 's1',
            date: new Date('2026-09-01'),
            duration: 3600,
            intensity: 'EASY' as const,
            primaryFocus: 'RUNNING',
            isRecovery: false,
          },
          // Week 1: 3960 seconds = 1.1 hours (10% increase = OK)
          {
            id: 's2',
            date: new Date('2026-09-08'),
            duration: 3960,
            intensity: 'EASY' as const,
            primaryFocus: 'RUNNING',
            isRecovery: false,
          },
        ],
        startDate: new Date('2026-09-01'),
        raceDate: new Date('2026-11-24'),
        phase: 'FOUNDATION',
      };

      const result = validatePlanAgainstGuardrails(plan, baseRuleset);
      const progressionViolations = result.violations.filter((v) => v.ruleId === 'PROGRESSION_CAP_EXCEEDED');

      expect(progressionViolations).toHaveLength(0);
    });

    it('warns on excessive progression', () => {
      const plan = {
        sessions: [
          {
            id: 's1',
            date: new Date('2026-09-01'),
            duration: 3600,
            intensity: 'EASY' as const,
            primaryFocus: 'RUNNING',
            isRecovery: false,
          },
          // 25% increase (exceeds 10% limit)
          {
            id: 's2',
            date: new Date('2026-09-08'),
            duration: 4500,
            intensity: 'EASY' as const,
            primaryFocus: 'RUNNING',
            isRecovery: false,
          },
        ],
        startDate: new Date('2026-09-01'),
        raceDate: new Date('2026-11-24'),
        phase: 'FOUNDATION',
      };

      const result = validatePlanAgainstGuardrails(plan, baseRuleset);
      const progressionViolations = result.violations.filter((v) => v.ruleId === 'PROGRESSION_CAP_EXCEEDED');

      expect(progressionViolations.length).toBeGreaterThan(0);
    });
  });

  describe('Rule 3: Minimum recovery [FR-G02]', () => {
    it('ensures minimum recovery days per week', () => {
      const plan = {
        sessions: [
          {
            id: 's1',
            date: new Date('2026-09-01'),
            duration: 1800,
            intensity: 'EASY' as const,
            primaryFocus: 'RUNNING',
            isRecovery: false,
          },
          {
            id: 's2',
            date: new Date('2026-09-02'),
            duration: 1800,
            intensity: 'EASY' as const,
            primaryFocus: 'RECOVERY',
            isRecovery: true,
          },
          {
            id: 's3',
            date: new Date('2026-09-03'),
            duration: 1800,
            intensity: 'EASY' as const,
            primaryFocus: 'RECOVERY',
            isRecovery: true,
          },
        ],
        startDate: new Date('2026-09-01'),
        raceDate: new Date('2026-11-24'),
        phase: 'FOUNDATION',
      };

      const result = validatePlanAgainstGuardrails(plan, baseRuleset);
      const recoveryViolations = result.violations.filter((v) => v.ruleId === 'INSUFFICIENT_RECOVERY');

      expect(recoveryViolations).toHaveLength(0);
    });
  });

  describe('Rule 5: No workload stacking [Constraint 2]', () => {
    it('warns on consecutive hard-intensity days', () => {
      const plan = {
        sessions: [
          {
            id: 's1',
            date: new Date('2026-09-01'),
            duration: 1800,
            intensity: 'HARD' as const,
            primaryFocus: 'RUNNING',
            isRecovery: false,
          },
          {
            id: 's2',
            date: new Date('2026-09-02'),
            duration: 1800,
            intensity: 'HARD' as const,
            primaryFocus: 'STRENGTH',
            isRecovery: false,
          },
        ],
        startDate: new Date('2026-09-01'),
        raceDate: new Date('2026-11-24'),
        phase: 'DEVELOPMENT',
      };

      const result = validatePlanAgainstGuardrails(plan, baseRuleset);
      const stackingViolations = result.violations.filter((v) => v.ruleId === 'WORKLOAD_STACKING');

      expect(stackingViolations.length).toBeGreaterThan(0);
    });

    it('allows hard days with recovery in between', () => {
      const plan = {
        sessions: [
          {
            id: 's1',
            date: new Date('2026-09-01'),
            duration: 1800,
            intensity: 'HARD' as const,
            primaryFocus: 'RUNNING',
            isRecovery: false,
          },
          {
            id: 's2',
            date: new Date('2026-09-02'),
            duration: 1800,
            intensity: 'EASY' as const,
            primaryFocus: 'RECOVERY',
            isRecovery: true,
          },
          {
            id: 's3',
            date: new Date('2026-09-03'),
            duration: 1800,
            intensity: 'HARD' as const,
            primaryFocus: 'STRENGTH',
            isRecovery: false,
          },
        ],
        startDate: new Date('2026-09-01'),
        raceDate: new Date('2026-11-24'),
        phase: 'DEVELOPMENT',
      };

      const result = validatePlanAgainstGuardrails(plan, baseRuleset);
      const stackingViolations = result.violations.filter((v) => v.ruleId === 'WORKLOAD_STACKING');

      expect(stackingViolations).toHaveLength(0);
    });
  });
});
