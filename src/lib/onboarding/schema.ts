// Onboarding schema validation [T-14, PRD Appendix A]
import { z } from 'zod';

// Step 1: Ranked stations [T-14, US-02]
export const OnboardingStep1 = z.object({
  athleteId: z.string().min(1),
  stationRank1: z.string().min(1, 'First hardest station is required'),
  stationRank2: z.string().min(1, 'Second hardest station is required'),
  stationRank3: z.string().min(1, 'Third hardest station is required'),
});

export function validateStep1(input: unknown) {
  const parsed = OnboardingStep1.safeParse(input);
  if (parsed.success) {
    // Validate no duplicates [T-14, US-02]
    const ranks = [parsed.data.stationRank1, parsed.data.stationRank2, parsed.data.stationRank3];
    const unique = new Set(ranks);
    if (unique.size !== 3) {
      return {
        success: false,
        error: 'Stations must be unique. Please select three different stations.',
      };
    }
  }
  return parsed.success ? { success: true, data: parsed.data } : { success: false, error: parsed.error.message };
}

// Step 2: Athletic background and load
export const OnboardingStep2 = z.object({
  athleteId: z.string().min(1),
  athleticBackground: z.string().min(1, 'Athletic background is required'),
  currentWeeklyLoadMinutes: z.number().min(0).max(10000),
});

export function validateStep2(input: unknown) {
  const parsed = OnboardingStep2.safeParse(input);
  return parsed.success ? { success: true, data: parsed.data } : { success: false, error: parsed.error.message };
}

// Step 3: Work pattern and physical demand
export const OnboardingStep3 = z.object({
  athleteId: z.string().min(1),
  workPattern: z.enum(['SEDENTARY', 'LIGHT', 'MODERATE', 'HEAVY']),
  physicalDemand: z.enum(['LOW', 'MODERATE', 'HIGH']),
});

export function validateStep3(input: unknown) {
  const parsed = OnboardingStep3.safeParse(input);
  return parsed.success ? { success: true, data: parsed.data } : { success: false, error: parsed.error.message };
}

// Step 4: Mobility screening (T-15 handles red flags)
export const OnboardingStep4 = z.object({
  athleteId: z.string().min(1),
  mobilityStatus: z.enum(['UNRESTRICTED', 'LIMITED_MOBILITY']),
  activePain: z.boolean(),
  painDetails: z.string().optional(), // Last resort, prefer structured enum
});

export function validateStep4(input: unknown) {
  const parsed = OnboardingStep4.safeParse(input);
  return parsed.success ? { success: true, data: parsed.data } : { success: false, error: parsed.error.message };
}

// Step 5: Equipment access
export const OnboardingStep5 = z.object({
  athleteId: z.string().min(1),
  equipment: z.array(z.string()).default([]),
});

export function validateStep5(input: unknown) {
  const parsed = OnboardingStep5.safeParse(input);
  return parsed.success ? { success: true, data: parsed.data } : { success: false, error: parsed.error.message };
}

// Step 6: Day-by-day availability [T-14, US-03]
export const OnboardingStep6 = z.object({
  athleteId: z.string().min(1),
  availabilityByDay: z.record(
    z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
    z.number().min(0).max(10000),
  ),
});

export function validateStep6(input: unknown) {
  const parsed = OnboardingStep6.safeParse(input);
  return parsed.success ? { success: true, data: parsed.data } : { success: false, error: parsed.error.message };
}

export const ATHLETIC_BACKGROUNDS = [
  { value: 'SEDENTARY', label: 'Little to no structured exercise' },
  { value: 'RECREATIONAL', label: 'Recreational sports or occasional gym' },
  { value: 'COMPETITIVE', label: 'Competitive sports background' },
  { value: 'ENDURANCE', label: 'Endurance sports (running, cycling, etc.)' },
  { value: 'STRENGTH', label: 'Strength training focus' },
  { value: 'MIXED', label: 'Mixed training (running + strength)' },
];

export const EQUIPMENT_OPTIONS = [
  'Barbell',
  'Dumbbell',
  'Kettlebell',
  'Rowing machine',
  'Treadmill',
  'Pull-up bar',
  'Resistance bands',
  'Medicine ball',
  'Gymnastics rings',
];
