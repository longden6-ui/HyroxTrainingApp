// Workout template schema and validation [T-16, PRD 9.3]
import { z } from 'zod';

export enum TemplateStatus {
  DRAFT = 'DRAFT', // Not yet submitted for review
  PENDING_APPROVAL = 'PENDING_APPROVAL', // Awaiting professional sign-off
  APPROVED = 'APPROVED', // Approved by accountable professional
  DEPRECATED = 'DEPRECATED', // No longer used
}

export enum PrimaryFocus {
  RUNNING = 'RUNNING',
  STRENGTH = 'STRENGTH',
  STATION_SKILL = 'STATION_SKILL',
  COMBINED = 'COMBINED', // Running + strength compromise
  MOBILITY = 'MOBILITY',
  RECOVERY = 'RECOVERY',
}

export enum Phase {
  FOUNDATION = 'FOUNDATION',
  DEVELOPMENT = 'DEVELOPMENT',
  RACE_SPECIFIC = 'RACE_SPECIFIC',
  PEAK = 'PEAK',
  TAPER = 'TAPER',
}

export enum IntensityLevel {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
}

export const CreateWorkoutTemplateInput = z.object({
  name: z.string().min(1, 'Template name is required'),
  version: z.string().min(1, 'Version is required'),
  description: z.string().optional(),
  duration: z.number().min(60).max(7200), // 1 min to 2 hours, in seconds
  warmupDuration: z.number().min(0).max(600).optional(),
  mainDuration: z.number().min(60).max(7200).optional(),
  cooldownDuration: z.number().min(0).max(600).optional(),
  primaryFocus: z.nativeEnum(PrimaryFocus),
  phase: z.nativeEnum(Phase).optional(),
  stationName: z.string().optional(), // null = station-agnostic
  equipment: z.array(z.string()).default([]),
  intensityLevel: z.nativeEnum(IntensityLevel).optional(),
  purposeStatement: z.string().min(10, 'Purpose statement is required (min 10 chars)'), // [FR-G09]
  instructions: z.string().optional(),
});

export const ApproveTemplateInput = z.object({
  templateId: z.string().min(1),
  approvedBy: z.string().min(1, 'Approver name/ID is required'),
});

export const CreateSubstitutionInput = z.object({
  templateId: z.string().min(1),
  originalExercise: z.string().min(1),
  substituteName: z.string().min(1),
  explanation: z.string().min(10, 'Explain why this substitution is safe and race-specific'),
});

export type CreateWorkoutTemplateInputType = z.infer<typeof CreateWorkoutTemplateInput>;
export type ApproveTemplateInputType = z.infer<typeof ApproveTemplateInput>;
export type CreateSubstitutionInputType = z.infer<typeof CreateSubstitutionInput>;

export function validateCreateTemplate(input: unknown) {
  return CreateWorkoutTemplateInput.safeParse(input);
}

export function validateApproveTemplate(input: unknown) {
  return ApproveTemplateInput.safeParse(input);
}

export function validateCreateSubstitution(input: unknown) {
  return CreateSubstitutionInput.safeParse(input);
}
