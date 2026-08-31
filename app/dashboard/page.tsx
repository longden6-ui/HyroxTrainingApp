import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getDashboardData } from '@/lib/actions/session';
import { calculateBurndownMetrics, detectRiskFlags, formatBurndownForDisplay } from '@/lib/athlete/burndown';
import { BurndownChart } from '@/components/athlete/BurndownChart';
import { StatusIndicator } from '@/components/athlete/StatusIndicator';
import { RiskFlags } from '@/components/athlete/RiskFlags';

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
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Training Dashboard</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-900">{result.error || 'Unable to load dashboard'}</p>
          <p className="text-amber-800 text-sm mt-2">Generate a training plan to see your progress.</p>
        </div>
      </div>
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
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Training Dashboard</h1>
          <p className="text-gray-600">Your personalized preparation status and progress metrics</p>
        </div>

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
        <div className="bg-white rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900">This Week</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatted.thisWeek.adherence}</div>
              <div className="text-sm text-gray-600 mt-1">Adherence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatted.thisWeek.recoveryDays}</div>
              <div className="text-sm text-gray-600 mt-1">Recovery Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {formatted.progress.sessions.completed}/{formatted.progress.sessions.planned}
              </div>
              <div className="text-sm text-gray-600 mt-1">Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatted.progress.minutes.completed}</div>
              <div className="text-sm text-gray-600 mt-1">Minutes</div>
            </div>
          </div>
        </div>

        {/* Recent Changes */}
        {changes && changes.length > 0 && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Recent Plan Adjustments</h2>
            <div className="space-y-3">
              {changes.map((change: any) => (
                <div key={change.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="font-medium text-gray-900">{change.reason}</div>
                  <p className="text-sm text-gray-600 mt-1">{change.changesSummary}</p>
                  <div className="flex gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      change.material
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {change.material ? 'Requires Review' : 'Auto-Applied'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      change.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {change.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
