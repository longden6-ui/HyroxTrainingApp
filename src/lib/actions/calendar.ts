'use server';

import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth/session';
import { buildMonthView, formatCalendarForDisplay } from '@/lib/athlete/calendar';
import { getPhaseForDate } from '@/lib/planning/phases';

const prisma = new PrismaClient();

// Fetch athlete's calendar data [T-23]
export async function getAthleteCalendar(month: number, year: number) {
  try {
    const session = await getSession();
    if (!session?.athleteId) {
      return { error: 'Not authenticated' };
    }

    // Get athlete's training plan
    const plan = await prisma.trainingPlan.findFirst({
      where: { athleteId: session.athleteId },
      orderBy: { createdAt: 'desc' },
      include: {
        sessions: {
          orderBy: { scheduledDate: 'asc' },
        },
        ruleSet: true,
      },
    });

    if (!plan) {
      return { error: 'No training plan found' };
    }

    // Map database sessions to calendar sessions
    const calendarSessions = plan.sessions.map((session: any) => ({
      id: session.id,
      date: session.scheduledDate,
      title: session.title,
      duration: session.durationSeconds,
      primaryFocus: session.primaryFocus,
      intensity: session.intensity as 'EASY' | 'MODERATE' | 'HARD' | 'RACE_PACE',
      completed: session.locked, // Session is locked after completion
      phase: session.phase,
    }));

    // Build phase boundaries map
    const phaseMap = new Map<
      string,
      {
        start: Date;
        end: Date;
      }
    >();

    // Get all phases from the plan's sessions
    const phases = Array.from(new Set(plan.sessions.map((s: any) => s.phase))) as string[];
    for (const phase of phases) {
      const phaseSessions = plan.sessions.filter((s: any) => s.phase === phase);
      if (phaseSessions.length > 0) {
        const startDate = new Date(
          Math.min(...phaseSessions.map((s: any) => s.scheduledDate.getTime())),
        );
        const endDate = new Date(
          Math.max(...phaseSessions.map((s: any) => s.scheduledDate.getTime())),
        );

        phaseMap.set(phase, { start: startDate, end: endDate });
      }
    }

    // Build month view
    const planPhaseStartDates = new Map(
      Array.from(phaseMap.entries()).map(([k, v]) => [k, v.start])
    );
    const calendarMonth = buildMonthView(month, year, calendarSessions, planPhaseStartDates);

    // Format for display
    const displayData = formatCalendarForDisplay(calendarMonth);

    return {
      success: true,
      calendar: displayData,
      planId: plan.id,
      raceDate: plan.raceDate,
    };
  } catch (error) {
    console.error('Failed to load calendar:', error);
    return { error: 'Failed to load calendar data' };
  }
}

// Get session details for a specific day [T-23, T-24]
export async function getSessionDetails(sessionId: string) {
  try {
    const session = await getSession();
    if (!session?.athleteId) {
      return { error: 'Not authenticated' };
    }

    const trainingSession = await prisma.trainingSession.findFirst({
      where: {
        id: sessionId,
        trainingPlan: {
          athleteId: session.athleteId,
        },
      },
      include: {
        template: true,
        checkIns: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!trainingSession) {
      return { error: 'Session not found' };
    }

    return {
      success: true,
      session: {
        id: trainingSession.id,
        title: trainingSession.title,
        purpose: trainingSession.purpose,
        phase: trainingSession.phase,
        duration: trainingSession.durationSeconds,
        intensity: trainingSession.intensity,
        primaryFocus: trainingSession.primaryFocus,
        equipment: trainingSession.equipment || [],
        warmupMinutes: trainingSession.warmupSeconds ? trainingSession.warmupSeconds / 60 : 0,
        mainMinutes: trainingSession.mainSeconds ? trainingSession.mainSeconds / 60 : 0,
        cooldownMinutes: trainingSession.cooldownSeconds ? trainingSession.cooldownSeconds / 60 : 0,
        safetyNotes: trainingSession.safetyNotes,
        completed: trainingSession.locked,
        lastCheckIn: trainingSession.checkIns[0]
          ? {
              rpe: trainingSession.checkIns[0].rpe,
              actualMinutes: trainingSession.checkIns[0].actualDurationSeconds
                ? trainingSession.checkIns[0].actualDurationSeconds / 60
                : 0,
              painReported: trainingSession.checkIns[0].painReported,
              mobilityReported: trainingSession.checkIns[0].mobilityReported,
              notes: trainingSession.checkIns[0].notes,
            }
          : null,
      },
    };
  } catch (error) {
    console.error('Failed to load session details:', error);
    return { error: 'Failed to load session details' };
  }
}
