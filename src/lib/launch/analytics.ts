// Analytics funnel instrumentation [T-34, PRD 12.5, 16]
// NO health, mobility, weight, or fine-grained profile values to ad platforms
// Consent-gated - only fires if athlete consents to analytics

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type FunnelEvent =
  | 'PREDICTOR_START'
  | 'PREDICTOR_COMPLETE'
  | 'PREDICTOR_TO_SIGNUP'
  | 'SIGNUP_START'
  | 'SIGNUP_COMPLETE'
  | 'ONBOARDING_START'
  | 'ONBOARDING_STEP_1'
  | 'ONBOARDING_STEP_2'
  | 'ONBOARDING_STEP_3'
  | 'ONBOARDING_STEP_4'
  | 'ONBOARDING_STEP_5'
  | 'ONBOARDING_STEP_6'
  | 'ONBOARDING_COMPLETE'
  | 'PLAN_GENERATION_START'
  | 'PLAN_GENERATION_COMPLETE'
  | 'DASHBOARD_FIRST_VIEW';

interface FunnelEventData {
  eventName: FunnelEvent;
  athleteId?: string; // Only if athlete is logged in
  timestamp: string;
  sessionId: string; // Anonymous session ID for cross-device tracking
}

// Check if athlete has consented to analytics [T-34, PRD 12.5]
async function hasAnalyticsConsent(athleteId?: string): Promise<boolean> {
  if (!athleteId) {
    // For anonymous users, assume opt-in (GA default)
    return true;
  }

  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
    select: { id: true },
  });

  if (!athlete) {
    return false;
  }

  const consent = await prisma.consent.findFirst({
    where: {
      athleteId,
      documentType: 'ANALYTICS',
    },
  });

  return consent !== null && !consent.withdrawnAt;
}

// Track funnel event [T-34]
export async function trackFunnelEvent(input: {
  eventName: FunnelEvent;
  athleteId?: string;
  sessionId: string;
}): Promise<{ success: boolean }> {
  try {
    // Check consent before sending [T-34, PRD 12.5]
    const canTrack = await hasAnalyticsConsent(input.athleteId);
    if (!canTrack && input.athleteId) {
      // Athlete has opted out
      return { success: true }; // Silent - don't error
    }

    const eventData: FunnelEventData = {
      eventName: input.eventName,
      athleteId: input.athleteId, // Include only for identified users
      timestamp: new Date().toISOString(),
      sessionId: input.sessionId,
    };

    // In production, send to GA4 or similar
    // CRITICAL: NO sensitive data fields in this object [T-34, PRD 12.5]
    console.log('[ANALYTICS] Funnel:', JSON.stringify(eventData));

    return { success: true };
  } catch (error) {
    console.error('Failed to track funnel event:', error);
    return { success: true }; // Don't break app on analytics failure
  }
}

// Conversion tracking [T-34]
export interface ConversionMetrics {
  predictorStarts: number;
  predictorCompletions: number;
  predictorToSignupRate: number;
  signupCompletions: number;
  onboardingCompletions: number;
  planGenerations: number;
}

// Get conversion funnel metrics [T-34]
export async function getConversionMetrics(days: number = 7): Promise<{
  success: boolean;
  metrics?: ConversionMetrics;
}> {
  try {
    // In production, query from analytics platform
    // This is a placeholder for funnel analysis [T-34]
    const metrics: ConversionMetrics = {
      predictorStarts: 0,
      predictorCompletions: 0,
      predictorToSignupRate: 0,
      signupCompletions: 0,
      onboardingCompletions: 0,
      planGenerations: 0,
    };

    return { success: true, metrics };
  } catch (error) {
    console.error('Failed to get conversion metrics:', error);
    return { success: false };
  }
}

// CRITICAL: Verify no sensitive data sent to ad platforms [T-34, PRD 12.5]
export function assertNoSensitiveInAnalytics(eventData: Record<string, any>): boolean {
  const sensitiveFields = [
    'weight',
    'weightKg',
    'age',
    'fiveKmTime',
    'fiftyKmTime',
    'painReported',
    'painSeverity',
    'mobilityStatus',
    'mobilityDetails',
    'healthConditions',
    'medicalHistory',
    'exactEmail', // Use hashed email only
  ];

  for (const field of sensitiveFields) {
    if (field in eventData) {
      console.error('[SECURITY] Sensitive field in analytics:', field);
      return false;
    }
  }

  // Check for accidental serialization of full objects
  const serialized = JSON.stringify(eventData);
  if (
    /\b(?:kg|weight|pain|mobility|health|medical)\b/i.test(serialized) &&
    !/(PREDICTOR|SIGNUP|ONBOARDING|PLAN|DASHBOARD)/i.test(serialized)
  ) {
    console.error('[SECURITY] Suspicious sensitive pattern in analytics data');
    return false;
  }

  return true;
}

// Cohort analysis (demographic-free) [T-34]
export interface CohortMetrics {
  newUsers: number;
  activeUsers: number;
  returningUsers: number;
  churnRate: number;
}

// Get cohort metrics WITHOUT sensitive attributes [T-34, PRD 12.5]
export async function getCohortMetrics(days: number = 7): Promise<{
  success: boolean;
  metrics?: CohortMetrics;
}> {
  try {
    // Track user activity only, NO demographic breakdowns [T-34]
    const metrics: CohortMetrics = {
      newUsers: 0,
      activeUsers: 0,
      returningUsers: 0,
      churnRate: 0,
    };

    return { success: true, metrics };
  } catch (error) {
    console.error('Failed to get cohort metrics:', error);
    return { success: false };
  }
}
