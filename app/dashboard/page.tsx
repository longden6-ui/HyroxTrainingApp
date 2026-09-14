import { redirect } from 'next/navigation';
import { getSession } from '@/src/lib/auth/session';
import { getDashboardData } from '@/src/lib/actions/session';
import { calculateBurndownMetrics, detectRiskFlags, formatBurndownForDisplay } from '@/src/lib/athlete/burndown';
import { PageLayout } from '@/src/components/layout/PageLayout';
import { Card } from '@/src/components/layout/Card';
import styles from '@/src/components/layout/layout.module.css';
import { BurndownChart } from '@/src/components/athlete/BurndownChart';
import { StatusIndicator } from '@/src/components/athlete/StatusIndicator';
import { RiskFlags } from '@/src/components/athlete/RiskFlags';

export const metadata = {
  title: 'Dashboard | HYROX Coach',
  description: 'Your training progress and preparation status',
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.athleteId) {
    redirect('/signin');
  }

  const result = await getDashboardData();

  if (!result.success || !result.data) {
    return (
      <PageLayout
        title="Training Dashboard"
        subtitle="Your personalized preparation status and progress metrics"
      >
        <Card variant="warning">
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>
            {result.error || 'Unable to load dashboard'}
          </p>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            Generate a training plan to see your progress.
          </p>
        </Card>
      </PageLayout>
    );
  }

  const {
    metrics,
    recentSessions,
    skippedInRow,
    changes,
  } = result.data as any;

  // Calculate burn-down metrics
  const burndown = calculateBurndownMetrics(
    metrics.completedSessions,
    metrics.plannedSessions,
    metrics.completedMinutes,
    metrics.plannedMinutes,
    metrics.daysRemaining,
    metrics.currentPhase,
    metrics.phaseEnd,
    metrics.nextSession
      ? { date: metrics.nextSession.scheduledDate, title: metrics.nextSession.title }
      : undefined,
    metrics.recoveryDays,
    metrics.weekAdherence,
  );

  // Detect risk flags
  const riskFlags = detectRiskFlags(
    metrics.completedSessions / metrics.plannedSessions,
    recentSessions,
    skippedInRow,
  );

  const formatted = formatBurndownForDisplay(burndown);

  return (
    <PageLayout
      title="Training Dashboard"
      subtitle="Your personalized preparation status and progress metrics"
    >
      {/* Burn-down Chart */}
      <BurndownChart
        sessionsCompleted={metrics.completedSessions}
        sessionsPlanned={metrics.plannedSessions}
        minutesCompleted={metrics.completedMinutes}
        minutesPlanned={metrics.plannedMinutes}
        daysRemaining={metrics.daysRemaining}
        weeksRemaining={Math.ceil(metrics.daysRemaining / 7)}
        currentPhase={metrics.currentPhase}
      />

      {/* Status Indicator */}
      <StatusIndicator
        status={burndown.preparationStatus as any}
        explanation={burndown.preparationExplanation}
        nextSessionDate={formatted.upcomingSession?.date}
        nextSessionTitle={formatted.upcomingSession?.title}
      />

      {/* Risk Flags */}
      <RiskFlags flags={riskFlags} />

      {/* This Week Summary */}
      <Card title="This Week">
        <div className={styles.grid}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--color-info-text)' }}>
              {formatted.thisWeek.adherence}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              Adherence
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--color-success-text)' }}>
              {formatted.thisWeek.recoveryDays}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              Recovery Days
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--color-link)' }}>
              {formatted.progress.sessions.completed}/{formatted.progress.sessions.planned}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              Sessions
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--color-accent-violet)' }}>
              {formatted.progress.minutes.completed}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              Minutes
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Changes */}
      {changes && changes.length > 0 && (
        <Card title="Recent Plan Adjustments">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {changes.map((change: any) => (
              <div key={change.id} style={{ borderLeft: '4px solid var(--color-info)', paddingLeft: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
                <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>{change.reason}</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                  {change.changesSummary}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    backgroundColor: change.material ? 'var(--color-warning-bg)' : 'var(--color-success-bg)',
                    color: change.material ? 'var(--color-warning-text)' : 'var(--color-success-text)',
                  }}>
                    {change.material ? 'Requires Review' : 'Auto-Applied'}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    backgroundColor: change.status === 'PENDING' ? 'var(--color-warning-bg)' : 'var(--color-success-bg)',
                    color: change.status === 'PENDING' ? 'var(--color-warning-text)' : 'var(--color-success-text)',
                  }}>
                    {change.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </PageLayout>
  );
}
