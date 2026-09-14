'use client';

import { useEffect, useState } from 'react';
import { getFullTrainingPlan } from '@/src/lib/actions/training-plan';
import { PageLayout } from '@/src/components/layout/PageLayout';
import { Card } from '@/src/components/layout/Card';
import styles from './training-plan.module.css';

interface Session {
  id: string;
  title: string;
  purpose: string;
  duration: number;
  intensityLabel: string;
  primaryFocus: string;
  phase: string;
  locked: boolean;
}

interface DayPlan {
  date: Date;
  dayOfWeek: string;
  sessions: Session[];
}

export default function FullTrainingPlanPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planData, setPlanData] = useState<any>(null);
  const [sessionsByDay, setSessionsByDay] = useState<Record<string, DayPlan>>({});

  useEffect(() => {
    const loadPlan = async () => {
      setLoading(true);
      setError(null);

      const result = await getFullTrainingPlan();

      if (result.success) {
        setPlanData(result.plan);
        setSessionsByDay(result.sessionsByDay);
      } else {
        setError(result.error || 'Unable to load training plan');
      }

      setLoading(false);
    };

    loadPlan();
  }, []);

  const getIntensityColor = (intensity: string) => {
    const colors: Record<string, string> = {
      EASY: 'var(--color-success-text)',
      MODERATE: 'var(--color-warning-text)',
      HARD: 'var(--color-error-text)',
      RACE_PACE: 'var(--color-intensity-race)',
    };
    return colors[intensity] || 'var(--color-text-secondary)';
  };

  if (loading) {
    return (
      <PageLayout
        title="Full Training Plan"
        subtitle="Day-by-day view of your complete training schedule"
      >
        <Card>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>Loading your training plan...</p>
        </Card>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout
        title="Full Training Plan"
        subtitle="Day-by-day view of your complete training schedule"
      >
        <Card variant="error">
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>{error}</p>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Generate a training plan to see your schedule.</p>
        </Card>
      </PageLayout>
    );
  }

  const daysList = Object.entries(sessionsByDay).map(([dateKey, day]) => ({
    dateKey,
    ...day,
  }));

  return (
    <PageLayout
      title="Full Training Plan"
      subtitle={planData ? `${planData.totalSessions} sessions · Target Race: ${new Date(planData.competitionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : 'Day-by-day view of your complete training schedule'}
    >
      <div className={styles.planList}>
        {daysList.map((day) => (
          <div key={day.dateKey} className={styles.daySection}>
            <div className={styles.dayHeader}>
              <div className={styles.dayInfo}>
                <h2 className={styles.dayName}>{day.dayOfWeek}</h2>
                <p className={styles.dayDate}>
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className={styles.sessionCount}>
                {day.sessions.length} {day.sessions.length === 1 ? 'session' : 'sessions'}
              </div>
            </div>

            {day.sessions.length > 0 ? (
              <div className={styles.sessionsList}>
                {day.sessions.map((session) => (
                  <div key={session.id} className={styles.sessionCard}>
                    <div className={styles.sessionCardHeader}>
                      <div className={styles.sessionTitle}>{session.title}</div>
                      <div
                        className={styles.intensityBadge}
                        style={{ backgroundColor: getIntensityColor(session.intensityLabel) }}
                      >
                        {session.intensityLabel}
                      </div>
                    </div>

                    <p className={styles.sessionPurpose}>{session.purpose}</p>

                    <div className={styles.sessionDetails}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Duration</span>
                        <span className={styles.detailValue}>{Math.round(session.duration / 60)} min</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Focus</span>
                        <span className={styles.detailValue}>{session.primaryFocus}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Phase</span>
                        <span className={styles.detailValue}>{session.phase}</span>
                      </div>
                      {session.locked && (
                        <div className={styles.detailItem}>
                          <span className={styles.completedBadge}>✓ Completed</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.restDay}>
                <span className={styles.restIcon}>☀️</span>
                <p>Rest and Recovery Day</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </PageLayout>
  );
}
