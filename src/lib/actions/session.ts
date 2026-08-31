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
        athleteId: session.athleteId,
      },
    });

    if (!trainingSession) {
      return { error: 'Session not found' };
    }

    // Map to actual SessionCheckIn schema fields
    const mobilityNotesValue = checkInData.mobilityReported
      ? checkInData.mobilityLimitations.length > 0
        ? 'LIMITED'
        : 'GOOD'
      : undefined;

    const painNotesValue = checkInData.painReported ? checkInData.painSeverity : undefined;

    // Create check-in record [T-25, FR-A01]
    const checkIn = await prisma.sessionCheckIn.create({
      data: {
        sessionId: checkInData.sessionId,
        athleteId: session.athleteId,
        rpe: checkInData.rpe,
        actualDuration: checkInData.actualDurationMinutes * 60,
        painFlag: checkInData.painReported,
        painNotes: painNotesValue || null,
        mobilityFlag: checkInData.mobilityReported,
        mobilityNotes: mobilityNotesValue || null,
        performedSubstitution: checkInData.substitutionsPerformed[0] || null,
        substitutionReason: checkInData.notes || null,
        notes: checkInData.notes || null,
        completionStatus: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Lock the session [FR-A01] - immutable after completion
    const updatedSession = await prisma.trainingSession.update({
      where: { id: checkInData.sessionId },
      data: {
        locked: true,
      },
    });

    // Create audit event for completion
    await prisma.auditEvent.create({
      data: {
        athleteId: session.athleteId,
        eventType: 'SESSION_LOCKED',
        description: `Session ${trainingSession.title} completed with RPE ${checkInData.rpe}`,
        metadata: JSON.stringify({
          sessionId: checkInData.sessionId,
          rpe: checkInData.rpe,
          actualMinutes: checkInData.actualDurationMinutes,
          plannedMinutes: Math.ceil(trainingSession.duration / 60),
          painReported: checkInData.painReported,
          mobilityReported: checkInData.mobilityReported,
        }),
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

    const checkIn = await prisma.sessionCheckIn.findUnique({
      where: { sessionId },
    });

    if (!checkIn) {
      return { success: true, checkIn: null };
    }

    if (checkIn.athleteId !== session.athleteId) {
      return { error: 'Not authorized' };
    }

    return {
      success: true,
      checkIn: {
        id: checkIn.id,
        rpe: checkIn.rpe,
        actualDurationMinutes: checkIn.actualDuration ? checkIn.actualDuration / 60 : 0,
        painReported: checkIn.painFlag,
        painNotes: checkIn.painNotes,
        mobilityReported: checkIn.mobilityFlag,
        mobilityNotes: checkIn.mobilityNotes,
        substitutions: checkIn.performedSubstitution,
        notes: checkIn.notes,
        status: checkIn.completionStatus,
        completedAt: checkIn.completedAt.toISOString(),
      },
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
        athleteId: session.athleteId,
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
        duration: ts.duration,
        intensity: ts.intensityLabel,
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
        athleteId: session.athleteId,
        scheduledDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        checkIn: true,
      },
    });

    const completedSessions = sessions.filter((s: any) => s.locked);
    const totalPlannedMinutes = sessions.reduce((sum: number, s: any) => sum + s.duration / 60, 0);
    const totalCompletedMinutes = completedSessions.reduce(
      (sum: number, s: any) => sum + (s.checkIn?.actualDuration || s.duration) / 60,
      0,
    );

    const rpes: number[] = completedSessions
      .map((s: any) => s.checkIn?.rpe)
      .filter((rpe: any) => rpe !== null && rpe !== undefined) as number[];

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

// Get dashboard data [T-26]
export async function getDashboardData() {
  try {
    const session = await getSession();
    if (!session?.athleteId) {
      return { error: 'Not authenticated' };
    }

    // Get current plan
    const plan = await prisma.trainingPlan.findFirst({
      where: { athleteId: session.athleteId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: {
        sessions: {
          orderBy: { scheduledDate: 'asc' },
          include: { checkIn: true },
        },
        adjustments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!plan) {
      return { error: 'No active training plan found' };
    }

    // Calculate metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedSessions = plan.sessions.filter((s: any) => s.locked);
    const completedMinutes = completedSessions.reduce(
      (sum: number, s: any) => sum + (s.checkIn?.actualDuration || s.duration),
      0,
    );
    const totalPlannedMinutes = plan.sessions.reduce((sum: number, s: any) => sum + s.duration, 0);
    const daysRemaining = Math.ceil(
      (plan.competitionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Find current phase
    let currentPhase = 'UNKNOWN';
    let phaseEnd = plan.competitionDate;
    if (plan.foundationStart && plan.foundationEnd && today <= plan.foundationEnd) {
      currentPhase = 'FOUNDATION';
      phaseEnd = plan.foundationEnd;
    } else if (plan.developmentStart && plan.developmentEnd && today <= plan.developmentEnd) {
      currentPhase = 'DEVELOPMENT';
      phaseEnd = plan.developmentEnd;
    } else if (plan.raceSpecificStart && plan.raceSpecificEnd && today <= plan.raceSpecificEnd) {
      currentPhase = 'RACE_SPECIFIC';
      phaseEnd = plan.raceSpecificEnd;
    } else if (plan.peakStart && plan.peakEnd && today <= plan.peakEnd) {
      currentPhase = 'PEAK';
      phaseEnd = plan.peakEnd;
    } else if (plan.taperStart && plan.taperEnd && today <= plan.taperEnd) {
      currentPhase = 'TAPER';
      phaseEnd = plan.taperEnd;
    } else if (plan.raceWeekStart && today <= plan.competitionDate) {
      currentPhase = 'RACE_WEEK';
      phaseEnd = plan.competitionDate;
    }

    // Next session
    const nextSession = plan.sessions.find((s: any) => s.scheduledDate >= today && !s.locked);

    // This week's sessions (for adherence)
    const weekStart = new Date(today);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekSessions = plan.sessions.filter(
      (s: any) => s.scheduledDate >= weekStart && s.scheduledDate < weekEnd,
    );
    const completedWeekSessions = weekSessions.filter((s: any) => s.locked);
    const weekAdherence =
      weekSessions.length > 0 ? completedWeekSessions.length / weekSessions.length : 0;
    const recoveryDays = 7 - weekSessions.length;

    // Recent sessions for risk detection
    const recentStart = new Date(today);
    recentStart.setDate(recentStart.getDate() - 7);
    const recentSessions = plan.sessions
      .filter((s: any) => s.scheduledDate >= recentStart && s.locked)
      .map((s: any) => ({
        rpe: s.checkIn?.rpe,
        painReported: s.checkIn?.painFlag || false,
        actualDurationMinutes: s.checkIn?.actualDuration ? s.checkIn.actualDuration / 60 : 0,
        plannedDurationMinutes: s.duration / 60,
      }));

    // Count consecutive skips
    let skippedInRow = 0;
    for (let i = plan.sessions.length - 1; i >= 0; i--) {
      const s = plan.sessions[i];
      if (s.locked) break;
      if (s.scheduledDate < today) {
        skippedInRow++;
      }
    }

    return {
      success: true,
      data: {
        metrics: {
          completedSessions: completedSessions.length,
          plannedSessions: plan.sessions.length,
          completedMinutes,
          plannedMinutes: totalPlannedMinutes,
          daysRemaining,
          currentPhase,
          phaseEnd,
          nextSession,
          recoveryDays,
          weekAdherence,
        },
        recentSessions,
        skippedInRow,
        changes: plan.adjustments,
      },
    };
  } catch (error) {
    console.error('Failed to get dashboard data:', error);
    return { error: 'Failed to load dashboard data' };
  }
}
