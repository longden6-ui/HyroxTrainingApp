'use server';

import { PrismaClient } from '@prisma/client';
import { getSession } from '@/src/lib/auth/session';

const prisma = new PrismaClient();

interface SessionsByDay {
  [date: string]: {
    date: Date;
    dayOfWeek: string;
    sessions: Array<{
      id: string;
      title: string;
      purpose: string;
      duration: number;
      intensityLabel: string;
      primaryFocus: string;
      scheduledDate: Date;
      phase: string;
      locked: boolean;
    }>;
  };
}

// Fetch all training sessions organized by day [T-24]
export async function getFullTrainingPlan() {
  try {
    const session = await getSession();
    if (!session?.athleteId) {
      return { error: 'Not authenticated' };
    }

    // Get athlete's active training plan
    const plan = await prisma.trainingPlan.findFirst({
      where: { athleteId: session.athleteId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: {
        sessions: {
          orderBy: { scheduledDate: 'asc' },
        },
      },
    });

    if (!plan) {
      return { error: 'No training plan found' };
    }

    // Organize sessions by day
    const sessionsByDay: SessionsByDay = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const session of plan.sessions) {
      const dateKey = session.scheduledDate.toISOString().split('T')[0];

      if (!sessionsByDay[dateKey]) {
        const dayOfWeek = dayNames[session.scheduledDate.getDay()];
        sessionsByDay[dateKey] = {
          date: session.scheduledDate,
          dayOfWeek,
          sessions: [],
        };
      }

      // Determine phase based on session date
      let sessionPhase = 'UNKNOWN';
      if (plan.foundationStart && plan.foundationEnd && session.scheduledDate >= plan.foundationStart && session.scheduledDate <= plan.foundationEnd) {
        sessionPhase = 'FOUNDATION';
      } else if (plan.developmentStart && plan.developmentEnd && session.scheduledDate >= plan.developmentStart && session.scheduledDate <= plan.developmentEnd) {
        sessionPhase = 'DEVELOPMENT';
      } else if (plan.raceSpecificStart && plan.raceSpecificEnd && session.scheduledDate >= plan.raceSpecificStart && session.scheduledDate <= plan.raceSpecificEnd) {
        sessionPhase = 'RACE_SPECIFIC';
      } else if (plan.peakStart && plan.peakEnd && session.scheduledDate >= plan.peakStart && session.scheduledDate <= plan.peakEnd) {
        sessionPhase = 'PEAK';
      } else if (plan.taperStart && plan.taperEnd && session.scheduledDate >= plan.taperStart && session.scheduledDate <= plan.taperEnd) {
        sessionPhase = 'TAPER';
      } else if (plan.raceWeekStart) {
        const raceWeekEnd = new Date(plan.raceWeekStart);
        raceWeekEnd.setDate(raceWeekEnd.getDate() + 7);
        if (session.scheduledDate >= plan.raceWeekStart && session.scheduledDate < raceWeekEnd) {
          sessionPhase = 'RACE_WEEK';
        }
      }

      sessionsByDay[dateKey].sessions.push({
        id: session.id,
        title: session.title,
        purpose: session.purpose,
        duration: session.duration,
        intensityLabel: session.intensityLabel || 'EASY',
        primaryFocus: session.primaryFocus || 'COMBINED',
        scheduledDate: session.scheduledDate,
        phase: sessionPhase,
        locked: session.locked,
      });
    }

    // Sort by date
    const sortedDays = Object.keys(sessionsByDay)
      .sort()
      .reduce((result: SessionsByDay, key) => {
        result[key] = sessionsByDay[key];
        return result;
      }, {});

    return {
      success: true,
      plan: {
        id: plan.id,
        competitionDate: plan.competitionDate,
        totalSessions: plan.sessions.length,
      },
      sessionsByDay: sortedDays,
    };
  } catch (error) {
    console.error('Failed to load training plan:', error);
    return { error: 'Failed to load training plan' };
  }
}
