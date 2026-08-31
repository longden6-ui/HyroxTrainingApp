'use client';

import { useState } from 'react';
import styles from './calendar.module.css';

interface CalendarDay {
  dayName: string;
  hasSession: boolean;
  isRest: boolean;
  completed: boolean;
  sessionTitle?: string;
  duration?: string;
  sessionId?: string;
}

interface CalendarWeek {
  weekLabel: string;
  phase: string;
  adherence: string;
  days: CalendarDay[];
}

interface CalendarViewProps {
  monthName: string;
  weeks: CalendarWeek[];
  onSessionClick?: (sessionId: string) => void;
}

export function CalendarView({ monthName, weeks, onSessionClick }: CalendarViewProps) {
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  const phaseColors: Record<string, string> = {
    FOUNDATION: 'var(--color-foundation)',
    DEVELOPMENT: 'var(--color-development)',
    RACE_SPECIFIC: 'var(--color-race-specific)',
    PEAK: 'var(--color-peak)',
    TAPER: 'var(--color-taper)',
    RACE_WEEK: 'var(--color-race-week)',
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.header}>
        <h1>{monthName}</h1>
        <p className={styles.subtitle}>Training plan overview</p>
      </div>

      <div className={styles.weeksGrid}>
        {weeks.map((week) => (
          <div
            key={week.weekLabel}
            className={`${styles.weekCard} ${selectedWeek === week.weekLabel ? styles.selected : ''}`}
            onClick={() => setSelectedWeek(selectedWeek === week.weekLabel ? null : week.weekLabel)}
          >
            <div className={styles.weekHeader}>
              <h3>{week.weekLabel}</h3>
              <div className={styles.phaseTag} style={{ backgroundColor: phaseColors[week.phase] }}>
                {week.phase}
              </div>
            </div>

            <div className={styles.adherenceBar}>
              <div className={styles.adherenceLabel}>Adherence</div>
              <div className={styles.adherenceMetric}>
                <div className={styles.adherenceTrack}>
                  <div
                    className={styles.adherenceFill}
                    style={{ width: week.adherence }}
                  />
                </div>
                <span className={styles.adherencePercent}>{week.adherence}</span>
              </div>
            </div>

            <div className={styles.weekDays}>
              {week.days.map((day, index) => (
                <div
                  key={`${week.weekLabel}-${index}`}
                  className={`${styles.dayCell} ${day.hasSession ? styles.withSession : ''} ${
                    day.isRest ? styles.restDay : ''
                  } ${day.completed ? styles.completed : ''}`}
                  title={
                    day.hasSession
                      ? `${day.dayName}: ${day.sessionTitle} (${day.duration})`
                      : `${day.dayName}: Rest day`
                  }
                >
                  <div className={styles.dayName}>{day.dayName.slice(0, 3)}</div>

                  {day.hasSession ? (
                    <div
                      className={styles.sessionIndicator}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (day.sessionId) {
                          onSessionClick?.(day.sessionId);
                        }
                      }}
                      style={{ cursor: day.sessionId ? 'pointer' : 'default' }}
                    >
                      <div className={styles.sessionDot} />
                      {day.completed && <div className={styles.completedBadge}>✓</div>}
                    </div>
                  ) : (
                    <div className={styles.restIndicator}>Rest</div>
                  )}
                </div>
              ))}
            </div>

            {selectedWeek === week.weekLabel && (
              <div className={styles.weekDetail}>
                <div className={styles.detailContent}>
                  <p className={styles.detailPhase}>
                    <strong>Phase:</strong> {week.phase}
                  </p>
                  <p className={styles.detailAdherence}>
                    <strong>Week Adherence:</strong> {week.adherence}
                  </p>
                  <p className={styles.detailSessions}>
                    {week.days.filter((d) => d.hasSession).length} sessions planned
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ backgroundColor: 'var(--color-session)' }} />
          <span>Session scheduled</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ backgroundColor: 'var(--color-rest)' }} />
          <span>Rest/recovery day</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendCheckmark}>✓</div>
          <span>Session completed</span>
        </div>
      </div>
    </div>
  );
}
