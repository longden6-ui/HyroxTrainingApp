'use client';

import { useState } from 'react';
import styles from './checkin.module.css';
import { painReportingOptions, mobilityOptions, rpeGuidance } from '@/src/lib/athlete/schema';

interface SessionCheckInProps {
  sessionId: string;
  sessionTitle: string;
  plannedDurationMinutes: number;
  onSubmit: (data: {
    sessionId: string;
    rpe: number;
    actualDurationMinutes: number;
    painReported: boolean;
    painSeverity: string;
    mobilityReported: boolean;
    mobilityLimitations: string[];
    substitutionsPerformed: string[];
    notes?: string;
  }) => Promise<void>;
  onCancel?: () => void;
}

export function SessionCheckIn({
  sessionId,
  sessionTitle,
  plannedDurationMinutes,
  onSubmit,
  onCancel,
}: SessionCheckInProps) {
  const [rpe, setRpe] = useState(5);
  const [actualMinutes, setActualMinutes] = useState(plannedDurationMinutes);
  const [painReported, setPainReported] = useState(false);
  const [painSeverity, setPainSeverity] = useState('NONE');
  const [mobilityReported, setMobilityReported] = useState(false);
  const [mobilityLimitations, setMobilityLimitations] = useState<string[]>([]);
  const [substitutions, setSubstitutions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleMobilityLimitation = (limitation: string) => {
    setMobilityLimitations((prev) =>
      prev.includes(limitation) ? prev.filter((l) => l !== limitation) : [...prev, limitation],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit({
        sessionId,
        rpe,
        actualDurationMinutes: actualMinutes,
        painReported,
        painSeverity,
        mobilityReported,
        mobilityLimitations,
        substitutionsPerformed: substitutions,
        notes: notes || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save check-in');
      setIsSubmitting(false);
    }
  };

  const selectedRpeGuidance = rpeGuidance.find((g: any) => g.value === rpe);

  return (
    <div className={styles.checkInContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Session Check-In</h2>
        <p className={styles.subtitle}>{sessionTitle}</p>
      </div>

      {error && (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* RPE Section */}
        <fieldset className={styles.section}>
          <legend className={styles.sectionTitle}>How hard was the workout?</legend>
          <p className={styles.sectionDesc}>
            Rate your perceived exertion (RPE) on a scale of 1-10
          </p>

          <div className={styles.rpeControl}>
            <input
              type="range"
              min="1"
              max="10"
              value={rpe}
              onChange={(e) => setRpe(parseInt(e.target.value))}
              className={styles.rpeSlider}
              aria-label="Rate of Perceived Exertion"
            />
            <div className={styles.rpeDisplay}>{rpe}</div>
          </div>

          {selectedRpeGuidance && (
            <div className={styles.rpeGuidanceBox}>
              <p className={styles.rpeGuidanceLabel}>{selectedRpeGuidance.label}</p>
              <p className={styles.rpeGuidanceDesc}>{selectedRpeGuidance.description}</p>
            </div>
          )}
        </fieldset>

        {/* Duration Section */}
        <fieldset className={styles.section}>
          <legend className={styles.sectionTitle}>How long did you train?</legend>

          <div className={styles.formGroup}>
            <label htmlFor="actualMinutes" className={styles.formLabel}>
              Actual duration (minutes)
            </label>
            <div className={styles.durationControl}>
              <input
                id="actualMinutes"
                type="number"
                min="0"
                max="600"
                value={actualMinutes}
                onChange={(e) => setActualMinutes(parseInt(e.target.value))}
                className={styles.numberInput}
              />
              <span className={styles.durationHint}>
                (Planned: {plannedDurationMinutes} min)
              </span>
            </div>
          </div>
        </fieldset>

        {/* Pain Reporting - Neutral Language [PRD 7.3, T-25] */}
        <fieldset className={styles.section}>
          <legend className={styles.sectionTitle}>How did your body feel?</legend>
          <p className={styles.sectionDesc}>
            Select any discomfort or limitations you experienced
          </p>

          <div className={styles.checkboxGroup}>
            {painReportingOptions.map((option: any) => (
              <label key={option.value} className={styles.checkboxLabel}>
                <input
                  type="radio"
                  name="painSeverity"
                  value={option.value}
                  checked={painSeverity === option.value}
                  onChange={(e) => {
                    setPainSeverity(e.target.value);
                    if (e.target.value === 'NONE') {
                      setPainReported(false);
                    } else {
                      setPainReported(true);
                    }
                  }}
                  className={styles.radio}
                />
                <div>
                  <span className={styles.checkboxText}>{option.label}</span>
                  <p className={styles.checkboxDesc}>{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Mobility Screening - Neutral Language [T-25] */}
        <fieldset className={styles.section}>
          <legend className={styles.sectionTitle}>Any areas of awareness or tightness?</legend>
          <p className={styles.sectionDesc}>
            Select all that apply - this helps us understand your training response
          </p>

          <div className={styles.mobilityGrid}>
            {mobilityOptions.map((option: any) => (
              <label key={option.value} className={styles.mobilityCheckbox}>
                <input
                  type="checkbox"
                  checked={mobilityLimitations.includes(option.value)}
                  onChange={() => toggleMobilityLimitation(option.value)}
                  className={styles.checkbox}
                />
                <div>
                  <span className={styles.mobilityLabel}>{option.label}</span>
                  <p className={styles.mobilityDesc}>{option.description}</p>
                </div>
              </label>
            ))}
          </div>

          {mobilityLimitations.length > 0 && (
            <button
              type="button"
              onClick={() => setMobilityReported(true)}
              className={styles.clearButton}
            >
              {mobilityReported ? '✓ Limitations noted' : 'Note for coach'}
            </button>
          )}
        </fieldset>

        {/* Substitutions */}
        <fieldset className={styles.section}>
          <legend className={styles.sectionTitle}>Did you modify the workout?</legend>
          <p className={styles.sectionDesc}>
            Let us know about any substitutions or modifications you made
          </p>

          <div className={styles.formGroup}>
            <textarea
              value={substitutions.join(', ')}
              onChange={(e) => setSubstitutions(e.target.value.split(',').map((s) => s.trim()))}
              placeholder="e.g., Rowed instead of SkiErg; Skipped sled push due to shoulder"
              className={styles.textarea}
              rows={3}
            />
          </div>
        </fieldset>

        {/* Notes */}
        <fieldset className={styles.section}>
          <legend className={styles.sectionTitle}>Additional notes (optional)</legend>

          <div className={styles.formGroup}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did this feel? Any observations about your performance or body?"
              className={styles.textarea}
              rows={4}
              maxLength={1000}
            />
            <div className={styles.charCount}>{notes.length}/1000</div>
          </div>
        </fieldset>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.submitButton}
          >
            {isSubmitting ? 'Saving...' : 'Complete Workout'}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className={styles.cancelButton}
            >
              Save for Later
            </button>
          )}
        </div>

        <p className={styles.disclaimer}>
          This check-in is used to personalize your future training plans. Your responses help us
          understand how you respond to different training intensities and allow us to adjust your
          program as needed.
        </p>
      </form>
    </div>
  );
}
