// Phase calculation for training plans [T-17, FR-G02]
// Divide plan horizon into FOUNDATION, DEVELOPMENT, RACE_SPECIFIC, PEAK, TAPER, RACE_WEEK

export interface TrainingPhases {
  foundationStart: Date;
  foundationEnd: Date;
  developmentStart: Date;
  developmentEnd: Date;
  raceSpecificStart: Date;
  raceSpecificEnd: Date;
  peakStart: Date;
  peakEnd: Date;
  taperStart: Date;
  taperEnd: Date;
  raceWeekStart: Date;
  raceDate: Date;
}

// Minimum phase lengths in days (configurable) [T-17]
const PHASE_MINIMUMS = {
  FOUNDATION: 21, // 3 weeks minimum
  DEVELOPMENT: 21, // 3 weeks minimum
  RACE_SPECIFIC: 14, // 2 weeks minimum
  PEAK: 7, // 1 week minimum
  TAPER: 7, // 1 week minimum
  RACE_WEEK: 7, // 1 week (race day + recovery)
};

const TOTAL_MINIMUM = Object.values(PHASE_MINIMUMS).reduce((a, b) => a + b, 0); // 77 days (21+21+14+7+7+7)

export function calculateTrainingPhases(
  startDate: Date,
  raceDate: Date,
): {
  success: boolean;
  phases?: TrainingPhases;
  error?: string;
} {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const race = new Date(raceDate);
  race.setHours(0, 0, 0, 0);

  // Validation [T-17, Constraint 3]
  if (start >= race) {
    return { success: false, error: 'Start date must be before race date' };
  }

  const totalDays = Math.floor((race.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  // Handle degenerate case: very short horizon [T-17]
  if (totalDays < TOTAL_MINIMUM) {
    return {
      success: false,
      error: `Insufficient planning horizon. Need at least ${TOTAL_MINIMUM} days, got ${totalDays}`,
    };
  }

  // Calculate available days for flexible phases
  // Reserve fixed phases: TAPER (7 days) + RACE_WEEK (7 days) = 14 days
  const fixedDays = PHASE_MINIMUMS.TAPER + PHASE_MINIMUMS.RACE_WEEK;
  const flexibleDays = totalDays - fixedDays;

  // Allocate phases proportionally, but cap at actual available [T-17]
  let foundationDays = Math.max(
    PHASE_MINIMUMS.FOUNDATION,
    Math.floor(flexibleDays * 0.35),
  );
  foundationDays = Math.min(foundationDays, flexibleDays - PHASE_MINIMUMS.DEVELOPMENT - PHASE_MINIMUMS.RACE_SPECIFIC - PHASE_MINIMUMS.PEAK);

  let developmentDays = Math.max(
    PHASE_MINIMUMS.DEVELOPMENT,
    Math.floor(flexibleDays * 0.35),
  );
  developmentDays = Math.min(developmentDays, flexibleDays - foundationDays - PHASE_MINIMUMS.RACE_SPECIFIC - PHASE_MINIMUMS.PEAK);

  let raceSpecificDays = Math.max(
    PHASE_MINIMUMS.RACE_SPECIFIC,
    Math.floor(flexibleDays * 0.2),
  );
  raceSpecificDays = Math.min(raceSpecificDays, flexibleDays - foundationDays - developmentDays - PHASE_MINIMUMS.PEAK);

  // Peak gets whatever is left (at least minimum, at most available)
  let peakDays = flexibleDays - foundationDays - developmentDays - raceSpecificDays;
  peakDays = Math.max(PHASE_MINIMUMS.PEAK, peakDays);

  const taperDays = PHASE_MINIMUMS.TAPER; // Fixed at 1 week
  const raceWeekDays = PHASE_MINIMUMS.RACE_WEEK; // Fixed at 1 week

  // Verify total doesn't exceed available
  const totalAllocated = foundationDays + developmentDays + raceSpecificDays + peakDays + taperDays + raceWeekDays;
  if (totalAllocated > totalDays) {
    return {
      success: false,
      error: `Phase allocation exceeds available days: ${totalAllocated} > ${totalDays}`,
    };
  }

  // Guard against negative days (edge case)
  if (
    foundationDays <= 0 ||
    developmentDays <= 0 ||
    raceSpecificDays <= 0 ||
    peakDays <= 0
  ) {
    return {
      success: false,
      error: 'Could not allocate non-zero phases within horizon',
    };
  }

  // Build phase dates
  const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const foundationStart = start;
  const foundationEnd = addDays(foundationStart, foundationDays);

  const developmentStart = foundationEnd;
  const developmentEnd = addDays(developmentStart, developmentDays);

  const raceSpecificStart = developmentEnd;
  const raceSpecificEnd = addDays(raceSpecificStart, raceSpecificDays);

  const peakStart = raceSpecificEnd;
  const peakEnd = addDays(peakStart, peakDays);

  const taperStart = peakEnd;
  const taperEnd = addDays(taperStart, taperDays);

  const raceWeekStart = taperEnd;

  // Sanity check: race week should be exactly 7 days before race
  const daysToRace = Math.floor((race.getTime() - raceWeekStart.getTime()) / (1000 * 60 * 60 * 24));
  if (daysToRace !== raceWeekDays) {
    return {
      success: false,
      error: `Phase calculation error: race week mismatch (${daysToRace} days vs expected ${raceWeekDays})`,
    };
  }

  // Verify no overlaps [T-17]
  const phases = [
    { name: 'Foundation', start: foundationStart, end: foundationEnd },
    { name: 'Development', start: developmentStart, end: developmentEnd },
    { name: 'Race Specific', start: raceSpecificStart, end: raceSpecificEnd },
    { name: 'Peak', start: peakStart, end: peakEnd },
    { name: 'Taper', start: taperStart, end: taperEnd },
    { name: 'Race Week', start: raceWeekStart, end: race },
  ];

  for (let i = 0; i < phases.length - 1; i++) {
    if (phases[i].end > phases[i + 1].start) {
      return {
        success: false,
        error: `Phase overlap detected between ${phases[i].name} and ${phases[i + 1].name}`,
      };
    }
  }

  return {
    success: true,
    phases: {
      foundationStart,
      foundationEnd,
      developmentStart,
      developmentEnd,
      raceSpecificStart,
      raceSpecificEnd,
      peakStart,
      peakEnd,
      taperStart,
      taperEnd,
      raceWeekStart,
      raceDate: race,
    },
  };
}

// Get phase name for a given date
export function getPhaseForDate(date: Date, phases: TrainingPhases): string | null {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  if (d >= phases.foundationStart && d < phases.foundationEnd) return 'FOUNDATION';
  if (d >= phases.developmentStart && d < phases.developmentEnd) return 'DEVELOPMENT';
  if (d >= phases.raceSpecificStart && d < phases.raceSpecificEnd) return 'RACE_SPECIFIC';
  if (d >= phases.peakStart && d < phases.peakEnd) return 'PEAK';
  if (d >= phases.taperStart && d < phases.taperEnd) return 'TAPER';
  if (d >= phases.raceWeekStart && d <= phases.raceDate) return 'RACE_WEEK';

  return null;
}
