'use client';

import { useState } from 'react';
import styles from './workout.module.css';

interface WorkoutSegment {
  phase: 'warmup' | 'main' | 'cooldown';
  durationMinutes: number;
  description?: string;
}

interface Substitution {
  originalEquipment: string;
  explanation: string;
  altEquipment?: string;
}

interface WorkoutDetailProps {
  title: string;
  purpose: string;
  duration: number; // Minutes
  intensity: 'EASY' | 'MODERATE' | 'HARD' | 'RACE_PACE';
  primaryFocus: string;
  equipment: string[];
  segments: WorkoutSegment[];
  safetyNotes?: string[];
  substitutions?: Substitution[];
  completed?: boolean;
  onComplete?: (data: { rpe: number; actualMinutes: number; notes?: string }) => void;
  onAbort?: () => void;
}

const intensityGuidance: Record<string, { color: string; description: string }> = {
  EASY: {
    color: '#10b981',
    description: 'Easy pace - should be able to hold a conversation',
  },
  MODERATE: {
    color: '#3b82f6',
    description: 'Moderate intensity - breathing elevated but controlled',
  },
  HARD: {
    color: '#f59e0b',
    description: 'Hard effort - can only speak in short phrases',
  },
  RACE_PACE: {
    color: '#dc2626',
    description: 'Race pace - maximum sustainable effort',
  },
};

export function WorkoutDetail({
  title,
  purpose,
  duration,
  intensity,
  primaryFocus,
  equipment,
  segments,
  safetyNotes,
  substitutions,
  completed = false,
  onComplete,
  onAbort,
}: WorkoutDetailProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  const [rpe, setRpe] = useState(5);
  const [actualMinutes, setActualMinutes] = useState(duration);
  const [notes, setNotes] = useState('');

  const handleComplete = () => {
    if (onComplete) {
      onComplete({
        rpe,
        actualMinutes,
        notes: notes || undefined,
      });
      setShowCompletion(false);
    }
  };

  const intensityInfo = intensityGuidance[intensity];

  return (
    <div className={`${styles.workoutContainer} ${completed ? styles.completed : ''}`}>
      <div className={styles.header}>
        <div
          className={styles.intensityIndicator}
          style={{ backgroundColor: intensityInfo?.color }}
        />

        <div className={styles.headerContent}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.purpose}>{purpose}</p>
        </div>

        <button
          className={styles.expandButton}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className={styles.metadata}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Duration</span>
              <span className={styles.metaValue}>{duration} min</span>
            </div>

            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Intensity</span>
              <div className={styles.intensityBadge} style={{ backgroundColor: intensityInfo?.color }}>
                {intensity}
              </div>
            </div>

            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Focus</span>
              <span className={styles.metaValue}>{primaryFocus}</span>
            </div>
          </div>

          <div className={styles.intensityGuidance}>
            <p className={styles.guidanceText}>{intensityInfo?.description}</p>
          </div>

          {equipment.length > 0 && (
            <div className={styles.equipment}>
              <h4 className={styles.sectionTitle}>Equipment</h4>
              <div className={styles.equipmentList}>
                {equipment.map((item, index) => (
                  <div key={index} className={styles.equipmentTag}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {segments.length > 0 && (
            <div className={styles.segments}>
              <h4 className={styles.sectionTitle}>Workout Structure</h4>
              {segments.map((seg, index) => (
                <div key={index} className={styles.segment}>
                  <div className={styles.segmentPhase}>{seg.phase.charAt(0).toUpperCase() + seg.phase.slice(1)}</div>
                  <div className={styles.segmentTime}>{seg.durationMinutes} min</div>
                  {seg.description && <p className={styles.segmentDesc}>{seg.description}</p>}
                </div>
              ))}
            </div>
          )}

          {substitutions && substitutions.length > 0 && (
            <div className={styles.substitutions}>
              <h4 className={styles.sectionTitle}>Substitutions</h4>
              <div className={styles.substitutionNote}>
                <p className={styles.substitutionWarning}>
                  ⚠️ Equipment substitutions may impact race-specific preparation time.
                </p>
              </div>
              {substitutions.map((sub, index) => (
                <div key={index} className={styles.substitution}>
                  <p className={styles.subOriginal}>
                    <strong>If unavailable:</strong> {sub.originalEquipment}
                  </p>
                  <p className={styles.subExplanation}>{sub.explanation}</p>
                  {sub.altEquipment && (
                    <p className={styles.subAlt}>
                      <strong>Alternative:</strong> {sub.altEquipment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {safetyNotes && safetyNotes.length > 0 && (
            <div className={styles.safety}>
              <h4 className={styles.sectionTitle}>Safety & Form</h4>
              {safetyNotes.map((note, index) => (
                <div key={index} className={styles.safetyNote}>
                  {note}
                </div>
              ))}
            </div>
          )}

          <div className={styles.actions}>
            {!completed && !showCompletion && (
              <>
                <button
                  className={styles.completeButton}
                  onClick={() => setShowCompletion(true)}
                >
                  Mark as Complete
                </button>
                {onAbort && (
                  <button className={styles.abortButton} onClick={onAbort}>
                    Skip Workout
                  </button>
                )}
              </>
            )}

            {showCompletion && (
              <div className={styles.completionForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="rpe" className={styles.formLabel}>
                    Rate of Perceived Exertion (RPE)
                  </label>
                  <div className={styles.rpeControl}>
                    <input
                      id="rpe"
                      type="range"
                      min="1"
                      max="10"
                      value={rpe}
                      onChange={(e) => setRpe(parseInt(e.target.value))}
                      className={styles.slider}
                    />
                    <span className={styles.rpeValue}>{rpe}/10</span>
                  </div>
                  <p className={styles.rpeHint}>1 = very easy, 10 = maximum effort</p>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="actualMinutes" className={styles.formLabel}>
                    Actual Time (minutes)
                  </label>
                  <input
                    id="actualMinutes"
                    type="number"
                    min="0"
                    value={actualMinutes}
                    onChange={(e) => setActualMinutes(parseInt(e.target.value))}
                    className={styles.numberInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="notes" className={styles.formLabel}>
                    Notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="How did the workout feel? Any issues or adjustments?"
                    className={styles.textarea}
                    rows={3}
                  />
                </div>

                <div className={styles.completionActions}>
                  <button
                    className={styles.confirmButton}
                    onClick={handleComplete}
                  >
                    Confirm Completion
                  </button>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setShowCompletion(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {completed && (
              <div className={styles.completedBadge}>
                ✓ Workout completed
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
