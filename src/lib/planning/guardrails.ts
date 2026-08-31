// Guardrail rule layer [T-20, PRD 11]
// Enforce safety and training rules; refuse to run against unapproved RuleSet [Constraint 4]

export interface TrainingSession {
  id: string;
  date: Date;
  duration: number; // Seconds
  intensity: 'EASY' | 'MODERATE' | 'HARD' | 'RACE_PACE';
  primaryFocus: string;
  isRecovery: boolean;
}

export interface TrainingPlan {
  sessions: TrainingSession[];
  startDate: Date;
  raceDate: Date;
  phase: string;
}

export interface RuleSetConfig {
  maxProgressionIncrease: number; // % increase allowed week-to-week
  minRecoveryDaysPerWeek: number;
  taperReductionPercent: number; // % load reduction in taper
  maxOccupationalLoad: number; // Hours/week
  allowedEquipment: string[];
  maxConsecutiveHardDays: number;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

export interface GuardrailViolation {
  ruleId: string;
  sessionId?: string;
  severity: 'ERROR' | 'WARNING';
  message: string;
  suggestion?: string;
}

// Guardrail enforcement [T-20, Constraint 4]
export function validatePlanAgainstGuardrails(
  plan: TrainingPlan,
  ruleset: RuleSetConfig,
): {
  valid: boolean;
  violations: GuardrailViolation[];
} {
  const violations: GuardrailViolation[] = [];

  // Constraint 4: Refuse if ruleset is unapproved [T-20]
  if (!ruleset.approved) {
    return {
      valid: false,
      violations: [
        {
          ruleId: 'UNAPPROVED_RULESET',
          severity: 'ERROR',
          message: 'Cannot generate plan against unapproved RuleSet',
          suggestion: `This RuleSet must be approved by a professional (approvedBy + approvedAt must be set)`,
        },
      ],
    };
  }

  // Rule 1: No sessions on or after race date [Constraint 3]
  violations.push(...enforceNoPostRaceSessions(plan));

  // Rule 2: Progression caps [T-20, FR-G02]
  violations.push(...enforceProgressionCaps(plan, ruleset));

  // Rule 3: Minimum recovery [T-20, FR-G02]
  violations.push(...enforceMinimumRecovery(plan, ruleset));

  // Rule 4: Taper reduction [T-20, FR-G02]
  violations.push(...enforceTaperReduction(plan, ruleset));

  // Rule 5: No workload stacking [Constraint 2, FR-A04]
  violations.push(...enforceNoWorkloadStacking(plan));

  // Rule 6: Occupational load consideration [T-20, FR-G03]
  violations.push(...enforceOccupationalLoad(plan, ruleset));

  // Rule 7: Equipment filtering [T-20, FR-G02]
  violations.push(...enforceEquipmentAvailability(plan, ruleset));

  return {
    valid: violations.filter((v) => v.severity === 'ERROR').length === 0,
    violations,
  };
}

// Rule 1: No sessions on or after race date [Constraint 3, PRD 11]
function enforceNoPostRaceSessions(plan: TrainingPlan): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];
  const raceStart = new Date(plan.raceDate);
  raceStart.setHours(0, 0, 0, 0);

  for (const session of plan.sessions) {
    const sessionDate = new Date(session.date);
    sessionDate.setHours(0, 0, 0, 0);

    if (sessionDate >= raceStart) {
      violations.push({
        ruleId: 'NO_POST_RACE_SESSIONS',
        sessionId: session.id,
        severity: 'ERROR',
        message: `Session scheduled on or after race date (${sessionDate.toDateString()})`,
        suggestion: 'Move this session before race week or remove it',
      });
    }
  }

  return violations;
}

// Rule 2: Progression caps [T-20, FR-G02]
function enforceProgressionCaps(plan: TrainingPlan, ruleset: RuleSetConfig): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];

  // Group sessions by week
  const weekLoad: Map<number, number> = new Map();
  for (const session of plan.sessions) {
    const weekNumber = Math.floor(
      (session.date.getTime() - plan.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000),
    );
    const current = weekLoad.get(weekNumber) || 0;
    weekLoad.set(weekNumber, current + session.duration);
  }

  // Check progression
  const weeks = Array.from(weekLoad.keys()).sort((a, b) => a - b);
  for (let i = 1; i < weeks.length; i++) {
    const prevLoad = weekLoad.get(weeks[i - 1]) || 0;
    const currentLoad = weekLoad.get(weeks[i]) || 0;
    const increase = ((currentLoad - prevLoad) / prevLoad) * 100;

    if (increase > ruleset.maxProgressionIncrease) {
      violations.push({
        ruleId: 'PROGRESSION_CAP_EXCEEDED',
        severity: 'WARNING',
        message: `Week ${weeks[i]} load increased ${increase.toFixed(1)}% from previous week (limit: ${ruleset.maxProgressionIncrease}%)`,
        suggestion: `Reduce load in week ${weeks[i]} by ${Math.ceil((increase - ruleset.maxProgressionIncrease) * prevLoad / 100)}min`,
      });
    }
  }

  return violations;
}

