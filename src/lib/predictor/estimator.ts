// Rules-based HYROX finish-time estimator [T-07, FR-P03–P05, P08]
// Pure functions, no database access, no I/O.

import { PredictorInput } from './schema';

// Model version for reproducibility and versioning [T-21, FR-P03]
export const ESTIMATOR_MODEL_VERSION = '0.1.0-alpha';

// Confidence factors [FR-P04]
enum ConfidenceFactor {
  STRONG = 1.0,        // 5K result < 30 days
  MODERATE = 0.7,      // 3-6 months old
  WEAK = 0.5,          // >6 months old or stale
  VERY_WEAK = 0.3,     // No prior HYROX or no recent 5K
}

// Goal-gap assessment [FR-P08]
export enum GoalGapLabel {
  WITHIN_RANGE = 'WITHIN_RANGE',
  STRETCH = 'STRETCH',
  REQUIRES_MORE_EVIDENCE = 'REQUIRES_MORE_EVIDENCE',
}

// Finish time driver with plain-language label [FR-P05]
export interface Driver {
  factor: string;  // e.g., "5K_RUNNING_FITNESS"
  label: string;   // e.g., "5K running fitness"
  weight: number;  // 0.0–1.0, relative importance
}

// Data quality warning [T-07, FR-P04]
export interface DataQualityWarning {
  code: string;
  label: string;
  severity: 'INFO' | 'CAUTION' | 'CONCERN';
}

// Estimator output [T-07]
export interface EstimateResult {
  lowSeconds: number;       // Conservative finish time [FR-P03]
  highSeconds: number;      // Optimistic finish time [FR-P03]
  confidence: number;       // 0.0–1.0 [FR-P04]
  drivers: Driver[];        // Key factors, ordered by weight [FR-P05]
  dataQualityWarnings: DataQualityWarning[];
  goalGapLabel: GoalGapLabel;  // If target was provided [FR-P08]
  modelVersion: string;     // ESTIMATOR_MODEL_VERSION [T-21]
}

// Placeholder coefficients [T-07 note]
// These are clearly marked as placeholders and not authoritative.
// Replace after product decision on actual model coefficients.
interface ModelCoefficients {
  // Base HYROX time for reference athlete
  baseTimeSeconds: number;

  // 5K time contribution: how running ability maps to HYROX
  fiveKmWeight: number;

  // Adjustment for division/category
  divisionAdjustments: Record<string, number>;

  // Prior result impact [FR-P04]
  priorHyroxCompletedBonus: number;
  priorHyroxDNFPenalty: number;

  // Recency adjustment [FR-P04]
  recencyMultipliers: Record<string, number>;

  // Age adjustment (baseline ~30 years)
  ageAdjustmentPerYear: number;

  // Sprint variability (range as % of estimate)
  lowRangePercent: number;
  highRangePercent: number;
}

// Placeholder model [T-07 note: CLEARLY MARKED AS UNAPPROVED]
const PLACEHOLDER_COEFFICIENTS: ModelCoefficients = {
  // Placeholder: ~45 minute baseline
  baseTimeSeconds: 2700,

  // 5K fitness contributes significantly to HYROX
  fiveKmWeight: 0.4,

  // Placeholder divisions
  divisionAdjustments: {
    WOMEN_INDIVIDUAL_OPEN: 0.05,
    MEN_INDIVIDUAL_OPEN: -0.05,
    WOMEN_INDIVIDUAL_PRO: -0.1,
    MEN_INDIVIDUAL_PRO: -0.15,
    MIXED_TEAM: 0.0,
  },

  // Prior results impact confidence but not base estimate
  priorHyroxCompletedBonus: 0.15,
  priorHyroxDNFPenalty: -0.25,

  // Recency adjusts confidence [FR-P04]
  recencyMultipliers: {
    RECENT: 1.0,
    '3_MONTHS': 0.9,
    '6_MONTHS': 0.75,
    STALE: 0.5,
    NO_DATA: 0.3,
  },

  // ~2% per year from age 30
  ageAdjustmentPerYear: 0.02,

  // Range: ±15% for exploratory, ±8% for high confidence
  lowRangePercent: 0.15,
  highRangePercent: 0.15,
};

