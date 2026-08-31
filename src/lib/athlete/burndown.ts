// Burn-down dashboard data [T-26, FR-D01-D08]
// Days/weeks remaining, current phase, planned vs completed, risk flags

export interface BurndownMetrics {
  daysRemaining: number;
  weeksRemaining: number;
  currentPhase: string;
  phaseEndDate: string;
  sessionsPlanned: number;
  sessionsCompleted: number;
  sessionCompletionRate: number; // 0-1
  minutesPlanned: number;
  minutesCompleted: number;
  minuteCompletionRate: number; // 0-1
  nextSessionDate?: string;
  nextSessionTitle?: string;
  recoveryDaysThisWeek: number;
  adherenceThisWeek: number; // 0-1
  preparationStatus: string; // "ON_TRACK", "BEHIND", "AHEAD", "AT_RISK"
  preparationExplanation: string;
}

export interface RiskFlag {
  type:
    | 'REPEATED_SKIPS'
    | 'SUSTAINED_EFFORT'
    | 'PAIN_REPORTED'
    | 'COMPRESSED_TIME'
    | 'LOW_ADHERENCE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  sessionCount?: number;
  lastOccurrence?: string;
}

export interface PlanChange {
  id: string;
  version: number;
  reason: string;
  summary: string;
  material: boolean;
  status: string;
  approvedAt?: string;
  createdAt: string;
}

export interface DashboardData {
  metrics: BurndownMetrics;
  riskFlags: RiskFlag[];
  recentChanges: PlanChange[];
}

// Calculate burn-down metrics [T-26]
export function calculateBurndownMetrics(
  completedSessions: number,
  plannedSessions: number,
  completedMinutes: number,
  plannedMinutes: number,
  daysRemaining: number,
  currentPhase: string,
  phaseEndDate: Date,
  nextSession?: { date: Date; title: string },
  recoveryDays?: number,
  weekAdherence?: number,
): BurndownMetrics {
  const weeksRemaining = Math.ceil(daysRemaining / 7);
  const sessionCompletionRate = plannedSessions > 0 ? completedSessions / plannedSessions : 0;
  const minuteCompletionRate = plannedMinutes > 0 ? completedMinutes / plannedMinutes : 0;

  // Calculate preparation status [T-26, FR-D06]
  let preparationStatus: string;
  let preparationExplanation: string;

  if (sessionCompletionRate >= 0.95) {
    preparationStatus = 'AHEAD';
    preparationExplanation = 'You are ahead of schedule. Maintain consistency and focus on quality.';
  } else if (sessionCompletionRate >= 0.75) {
    preparationStatus = 'ON_TRACK';
    preparationExplanation = 'You are on track for your training plan. Continue at current pace.';
  } else if (sessionCompletionRate >= 0.5) {
    preparationStatus = 'BEHIND';
    preparationExplanation = 'You are behind schedule. Prioritize upcoming key sessions.';
  } else {
    preparationStatus = 'AT_RISK';
    preparationExplanation =
      'Your preparation is at risk. Consider adjusting your schedule or intensity to catch up.';
  }

  return {
    daysRemaining,
    weeksRemaining,
    currentPhase,
    phaseEndDate: phaseEndDate.toISOString().split('T')[0],
    sessionsPlanned: plannedSessions,
    sessionsCompleted: completedSessions,
    sessionCompletionRate,
    minutesPlanned: plannedMinutes,
    minutesCompleted: completedMinutes,
    minuteCompletionRate,
    nextSessionDate: nextSession?.date.toISOString().split('T')[0],
    nextSessionTitle: nextSession?.title,
    recoveryDaysThisWeek: recoveryDays || 0,
    adherenceThisWeek: weekAdherence || 0,
    preparationStatus,
    preparationExplanation,
  };
}

// Detect risk flags [T-26, FR-D08]
export function detectRiskFlags(
  completionRate: number,
  recentSessions: Array<{ rpe?: number; painReported: boolean; actualDurationMinutes: number; plannedDurationMinutes: number }>,
  skippedSessionsInRow: number,
): RiskFlag[] {
  const flags: RiskFlag[] = [];

  // Repeated skips [FR-D08]
  if (skippedSessionsInRow >= 2) {
    flags.push({
      type: 'REPEATED_SKIPS',
      severity: skippedSessionsInRow >= 3 ? 'HIGH' : 'MEDIUM',
      description: `${skippedSessionsInRow} sessions skipped in a row. This may impact race preparation.`,
      sessionCount: skippedSessionsInRow,
    });
  }

  // Sustained high effort [FR-D08]
  const highEffortSessions = recentSessions.filter((s) => s.rpe && s.rpe >= 8);
  if (highEffortSessions.length >= 3) {
    flags.push({
      type: 'SUSTAINED_EFFORT',
      severity: 'MEDIUM',
      description: `Multiple high-intensity sessions in a row (${highEffortSessions.length}). Ensure adequate recovery.`,
      sessionCount: highEffortSessions.length,
    });
  }

  // Pain reports [FR-D08]
  const painReports = recentSessions.filter((s) => s.painReported);
  if (painReports.length >= 2) {
    flags.push({
      type: 'PAIN_REPORTED',
      severity: 'MEDIUM',
      description: `Pain reported in ${painReports.length} recent sessions. Consider adjusting intensity or consulting a coach.`,
      sessionCount: painReports.length,
    });
  }

  // Compressed time [FR-D08]
  const compressedSessions = recentSessions.filter(
    (s) => s.actualDurationMinutes < s.plannedDurationMinutes * 0.7,
  );
  if (compressedSessions.length >= 2) {
    flags.push({
      type: 'COMPRESSED_TIME',
      severity: 'LOW',
      description: `${compressedSessions.length} sessions completed in significantly less time than planned. Check if intensity or volume is reduced.`,
      sessionCount: compressedSessions.length,
    });
  }

  // Low adherence [FR-D08]
  if (completionRate < 0.5) {
    flags.push({
      type: 'LOW_ADHERENCE',
      severity: 'HIGH',
      description: 'Adherence is below 50%. Prioritize completing your scheduled sessions.',
    });
  }

  return flags;
}

// Format metrics for display [T-26]
export function formatBurndownForDisplay(metrics: BurndownMetrics) {
  return {
    timeRemaining: {
      days: metrics.daysRemaining,
      weeks: metrics.weeksRemaining,
      formattedPhase: `${metrics.currentPhase} (ends ${metrics.phaseEndDate})`,
    },
    progress: {
      sessions: {
        completed: metrics.sessionsCompleted,
        planned: metrics.sessionsPlanned,
        remaining: Math.max(0, metrics.sessionsPlanned - metrics.sessionsCompleted),
        percentComplete: `${Math.round(metrics.sessionCompletionRate * 100)}%`,
      },
      minutes: {
        completed: Math.round(metrics.minutesCompleted / 60),
        planned: Math.round(metrics.minutesPlanned / 60),
        remaining: Math.round(Math.max(0, (metrics.minutesPlanned - metrics.minutesCompleted) / 60)),
        percentComplete: `${Math.round(metrics.minuteCompletionRate * 100)}%`,
      },
    },
    upcomingSession: metrics.nextSessionTitle
      ? {
          date: metrics.nextSessionDate,
          title: metrics.nextSessionTitle,
        }
      : null,
    thisWeek: {
      adherence: `${Math.round(metrics.adherenceThisWeek * 100)}%`,
      recoveryDays: metrics.recoveryDaysThisWeek,
    },
    status: {
      label: metrics.preparationStatus,
      explanation: metrics.preparationExplanation,
    },
  };
}
