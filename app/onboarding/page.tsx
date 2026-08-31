import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';

export const metadata = {
  title: 'Onboarding - HYROX Coach AI',
  description: 'Complete your profile to get your personalized training plan',
};

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session?.athleteId) {
    redirect('/signin');
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to HYROX Coach AI</h1>
          <p className="text-xl text-gray-600 mb-2">Let's build your personalized training plan</p>
          <p className="text-gray-500">Complete these 6 quick steps to get started</p>
        </div>

        {/* Steps Overview */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="space-y-4">
            <StepCard number={1} title="Rank Your Hardest Stations" description="Tell us which HYROX stations challenge you most" link="/onboarding/step1" />
            <StepCard number={2} title="Athletic Background" description="Share your fitness experience and weekly training load" link="/onboarding/step2" />
            <StepCard number={3} title="Work Pattern" description="Describe your work demands and physical requirements" link="/onboarding/step3" />
            <StepCard number={4} title="Mobility & Pain Screening" description="Help us understand any physical limitations" link="/onboarding/step4" />
            <StepCard number={5} title="Equipment Access" description="Which training equipment do you have available?" link="/onboarding/step5" />
            <StepCard number={6} title="Training Availability" description="When can you train each day of the week?" link="/onboarding/step6" />
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
          <h3 className="font-bold text-blue-900 mb-2">💡 Why we ask this</h3>
          <p className="text-blue-800">
            Your answers help us create a training plan that fits your unique needs, schedule, and goals. This takes about 5-10 minutes.
          </p>
        </div>

        {/* Get Started Button */}
        <div className="text-center mt-12">
          <a
            href="/onboarding/step1"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
          >
            Start Building Your Plan →
          </a>
        </div>
      </div>
    </main>
  );
}

function StepCard({
  number,
  title,
  description,
  link,
}: {
  number: number;
  title: string;
  description: string;
  link: string;
}) {
  return (
    <a
      href={link}
      className="flex items-start p-4 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-blue-200"
    >
      <div className="flex-shrink-0">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold text-lg">
          {number}
        </div>
      </div>
      <div className="ml-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-gray-600">{description}</p>
      </div>
      <div className="ml-auto">
        <span className="text-2xl text-gray-400">→</span>
      </div>
    </a>
  );
}
