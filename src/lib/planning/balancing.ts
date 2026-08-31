// Session balancing across exercise types [T-19, FR-G04, FR-G05, US-02]
// Ensure proper distribution while emphasizing athlete's ranked stations

export enum PrimaryFocus {
  RUNNING = 'RUNNING',
  STRENGTH = 'STRENGTH',
  STATION_SKILL = 'STATION_SKILL', // Focused on one HYROX station
  COMBINED = 'COMBINED', // Running + strength compromise
  MOBILITY = 'MOBILITY',
  RECOVERY = 'RECOVERY',
}

export interface SessionTemplate {
  id: string;
  primaryFocus: PrimaryFocus;
  stationName?: string; // For STATION_SKILL focus
  duration: number; // Seconds
}

export interface BalancingPlan {
  running: number; // Minutes
  strength: number; // Minutes
  stationSkill: number; // Minutes
  combined: number; // Minutes (running compromise)
  mobility: number; // Minutes
  recovery: number; // Minutes
}

export interface StationEmphasis {
  ranked1: number; // Minutes focused on hardest station (rank 1)
  ranked2: number; // Minutes focused on rank 2 station
  ranked3: number; // Minutes focused on rank 3 station
  other: number; // Minutes for remaining 5 stations
}

// Target distribution by training phase [T-19, FR-G04]
const PHASE_TARGETS: Record<string, BalancingPlan> = {
  FOUNDATION: {
    running: 40, // % of weekly load
    strength: 30,
    stationSkill: 15,
    combined: 5,
    mobility: 5,
    recovery: 5,
  },
  DEVELOPMENT: {
    running: 35,
    strength: 30,
    stationSkill: 20,
    combined: 5,
    mobility: 5,
    recovery: 5,
  },
  RACE_SPECIFIC: {
    running: 30,
    strength: 20,
    stationSkill: 35,
    combined: 10,
    mobility: 3,
    recovery: 2,
  },
  PEAK: {
    running: 40,
    strength: 15,
    stationSkill: 30,
    combined: 10,
    mobility: 3,
    recovery: 2,
  },
  TAPER: {
    running: 50,
    strength: 10,
    stationSkill: 15,
    combined: 10,
    mobility: 10,
    recovery: 5,
  },
};

// Calculate target minutes by type for phase [T-19]
export function getPhaseTargets(
  phase: string,
  totalWeeklyMinutes: number,
): BalancingPlan | null {
  const target = PHASE_TARGETS[phase];
  if (!target) return null;

  return {
    running: Math.round((target.running / 100) * totalWeeklyMinutes),
    strength: Math.round((target.strength / 100) * totalWeeklyMinutes),
    stationSkill: Math.round((target.stationSkill / 100) * totalWeeklyMinutes),
    combined: Math.round((target.combined / 100) * totalWeeklyMinutes),
    mobility: Math.round((target.mobility / 100) * totalWeeklyMinutes),
    recovery: Math.round((target.recovery / 100) * totalWeeklyMinutes),
  };
}

// Calculate emphasis on ranked stations [T-19, US-02 criterion 4, FR-G05]
export function getStationEmphasis(
  totalStationSkillMinutes: number,
  rankedStations: string[], // [rank1, rank2, rank3]
): StationEmphasis {
  // Emphasize ranked stations: 50% to rank 1, 30% to rank 2, 15% to rank 3, 5% to others [T-19]
  const rank1Minutes = Math.round((50 / 100) * totalStationSkillMinutes);
  const rank2Minutes = Math.round((30 / 100) * totalStationSkillMinutes);
  const rank3Minutes = Math.round((15 / 100) * totalStationSkillMinutes);
  const otherMinutes = totalStationSkillMinutes - rank1Minutes - rank2Minutes - rank3Minutes;

  return {
    ranked1: rank1Minutes,
    ranked2: rank2Minutes,
    ranked3: rank3Minutes,
    other: Math.max(0, otherMinutes), // Remaining 5 stations get time too
  };
}

// Check if session types are balanced [T-19, FR-G04]
export function checkBalance(
  plannedSessions: SessionTemplate[],
  targetPlan: BalancingPlan,
): {
  balanced: boolean;
  warnings: Array<{ type: PrimaryFocus; planned: number; target: number; gap: string }>;
} {
  const actualMinutes: Record<PrimaryFocus, number> = {
    RUNNING: 0,
    STRENGTH: 0,
    STATION_SKILL: 0,
    COMBINED: 0,
    MOBILITY: 0,
    RECOVERY: 0,
  };

  // Sum up actual minutes by type
  for (const session of plannedSessions) {
    const minutes = Math.ceil(session.duration / 60);
    actualMinutes[session.primaryFocus] += minutes;
  }

  const warnings: Array<{ type: PrimaryFocus; planned: number; target: number; gap: string }> = [];

  // Check each type against target (allow ±20% variance) [T-19]
  const types: PrimaryFocus[] = [
    PrimaryFocus.RUNNING,
    PrimaryFocus.STRENGTH,
    PrimaryFocus.STATION_SKILL,
    PrimaryFocus.COMBINED,
    PrimaryFocus.MOBILITY,
    PrimaryFocus.RECOVERY,
  ];

  for (const type of types) {
    const target = targetPlan[type.toLowerCase() as keyof BalancingPlan] as number;
    const actual = actualMinutes[type];
    const variance = target > 0 ? Math.abs(actual - target) / target : 0;

    if (variance > 0.2) {
      const gap = actual > target ? 'excess' : 'deficit';
      warnings.push({
        type,
        planned: actual,
        target,
        gap: `${gap} of ${Math.abs(actual - target)}min`,
      });
    }
  }

  return {
    balanced: warnings.length === 0,
    warnings,
  };
}

// Suggest balancing adjustments [T-19]
export function suggestAdjustments(
  plannedSessions: SessionTemplate[],
  targetPlan: BalancingPlan,
): string[] {
  const { warnings } = checkBalance(plannedSessions, targetPlan);
  const suggestions: string[] = [];

  for (const warning of warnings) {
    if (warning.gap.startsWith('excess')) {
      suggestions.push(
        `Too many ${warning.type} sessions (${warning.planned}min vs ${warning.target}min target). Consider replacing some with other types.`,
      );
    } else {
      suggestions.push(
        `Insufficient ${warning.type} sessions (${warning.planned}min vs ${warning.target}min target). Add more ${warning.type} workouts.`,
      );
    }
  }

  return suggestions;
}
