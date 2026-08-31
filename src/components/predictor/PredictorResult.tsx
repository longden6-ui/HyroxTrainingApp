'use client';

import { formatDuration } from '@/src/lib/units';
import { GoalGapLabel } from '@/src/lib/predictor/estimator';

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
    <div className="predictor-result">
      {/* Headline */}
      <div className="result-header">
        <h1>Your HYROX Finish-Time Estimate</h1>
      </div>

      {/* Main Estimate Box */}
      <div className="estimate-box">
        <div className="estimate-range">
          <div className="time-estimate">
            <div className="label">Estimated Finish Time</div>
            <div className="range">
              <span className="low">{formatDuration(result.lowSeconds)}</span>
              <span className="separator">–</span>
              <span className="high">{formatDuration(result.highSeconds)}</span>
            </div>
          </div>
        </div>

        {/* Confidence Meter */}
        <div className="confidence-section">
          <div className="label">Confidence</div>
          <div className="confidence-meter">
            <div className="bar-background">
              <div
                className="bar-fill"
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
            <div className="confidence-label">
              {confidenceLabel} confidence ({confidencePercent}%)
            </div>
          </div>
          <p className="confidence-explanation">
            Based on your 5K fitness and any prior HYROX experience. Update your 5K time for a
            more accurate estimate.
          </p>
        </div>
      </div>

      {/* Key Drivers */}
      {result.drivers.length > 0 && (
        <section className="drivers-section">
          <h2>What's Driving Your Estimate</h2>
          <ul className="drivers-list">
            {result.drivers.map((driver) => (
              <li key={driver.factor}>
                <strong>{driver.label}</strong>
                <div className="weight-bar">
                  <div
                    className="weight-fill"
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
        <section className="goal-section">
          <h2>Your Goal vs. Estimate</h2>
          <p className="goal-label">{goalGapLabel.replace(/_/g, ' ')}</p>
          <p>{goalGapExplanation}</p>
        </section>
      )}

      {/* Data Quality Warnings */}
      {result.dataQualityWarnings.length > 0 && (
        <section className="warnings-section">
          <h2>Data Quality Notes</h2>
          {result.dataQualityWarnings.map((warning) => (
            <div
              key={warning.code}
              className={`warning warning-${warning.severity.toLowerCase()}`}
              role="alert"
            >
              <strong>{warning.severity}</strong>
              <p>{warning.label}</p>
            </div>
          ))}
        </section>
      )}

      {/* Disclaimer - ALWAYS VISIBLE, NOT COLLAPSED [US-01 criterion 2] */}
      <section className="disclaimer-section">
        <h2>Important Notice</h2>
        <div className="disclaimer-text">
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
      <section className="cta-section">
        <h2>Ready to Train?</h2>
        <p>Create an account to save this prediction and build a personalized training plan.</p>
        <a href="/signup" className="cta-button">
          Create Free Account
        </a>
        <button onClick={onReset} className="secondary-button">
          Try Another Estimate
        </button>
      </section>

      <style jsx>{`
        .predictor-result {
          max-width: 700px;
          margin: 0 auto;
          padding: 2rem;
        }

        .result-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .result-header h1 {
          font-size: 2rem;
          margin: 0;
        }

        .estimate-box {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 8px;
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .estimate-range {
          margin-bottom: 2rem;
        }

        .time-estimate .label {
          font-size: 0.9rem;
          opacity: 0.9;
          margin-bottom: 0.5rem;
        }

        .range {
          font-size: 3rem;
          font-weight: bold;
          display: flex;
          align-items: baseline;
          gap: 1rem;
        }

        .range .low,
        .range .high {
          flex: 0 0 auto;
        }

        .range .separator {
          font-size: 1.5rem;
        }

        .confidence-section .label {
          font-size: 0.9rem;
          opacity: 0.9;
          margin-bottom: 0.75rem;
          font-weight: 600;
        }

        .confidence-meter {
          margin-bottom: 1rem;
        }

        .bar-background {
          width: 100%;
          height: 8px;
          background-color: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s;
        }

        .confidence-label {
          font-size: 0.95rem;
          font-weight: 600;
        }

        .confidence-explanation {
          font-size: 0.875rem;
          opacity: 0.9;
          margin-top: 0.75rem;
          margin-bottom: 0;
        }

        section {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background-color: #f9f9f9;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }

        h2 {
          margin-top: 0;
          font-size: 1.2rem;
          margin-bottom: 1rem;
        }

        .drivers-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .drivers-list li {
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #eee;
        }

        .drivers-list li:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .drivers-list strong {
          display: block;
          margin-bottom: 0.5rem;
        }

        .weight-bar {
          height: 6px;
          background-color: #e0e0e0;
          border-radius: 3px;
          overflow: hidden;
        }

        .weight-fill {
          height: 100%;
          background-color: #667eea;
          border-radius: 3px;
        }

        .goal-section {
          border-left-color: #2196f3;
        }

        .goal-label {
          font-size: 1.1rem;
          font-weight: 600;
          color: #2196f3;
          margin: 0 0 0.5rem 0;
        }

        .goal-section p {
          margin: 0.5rem 0;
        }

        .warnings-section {
          border-left-color: #ff9800;
        }

        .warning {
          padding: 1rem;
          margin-bottom: 1rem;
          border-radius: 4px;
          border-left: 4px solid;
        }

        .warning strong {
          display: block;
          margin-bottom: 0.25rem;
        }

        .warning p {
          margin: 0;
          font-size: 0.95rem;
        }

        .warning-info {
          background-color: #e3f2fd;
          border-left-color: #2196f3;
          color: #1565c0;
        }

        .warning-caution {
          background-color: #fff3e0;
          border-left-color: #ff9800;
          color: #e65100;
        }

        .warning-concern {
          background-color: #ffebee;
          border-left-color: #f44336;
          color: #c62828;
        }

        .disclaimer-section {
          background-color: #fffbea;
          border-left-color: #fbc02d;
        }

        .disclaimer-text {
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .disclaimer-text p {
          margin: 1rem 0;
        }

        .disclaimer-text p:first-child {
          margin-top: 0;
        }

        .disclaimer-text p:last-child {
          margin-bottom: 0;
        }

        .cta-section {
          text-align: center;
          border: 2px solid #667eea;
          background-color: white;
        }

        .cta-section h2 {
          color: #667eea;
        }

        .cta-button {
          display: inline-block;
          padding: 1rem 2rem;
          background-color: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 600;
          margin-right: 1rem;
          transition: background-color 0.2s;
        }

        .cta-button:hover {
          background-color: #5568d3;
        }

        .secondary-button {
          padding: 0.75rem 1.5rem;
          background-color: transparent;
          color: #667eea;
          border: 1px solid #667eea;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .secondary-button:hover {
          background-color: #f0f1ff;
        }

        @media (max-width: 600px) {
          .predictor-result {
            padding: 1rem;
          }

          .range {
            font-size: 2rem;
          }

          .cta-button {
            display: block;
            margin-right: 0;
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
