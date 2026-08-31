// Athlete calendar view [T-23, FR-D01-D05]
// Display training plan by week and month, phase-aware, showing rest days as deliberate

export interface CalendarSession {
  id: string;
  date: Date;
  title: string;
  duration: number; // Seconds
  primaryFocus: string;
  intensity: 'EASY' | 'MODERATE' | 'HARD' | 'RACE_PACE';
  completed: boolean;
  phase: string;
}

export interface CalendarDay {
  date: Date;
  dayOfWeek: string; // MONDAY, TUESDAY, etc.
  session?: CalendarSession;
  isRestDay: boolean;
  isPhaseTransition: boolean; // First day of new phase
}

export interface CalendarWeek {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  phase: string;
  days: CalendarDay[];
  totalMinutes: number;
  sessionsCount: number;
  completedCount: number;
  adherence: number; // 0-1, completed/planned
}

export interface CalendarMonth {
  month: number;
  year: number;
  weeks: CalendarWeek[];
  totalSessions: number;
  completedSessions: number;
  overallAdherence: number;
}

// Build week view [T-23]
export function buildWeekView(
  weekStartDate: Date,
  sessions: CalendarSession[],
  planPhase: string,
  phaseTransitionDate?: Date,
): CalendarWeek {
  const days: CalendarDay[] = [];
  let totalMinutes = 0;
  let completedCount = 0;

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStartDate);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);

    const dayName = getDayName(date);
    const daySession = sessions.find((s) => {
      const sDate = new Date(s.date);
      sDate.setHours(0, 0, 0, 0);
      return sDate.getTime() === date.getTime();
    });

    const isPhaseTransition = phaseTransitionDate
      ? new Date(phaseTransitionDate).toDateString() === date.toDateString()
      : false;

    if (daySession) {
      totalMinutes += Math.ceil(daySession.duration / 60);
      if (daySession.completed) {
        completedCount++;
      }
    }

    days.push({
      date,
      dayOfWeek: dayName,
      session: daySession,
      isRestDay: !daySession, // No session = rest day [T-23]
      isPhaseTransition,
    });
  }

  const sessionsCount = days.filter((d) => d.session).length;
  const adherence = sessionsCount > 0 ? completedCount / sessionsCount : 0;

  return {
    weekNumber: getWeekNumber(weekStartDate),
    startDate: weekStartDate,
    endDate: new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000),
    phase: planPhase,
    days,
    totalMinutes,
    sessionsCount,
    completedCount,
    adherence,
  };
}

// Build month view [T-23]
export function buildMonthView(
  month: number,
  year: number,
  sessions: CalendarSession[],
  planPhases: Map<string, Date>, // Phase name -> start date
): CalendarMonth {
  const weeks: CalendarWeek[] = [];
  let totalSessions = 0;
  let completedSessions = 0;

  // Find first day of month
  const firstDay = new Date(year, month, 1);
  const firstMonday = new Date(firstDay);
  const dayOfWeek = firstDay.getDay();
  firstMonday.setDate(firstDay.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  // Build all weeks in month
  let currentDate = new Date(firstMonday);
  while (currentDate.getMonth() <= month && currentDate.getFullYear() <= year) {
    const weekStart = new Date(currentDate);
    weekStart.setHours(0, 0, 0, 0);

    // Determine phase for this week
    let weekPhase = 'UNKNOWN';
    for (const [phase, startDate] of planPhases.entries()) {
      if (startDate <= weekStart) {
        weekPhase = phase;
      }
    }

    const weekSessions = sessions.filter((s) => {
      const sDate = new Date(s.date);
      const nextWeek = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      return sDate >= weekStart && sDate < nextWeek;
    });

    const weekView = buildWeekView(
      weekStart,
      weekSessions,
      weekPhase,
      Array.from(planPhases.values()).find((d) => d >= weekStart),
    );

    // Only include weeks that overlap with this month
    if (weekView.startDate.getMonth() === month || weekView.endDate.getMonth() === month) {
      weeks.push(weekView);
      totalSessions += weekView.sessionsCount;
      completedSessions += weekView.completedCount;
    }

    currentDate.setDate(currentDate.getDate() + 7);
  }

  const overallAdherence = totalSessions > 0 ? completedSessions / totalSessions : 0;

  return {
    month,
    year,
    weeks,
    totalSessions,
    completedSessions,
    overallAdherence,
  };
}

// Get phase for date [T-23]
export function getPhaseForDate(
  date: Date,
  phases: Map<string, { start: Date; end: Date }>,
): string | null {
  for (const [phaseName, { start, end }] of phases.entries()) {
    if (date >= start && date <= end) {
      return phaseName;
    }
  }
  return null;
}

// Helper: Get day name
function getDayName(date: Date): string {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return days[date.getDay()];
}

// Helper: Get week number
function getWeekNumber(date: Date): number {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const pastDays = (date.getTime() - firstDay.getTime()) / 86400000;
  return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
}

// Format calendar data for display [T-23]
export function formatCalendarForDisplay(month: CalendarMonth): {
  monthName: string;
  weeks: Array<{
    weekLabel: string;
    phase: string;
    adherence: string;
    days: Array<{ dayName: string; hasSession: boolean; isRest: boolean; completed: boolean }>;
  }>;
} {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return {
    monthName: `${monthNames[month.month]} ${month.year}`,
    weeks: month.weeks.map((week) => ({
      weekLabel: `Week ${week.weekNumber}`,
      phase: week.phase,
      adherence: `${Math.round(week.adherence * 100)}%`,
      days: week.days.map((day) => ({
        dayName: day.dayOfWeek,
        hasSession: !!day.session,
        isRest: day.isRestDay,
        completed: day.session?.completed || false,
      })),
    })),
  };
}
