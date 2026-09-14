'use client';

import styles from './burndown.module.css';

interface RiskFlag {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  sessionCount?: number;
  lastOccurrence?: string;
}

interface RiskFlagsProps {
  flags: RiskFlag[];
}

const severityConfig: Record<string, { color: string; label: string }> = {
  LOW: {
    color: 'var(--color-info-text)',
    label: 'Low Priority',
  },
  MEDIUM: {
    color: 'var(--color-warning-text)',
    label: 'Medium Priority',
  },
  HIGH: {
    color: 'var(--color-error-text)',
    label: 'High Priority',
  },
};

const flagIcons: Record<string, string> = {
  REPEATED_SKIPS: '⊘',
  SUSTAINED_EFFORT: '⚡',
  PAIN_REPORTED: '⚠',
  COMPRESSED_TIME: '⏱',
  LOW_ADHERENCE: '📉',
};

export function RiskFlags({ flags }: RiskFlagsProps) {
  if (flags.length === 0) {
    return (
      <div className={styles.noRisksContainer}>
        <div className={styles.noRisksMessage}>
          <p className={styles.noRisksIcon}>✓</p>
          <p className={styles.noRisksText}>No risk flags detected. Keep up the good work!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.flagsContainer}>
      <h2 className={styles.flagsTitle}>Items to Monitor</h2>
      <div className={styles.flagsList}>
        {flags.map((flag, index) => {
          const severityConfig_ = severityConfig[flag.severity];
          const icon = flagIcons[flag.type] || '!';

          return (
            <div
              key={index}
              className={styles.flagCard}
              style={{ borderLeftColor: severityConfig_.color }}
            >
              <div className={styles.flagHeader}>
                <div
                  className={styles.flagIcon}
                  style={{ backgroundColor: severityConfig_.color }}
                >
                  {icon}
                </div>
                <div className={styles.flagContent}>
                  <h4 className={styles.flagType}>{flag.type.replace(/_/g, ' ')}</h4>
                  <p className={styles.flagSeverity}>{severityConfig_.label}</p>
                </div>
              </div>

              <p className={styles.flagDescription}>{flag.description}</p>

              {flag.sessionCount && (
                <div className={styles.flagMeta}>
                  <span className={styles.flagCount}>{flag.sessionCount} sessions affected</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className={styles.flagsDisclaimer}>
        These flags are based on your training data and are provided for informational purposes.
        Consult your coach or healthcare provider for personalized guidance.
      </p>
    </div>
  );
}
