import { redirect } from 'next/navigation';
import { getSession } from '@/src/lib/auth/session';

export const metadata = {
  title: 'Step 1: Ranked Stations - HYROX Coach AI',
  description: 'Rank your hardest HYROX stations',
};

export default async function Step1Page() {
  const session = await getSession();
  if (!session?.athleteId) {
    redirect('/signin');
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <a href="/onboarding" className="text-blue-600 hover:text-blue-700 font-semibold mb-4 inline-block">
            ← Back to Onboarding
          </a>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold">1</div>
              <h1 className="text-3xl font-bold text-gray-900 ml-4">Rank Your Hardest Stations</h1>
            </div>
            <p className="text-gray-600">Select the 3 HYROX stations that challenge you the most, in order</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="space-y-6">
            <StationOption rank={1} name="SkiErg" description="Rowing-like machine, tests upper body and cardio" />
            <StationOption rank={2} name="Rowing" description="Full-body powerful pulling motion" />
            <StationOption rank={3} name="WallBalls" description="Explosive squat and throw movement" />
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Full onboarding steps are currently being connected. For now, you can{' '}
              <a href="/dashboard" className="text-blue-600 hover:text-blue-700 font-semibold">
                go to your dashboard
              </a>
              {' '}or{' '}
              <a href="/predict" className="text-blue-600 hover:text-blue-700 font-semibold">
                try the predictor
              </a>
              .
            </p>
          </div>

          <div className="mt-8 flex gap-4">
            <a
              href="/onboarding"
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Back
            </a>
            <a
              href="/dashboard"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Continue to Dashboard
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

function StationOption({
  rank,
  name,
  description,
}: {
  rank: number;
  name: string;
  description: string;
}) {
  return (
    <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-gray-300">
          <span className="text-sm font-semibold text-gray-600">{rank}</span>
        </div>
      </div>
      <div className="ml-4">
        <p className="font-semibold text-gray-900">{name}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </label>
  );
}