// Estimate HYROX finish time based on validated inputs [T-07, FR-P03–P08]
export function estimateFinishTime(input: PredictorInput): EstimateResult {
  const coeff = PLACEHOLDER_COEFFICIENTS;

  // Start with base time
  let baseEstimate = coeff.baseTimeSeconds;

  // Adjust for 5K fitness [FR-P03: range, not point]
  // Placeholder: 5K time ~40% determines HYROX time
  const fiveKmFactor = (input.fiveKmTimeSeconds / 1500) - 1; // Normalized to reference (25 min)
  baseEstimate += fiveKmFactor * coeff.fiveKmWeight * baseEstimate;

  // Adjust for division
  const divisionAdj = coeff.divisionAdjustments[input.division] || 0;
  baseEstimate *= 1 + divisionAdj;

  // Adjust for age (relative to 30)
  const ageAdj = (input.age - 30) * coeff.ageAdjustmentPerYear * baseEstimate;
  baseEstimate += ageAdj;

  // Calculate confidence [FR-P04]
  let confidenceBase = coeff.recencyMultipliers[input.fiveKmRecency];

  // Prior HYROX result boosts confidence
  if (input.priorHyroxResult === 'COMPLETED') {
    confidenceBase += coeff.priorHyroxCompletedBonus;
  } else if (input.priorHyroxResult === 'DNF') {
    confidenceBase += coeff.priorHyroxDNFPenalty;
  }

  const confidence = Math.max(0, Math.min(1, confidenceBase));

  // Adaptive range: wider when low confidence, narrower when high [FR-P03]
  const rangeAdjustment = confidence > 0.7 ? 0.5 : 1.0;
  const lowRangePercent = coeff.lowRangePercent * rangeAdjustment;
  const highRangePercent = coeff.highRangePercent * rangeAdjustment;

  const lowSeconds = Math.round(baseEstimate * (1 - lowRangePercent));
  const highSeconds = Math.round(baseEstimate * (1 + highRangePercent));

  // Identify key drivers [FR-P05: ordered by weight]
  const drivers = buildDriverList(input, baseEstimate, confidence);

  // Data quality warnings [T-07]
  const warnings = buildQualityWarnings(input, confidence);

  // Goal gap assessment [FR-P08]
  const goalGapLabel = assessGoalGap(input, lowSeconds, highSeconds, confidence);

  return {
    lowSeconds,
    highSeconds,
    confidence,
    drivers,
    dataQualityWarnings: warnings,
    goalGapLabel,
    modelVersion: ESTIMATOR_MODEL_VERSION,
  };
}

// Build ordered list of key factors [FR-P05]
function buildDriverList(
  input: PredictorInput,
  baseEstimate: number,
  confidence: number,
): Driver[] {
  const drivers: Driver[] = [];

  // 1. 5K fitness is the strongest predictor
  drivers.push({
    factor: '5K_RUNNING_FITNESS',
    label: 'Your 5K running fitness',
    weight: 0.4,
  });

  // 2. Prior HYROX experience (if available)
  if (input.priorHyroxResult && input.priorHyroxResult !== 'NO_PRIOR_RESULT') {
    drivers.push({
      factor: 'PRIOR_HYROX_EXPERIENCE',
      label: `Prior HYROX: ${input.priorHyroxResult.toLowerCase()}`,
      weight: 0.2,
    });
  }

  // 3. Age adjustment
  if (input.age > 35 || input.age < 25) {
    drivers.push({
      factor: 'AGE',
      label: `Age adjustment (${input.age} years)`,
      weight: 0.15,
    });
  }

  // 4. 5K data recency affects confidence
  if (input.fiveKmRecency !== 'RECENT') {
    drivers.push({
      factor: '5K_RECENCY',
      label: `5K result recency: ${input.fiveKmRecency.toLowerCase()}`,
      weight: 0.15,
    });
  }

  // 5. Division/category
  drivers.push({
    factor: 'DIVISION',
    label: `Division: ${input.division.replace(/_/g, ' ').toLowerCase()}`,
    weight: 0.1,
  });

  return drivers;
}

// Build data quality warnings [T-07, FR-P04]
function buildQualityWarnings(
  input: PredictorInput,
  confidence: number,
): DataQualityWarning[] {
  const warnings: DataQualityWarning[] = [];

  // Stale 5K data
  if (input.fiveKmRecency === 'STALE' || input.fiveKmRecency === 'NO_DATA') {
    warnings.push({
      code: 'STALE_5K_DATA',
      label: `No recent 5K result. Estimate is exploratory; update with a current 5K time for accuracy.`,
      severity: 'CONCERN',
    });
  } else if (input.fiveKmRecency === '6_MONTHS') {
    warnings.push({
      code: 'AGED_5K_DATA',
      label: 'Your 5K result is >6 months old. Update it for a more accurate estimate.',
      severity: 'CAUTION',
    });
  }

  // No prior HYROX experience
  if (input.priorHyroxResult === 'NO_PRIOR_RESULT') {
    warnings.push({
      code: 'NO_PRIOR_HYROX',
      label: 'First-time HYROX athlete. This estimate is based on 5K fitness; station skill matters significantly.',
      severity: 'INFO',
    });
  }

  // Very low confidence
  if (confidence < 0.4) {
    warnings.push({
      code: 'LOW_CONFIDENCE',
      label: 'Confidence in this estimate is low. Consider completing a recent 5K test to improve accuracy.',
      severity: 'CAUTION',
    });
  }

  return warnings;
}

// Assess goal vs. predicted range [FR-P08]
function assessGoalGap(
  input: PredictorInput,
  lowSeconds: number,
  highSeconds: number,
  confidence: number,
): GoalGapLabel {
  if (!input.targetFinishTimeSeconds) {
    return GoalGapLabel.REQUIRES_MORE_EVIDENCE; // No goal provided
  }

  const target = input.targetFinishTimeSeconds;

  // Goal is within predicted range
  if (target >= lowSeconds && target <= highSeconds) {
    return GoalGapLabel.WITHIN_RANGE;
  }

  // Goal is faster than predicted range and confidence is good
  if (target < lowSeconds && confidence >= 0.6) {
    return GoalGapLabel.STRETCH; // Ambitious but possible with focused training
  }

  // Goal is slower than predicted range, or confidence is low
  return GoalGapLabel.REQUIRES_MORE_EVIDENCE;
}

// Validate that low < high (sanity check)
export function validateEstimate(result: EstimateResult): boolean {
  return (
    result.lowSeconds > 0 &&
    result.highSeconds > 0 &&
    result.lowSeconds < result.highSeconds &&
    result.confidence >= 0 &&
    result.confidence <= 1
  );
}
