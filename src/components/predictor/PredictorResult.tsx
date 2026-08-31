'use client';

import { formatDuration } from '@/src/lib/units';
import { GoalGapLabel } from '@/src/lib/predictor/estimator';
import styles from './result.module.css';

interface ResultProps {
  result: {
    id: string;
    lowSeconds: number;
    highSeconds: number;
    confidence: number;
    drivers: Array<{ factor: string; label: string; weight: number }>;
    dataQualityWarnings: Array<{ code: string; label: string; severity: string }>;
    goalGapLabel: string;
  };
  onReset: () => void;
}

export function PredictorResult({ result, onReset }: ResultProps) {
  const confidencePercent = Math.round(result.confidence * 100);
  const confidenceLabel =
    result.confidence >= 0.8
      ? 'High'
      : result.confidence >= 0.6
        ? 'Good'
        : result.confidence >= 0.4
          ? 'Moderate'
          : 'Low';

  const goalGapLabel = result.goalGapLabel;
  const goalGapExplanation =
    goalGapLabel === GoalGapLabel.WITHIN_RANGE
      ? 'Your goal is within the predicted range. This is achievable with focused training.'
      : goalGapLabel === GoalGapLabel.STRETCH
        ? "Your goal is faster than the predicted range. It's ambitious, but possible with dedicated preparation."
        : 'We need more information to assess your goal. Consider updating your 5K time for a more accurate picture.';

  return (
    <div className={styles.predictor_result}>
      {/* Headline */}
      <div className={styles.result_header}>
        <h1>Your HYROX Finish-Time Estimate</h1>
      </div>

      {/* Main Estimate Box */}
      <div className={styles.estimate_box}>
        <div className={styles.estimate_range}>
          <div>
            <div className={styles.time_estimate_label}>Estimated Finish Time</div>
            <div className={styles.range}>
              <span className={styles.range_low}>{formatDuration(result.lowSeconds)}</span>
              <span className={styles.range_separator}>–</span>
              <span className={styles.range_high}>{formatDuration(result.highSeconds)}</span>
            </div>
          </div>
        </div>

        {/* Confidence Meter */}
        <div>
          <div className={styles.confidence_section_label}>Confidence</div>
          <div className={styles.confidence_meter}>
            <div className={styles.bar_background}>
              <div
                className={styles.bar_fill}
                style={{
                  width: `${confidencePercent}%`,
                  backgroundColor:
                    confidencePercent >= 80
                      ? '#4caf50'
                      : confidencePercent >= 60
                        ? '#2196f3'
                        : confidencePercent >= 40
                          ? '#ff9800'
                          : '#f44336',
                }}
              />
            </div>
            <div className={styles.confidence_label}>
              {confidenceLabel} confidence ({confidencePercent}%)
            </div>
          </div>
          <p className={styles.confidence_explanation}>
            Based on your 5K fitness and any prior HYROX experience. Update your 5K time for a
            more accurate estimate.
          </p>
        </div>
      </div>

      {/* Key Drivers */}
      {result.drivers.length > 0 && (
        <section className={styles.section}>
          <h2>What's Driving Your Estimate</h2>
          <ul className={styles.drivers_list}>
            {result.drivers.map((driver) => (
              <li key={driver.factor}>
                <strong>{driver.label}</strong>
                <div className={styles.weight_bar}>
                  <div
                    className={styles.weight_fill}
                    style={{ width: `${Math.round(driver.weight * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Goal Gap (if applicable) */}
      {goalGapLabel !== 'REQUIRES_MORE_EVIDENCE' && (
        <section className={`${styles.section} ${styles.goal_section}`}>
          <h2>Your Goal vs. Estimate</h2>
          <p className={styles.goal_label}>{goalGapLabel.replace(/_/g, ' ')}</p>
          <p>{goalGapExplanation}</p>
        </section>
      )}

      {/* Data Quality Warnings */}
      {result.dataQualityWarnings.length > 0 && (
        <section className={`${styles.section} ${styles.warnings_section}`}>
          <h2>Data Quality Notes</h2>
          {result.dataQualityWarnings.map((warning) => {
            const warningClass =
              warning.severity.toLowerCase() === 'info'
                ? styles.warning_info
                : warning.severity.toLowerCase() === 'caution'
                  ? styles.warning_caution
                  : styles.warning_concern;
            return (
              <div
                key={warning.code}
                className={`${styles.warning} ${warningClass}`}
                role="alert"
              >
                <strong>{warning.severity}</strong>
                <p>{warning.label}</p>
              </div>
            );
          })}
        </section>
      )}

      {/* Disclaimer - ALWAYS VISIBLE, NOT COLLAPSED [US-01 criterion 2] */}
      <section className={`${styles.section} ${styles.disclaimer_section}`}>
        <h2>Important Notice</h2>
        <div className={styles.disclaimer_text}>
          <p>
            <strong>This estimate is guidance only.</strong> It is not a guarantee of your finish
            time, nor is it medical advice or an assessment of your physical readiness to compete.
          </p>
          <p>
            HYROX is a demanding event combining 8 km of running with 8 obstacle stations. Success
            depends on running fitness, strength, station skill, mental resilience, and your
            familiarity with the specific obstacles at your event.
          </p>
          <p>
            <strong>If you have any health concerns</strong>—previous injuries, medical conditions,
            or pain—consult a healthcare provider before training for HYROX or any endurance event.
          </p>
        </div>
      </section>

      {/* CTA to Create Account */}
      <section className={`${styles.section} ${styles.cta_section}`}>
        <h2>Ready to Train?</h2>
        <p>Create an account to save this prediction and build a personalized training plan.</p>
        <a href="/signup" className={styles.cta_button}>
          Create Free Account
        </a>
        <button onClick={onReset} className={styles.secondary_button}>
          Try Another Estimate
        </button>
      </section>
    </div>
  );
}
