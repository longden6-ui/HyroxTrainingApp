// Athlete-facing validation schemas [T-24, T-25]
import { z } from 'zod';

// Workout completion check-in [T-25, FR-A01]
export const sessionCheckInSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  rpe: z
    .number()
    .int()
    .min(1, 'RPE must be between 1 and 10')
    .max(10, 'RPE must be between 1 and 10'),
  actualDurationMinutes: z
    .number()
    .int()
    .min(0, 'Duration cannot be negative')
    .max(600, 'Duration cannot exceed 10 hours'),
  painReported: z.boolean().default(false),
  painSeverity: z
    .enum(['NONE', 'MILD', 'MODERATE', 'SEVERE'])
    .default('NONE'),
  mobilityReported: z.boolean().default(false),
  mobilityLimitations: z
    .array(z.enum(['LOWER_BACK', 'KNEES', 'HIPS', 'SHOULDERS', 'ANKLES', 'OTHER']))
    .default([]),
  substitutionsPerformed: z.array(z.string()).default([]),
  notes: z.string().max(1000).optional(),
  completedAt: z.date().default(() => new Date()),
});

export type SessionCheckIn = z.infer<typeof sessionCheckInSchema>;

// Validate check-in data [T-25]
export function validateSessionCheckIn(data: unknown) {
  try {
    const validated = sessionCheckInSchema.parse(data);
    return { valid: true, data: validated, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        data: null,
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }
    return { valid: false, data: null, errors: [{ field: '', message: 'Validation failed' }] };
  }
}

// Pain reporting with neutral language [T-25, PRD 7.3]
export const painReportingOptions = [
  {
    value: 'NONE',
    label: 'No discomfort',
    description: 'Felt good during the workout',
  },
  {
    value: 'MILD',
    label: 'Mild discomfort',
    description: 'Noticed some awareness but it did not limit performance',
  },
  {
    value: 'MODERATE',
    label: 'Moderate discomfort',
    description: 'Affected workout execution but workout was completable',
  },
  {
    value: 'SEVERE',
    label: 'Unable to continue',
    description: 'Had to stop or significantly modify the workout',
  },
];

// Mobility screening with neutral language [T-25]
export const mobilityOptions = [
  {
    value: 'LOWER_BACK',
    label: 'Lower back',
    description: 'Awareness or tightness in lower back area',
  },
  {
    value: 'KNEES',
    label: 'Knees',
    description: 'Awareness or tightness in knee area',
  },
  {
    value: 'HIPS',
    label: 'Hips',
    description: 'Awareness or tightness in hip area',
  },
  {
    value: 'SHOULDERS',
    label: 'Shoulders',
    description: 'Awareness or tightness in shoulder area',
  },
  {
    value: 'ANKLES',
    label: 'Ankles',
    description: 'Awareness or tightness in ankle area',
  },
  {
    value: 'OTHER',
    label: 'Other',
    description: 'Different area',
  },
];

// RPE guidance [T-25]
export const rpeGuidance = [
  { value: 1, label: 'Very easy', description: 'Could easily continue for hours' },
  { value: 2, label: 'Easy', description: 'Can hold a full conversation' },
  { value: 3, label: 'Light', description: 'Comfortable effort' },
  { value: 4, label: 'Light to moderate', description: 'Breathing elevated but easy' },
  { value: 5, label: 'Moderate', description: 'Breathing elevated, can speak short sentences' },
  { value: 6, label: 'Moderate to hard', description: 'Harder to speak, maintaining effort' },
  { value: 7, label: 'Hard', description: 'Can only speak a few words' },
  { value: 8, label: 'Very hard', description: 'Very difficult to sustain' },
  { value: 9, label: 'Nearly maximum', description: 'Only a few minutes at this intensity' },
  { value: 10, label: 'Maximum', description: 'Absolute maximum effort' },
];

// Session completion payload for server action [T-25]
export const completeSessionPayload = z.object({
  sessionId: z.string().uuid(),
  rpe: z.number().int().min(1).max(10),
  actualDurationMinutes: z.number().int().min(0),
  painReported: z.boolean(),
  painSeverity: z.enum(['NONE', 'MILD', 'MODERATE', 'SEVERE']),
  mobilityReported: z.boolean(),
  mobilityLimitations: z.array(z.enum(['LOWER_BACK', 'KNEES', 'HIPS', 'SHOULDERS', 'ANKLES', 'OTHER'])),
  substitutionsPerformed: z.array(z.string()),
  notes: z.string().max(1000).optional(),
});

export type CompleteSessionPayload = z.infer<typeof completeSessionPayload>;
