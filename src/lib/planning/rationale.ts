// Rationale and traceability [T-21, FR-G09, PRD 12.4]
// Connect each session to athlete profile; track template/ruleset versions for reproducibility

export interface SessionRationale {
  sessionId: string;
  purpose: string; // Plain-language reason for this session [FR-G09]
  templateId: string;
  templateVersion: string; // Snapshot of template version at generation
  ruleSetVersion: string; // Snapshot of ruleset version at generation
  athleteContext: string; // Why this session for THIS athlete
}

export interface PlanRationale {
  planId: string;
  generationRationale: string; // Why this plan was created [FR-G09]
  assumptions: {
    athleteAge: number;
    athleteWeightKg: number;
    competitionDate: string;
    division: string;
    rankedStations: string[];
    availabilityMinutesPerWeek: number;
  };
  ruleSetVersion: string; // Which ruleset governed this plan
  eventStandardSetVersion: string; // Which standards used for benchmarking
}

// Generate rationale for a session [T-21, FR-G09]
export function generateSessionRationale(
  sessionId: string,
  templateId: string,
  templateVersion: string,
  ruleSetVersion: string,
  phase: string,
  primaryFocus: string,
  athleteAge: number,
  athleteRankedStations: string[],
  stationName?: string,
): SessionRationale {
  // Base purpose from primary focus
  const focusPurposes: Record<string, string> = {
    RUNNING: 'Build aerobic base and running efficiency',
    STRENGTH: 'Develop muscular endurance for obstacles',
    STATION_SKILL: 'Practice specific HYROX station technique',
    COMBINED: 'Simulate race conditions with compromised running',
    MOBILITY: 'Maintain range of motion and injury prevention',
    RECOVERY: 'Active recovery and central nervous system restoration',
  };

  let purpose = focusPurposes[primaryFocus] || 'Training session';

  // Add phase context [T-21]
  const phaseContext: Record<string, string> = {
    FOUNDATION: ' during base-building phase to establish aerobic foundation',
    DEVELOPMENT: ' during development phase to build capacity and skill',
    RACE_SPECIFIC: ' during race-specific phase to emphasize HYROX movements',
    PEAK: ' during peak phase to sharpen fitness before taper',
    TAPER: ' during taper to maintain fitness while reducing fatigue',
  };

  if (phaseContext[phase]) {
    purpose += phaseContext[phase];
  }

  // Add station emphasis context [T-21, US-02]
  let athleteContext = '';
  if (primaryFocus === 'STATION_SKILL' && stationName) {
    const rankIndex = athleteRankedStations.indexOf(stationName);
    if (rankIndex === 0) {
      athleteContext = `Your hardest station (ranked #1) - requires dedicated technique work`;
    } else if (rankIndex === 1) {
      athleteContext = `Your ranked #2 hardest station - critical for race performance`;
    } else if (rankIndex === 2) {
      athleteContext = `Your ranked #3 hardest station - essential preparation`;
    } else {
      athleteContext = `Prepares you for one of the 5 remaining HYROX stations`;
    }
  } else if (primaryFocus === 'STATION_SKILL') {
    athleteContext = `Balanced station skill work across all 8 HYROX obstacles`;
  } else if (athleteAge >= 40) {
    athleteContext = `Adjusted for your age with emphasis on mobility and recovery`;
  }

  return {
    sessionId,
    purpose,
    templateId,
    templateVersion,
    ruleSetVersion,
    athleteContext,
  };
}

// Generate plan-level rationale [T-21, FR-G09]
export function generatePlanRationale(
  planId: string,
  athleteAge: number,
  athleteWeightKg: number,
  competitionDate: string,
  division: string,
  rankedStations: string[],
  availabilityMinutesPerWeek: number,
  ruleSetVersion: string,
  eventStandardSetVersion: string,
  weeksDaysToRace: number,
): PlanRationale {
  // Build generationRationale [T-21, FR-G09]
  const generationReasons: string[] = [];

  generationReasons.push(
    `Personalized training plan for ${division} athlete competing on ${competitionDate}`,
  );
  generationReasons.push(`Planning horizon: ${weeksDaysToRace} days (${Math.floor(weeksDaysToRace / 7)} weeks)`);
  generationReasons.push(
    `Ranked hardest stations: ${rankedStations.join(', ')} — these receive 50%, 30%, 15% of station-skill work respectively`,
  );
  generationReasons.push(`Available training time: ${availabilityMinutesPerWeek} minutes/week`);

  if (athleteAge >= 45) {
    generationReasons.push(`Age-adjusted training load (${athleteAge} years) with emphasis on recovery`);
  }

  return {
    planId,
    generationRationale: generationReasons.join('; '),
    assumptions: {
      athleteAge,
      athleteWeightKg,
      competitionDate,
      division,
      rankedStations,
      availabilityMinutesPerWeek,
    },
    ruleSetVersion,
    eventStandardSetVersion,
  };
}

// Verify traceability [T-21]
export function verifyTraceability(sessionRationale: SessionRationale): {
  traceable: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  if (!sessionRationale.sessionId) missingFields.push('sessionId');
  if (!sessionRationale.templateId) missingFields.push('templateId');
  if (!sessionRationale.templateVersion) missingFields.push('templateVersion');
  if (!sessionRationale.ruleSetVersion) missingFields.push('ruleSetVersion');
  if (!sessionRationale.purpose) missingFields.push('purpose');

  return {
    traceable: missingFields.length === 0,
    missingFields,
  };
}

// Reconstruct what produced a session [T-21]
export function reconstructSessionOrigin(
  sessionRationale: SessionRationale,
): {
  templateSnapshot: string;
  ruleSetSnapshot: string;
  explanation: string;
} {
  return {
    templateSnapshot: `${sessionRationale.templateId}@${sessionRationale.templateVersion}`,
    ruleSetSnapshot: `ruleset@${sessionRationale.ruleSetVersion}`,
    explanation: `This session was generated using template ${sessionRationale.templateId} (version ${sessionRationale.templateVersion}) under guardrail rules version ${sessionRationale.ruleSetVersion}. Purpose: ${sessionRationale.purpose}`,
  };
}
