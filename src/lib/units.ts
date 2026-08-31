// Canonical unit system: seconds, grams, metres everywhere internally.
// Convert only at the UI boundary. [BUILD_ORDER constraint]
// Nothing else parses a duration string.

export const WEIGHT_BOUNDS_GRAMS = {
  MIN: 30_000, // 30 kg
  MAX: 200_000, // 200 kg
};

// Planning horizon constraints [T-06, T-17]
export const PLANNING_HORIZON = {
  MIN_DAYS: 1,
  MAX_DAYS: 365,
  MIN_WEEKS: 1,
  MAX_WEEKS: 52,
};

// Parse a duration string into seconds.
// Accepts: "1:30", "1:30:45", "90", "1h30m", "1h 30m 45s"
// Throws if invalid.
export function parseDuration(input: string): number {
  if (!input || typeof input !== 'string') {
    throw new Error('Duration input must be a non-empty string');
  }

  const trimmed = input.trim();

  // Format: "HH:MM:SS" or "MM:SS"
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':').map((p) => parseInt(p, 10));

    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const minutes = parts[0];
      const seconds = parts[1];
      if (seconds < 0 || seconds >= 60) {
        throw new Error(`Invalid seconds: ${seconds}`);
      }
      return minutes * 60 + seconds;
    }

    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      const hours = parts[0];
      const minutes = parts[1];
      const seconds = parts[2];
      if (minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) {
        throw new Error(`Invalid minutes or seconds: ${minutes}:${seconds}`);
      }
      return hours * 3600 + minutes * 60 + seconds;
    }

    throw new Error(`Invalid time format: ${trimmed}`);
  }

  // Format: "90" (plain seconds or minutes, try both)
  const num = parseInt(trimmed, 10);
  if (!isNaN(num)) {
    if (num < 0) throw new Error('Duration cannot be negative');
    // Assume seconds if <= 3600 (1 hour), otherwise could be minutes
    return num;
  }

  // Format: "1h30m", "1h 30m 45s", "30m 45s"
  const hmsMatch = trimmed.match(
    /^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?$/i,
  );

  if (hmsMatch) {
    const hours = hmsMatch[1] ? parseInt(hmsMatch[1], 10) : 0;
    const minutes = hmsMatch[2] ? parseInt(hmsMatch[2], 10) : 0;
    const seconds = hmsMatch[3] ? parseInt(hmsMatch[3], 10) : 0;

    if (minutes >= 60 || seconds >= 60) {
      throw new Error(`Invalid time: minutes and seconds must be < 60`);
    }

    return hours * 3600 + minutes * 60 + seconds;
  }

  throw new Error(`Could not parse duration: "${input}"`);
}

// Format seconds to human-readable string.
// Options: "short" = "1:30:45", "long" = "1h 30m 45s", "hm" = "1h 30m"
export function formatDuration(
  seconds: number,
  format: 'short' | 'long' | 'hm' = 'short',
): string {
  if (seconds < 0) {
    throw new Error('Duration cannot be negative');
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (format === 'short') {
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  }

  if (format === 'long') {
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0) parts.push(`${secs}s`);
    return parts.length > 0 ? parts.join(' ') : '0s';
  }

  if (format === 'hm') {
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  throw new Error(`Unknown format: ${format}`);
}

// Format grams to human-readable weight with unit.
// Returns "80.5 kg", "80500 g", etc. based on magnitude.
export function formatWeight(grams: number, unit: 'kg' | 'g' | 'lb' = 'kg'): string {
  if (grams < 0) {
    throw new Error('Weight cannot be negative');
  }

  if (unit === 'kg') {
    return `${(grams / 1000).toFixed(1)} kg`;
  }

  if (unit === 'g') {
    return `${grams} g`;
  }

  if (unit === 'lb') {
    const lbs = grams / 453.592;
    return `${lbs.toFixed(1)} lb`;
  }

  throw new Error(`Unknown weight unit: ${unit}`);
}

// Convert weight from one unit to grams.
export function weightToGrams(value: number, unit: 'kg' | 'g' | 'lb'): number {
  if (value < 0) {
    throw new Error('Weight cannot be negative');
  }

  if (unit === 'kg') {
    return Math.round(value * 1000);
  }

  if (unit === 'g') {
    return Math.round(value);
  }

  if (unit === 'lb') {
    return Math.round(value * 453.592);
  }

  throw new Error(`Unknown weight unit: ${unit}`);
}

// Validate that a weight is within bounds.
export function isValidWeight(grams: number): boolean {
  return grams >= WEIGHT_BOUNDS_GRAMS.MIN && grams <= WEIGHT_BOUNDS_GRAMS.MAX;
}

// Validate planning horizon.
export function isValidPlanningHorizon(days: number): boolean {
  return days >= PLANNING_HORIZON.MIN_DAYS && days <= PLANNING_HORIZON.MAX_DAYS;
}
