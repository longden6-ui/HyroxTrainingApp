// Burn-down dashboard tests [T-26]
import { describe, it, expect } from 'vitest';
import { calculateBurndownMetrics, detectRiskFlags, formatBurndownForDisplay } from './burndown';

describe('Burn-down Dashboard [T-26]', () => {
  describe('Metrics calculation [FR-D01-D05]', () => {
    it('calculates on-track metrics', () => {
      const metrics = calculateBurndownMetrics(
        16, // completed sessions
        20, // planned sessions
        800, // completed minutes
        1000, // planned minutes
        14, // days remaining
        'DEVELOPMENT',
        new Date('2026-10-01'),
      );

      expect(metrics.daysRemaining).toBe(14);
      expect(metrics.weeksRemaining).toBe(2);
      expect(metrics.sessionCompletionRate).toBe(0.8);
      expect(metrics.preparationStatus).toBe('ON_TRACK');
    });

    it('detects ahead of schedule', () => {
      const metrics = calculateBurndownMetrics(
        19, // completed
        20, // planned - 95% complete
        1000,
        1000,
        10,
        'PEAK',
        new Date('2026-10-01'),
      );

      expect(metrics.preparationStatus).toBe('AHEAD');
      expect(metrics.preparationExplanation).toContain('ahead');
    });

    it('detects behind schedule', () => {
      const metrics = calculateBurndownMetrics(
        10, // completed
        20, // planned - 50% complete
        600,
        1000,
        7,
        'DEVELOPMENT',
        new Date('2026-10-01'),
      );

      expect(metrics.preparationStatus).toBe('BEHIND');
      expect(metrics.preparationExplanation).toContain('behind');
    });

    it('detects at-risk status', () => {
      const metrics = calculateBurndownMetrics(
        8, // completed
        20, // planned - 40% complete
        400,
        1000,
        3,
        'TAPER',
        new Date('2026-10-01'),
      );

      expect(metrics.preparationStatus).toBe('AT_RISK');
    });

    it('includes next session info when provided', () => {
      const nextDate = new Date('2026-09-08');
      const metrics = calculateBurndownMetrics(
        15,
        20,
        750,
        1000,
        10,
        'DEVELOPMENT',
        new Date('2026-10-01'),
        { date: nextDate, title: 'Run + SkiErg' },
      );

      expect(metrics.nextSessionTitle).toBe('Run + SkiErg');
      expect(metrics.nextSessionDate).toBe('2026-09-08');
    });
  });

  describe('Risk flag detection [FR-D08]', () => {
    it('detects repeated skips', () => {
      const flags = detectRiskFlags(
        0.5,
        [],
        3, // 3 sessions skipped in a row
      );

      const skipFlag = flags.find((f) => f.type === 'REPEATED_SKIPS');
      expect(skipFlag).toBeDefined();
      expect(skipFlag?.severity).toBe('HIGH');
      expect(skipFlag?.sessionCount).toBe(3);
    });

    it('marks 2 skips as medium severity', () => {
      const flags = detectRiskFlags(0.6, [], 2);

      const skipFlag = flags.find((f) => f.type === 'REPEATED_SKIPS');
      expect(skipFlag?.severity).toBe('MEDIUM');
    });

    it('detects sustained high effort', () => {
      const sessions = [
        { rpe: 8, painReported: false, actualDurationMinutes: 45, plannedDurationMinutes: 45 },
        { rpe: 9, painReported: false, actualDurationMinutes: 50, plannedDurationMinutes: 50 },
        { rpe: 8, painReported: false, actualDurationMinutes: 48, plannedDurationMinutes: 48 },
      ];

      const flags = detectRiskFlags(0.8, sessions, 0);

      const effortFlag = flags.find((f) => f.type === 'SUSTAINED_EFFORT');
      expect(effortFlag).toBeDefined();
      expect(effortFlag?.sessionCount).toBe(3);
    });

    it('detects pain reports', () => {
      const sessions = [
        { painReported: true, actualDurationMinutes: 40, plannedDurationMinutes: 45 },
        { painReported: true, actualDurationMinutes: 42, plannedDurationMinutes: 45 },
      ];

      const flags = detectRiskFlags(0.8, sessions, 0);

      const painFlag = flags.find((f) => f.type === 'PAIN_REPORTED');
      expect(painFlag).toBeDefined();
      expect(painFlag?.sessionCount).toBe(2);
    });

    it('detects compressed time', () => {
      const sessions = [
        { actualDurationMinutes: 20, plannedDurationMinutes: 45 },
        { actualDurationMinutes: 22, plannedDurationMinutes: 45 },
      ];

      const flags = detectRiskFlags(0.8, sessions, 0);

      const compressedFlag = flags.find((f) => f.type === 'COMPRESSED_TIME');
      expect(compressedFlag).toBeDefined();
    });

    it('detects low adherence', () => {
      const flags = detectRiskFlags(0.4, [], 0); // 40% completion

      const adherenceFlag = flags.find((f) => f.type === 'LOW_ADHERENCE');
      expect(adherenceFlag).toBeDefined();
      expect(adherenceFlag?.severity).toBe('HIGH');
    });

    it('returns no flags when metrics are healthy', () => {
      const sessions = [
        { rpe: 5, painReported: false, actualDurationMinutes: 45, plannedDurationMinutes: 45 },
        { rpe: 6, painReported: false, actualDurationMinutes: 50, plannedDurationMinutes: 50 },
      ];

      const flags = detectRiskFlags(0.85, sessions, 0);

      expect(flags).toHaveLength(0);
    });
  });

  describe('Display formatting [T-26]', () => {
    it('formats metrics for UI display', () => {
      const metrics = calculateBurndownMetrics(
        15,
        20,
        750 * 60, // Convert to seconds
        1000 * 60,
        14,
        'DEVELOPMENT',
        new Date('2026-10-01'),
      );

      const formatted = formatBurndownForDisplay(metrics);

      expect(formatted.timeRemaining.days).toBe(14);
      expect(formatted.progress.sessions.completed).toBe(15);
      expect(formatted.progress.sessions.planned).toBe(20);
      expect(formatted.progress.sessions.percentComplete).toContain('75%');
      expect(formatted.status.label).toBe('ON_TRACK');
    });

    it('includes upcoming session in formatted output', () => {
      const nextDate = new Date('2026-09-08');
      const metrics = calculateBurndownMetrics(
        10,
        20,
        500 * 60,
        1000 * 60,
        10,
        'DEVELOPMENT',
        new Date('2026-10-01'),
        { date: nextDate, title: 'Strength Session' },
      );

      const formatted = formatBurndownForDisplay(metrics);

      expect(formatted.upcomingSession).toBeDefined();
      expect(formatted.upcomingSession?.title).toBe('Strength Session');
    });
  });
});
