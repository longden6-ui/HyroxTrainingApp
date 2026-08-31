// Session allocation tests [T-18]
import { describe, it, expect } from 'vitest';
import { allocateSessions, checkAvailabilityAlignment } from './allocation';

describe('Session Allocation [T-18]', () => {
  describe('Basic allocation', () => {
    it('allocates session to available day', () => {
      const sessions = [
        {
          id: 'session-1',
          duration: 1800, // 30 mins
          date: new Date('2026-09-07T00:00:00Z'), // Monday
          priority: 'PREFERRED' as const,
        },
      ];

      const availability = {
        MONDAY: 60,
        TUESDAY: 60,
        WEDNESDAY: 60,
        THURSDAY: 60,
        FRIDAY: 60,
        SATURDAY: 120,
        SUNDAY: 120,
      };

      const result = allocateSessions(sessions, availability, new Date('2026-09-01T00:00:00Z'), new Date('2026-11-24T00:00:00Z'));

      expect(result.success).toBe(true);
      expect(result.allocated).toHaveLength(1);
      expect(result.allocated[0].status).toBe('ALLOCATED');
      expect(result.warnings).toHaveLength(0);
    });

    it('respects daily minute limits', () => {
      const sessions = [
        {
          id: 'session-1',
          duration: 1800, // 30 mins
          date: new Date('2026-09-07T00:00:00Z'), // Monday
          priority: 'PREFERRED' as const,
        },
        {
          id: 'session-2',
          duration: 1800, // 30 mins
          date: new Date('2026-09-07T00:00:00Z'), // Same day
          priority: 'PREFERRED' as const,
        },
      ];

      const availability = {
        MONDAY: 60, // Exactly fits 2 x 30min sessions
        TUESDAY: 60,
        WEDNESDAY: 60,
        THURSDAY: 60,
        FRIDAY: 60,
        SATURDAY: 120,
        SUNDAY: 120,
      };

      const result = allocateSessions(sessions, availability, new Date('2026-09-01T00:00:00Z'), new Date('2026-11-24T00:00:00Z'));

      expect(result.allocated).toHaveLength(2);
      // Both should be on Monday
      expect(result.allocated.every((s) => s.scheduledDate.toDateString() === new Date('2026-09-07T00:00:00Z').toDateString())).toBe(true);
    });


  });

  describe('Availability alignment checks', () => {
    it('detects when available time is too low', () => {
      const result = checkAvailabilityAlignment(300, {
        MONDAY: 20,
        TUESDAY: 20,
        WEDNESDAY: 20,
        THURSDAY: 20,
        FRIDAY: 20,
        SATURDAY: 20,
        SUNDAY: 20,
      }); // 140 mins/week vs 300 target (less than 70%)

      expect(result.misaligned).toBe(true);
      expect(result.message).toContain('significantly less');
    });

    it('detects when available time is too high', () => {
      const result = checkAvailabilityAlignment(300, {
        MONDAY: 300,
        TUESDAY: 300,
        WEDNESDAY: 300,
        THURSDAY: 300,
        FRIDAY: 300,
        SATURDAY: 300,
        SUNDAY: 300,
      }); // 2100 mins/week vs 300 target

      expect(result.misaligned).toBe(true);
      expect(result.message).toContain('exceeds target by 2x');
    });

    it('accepts aligned availability', () => {
      const result = checkAvailabilityAlignment(300, {
        MONDAY: 60,
        TUESDAY: 60,
        WEDNESDAY: 60,
        THURSDAY: 60,
        FRIDAY: 60,
        SATURDAY: 120,
        SUNDAY: 120,
      }); // 600 mins/week, 2x 300 target

      expect(result.misaligned).toBe(false);
    });
  });

  describe('Priority handling', () => {
    it('prioritizes required sessions', () => {
      const sessions = [
        {
          id: 'session-1',
          duration: 1800, // 30 mins
          date: new Date('2026-09-07T00:00:00Z'),
          priority: 'FLEXIBLE' as const,
        },
        {
          id: 'session-2',
          duration: 3600, // 60 mins
          date: new Date('2026-09-08T00:00:00Z'),
          priority: 'REQUIRED' as const,
        },
      ];

      const availability = {
        MONDAY: 30, // Can only fit flexible
        TUESDAY: 60, // Can fit required
        WEDNESDAY: 60,
        THURSDAY: 60,
        FRIDAY: 60,
        SATURDAY: 120,
        SUNDAY: 120,
      };

      const result = allocateSessions(sessions, availability, new Date('2026-09-01T00:00:00Z'), new Date('2026-11-24T00:00:00Z'));

      // Required should get Tuesday slot, flexible deferred
      const required = result.allocated.find((s) => s.templateId === 'session-2');
      expect(required?.scheduledDate.toDateString()).toBe(new Date('2026-09-08T00:00:00Z').toDateString());
    });
  });
});
