'use server';

import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth/session';
import { validateSessionCheckIn } from '@/lib/athlete/schema';

const prisma = new PrismaClient();

// Complete a training session with check-in [T-25, FR-A01]
export async function completeTrainingSession(checkInData: {
  sessionId: string;
  rpe: number;
  actualDurationMinutes: number;
  painReported: boolean;
  painSeverity: string;
  mobilityReported: boolean;
  mobilityLimitations: string[];
  substitutionsPerformed: string[];
  notes?: string;
}) {
  try {
    const session = await getSession();
    if (!session?.athleteId) {
      return { error: 'Not authenticated' };
    }

    // Validate check-in data
    const validation = validateSessionCheckIn(checkInData);
    if (!validation.valid) {
      return { error: 'Invalid check-in data', details: validation.errors };
    }

    // Verify session belongs to athlete
    const trainingSession = await prisma.trainingSession.findFirst({
      where: {
        id: checkInData.sessionId,
        trainingPlan: {
          athleteId: session.athleteId,
        },
      },
      include: {
        trainingPlan: true,
      },
    });

    if (!trainingSession) {
      return { error: 'Session not found' };
    }

    // Create check-in record [T-25, FR-A01]
    const checkIn = await prisma.sessionCheckIn.create({
      data: {
        sessionId: checkInData.sessionId,
        rpe: checkInData.rpe,
        actualDurationSeconds: checkInData.actualDurationMinutes * 60,
        painReported: checkInData.painReported,
        painSeverity: checkInData.painSeverity,
        mobilityReported: checkInData.mobilityReported,
        mobilityLimitations: checkInData.mobilityLimitations,
        substitutionsPerformed: checkInData.substitutionsPerformed,
        notes: checkInData.notes || null,
        completedAt: new Date(),
      },
    });

    // Lock the session [FR-A01] - immutable after completion
    const updatedSession = await prisma.trainingSession.update({
      where: { id: checkInData.sessionId },
      data: {
        locked: true,
        completedAt: new Date(),
      },
    });

    // Create audit log for completion
    await prisma.auditLog.create({
      data: {
        athleteId: session.athleteId,
        action: 'SESSION_COMPLETED',
        resourceType: 'TrainingSession',
        resourceId: checkInData.sessionId,
        metadata: {
          rpe: checkInData.rpe,
          actualMinutes: checkInData.actualDurationMinutes,
          plannedMinutes: trainingSession.durationSeconds / 60,
          painReported: checkInData.painReported,
          mobilityReported: checkInData.mobilityReported,
        },
      },
    });

    return {
      success: true,
      sessionId: updatedSession.id,
      checkInId: checkIn.id,
      locked: updatedSession.locked,
    };
  } catch (error) {
    console.error('Failed to complete session:', error);
    return { error: 'Failed to save session completion' };
  }
}

// Get session check-in history [T-25]
export async function getSessionCheckInHistory(sessionId: string) {
  try {
    const session = await getSession();
    if (!session?.athleteId) {
      return { error: 'Not authenticated' };
    }

    const checkIns = await prisma.sessionCheckIn.findMany({
      where: {
        session: {
          trainingPlan: {
            athleteId: session.athleteId,
          },
        },
        sessionId,
      },
      orderBy: { completedAt: 'desc' },
    });

    return {
      success: true,
      checkIns: checkIns.map((ci) => ({
        id: ci.id,
        rpe: ci.rpe,
        actualDurationMinutes: ci.actualDurationSeconds / 60,
        painReported: ci.painReported,
        painSeverity: ci.painSeverity,
        mobilityReported: ci.mobilityReported,
        mobilityLimitations: ci.mobilityLimitations,
        substitutions: ci.substitutionsPerformed,
        notes: ci.notes,
        completedAt: ci.completedAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error('Failed to load check-in history:', error);
    return { error: 'Failed to load check-in history' };
  }
}

// Get incomplete sessions for athlete [T-25, T-26]
export async function getIncompleteSessionsForWeek(weekStartDate: Date) {
  try {
    const session = await getSession();
    if (!session?.athleteId) {
      return { error: 'Not authenticated' };
    }

    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 7);

    const incompleteSessions = await prisma.trainingSession.findMany({
      where: {
        trainingPlan: {
          athleteId: session.athleteId,
        },
        scheduledDate: {
          gte: weekStartDate,
          lt: weekEndDate,
        },
        locked: false,
      },
      orderBy: { scheduledDate: 'asc' },
    });

    return {
      success: true,
      sessions: incompleteSessions.map((ts: any) => ({
        id: ts.id,
        title: ts.title,
        scheduledDate: ts.scheduledDate.toISOString(),
        duration: ts.durationSeconds,
        intensity: ts.intensity,
      })),
    };
  } catch (error) {
    console.error('Failed to load incomplete sessions:', error);
    return { error: 'Failed to load incomplete sessions' };
  }
}

// Get session completion summary for a date range [T-26]
export async function getSessionCompletionSummary(
  startDate: Date,
  endDate: Date,
): Promise<{
  success?: boolean;
  totalSessions?: number;
  completedSessions?: number;
  completionRate?: number;
  totalPlannedMinutes?: number;
  totalCompletedMinutes?: number;
  averageRpe?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.athleteId) {
      return { error: 'Not authenticated' };
    }

    const sessions = await prisma.trainingSession.findMany({
      where: {
        trainingPlan: {
          athleteId: session.athleteId,
        },
        scheduledDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        checkIns: {
          orderBy: { completedAt: 'desc' },
          take: 1,
        },
      },
    });

    const completedSessions = sessions.filter((s: any) => s.locked);
    const totalPlannedMinutes = sessions.reduce((sum: number, s: any) => sum + s.durationSeconds / 60, 0);
    const totalCompletedMinutes = completedSessions.reduce(
      (sum: number, s: any) => sum + (s.checkIns[0]?.actualDurationSeconds || s.durationSeconds) / 60,
      0,
    );

    const rpes: number[] = completedSessions
      .flatMap((s: any) => s.checkIns)
      .filter((ci: any) => ci.rpe !== null)
      .map((ci: any) => ci.rpe);

    const averageRpe = rpes.length > 0 ? rpes.reduce((a: number, b: number) => a + b, 0) / rpes.length : 0;

    return {
      success: true,
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      completionRate: sessions.length > 0 ? completedSessions.length / sessions.length : 0,
      totalPlannedMinutes: Math.round(totalPlannedMinutes),
      totalCompletedMinutes: Math.round(totalCompletedMinutes),
      averageRpe: Math.round(averageRpe * 10) / 10,
    };
  } catch (error) {
    console.error('Failed to get completion summary:', error);
    return { error: 'Failed to get completion summary' };
  }
}
