import { z } from 'zod';
import { isValidWeight, isValidPlanningHorizon, WEIGHT_BOUNDS_GRAMS, PLANNING_HORIZON } from '../units';
import { STATION_NAMES } from '../domain/stations';

// Supported weight units at UI boundary [BUILD_ORDER unit conversion]
export const WeightUnitSchema = z.enum(['kg', 'lb']).default('kg');

// 5K time recency bands [PRD 7.1, FR-P04]
export const RecencyBandSchema = z.enum([
  'RECENT',        // Within 30 days
  '3_MONTHS',      // 30-90 days
  '6_MONTHS',      // 90-180 days
  'STALE',         // >180 days
  'NO_DATA',       // Never taken
]);

// HYROX category [PRD 7.1]
export const CategorySchema = z.enum(['INDIVIDUAL', 'TEAM']).default('INDIVIDUAL');

// Prior HYROX results [PRD 7.1, FR-P04]
export const PriorResultSchema = z.enum([
  'COMPLETED',
  'DNF',
  'NO_PRIOR_RESULT',
]).default('NO_PRIOR_RESULT');

// Supported divisions (seeded from database)
export const DivisionSchema = z.enum([
  'WOMEN_INDIVIDUAL_OPEN',
  'MEN_INDIVIDUAL_OPEN',
  'WOMEN_INDIVIDUAL_PRO',
  'MEN_INDIVIDUAL_PRO',
  'MIXED_TEAM',
]);

// Predictor input schema [T-06, PRD 7.1, US-01]
export const PredictorInputSchema = z.object({
  // Personal profile
  age: z
    .number()
    .int()
    .min(16, 'Age must be 16 or older') // [T-06 open question 5: under-18 athletes excluded?]
    .max(120, 'Age must be realistic'),

  category: CategorySchema,
  division: DivisionSchema,

  // Fitness
  fiveKmTimeSeconds: z
    .number()
    .int()
    .min(900, 'Must be a realistic 5K time (minimum ~15 minutes)')
    .max(3600, 'Must be a realistic 5K time (maximum ~60 minutes)'),

  fiveKmRecency: RecencyBandSchema,

  // Anthropometry
  weightValue: z
    .number()
    .positive('Weight must be positive')
    .finite(),

  weightUnit: WeightUnitSchema,

  // Race context
  competitionDate: z
    .string()
    .datetime({ offset: true })
    .transform((str) => new Date(str)),

  // Optional: goal and prior result
  targetFinishTimeSeconds: z
    .number()
    .int()
    .positive('Target time must be positive')
    .optional(),

  priorHyroxResult: PriorResultSchema.optional(),
});

// Derived type for type safety
export type PredictorInput = z.infer<typeof PredictorInputSchema>;

// Validation result with per-field errors [US-01 criterion 2]
export interface ValidationResult {
  valid: boolean;
  data?: PredictorInput;
  errors: Record<string, string>;
}

// Validate predictor input with human-readable errors [T-06, US-01 criterion 2]
export function validatePredictorInput(input: unknown): ValidationResult {
  const result = PredictorInputSchema.safeParse(input);

  if (result.success) {
    const data = result.data;

    // Convert weight to grams for internal use [BUILD_ORDER unit system]
    const { weightValue, weightUnit, ...rest } = data;
    const weightGrams =
      weightUnit === 'kg'
        ? Math.round(weightValue * 1000)
        : Math.round(weightValue * 453.592);

    // Validate weight is within bounds [T-06]
    if (!isValidWeight(weightGrams)) {
      return {
        valid: false,
        errors: {
          weightValue: `Weight must be between ${WEIGHT_BOUNDS_GRAMS.MIN / 1000}kg and ${WEIGHT_BOUNDS_GRAMS.MAX / 1000}kg`,
        },
      };
    }

    // Validate planning horizon [T-06, T-17, open question 13]
    const today = new Date();
    const daysUntilRace = Math.ceil(
      (data.competitionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilRace < PLANNING_HORIZON.MIN_DAYS) {
      return {
        valid: false,
        errors: {
          competitionDate: 'Competition must be at least 1 day away',
        },
      };
    }

    if (daysUntilRace > PLANNING_HORIZON.MAX_DAYS) {
      return {
        valid: false,
        errors: {
          competitionDate: `Planning horizon exceeds ${PLANNING_HORIZON.MAX_DAYS} days. Please use a nearer race date.`, // [T-06 open question 13]
        },
      };
    }

    // Validate target time if provided [T-06]
    if (data.targetFinishTimeSeconds) {
      if (data.targetFinishTimeSeconds < 900) {
        return {
          valid: false,
          errors: {
            targetFinishTimeSeconds: 'Target time must be at least 15 minutes',
          },
        };
      }
      if (data.targetFinishTimeSeconds > 14400) {
        return {
          valid: false,
          errors: {
            targetFinishTimeSeconds: 'Target time must be less than 4 hours',
          },
        };
      }
    }

    return {
      valid: true,
      data: {
        ...rest,
        weightValue: weightGrams, // Store as grams internally
        weightUnit: 'g',
      } as any,
    };
  }

  // Transform Zod errors to field-level messages [US-01 criterion 2]
  const errors: Record<string, string> = {};

  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  }

  return {
    valid: false,
    errors,
  };
}
