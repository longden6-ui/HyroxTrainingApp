// Template schema validation tests [T-16]
import { describe, it, expect } from 'vitest';
import {
  validateCreateTemplate,
  validateApproveTemplate,
  validateCreateSubstitution,
  PrimaryFocus,
  Phase,
  IntensityLevel,
} from './schema';

describe('Template Schema Validation', () => {
  describe('Create template validation', () => {
    it('accepts valid template input', () => {
      const result = validateCreateTemplate({
        name: 'SkiErg Skill Work',
        version: '1.0',
        description: 'Focused SkiErg technique',
        duration: 1800, // 30 mins
        warmupDuration: 300,
        mainDuration: 1200,
        cooldownDuration: 300,
        primaryFocus: PrimaryFocus.STATION_SKILL,
        phase: Phase.DEVELOPMENT,
        stationName: 'SkiErg',
        equipment: ['SkiErg machine'],
        intensityLevel: IntensityLevel.MODERATE,
        purposeStatement: 'Build efficient SkiErg technique with steady-state intervals',
        instructions: 'Warm up 5 min. 4x3 min steady at 80% effort. Cool down 5 min.',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing name', () => {
      const result = validateCreateTemplate({
        version: '1.0',
        duration: 1800,
        primaryFocus: PrimaryFocus.RUNNING,
        purposeStatement: 'This is a long enough purpose statement',
      });
      expect(result.success).toBe(false);
    });

    it('rejects short purpose statement', () => {
      const result = validateCreateTemplate({
        name: 'Test',
        version: '1.0',
        duration: 1800,
        primaryFocus: PrimaryFocus.RUNNING,
        purposeStatement: 'Short',
      });
      expect(result.success).toBe(false);
    });

    it('rejects duration outside bounds', () => {
      const result = validateCreateTemplate({
        name: 'Test',
        version: '1.0',
        duration: 30, // Too short
        primaryFocus: PrimaryFocus.RUNNING,
        purposeStatement: 'This is a long enough purpose statement',
      });
      expect(result.success).toBe(false);
    });

    it('accepts station-agnostic template (no stationName)', () => {
      const result = validateCreateTemplate({
        name: 'Running Interval Workout',
        version: '1.0',
        duration: 1800,
        primaryFocus: PrimaryFocus.RUNNING,
        purposeStatement: 'Build aerobic capacity with tempo intervals outdoors',
      });
      expect(result.success).toBe(true);
    });

    it('defaults equipment to empty array', () => {
      const result = validateCreateTemplate({
        name: 'Bodyweight Strength',
        version: '1.0',
        duration: 1800,
        primaryFocus: PrimaryFocus.STRENGTH,
        purposeStatement: 'Build functional strength using bodyweight exercises',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.equipment).toEqual([]);
      }
    });
  });

  describe('Approve template validation', () => {
    it('accepts valid approval input', () => {
      const result = validateApproveTemplate({
        templateId: 'template-123',
        approvedBy: 'Dr. Sarah Coach',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing approver', () => {
      const result = validateApproveTemplate({
        templateId: 'template-123',
        approvedBy: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Create substitution validation', () => {
    it('accepts valid substitution', () => {
      const result = validateCreateSubstitution({
        templateId: 'template-123',
        originalExercise: 'Wall balls 14/10 lbs',
        substituteName: 'Medicine ball throw to wall',
        explanation:
          'Maintains explosive power development while reducing load for athletes with shoulder concerns',
      });
      expect(result.success).toBe(true);
    });

    it('rejects short explanation', () => {
      const result = validateCreateSubstitution({
        templateId: 'template-123',
        originalExercise: 'Wall balls',
        substituteName: 'Med ball',
        explanation: 'Easier',
      });
      expect(result.success).toBe(false);
    });
  });
});
