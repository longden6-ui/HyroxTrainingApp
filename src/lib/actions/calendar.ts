'use server';

import { PrismaClient } from '@prisma/client';
import { getSession } from '@/src/lib/auth/session';
import { buildMonthView, formatCalendarForDisplay } from '@/src/lib/athlete/calendar';
import { getPhaseForDate } from '@/src/lib/planning/phases';

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
      duration: session.duration,
      primaryFocus: session.primaryFocus,
      intensity: (session.intensityLabel || 'EASY') as 'EASY' | 'MODERATE' | 'HARD' | 'RACE_PACE',
      completed: session.locked, // Session is locked after completion
      phase: session.phase || 'UNKNOWN',
    }));

    // Build phase map from TrainingPlan dates
    const phaseMap = new Map<string, { start: Date; end: Date }>();

    if (plan.foundationStart && plan.foundationEnd) {
      phaseMap.set('FOUNDATION', { start: plan.foundationStart, end: plan.foundationEnd });
    }
    if (plan.developmentStart && plan.developmentEnd) {
      phaseMap.set('DEVELOPMENT', { start: plan.developmentStart, end: plan.developmentEnd });
    }
    if (plan.raceSpecificStart && plan.raceSpecificEnd) {
      phaseMap.set('RACE_SPECIFIC', { start: plan.raceSpecificStart, end: plan.raceSpecificEnd });
    }
    if (plan.peakStart && plan.peakEnd) {
      phaseMap.set('PEAK', { start: plan.peakStart, end: plan.peakEnd });
    }
    if (plan.taperStart && plan.taperEnd) {
      phaseMap.set('TAPER', { start: plan.taperStart, end: plan.taperEnd });
    }
    if (plan.raceWeekStart) {
      const raceWeekEnd = new Date(plan.raceWeekStart);
      raceWeekEnd.setDate(raceWeekEnd.getDate() + 7);
      phaseMap.set('RACE_WEEK', { start: plan.raceWeekStart, end: raceWeekEnd });
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
      raceDate: plan.competitionDate,
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
        athleteId: session.athleteId,
      },
      include: {
        checkIn: true,
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
        duration: trainingSession.duration,
        intensity: trainingSession.intensityLabel,
        primaryFocus: trainingSession.primaryFocus,
        equipment: trainingSession.equipment ? JSON.parse(trainingSession.equipment) : [],
        warmupMinutes: trainingSession.warmupDuration ? trainingSession.warmupDuration / 60 : 0,
        mainMinutes: trainingSession.mainDuration ? trainingSession.mainDuration / 60 : 0,
        cooldownMinutes: trainingSession.cooldownDuration ? trainingSession.cooldownDuration / 60 : 0,
        safetyNotes: trainingSession.safetyNotes,
        completed: trainingSession.locked,
        lastCheckIn: trainingSession.checkIn
          ? {
              rpe: trainingSession.checkIn.rpe,
              actualMinutes: trainingSession.checkIn.actualDuration
                ? trainingSession.checkIn.actualDuration / 60
                : 0,
              painReported: trainingSession.checkIn.painFlag,
              mobilityReported: trainingSession.checkIn.mobilityFlag,
              notes: trainingSession.checkIn.notes,
            }
          : null,
      },
    };
  } catch (error) {
    console.error('Failed to load session details:', error);
    return { error: 'Failed to load session details' };
  }
}
