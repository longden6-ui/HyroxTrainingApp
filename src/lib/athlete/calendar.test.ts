// Calendar tests [T-23]
import { describe, it, expect } from 'vitest';
import {
  buildWeekView,
  buildMonthView,
  getPhaseForDate,
  formatCalendarForDisplay,
} from './calendar';

describe('Calendar View [T-23]', () => {
  const mockSessions = [
    {
      id: 'session-1',
      date: new Date('2026-09-07'),
      title: 'Run + SkiErg',
      duration: 3600,
      primaryFocus: 'RUNNING',
      intensity: 'EASY' as const,
      completed: true,
      phase: 'FOUNDATION',
    },
    {
      id: 'session-2',
      date: new Date('2026-09-08'),
      title: 'Strength',
      duration: 2700,
      primaryFocus: 'STRENGTH',
      intensity: 'HARD' as const,
      completed: false,
      phase: 'FOUNDATION',
    },
    {
      id: 'session-3',
      date: new Date('2026-09-10'),
      title: 'Station Skills',
      duration: 3300,
      primaryFocus: 'STATION_SKILL',
      intensity: 'MODERATE' as const,
      completed: true,
      phase: 'FOUNDATION',
    },
  ];

  describe('Week view [T-23]', () => {
    it('builds week view with sessions and rest days', () => {
      const weekStart = new Date('2026-09-07'); // Monday
      const week = buildWeekView(weekStart, mockSessions, 'FOUNDATION');

      expect(week.days).toHaveLength(7);
      expect(week.phase).toBe('FOUNDATION');
      expect(week.sessionsCount).toBe(3);
      expect(week.completedCount).toBe(2);
    });

    it('marks days without sessions as rest days', () => {
      const weekStart = new Date('2026-09-07');
      const week = buildWeekView(weekStart, mockSessions, 'FOUNDATION');

      const restDays = week.days.filter((d) => d.isRestDay);
      expect(restDays.length).toBeGreaterThan(0);
      expect(restDays[0].dayOfWeek).toBeDefined();
    });

    it('calculates adherence correctly', () => {
      const weekStart = new Date('2026-09-07');
      const week = buildWeekView(weekStart, mockSessions, 'FOUNDATION');

      // 2 completed out of 3 sessions = 66%
      expect(week.adherence).toBeCloseTo(2 / 3, 2);
    });

    it('converts duration from seconds to minutes', () => {
      const weekStart = new Date('2026-09-07');
      const week = buildWeekView(weekStart, mockSessions, 'FOUNDATION');

      // 3600 + 2700 + 3300 = 9600 seconds = 160 minutes
      expect(week.totalMinutes).toBe(160);
    });

    it('detects phase transitions', () => {
      const weekStart = new Date('2026-09-07');
      const phaseTransitionDate = new Date('2026-09-08');
      const week = buildWeekView(weekStart, mockSessions, 'FOUNDATION', phaseTransitionDate);

      const transitionDay = week.days.find(
        (d) => d.date.toDateString() === phaseTransitionDate.toDateString(),
      );
      expect(transitionDay?.isPhaseTransition).toBe(true);
    });
  });

  describe('Month view [T-23]', () => {
    it('builds month view with multiple weeks', () => {
      const planPhases = new Map([['FOUNDATION', new Date('2026-09-01')]]);
      const month = buildMonthView(8, 2026, mockSessions, planPhases);

      expect(month.month).toBe(8);
      expect(month.year).toBe(2026);
      expect(month.weeks.length).toBeGreaterThan(0);
    });

    it('calculates overall adherence across month', () => {
      const planPhases = new Map([['FOUNDATION', new Date('2026-09-01')]]);
      const month = buildMonthView(8, 2026, mockSessions, planPhases);

      expect(month.overallAdherence).toBeGreaterThanOrEqual(0);
      expect(month.overallAdherence).toBeLessThanOrEqual(1);
    });

    it('counts total sessions and completions', () => {
      const planPhases = new Map([['FOUNDATION', new Date('2026-09-01')]]);
      const month = buildMonthView(8, 2026, mockSessions, planPhases);

      expect(month.totalSessions).toBeGreaterThan(0);
      expect(month.completedSessions).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Phase date lookup [T-23]', () => {
    it('identifies phase for a given date', () => {
      const phases = new Map([
        [
          'FOUNDATION',
          {
            start: new Date('2026-09-01'),
            end: new Date('2026-09-21'),
          },
        ],
        [
          'DEVELOPMENT',
          {
            start: new Date('2026-09-22'),
            end: new Date('2026-10-12'),
          },
        ],
      ]);

      const phaseDay1 = getPhaseForDate(new Date('2026-09-10'), phases);
      expect(phaseDay1).toBe('FOUNDATION');

      const phaseDay2 = getPhaseForDate(new Date('2026-10-01'), phases);
      expect(phaseDay2).toBe('DEVELOPMENT');
    });

    it('returns null for date outside phases', () => {
      const phases = new Map([
        [
          'FOUNDATION',
          {
            start: new Date('2026-09-01'),
            end: new Date('2026-09-21'),
          },
        ],
      ]);

      const phase = getPhaseForDate(new Date('2026-08-01'), phases);
      expect(phase).toBeNull();
    });
  });

  describe('Display formatting [T-23]', () => {
    it('formats calendar for display with month name', () => {
      const planPhases = new Map([['FOUNDATION', new Date('2026-09-01')]]);
      const month = buildMonthView(8, 2026, mockSessions, planPhases);
      const formatted = formatCalendarForDisplay(month);

      expect(formatted.monthName).toBe('September 2026');
      expect(formatted.weeks.length).toBeGreaterThan(0);
    });

    it('includes adherence percentage in display format', () => {
      const planPhases = new Map([['FOUNDATION', new Date('2026-09-01')]]);
      const month = buildMonthView(8, 2026, mockSessions, planPhases);
      const formatted = formatCalendarForDisplay(month);

      expect(formatted.weeks[0].adherence).toMatch(/^\d+%$/);
    });
  });
});
