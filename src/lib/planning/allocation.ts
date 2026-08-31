// Session allocation into available time slots [T-18, FR-G03, US-03]
// Place sessions within per-day availability without exceeding athlete's time budget

export interface AvailabilityByDay {
  [day: string]: number; // Minutes available per day (e.g., MONDAY: 60)
}

export interface SessionTemplate {
  id: string;
  duration: number; // Seconds
  date: Date; // Target date (may shift if no availability)
  priority: 'REQUIRED' | 'PREFERRED' | 'FLEXIBLE'; // Urgency
}

export interface AllocatedSession {
  templateId: string;
  scheduledDate: Date;
  scheduledHour?: number;
  status: 'ALLOCATED' | 'DEFERRED' | 'WARNING'; // WARNING if misaligned with availability
  warningMessage?: string;
}

// Get day-of-week name (0=Sunday, 1=Monday, etc.)
function getDayName(date: Date): string {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return days[date.getDay()];
}

// Allocate sessions into available time slots [T-18]
export function allocateSessions(
  sessions: SessionTemplate[],
  availabilityByDay: AvailabilityByDay,
  planStart: Date,
  planEnd: Date,
): {
  success: boolean;
  allocated: AllocatedSession[];
  warnings: Array<{ sessionId: string; warning: string }>;
} {
  const allocated: AllocatedSession[] = [];
  const warnings: Array<{ sessionId: string; warning: string }> = [];

  // Track daily usage [T-18, FR-G03]
  const dailyUsage: { [dateString: string]: number } = {};

  // Sort sessions by priority and date
  const sorted = [...sessions].sort((a, b) => {
    const priorityOrder = { REQUIRED: 0, PREFERRED: 1, FLEXIBLE: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.date.getTime() - b.date.getTime();
  });

  for (const session of sorted) {
    const durationMinutes = Math.ceil(session.duration / 60);
    const dayName = getDayName(session.date);
    const availableMinutes = availabilityByDay[dayName] || 0;
    const dateKey = session.date.toISOString().split('T')[0];

    // Get current usage for this day
    const currentUsage = dailyUsage[dateKey] || 0;

    // Check if session fits [T-18]
    if (currentUsage + durationMinutes <= availableMinutes) {
      // Fits! Allocate to target date
      allocated.push({
        templateId: session.id,
        scheduledDate: session.date,
        status: 'ALLOCATED',
      });
      dailyUsage[dateKey] = currentUsage + durationMinutes;
    } else if (session.priority === 'FLEXIBLE') {
      // Try to find next available day [T-18]
      let found = false;
      let checkDate = new Date(session.date);
      checkDate.setDate(checkDate.getDate() + 1);

      while (checkDate <= planEnd && !found) {
        const checkDayName = getDayName(checkDate);
        const checkAvailable = availabilityByDay[checkDayName] || 0;
        const checkDateKey = checkDate.toISOString().split('T')[0];
        const checkUsage = dailyUsage[checkDateKey] || 0;

        if (checkUsage + durationMinutes <= checkAvailable) {
          allocated.push({
            templateId: session.id,
            scheduledDate: checkDate,
            status: 'ALLOCATED',
          });
          dailyUsage[checkDateKey] = checkUsage + durationMinutes;
          found = true;

          warnings.push({
            sessionId: session.id,
            warning: `Deferred from ${session.date.toDateString()} to ${checkDate.toDateString()} to fit available time`,
          });
        }

        checkDate.setDate(checkDate.getDate() + 1);
      }

      if (!found) {
        // Could not find slot - warn and defer [T-18, FR-G03]
        allocated.push({
          templateId: session.id,
          scheduledDate: session.date,
          status: 'WARNING',
          warningMessage: `Insufficient availability for ${durationMinutes}min session. Target day has ${availableMinutes}min available, ${currentUsage}min already used.`,
        });

        warnings.push({
          sessionId: session.id,
          warning: `Insufficient time on ${dayName}. Need ${durationMinutes}min, have ${availableMinutes - currentUsage}min free. Consider adjusting availability or session duration.`,
        });
      }
    } else {
      // Required or preferred: warn but allocate to target date anyway [T-18]
      allocated.push({
        templateId: session.id,
        scheduledDate: session.date,
        status: 'WARNING',
        warningMessage: `Session exceeds daily availability. Allocating despite constraint.`,
      });

      warnings.push({
        sessionId: session.id,
        warning: `${session.priority} session exceeds available time on ${dayName} by ${currentUsage + durationMinutes - availableMinutes}min`,
      });

      dailyUsage[dateKey] = currentUsage + durationMinutes;
    }
  }

  return {
    success: warnings.length === 0,
    allocated,
    warnings,
  };
}

// Check if target and availability are misaligned [T-18, US-03 criterion 2-3]
export function checkAvailabilityAlignment(
  totalMinutesPerWeek: number,
  availabilityByDay: AvailabilityByDay,
): {
  misaligned: boolean;
  message?: string;
} {
  const availablePerWeek = Object.values(availabilityByDay).reduce((a, b) => a + b, 0);

  // If available time is significantly less than target, warn [T-18]
  if (availablePerWeek < totalMinutesPerWeek * 0.7) {
    return {
      misaligned: true,
      message: `Available weekly time (${availablePerWeek}min) is significantly less than target (${totalMinutesPerWeek}min). Consider increasing availability or extending timeline.`,
    };
  }

  // If available time is more than 2x target, also warn (overtraining risk) [T-18]
  if (availablePerWeek > totalMinutesPerWeek * 2) {
    return {
      misaligned: true,
      message: `Available weekly time (${availablePerWeek}min) exceeds target by 2x (${totalMinutesPerWeek}min). Plan may be too conservative.`,
    };
  }

  return { misaligned: false };
}
