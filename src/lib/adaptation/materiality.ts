// Material vs non-material changes [T-29, FR-A06]
// Material changes require athlete acceptance. Non-material apply automatically.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Materiality threshold: changes that alter >15% of plan structure [T-29, FR-A06]
const MATERIALITY_THRESHOLDS = {
  sessionCountChange: 0.15, // >15% change in session count
  phaseShift: 7, // >7 days shift in phase dates
  weeklyLoadChange: 0.2, // >20% change in weekly minutes
  equipmentRequirementChange: true, // Any equipment requirement change
} as const;

export interface MaterielityAssessment {
  isMaterial: boolean;
  score: number; // 0-100, >50 is material
  factors: string[];
  recommendation: 'AUTO_APPLY' | 'PENDING';
}

// Assess if a planned adjustment is material [T-29, FR-A06]
export function assessMateriality(changeMetrics: {
  sessionCountBefore: number;
  sessionCountAfter: number;
  phaseStartShift?: number; // Days
  weeklyLoadBefore: number;
  weeklyLoadAfter: number;
  equipmentChanged: boolean;
}): MaterielityAssessment {
  const factors: string[] = [];
  let score = 0;

  // Session count change [T-29]
  const sessionChange = Math.abs(changeMetrics.sessionCountAfter - changeMetrics.sessionCountBefore) /
    changeMetrics.sessionCountBefore;
  if (sessionChange > MATERIALITY_THRESHOLDS.sessionCountChange) {
    score += 30;
    factors.push(`Session count changed by ${Math.round(sessionChange * 100)}%`);
  }

  // Phase shift [T-29]
  if (changeMetrics.phaseStartShift && Math.abs(changeMetrics.phaseStartShift) > MATERIALITY_THRESHOLDS.phaseShift) {
    score += 25;
    factors.push(`Phase dates shifted by ${changeMetrics.phaseStartShift} days`);
  }

  // Weekly load change [T-29]
  const loadChange = Math.abs(changeMetrics.weeklyLoadAfter - changeMetrics.weeklyLoadBefore) /
    changeMetrics.weeklyLoadBefore;
  if (loadChange > MATERIALITY_THRESHOLDS.weeklyLoadChange) {
    score += 25;
    factors.push(`Weekly load changed by ${Math.round(loadChange * 100)}%`);
  }

  // Equipment requirements [T-29]
  if (changeMetrics.equipmentChanged) {
    score += 20;
    factors.push('Equipment requirements changed');
  }

  const isMaterial = score > 50;

  return {
    isMaterial,
    score,
    factors,
    recommendation: isMaterial ? 'PENDING' : 'AUTO_APPLY',
  };
}

// Accept material change [T-29]
export async function acceptMaterialChange(
  adjustmentId: string,
  athleteId: string,
): Promise<{ success: boolean; adjustment?: any; error?: string }> {
  try {
    const adjustment = await prisma.planAdjustment.findUnique({
      where: { id: adjustmentId },
      include: { plan: true },
    });

    if (!adjustment) {
      return { success: false, error: 'Adjustment not found' };
    }

    if (adjustment.plan.athleteId !== athleteId) {
      return { success: false, error: 'Not authorized' };
    }

    if (adjustment.status !== 'PENDING') {
      return { success: false, error: 'Only PENDING adjustments can be accepted' };
    }

    // Apply the adjustment [T-29]
    const updated = await prisma.planAdjustment.update({
      where: { id: adjustmentId },
      data: {
        status: 'AUTO_APPLIED',
        appliedAt: new Date(),
      },
    });

    // Write audit event
    await prisma.auditEvent.create({
      data: {
        athleteId,
        eventType: 'PLAN_ADJUSTED',
        description: `Athlete accepted material plan change: ${adjustment.reason}`,
        metadata: JSON.stringify({
          adjustmentId,
          reason: adjustment.reason,
          changesSummary: adjustment.changesSummary,
        }),
      },
    });

    return { success: true, adjustment: updated };
  } catch (error) {
    console.error('Failed to accept change:', error);
    return { success: false, error: 'Failed to accept change' };
  }
}

// Reject material change (revert to previous state) [T-29]
export async function rejectMaterialChange(
  adjustmentId: string,
  athleteId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const adjustment = await prisma.planAdjustment.findUnique({
      where: { id: adjustmentId },
      include: { plan: true },
    });

    if (!adjustment) {
      return { success: false, error: 'Adjustment not found' };
    }

    if (adjustment.plan.athleteId !== athleteId) {
      return { success: false, error: 'Not authorized' };
    }

    if (adjustment.status !== 'PENDING') {
      return { success: false, error: 'Only PENDING adjustments can be rejected' };
    }

    // Mark as rejected (do not apply) [T-29]
    await prisma.planAdjustment.update({
      where: { id: adjustmentId },
      data: {
        status: 'REJECTED',
      },
    });

    // Write audit event
    await prisma.auditEvent.create({
      data: {
        athleteId,
        eventType: 'PLAN_ADJUSTED',
        description: `Athlete rejected material plan change: ${adjustment.reason}`,
        metadata: JSON.stringify({
          adjustmentId,
          reason: adjustment.reason,
        }),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to reject change:', error);
    return { success: false, error: 'Failed to reject change' };
  }
}

// Get pending material changes for athlete [T-29]
export async function getPendingAdjustments(athleteId: string) {
  try {
    const adjustments = await prisma.planAdjustment.findMany({
      where: {
        plan: { athleteId },
        status: 'PENDING',
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, adjustments };
  } catch (error) {
    console.error('Failed to fetch adjustments:', error);
    return { success: false, adjustments: [] };
  }
}
