// Idempotence [T-22, PRD 12.1]
// Same inputs + same versions = same plan. Enables reproducible planning.

import crypto from 'crypto';

export interface PlanInputHash {
  inputsHash: string;
  versionsHash: string;
  combinedHash: string;
}

export interface GenerationMetadata {
  generatedAt: string;
  inputHash: string;
  versionHash: string;
}

// Hash athlete inputs for idempotence [T-22]
export function hashPlanInputs(inputs: {
  athleteAge: number;
  athleteWeightKg: number;
  competitionDate: string;
  division: string;
  fiveKmTimeSeconds: number;
  rankedStations: string[];
  availabilityByDay: Record<string, number>;
  priorHyroxResult: string;
}): string {
  const canonical = JSON.stringify({
    age: inputs.athleteAge,
    weight: inputs.athleteWeightKg,
    race: inputs.competitionDate,
    division: inputs.division,
    fiveK: inputs.fiveKmTimeSeconds,
    ranks: inputs.rankedStations.sort(), // Sort for consistency
    avail: inputs.availabilityByDay,
    prior: inputs.priorHyroxResult,
  });

  return crypto.createHash('sha256').update(canonical).digest('hex');
}

// Hash template and ruleset versions [T-22, PRD 12.4]
export function hashVersions(versions: {
  templateIds: string[];
  templateVersions: string[];
  ruleSetVersion: string;
  eventStandardSetVersion: string;
}): string {
  const canonical = JSON.stringify({
    templates: versions.templateIds.sort(),
    templateVersions: versions.templateVersions.sort(),
    ruleset: versions.ruleSetVersion,
    standards: versions.eventStandardSetVersion,
  });

  return crypto.createHash('sha256').update(canonical).digest('hex');
}

// Create combined plan hash [T-22]
export function createPlanHash(inputsHash: string, versionsHash: string): string {
  return crypto.createHash('sha256').update(inputsHash + versionsHash).digest('hex').substring(0, 16);
}

// Verify plan is reproducible [T-22, PRD 12.1]
export function verifyIdempotence(
  plan1Hash: string,
  plan2Hash: string,
  inputs1: {
    athleteAge: number;
    athleteWeightKg: number;
    competitionDate: string;
    division: string;
    fiveKmTimeSeconds: number;
    rankedStations: string[];
    availabilityByDay: Record<string, number>;
    priorHyroxResult: string;
  },
  inputs2: {
    athleteAge: number;
    athleteWeightKg: number;
    competitionDate: string;
    division: string;
    fiveKmTimeSeconds: number;
    rankedStations: string[];
    availabilityByDay: Record<string, number>;
    priorHyroxResult: string;
  },
  versions1: {
    templateIds: string[];
    templateVersions: string[];
    ruleSetVersion: string;
    eventStandardSetVersion: string;
  },
  versions2: {
    templateIds: string[];
    templateVersions: string[];
    ruleSetVersion: string;
    eventStandardSetVersion: string;
  },
): {
  idempotent: boolean;
  inputsMatch: boolean;
  versionsMatch: boolean;
  planHashMatch: boolean;
} {
  const inputHash1 = hashPlanInputs(inputs1);
  const inputHash2 = hashPlanInputs(inputs2);
  const inputsMatch = inputHash1 === inputHash2;

  const versionHash1 = hashVersions(versions1);
  const versionHash2 = hashVersions(versions2);
  const versionsMatch = versionHash1 === versionHash2;

  const planHashMatch = plan1Hash === plan2Hash;
  const idempotent = inputsMatch && versionsMatch && planHashMatch;

  return {
    idempotent,
    inputsMatch,
    versionsMatch,
    planHashMatch,
  };
}

// Version a new plan generation [T-22, PRD 12.1]
export function createPlanGeneration(
  inputs: {
    athleteAge: number;
    athleteWeightKg: number;
    competitionDate: string;
    division: string;
    fiveKmTimeSeconds: number;
    rankedStations: string[];
    availabilityByDay: Record<string, number>;
    priorHyroxResult: string;
  },
  versions: {
    templateIds: string[];
    templateVersions: string[];
    ruleSetVersion: string;
    eventStandardSetVersion: string;
  },
): PlanInputHash & GenerationMetadata {
  const inputsHash = hashPlanInputs(inputs);
  const versionHash = hashVersions(versions);
  const combinedHash = createPlanHash(inputsHash, versionHash);

  return {
    inputsHash,
    versionsHash: versionHash,
    combinedHash,
    generatedAt: new Date().toISOString(),
    inputHash: inputsHash,
    versionHash,
  };
}

// Check if existing plan matches current inputs [T-22]
export function isPlanStillValid(
  existingPlanHash: string,
  currentInputs: {
    athleteAge: number;
    athleteWeightKg: number;
    competitionDate: string;
    division: string;
    fiveKmTimeSeconds: number;
    rankedStations: string[];
    availabilityByDay: Record<string, number>;
    priorHyroxResult: string;
  },
  currentVersions: {
    templateIds: string[];
    templateVersions: string[];
    ruleSetVersion: string;
    eventStandardSetVersion: string;
  },
): boolean {
  const currentHash = createPlanHash(
    hashPlanInputs(currentInputs),
    hashVersions(currentVersions),
  );

  return existingPlanHash === currentHash;
}
