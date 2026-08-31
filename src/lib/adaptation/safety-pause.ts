// Safety pause mechanism [T-30, FR-A05]
// Pain reports meeting threshold pause plan. No recalculation while paused.

import { PrismaClient } from '@prisma/client';
import { getSession } from '@/src/lib/auth/session';

const prisma = new PrismaClient();

// Pain severity thresholds from ruleset [T-30]
export interface SafetyThreshold {
  painSeverityThreshold: 'MILD' | 'MODERATE' | 'SEVERE'; // Pause if reported as this or worse
  painReportCountThreshold: number; // Number of reports in window
  reportWindowDays: number; // Look back window for pain reports
}

// Detect if pain report meets safety threshold [T-30, FR-A05]
export async function detectPauseTrigger(
  athleteId: string,
  ruleset: SafetyThreshold,
): Promise<{ shouldPause: boolean; reason?: string }> {
  const activePlan = await prisma.trainingPlan.findFirst({
    where: { athleteId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    include: {
      sessions: {
        where: { checkIn: { isNot: null } },
        include: { checkIn: true },
      },
    },
  });

  if (!activePlan) {
    return { shouldPause: false };
  }

  const today = new Date();
  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - ruleset.reportWindowDays);

  // Count pain reports in window [T-30]
  const recentPainReports = activePlan.sessions
    .filter((s) => s.checkIn && s.checkIn.completedAt && s.checkIn.completedAt >= windowStart)
    .filter((s) => {
      const severity = s.checkIn?.painNotes;
      return severity && severityMeetsThreshold(severity, ruleset.painSeverityThreshold);
    });

  if (recentPainReports.length >= ruleset.painReportCountThreshold) {
    return {
      shouldPause: true,
      reason: `${recentPainReports.length} pain reports in past ${ruleset.reportWindowDays} days meet safety threshold`,
    };
  }

  return { shouldPause: false };
}

// Check if pain severity meets or exceeds threshold [T-30]
function severityMeetsThreshold(reported: string, threshold: string): boolean {
  const severityOrder = { MILD: 1, MODERATE: 2, SEVERE: 3 };
  const reportedLevel = severityOrder[reported as keyof typeof severityOrder] ?? 0;
  const thresholdLevel = severityOrder[threshold as keyof typeof severityOrder] ?? 0;

  return reportedLevel >= thresholdLevel;
}

// Pause plan for safety [T-30, FR-A05]
export async function pausePlanForSafety(
  planId: string,
  reason: string,
): Promise<{ success: boolean; plan?: any; error?: string }> {
  try {
    const plan = await prisma.trainingPlan.update({
      where: { id: planId },
      data: {
        status: 'PAUSED_FOR_SAFETY',
        pausedAt: new Date(),
        pauseReason: reason,
      },
    });

    // Create audit event [T-30]
    const session = await getSession();
    if (session?.athleteId) {
      await prisma.auditEvent.create({
        data: {
          athleteId: session.athleteId,
          eventType: 'PLAN_PAUSED',
          description: `Plan paused for safety: ${reason}`,
          metadata: JSON.stringify({
            planId,
            reason,
            pausedAt: new Date().toISOString(),
          }),
        },
      });
    }

    return { success: true, plan };
  } catch (error) {
    console.error('Failed to pause plan:', error);
    return { success: false, error: 'Failed to pause plan' };
  }
}

// Resume paused plan [T-30]
export async function resumePausedPlan(
  planId: string,
  athleteId: string,
): Promise<{ success: boolean; plan?: any; error?: string }> {
  try {
    const plan = await prisma.trainingPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return { success: false, error: 'Plan not found' };
    }

    if (plan.athleteId !== athleteId) {
      return { success: false, error: 'Not authorized' };
    }

    if (plan.status !== 'PAUSED_FOR_SAFETY') {
      return { success: false, error: 'Plan is not paused for safety' };
    }

    // Resume plan [T-30]
    const resumed = await prisma.trainingPlan.update({
      where: { id: planId },
      data: {
        status: 'ACTIVE',
        pausedAt: null,
        pauseReason: null,
      },
    });

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        athleteId,
        eventType: 'PLAN_RESUMED',
        description: 'Plan resumed after safety pause',
        metadata: JSON.stringify({
          planId,
          resumedAt: new Date().toISOString(),
        }),
      },
    });

    return { success: true, plan: resumed };
  } catch (error) {
    console.error('Failed to resume plan:', error);
    return { success: false, error: 'Failed to resume plan' };
  }
}

// Check if plan is paused [T-30]
export async function isPlanPaused(planId: string): Promise<boolean> {
  const plan = await prisma.trainingPlan.findUnique({
    where: { id: planId },
    select: { status: true },
  });

  return plan?.status === 'PAUSED_FOR_SAFETY';
}

// Prevent modifications while paused [T-30]
export function requirePlanNotPaused(planStatus: string): { success: boolean; error?: string } {
  if (planStatus === 'PAUSED_FOR_SAFETY') {
    return {
      success: false,
      error: 'Plan is paused for safety. No recalculation occurs while paused. Please resume the plan to continue.',
    };
  }

  return { success: true };
}
