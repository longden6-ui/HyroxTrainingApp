'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitOnboardingStep2 } from '@/src/lib/actions/onboarding';
import { ATHLETIC_BACKGROUNDS } from '@/src/lib/onboarding/schema';

export default function Step2Page() {
  const router = useRouter();
  const [athleticBackground, setAthleticBackground] = useState('');
  const [weeklyLoadMinutes, setWeeklyLoadMinutes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!athleticBackground || !weeklyLoadMinutes) {
      setError('Please fill in all fields');
      return;
    }

    const minutes = parseInt(weeklyLoadMinutes, 10);
    if (isNaN(minutes) || minutes < 0 || minutes > 10000) {
      setError('Weekly load must be between 0 and 10,000 minutes');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await submitOnboardingStep2(athleticBackground, minutes);

      if (result.success) {
        router.push('/onboarding/step3');
      } else {
        setError(result.error || 'Failed to save your information');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <a href="/onboarding" className="text-blue-600 hover:text-blue-700 font-semibold mb-4 inline-block">
            ← Back to Onboarding
          </a>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold">
                2
              </div>
              <h1 className="text-3xl font-bold text-gray-900 ml-4">Athletic Background</h1>
            </div>
            <p className="text-gray-600">Tell us about your fitness experience and current training volume</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Athletic Background */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                <span className="text-red-600">*</span> What best describes your athletic background?
              </label>
              <select
                value={athleticBackground}
                onChange={(e) => setAthleticBackground(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold text-gray-900"
              >
                <option value="">-- Select your background --</option>
                {ATHLETIC_BACKGROUNDS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-600 mt-2">
                This helps us understand your baseline fitness level and training experience.
              </p>
            </div>

            {/* Weekly Training Load */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                <span className="text-red-600">*</span> Current weekly training load
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={weeklyLoadMinutes}
                  onChange={(e) => setWeeklyLoadMinutes(e.target.value)}
                  placeholder="e.g., 300"
                  className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold text-gray-900"
                />
                <span className="text-gray-700 font-semibold">minutes/week</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                How many minutes per week do you currently spend training? This includes all structured exercise
                (running, strength, gym sessions, etc.).
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Why we ask:</strong> Your fitness experience and current training volume help us set
              realistic progression rates and avoid overload.
            </p>
          </div>

          <div className="mt-8 flex gap-4">
            <a
              href="/onboarding/step1"
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Back
            </a>
            <button
              onClick={handleSubmit}
              disabled={loading || !athleticBackground || !weeklyLoadMinutes}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Saving...' : 'Continue to Step 3'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