// Rule 3: Minimum recovery [T-20, FR-G02]
function enforceMinimumRecovery(plan: TrainingPlan, ruleset: RuleSetConfig): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];

  // Group sessions by week
  const weekSessions: Map<number, TrainingSession[]> = new Map();
  for (const session of plan.sessions) {
    const weekNumber = Math.floor(
      (session.date.getTime() - plan.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000),
    );
    if (!weekSessions.has(weekNumber)) {
      weekSessions.set(weekNumber, []);
    }
    weekSessions.get(weekNumber)!.push(session);
  }

  // Check recovery days per week
  for (const [weekNumber, sessions] of weekSessions.entries()) {
    const recoveryDays = sessions.filter((s) => s.isRecovery).length;
    if (recoveryDays < ruleset.minRecoveryDaysPerWeek) {
      violations.push({
        ruleId: 'INSUFFICIENT_RECOVERY',
        severity: 'WARNING',
        message: `Week ${weekNumber} has ${recoveryDays} recovery days (minimum: ${ruleset.minRecoveryDaysPerWeek})`,
        suggestion: `Add ${ruleset.minRecoveryDaysPerWeek - recoveryDays} recovery session(s) to week ${weekNumber}`,
      });
    }
  }

  return violations;
}

// Rule 4: Taper reduction [T-20, FR-G02]
function enforceTaperReduction(plan: TrainingPlan, ruleset: RuleSetConfig): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];

  // Find taper phase (last 2 weeks before race)
  const raceTime = plan.raceDate.getTime();
  const taperStart = raceTime - 14 * 24 * 60 * 60 * 1000;

  const taperSessions = plan.sessions.filter((s) => s.date.getTime() >= taperStart && s.date.getTime() < raceTime);
  const preTaperSessions = plan.sessions.filter((s) => s.date.getTime() < taperStart);

  if (preTaperSessions.length > 0 && taperSessions.length > 0) {
    const preTaperLoad = preTaperSessions.reduce((sum, s) => sum + s.duration, 0);
    const taperLoad = taperSessions.reduce((sum, s) => sum + s.duration, 0);
    const reduction = ((preTaperLoad - taperLoad) / preTaperLoad) * 100;

    if (reduction < ruleset.taperReductionPercent) {
      violations.push({
        ruleId: 'INSUFFICIENT_TAPER',
        severity: 'WARNING',
        message: `Taper load reduction is ${reduction.toFixed(1)}% (target: ${ruleset.taperReductionPercent}%)`,
        suggestion: `Reduce taper load by ${Math.ceil((ruleset.taperReductionPercent - reduction) * preTaperLoad / 100)}min`,
      });
    }
  }

  return violations;
}

// Rule 5: No workload stacking [Constraint 2, FR-A04]
function enforceNoWorkloadStacking(plan: TrainingPlan): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];

  // Check for consecutive high-intensity days
  const sortedSessions = [...plan.sessions].sort((a, b) => a.date.getTime() - b.date.getTime());
  const hardIntensities = ['HARD', 'RACE_PACE'];

  for (let i = 0; i < sortedSessions.length - 1; i++) {
    const current = sortedSessions[i];
    const next = sortedSessions[i + 1];
    const daysDiff = Math.floor((next.date.getTime() - current.date.getTime()) / (24 * 60 * 60 * 1000));

    if (
      daysDiff <= 1 &&
      hardIntensities.includes(current.intensity) &&
      hardIntensities.includes(next.intensity)
    ) {
      violations.push({
        ruleId: 'WORKLOAD_STACKING',
        sessionId: next.id,
        severity: 'WARNING',
        message: `High-intensity session ${next.id} follows another high-intensity session with no recovery day`,
        suggestion: 'Insert a recovery or easy session between high-intensity efforts',
      });
    }
  }

  return violations;
}

// Rule 6: Occupational load [T-20, FR-G03]
function enforceOccupationalLoad(plan: TrainingPlan, ruleset: RuleSetConfig): GuardrailViolation[] {
  // Note: This rule requires athlete profile data (occupational hours/week)
  // Here we just validate the config threshold exists
  if (ruleset.maxOccupationalLoad <= 0) {
    return [
      {
        ruleId: 'INVALID_OCCUPATIONAL_LOAD',
        severity: 'WARNING',
        message: 'Occupational load limit is not configured or invalid',
        suggestion: 'Set maxOccupationalLoad to a positive value in RuleSet config',
      },
    ];
  }

  return [];
}

// Rule 7: Equipment filtering [T-20, FR-G02]
function enforceEquipmentAvailability(plan: TrainingPlan, ruleset: RuleSetConfig): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];

  // This would require equipment data on sessions
  // Here we validate that allowed equipment is non-empty
  if (ruleset.allowedEquipment.length === 0) {
    return [
      {
        ruleId: 'NO_EQUIPMENT_DEFINED',
        severity: 'WARNING',
        message: 'No equipment is defined in RuleSet',
        suggestion: 'Configure allowedEquipment in RuleSet to enable equipment filtering',
      },
    ];
  }

  return violations;
}
