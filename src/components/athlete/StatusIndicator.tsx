'use client';

import styles from './burndown.module.css';

interface StatusIndicatorProps {
  status: 'ON_TRACK' | 'AHEAD' | 'BEHIND' | 'AT_RISK';
  explanation: string;
  nextSessionDate?: string;
  nextSessionTitle?: string;
}

const statusConfig: Record<string, { icon: string; color: string; label: string }> = {
  ON_TRACK: {
    icon: '✓',
    color: '#10b981',
    label: 'On Track',
  },
  AHEAD: {
    icon: '↗',
    color: '#059669',
    label: 'Ahead of Schedule',
  },
  BEHIND: {
    icon: '⚠',
    color: '#f59e0b',
    label: 'Behind Schedule',
  },
  AT_RISK: {
    icon: '!',
    color: '#dc2626',
    label: 'At Risk',
  },
};

export function StatusIndicator({
  status,
  explanation,
  nextSessionDate,
  nextSessionTitle,
}: StatusIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div className={styles.statusContainer}>
      <div className={styles.statusCard} style={{ borderLeftColor: config.color }}>
        <div className={styles.statusHeader}>
          <div
            className={styles.statusIcon}
            style={{ backgroundColor: config.color }}
          >
            {config.icon}
          </div>
          <div className={styles.statusContent}>
            <h3 className={styles.statusLabel}>{config.label}</h3>
            <p className={styles.statusExplanation}>{explanation}</p>
          </div>
        </div>

        {nextSessionDate && nextSessionTitle && (
          <div className={styles.nextSession}>
            <div className={styles.nextSessionLabel}>Next Session</div>
            <div className={styles.nextSessionInfo}>
              <span className={styles.nextSessionDate}>{nextSessionDate}</span>
              <span className={styles.nextSessionTitle}>{nextSessionTitle}</span>
            </div>
          </div>
        )}

        <p className={styles.disclaimer}>
          This preparation status reflects your training progress, not medical readiness. Always
          consult a healthcare provider before making significant changes to your training.
        </p>
      </div>
    </div>
  );
}
