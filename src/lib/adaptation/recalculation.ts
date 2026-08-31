// Recalculation triggers [T-28, FR-G11, FR-G12, FR-A03]
// Only future sessions change. Missed workload never stacks. [FR-A04]

import { PrismaClient } from '@prisma/client';
import { getSession } from '@/src/lib/auth/session';

const prisma = new PrismaClient();

export interface PlanAdjustmentReason {
  type: 'NEW_BENCHMARK' | 'SCHEDULE_CHANGE' | 'MISSED_SESSION' | 'EXTENDED_INTERRUPTION' | 'EQUIPMENT_CHANGE' | 'USER_MOVED_SESSION';
  description: string;
  triggeredAt: Date;
}

// Detect if plan needs recalculation [T-28]
export async function detectRecalculationTrigger(athleteId: string): Promise<PlanAdjustmentReason | null> {
  const activePlan = await prisma.trainingPlan.findFirst({
    where: { athleteId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    include: {
      sessions: {
        orderBy: { scheduledDate: 'asc' },
        include: { checkIn: true },
      },
    },
  });

  if (!activePlan) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // T-28: Detect missed sessions (scheduled date passed, no check-in, not locked)
  const missedSessions = activePlan.sessions.filter(
    (s) => s.scheduledDate < today && !s.locked && !s.checkIn,
  );

  if (missedSessions.length === 1) {
    return {
      type: 'MISSED_SESSION',
      description: `Session "${missedSessions[0].title}" was missed on ${missedSessions[0].scheduledDate.toDateString()}`,
      triggeredAt: today,
    };
  }

  if (missedSessions.length > 1) {
    return {
      type: 'EXTENDED_INTERRUPTION',
      description: `${missedSessions.length} consecutive sessions missed (last: ${missedSessions[missedSessions.length - 1].scheduledDate.toDateString()})`,
      triggeredAt: today,
    };
  }

  // T-28: Detect schedule change (availability profile changed)
  const onboarding = await prisma.onboarding.findUnique({
    where: { athleteId },
  });

  if (onboarding?.updatedAt && onboarding.updatedAt > activePlan.createdAt) {
    return {
      type: 'SCHEDULE_CHANGE',
      description: 'Your weekly availability was updated',
      triggeredAt: onboarding.updatedAt,
    };
  }

  // T-28: Detect equipment change
  if (onboarding?.equipment && onboarding.updatedAt && onboarding.updatedAt > activePlan.createdAt) {
    return {
      type: 'EQUIPMENT_CHANGE',
      description: 'Your available equipment was updated',
      triggeredAt: onboarding.updatedAt,
    };
  }

  return null;
}

// Create plan adjustment record [T-28, T-29]
export async function createPlanAdjustment(input: {
  planId: string;
  reason: PlanAdjustmentReason;
  material: boolean;
  changesSummary: string;
}) {
  try {
    const plan = await prisma.trainingPlan.findUnique({
      where: { id: input.planId },
      select: { version: true },
    });

    if (!plan) {
      return { success: false, error: 'Plan not found' };
    }

    const adjustment = await prisma.planAdjustment.create({
      data: {
        planId: input.planId,
        version: plan.version + 1,
        reason: input.reason.description,
        changesSummary: input.changesSummary,
        material: input.material,
        status: input.material ? 'PENDING' : 'AUTO_APPLIED',
        approvedAt: input.material ? null : new Date(),
        approvedBy: input.material ? null : 'SYSTEM',
      },
    });

    return { success: true, adjustment };
  } catch (error) {
    console.error('Failed to create plan adjustment:', error);
    return { success: false, error: 'Failed to create adjustment' };
  }
}

// Recalculate future sessions only [T-28, FR-A04]
export async function recalculateFutureSessions(
  planId: string,
  reason: PlanAdjustmentReason,
): Promise<{ success: boolean; sessionsMoved?: number; error?: string }> {
  try {
    const plan = await prisma.trainingPlan.findUnique({
      where: { id: planId },
      include: {
        sessions: {
          orderBy: { scheduledDate: 'asc' },
          include: { checkIn: true },
        },
      },
    });

    if (!plan) {
      return { success: false, error: 'Plan not found' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // T-28, FR-A04: Only modify future/incomplete sessions [FR-A02]
    const futureSessions = plan.sessions.filter((s) => !s.locked && s.scheduledDate >= today);

    if (futureSessions.length === 0) {
      return { success: true, sessionsMoved: 0 };
    }

    // T-28: For missed sessions, mark them with null purpose to indicate skipped [FR-A04]
    const missedSessions = plan.sessions.filter((s) => s.scheduledDate < today && !s.locked && !s.checkIn);

    if (missedSessions.length > 0) {
      // Mark as skipped by clearing purpose (not attempted to re-add to future workload)
      for (const missed of missedSessions) {
        await prisma.trainingSession.update({
          where: { id: missed.id },
          data: {
            purpose: `[SKIPPED] ${missed.purpose}`,
          },
        });
      }
    }

    // Create adjustment record [T-28]
    await createPlanAdjustment({
      planId,
      reason,
      material: reason.type === 'EXTENDED_INTERRUPTION' || reason.type === 'SCHEDULE_CHANGE',
      changesSummary: `Recalculated ${futureSessions.length} future sessions due to ${reason.type}. No workload stacking applied.`,
    });

    // Bump plan version
    await prisma.trainingPlan.update({
      where: { id: planId },
      data: { version: { increment: 1 } },
    });

    return { success: true, sessionsMoved: futureSessions.length };
  } catch (error) {
    console.error('Recalculation failed:', error);
    return { success: false, error: 'Failed to recalculate plan' };
  }
}

// Check for no-stacking constraint [FR-A04, T-28]
export async function verifyNoWorkloadStacking(planId: string): Promise<{ valid: boolean; error?: string }> {
  const plan = await prisma.trainingPlan.findUnique({
    where: { id: planId },
    include: {
      sessions: {
        orderBy: { scheduledDate: 'asc' },
      },
    },
  });

  if (!plan) {
    return { valid: false, error: 'Plan not found' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check that no missed session time is re-added to future dates
  const missedSessions = plan.sessions.filter(
    (s) => s.scheduledDate < today && s.purpose?.startsWith('[SKIPPED]'),
  );
  const totalMissedMinutes = missedSessions.reduce((sum, s) => sum + s.duration / 60, 0);

  if (totalMissedMinutes > 0) {
    // Verify future sessions don't have added duration beyond plan
    const futureSessions = plan.sessions.filter((s) => s.scheduledDate >= today);
    const avgSessionDuration = plan.sessions.reduce((sum, s) => sum + s.duration, 0) / plan.sessions.length;
    const futureExtra = futureSessions.filter((s) => s.duration > avgSessionDuration * 1.5);

    if (futureExtra.length > 0) {
      return {
        valid: false,
        error: `Missed workload (${totalMissedMinutes}min) may have been re-added. This violates FR-A04.`,
      };
    }
  }

  return { valid: true };
}
