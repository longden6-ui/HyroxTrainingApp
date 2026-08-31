'use client';

import styles from './burndown.module.css';

interface BurndownChartProps {
  sessionsCompleted: number;
  sessionsPlanned: number;
  minutesCompleted: number;
  minutesPlanned: number;
  daysRemaining: number;
  weeksRemaining: number;
  currentPhase: string;
}

export function BurndownChart({
  sessionsCompleted,
  sessionsPlanned,
  minutesCompleted,
  minutesPlanned,
  daysRemaining,
  weeksRemaining,
  currentPhase,
}: BurndownChartProps) {
  const sessionRate = sessionsPlanned > 0 ? (sessionsCompleted / sessionsPlanned) * 100 : 0;
  const minuteRate = minutesPlanned > 0 ? (minutesCompleted / minutesPlanned) * 100 : 0;
  const sessionsRemaining = Math.max(0, sessionsPlanned - sessionsCompleted);
  const minutesRemaining = Math.max(0, Math.round((minutesPlanned - minutesCompleted) / 60));

  return (
    <div className={styles.chartContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Training Progress</h2>
        <p className={styles.phaseLabel}>{currentPhase} Phase</p>
      </div>

      <div className={styles.timeRemaining}>
        <div className={styles.timeItem}>
          <div className={styles.timeValue}>{daysRemaining}</div>
          <div className={styles.timeLabel}>Days Left</div>
        </div>
        <div className={styles.timeItem}>
          <div className={styles.timeValue}>{weeksRemaining}</div>
          <div className={styles.timeLabel}>Weeks</div>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        {/* Sessions Metric */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <h3 className={styles.metricTitle}>Sessions</h3>
            <span className={styles.metricPercent}>{Math.round(sessionRate)}%</span>
          </div>

          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${Math.min(sessionRate, 100)}%` }} />
          </div>

          <div className={styles.metricDetails}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Completed</span>
              <span className={styles.detailValue}>{sessionsCompleted}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Planned</span>
              <span className={styles.detailValue}>{sessionsPlanned}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Remaining</span>
              <span className={styles.remainingValue}>{sessionsRemaining}</span>
            </div>
          </div>
        </div>

        {/* Minutes Metric */}
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <h3 className={styles.metricTitle}>Training Time</h3>
            <span className={styles.metricPercent}>{Math.round(minuteRate)}%</span>
          </div>

          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${Math.min(minuteRate, 100)}%` }} />
          </div>

          <div className={styles.metricDetails}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Completed</span>
              <span className={styles.detailValue}>{Math.round(minutesCompleted / 60)} min</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Planned</span>
              <span className={styles.detailValue}>{Math.round(minutesPlanned / 60)} min</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Remaining</span>
              <span className={styles.remainingValue}>{minutesRemaining} min</span>
            </div>
          </div>
        </div>
      </div>

      {sessionRate > 100 && (
        <div className={styles.aheadMessage}>
          ✓ You're ahead of schedule! Keep maintaining this pace.
        </div>
      )}
    </div>
  );
}
