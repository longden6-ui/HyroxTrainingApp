import { describe, it, expect } from 'vitest';
import {
  parseDuration,
  formatDuration,
  formatWeight,
  weightToGrams,
  isValidWeight,
  isValidPlanningHorizon,
  WEIGHT_BOUNDS_GRAMS,
  PLANNING_HORIZON,
} from './units';

describe('parseDuration', () => {
  it('parses MM:SS format', () => {
    expect(parseDuration('1:30')).toBe(90);
    expect(parseDuration('0:45')).toBe(45);
    expect(parseDuration('59:59')).toBe(3599);
  });

  it('parses HH:MM:SS format', () => {
    expect(parseDuration('1:30:45')).toBe(5445);
    expect(parseDuration('0:0:0')).toBe(0);
    expect(parseDuration('2:15:30')).toBe(8130);
  });

  it('parses plain seconds', () => {
    expect(parseDuration('90')).toBe(90);
    expect(parseDuration('3600')).toBe(3600);
  });

  it('parses h/m/s suffix format', () => {
    expect(parseDuration('1h30m')).toBe(5400);
    expect(parseDuration('1h 30m 45s')).toBe(5445);
    expect(parseDuration('30m')).toBe(1800);
    expect(parseDuration('45s')).toBe(45);
    expect(parseDuration('1h')).toBe(3600);
  });

  it('rejects invalid seconds', () => {
    expect(() => parseDuration('1:60')).toThrow();
    expect(() => parseDuration('1:90')).toThrow();
  });

  it('rejects negative durations', () => {
    expect(() => parseDuration('-90')).toThrow();
  });

  it('rejects empty or invalid input', () => {
    expect(() => parseDuration('')).toThrow();
    expect(() => parseDuration('abc')).toThrow();
  });
});

describe('formatDuration', () => {
  it('formats to short format (MM:SS)', () => {
    expect(formatDuration(90)).toBe('1:30');
    expect(formatDuration(45)).toBe('0:45');
    expect(formatDuration(3661)).toBe('1:01:01');
  });

  it('formats to long format (h m s)', () => {
    expect(formatDuration(90, 'long')).toBe('1m 30s');
    expect(formatDuration(3661, 'long')).toBe('1h 1m 1s');
    expect(formatDuration(3600, 'long')).toBe('1h');
  });

  it('formats to hm format (h m)', () => {
    expect(formatDuration(90, 'hm')).toBe('1m');
    expect(formatDuration(3661, 'hm')).toBe('1h 1m');
    expect(formatDuration(5400, 'hm')).toBe('1h 30m');
  });

  it('formats zero seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(0, 'long')).toBe('0s');
  });
});

describe('formatWeight', () => {
  it('formats grams to kg', () => {
    expect(formatWeight(80000)).toBe('80.0 kg');
    expect(formatWeight(80500)).toBe('80.5 kg');
  });

  it('formats grams to grams', () => {
    expect(formatWeight(80000, 'g')).toBe('80000 g');
  });

  it('formats grams to pounds', () => {
    expect(formatWeight(80000, 'lb')).toBe('176.4 lb');
  });
});

describe('weightToGrams', () => {
  it('converts kg to grams', () => {
    expect(weightToGrams(80, 'kg')).toBe(80000);
    expect(weightToGrams(80.5, 'kg')).toBe(80500);
  });

  it('converts pounds to grams', () => {
    // 176.4 lb * 453.592 g/lb ≈ 80014 g
    expect(Math.abs(weightToGrams(176.4, 'lb') - 80014)).toBeLessThan(2);
  });

  it('returns same value for grams', () => {
    expect(weightToGrams(80000, 'g')).toBe(80000);
  });

  it('rejects negative weight', () => {
    expect(() => weightToGrams(-80, 'kg')).toThrow();
  });
});

describe('isValidWeight', () => {
  it('accepts weight within bounds', () => {
    expect(isValidWeight(80000)).toBe(true);
    expect(isValidWeight(WEIGHT_BOUNDS_GRAMS.MIN)).toBe(true);
    expect(isValidWeight(WEIGHT_BOUNDS_GRAMS.MAX)).toBe(true);
  });

  it('rejects weight below minimum', () => {
    expect(isValidWeight(WEIGHT_BOUNDS_GRAMS.MIN - 1)).toBe(false);
  });

  it('rejects weight above maximum', () => {
    expect(isValidWeight(WEIGHT_BOUNDS_GRAMS.MAX + 1)).toBe(false);
  });
});

describe('isValidPlanningHorizon', () => {
  it('accepts days within bounds', () => {
    expect(isValidPlanningHorizon(30)).toBe(true);
    expect(isValidPlanningHorizon(PLANNING_HORIZON.MIN_DAYS)).toBe(true);
    expect(isValidPlanningHorizon(PLANNING_HORIZON.MAX_DAYS)).toBe(true);
  });

  it('rejects days below minimum', () => {
    expect(isValidPlanningHorizon(0)).toBe(false);
  });

  it('rejects days above maximum', () => {
    expect(isValidPlanningHorizon(PLANNING_HORIZON.MAX_DAYS + 1)).toBe(false);
  });
});
