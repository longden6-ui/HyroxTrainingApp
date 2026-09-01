'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { submitOnboardingStep2, getCurrentOnboarding } from '@/src/lib/actions/onboarding';
import { ATHLETIC_BACKGROUNDS } from '@/src/lib/onboarding/schema';
import styles from '../onboarding.module.css';

export default function Step2Page() {
  const router = useRouter();
  const [athleticBackground, setAthleticBackground] = useState('');
  const [weeklyLoadMinutes, setWeeklyLoadMinutes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Load existing onboarding data on mount
  useEffect(() => {
    const loadOnboarding = async () => {
      try {
        const result = await getCurrentOnboarding();
        if (result.success && result.onboarding) {
          setAthleticBackground(result.onboarding.athleticBackground || '');
          setWeeklyLoadMinutes(result.onboarding.currentWeeklyLoadMinutes?.toString() || '');
        }
      } catch (err) {
        console.error('Failed to load onboarding data:', err);
      } finally {
        setPageLoading(false);
      }
    };
    loadOnboarding();
  }, []);

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
    <main className={styles.container}>
      {/* Header Section */}
      <div className="">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white bg-opacity-20 text-white font-bold text-lg">
              2
            </div>
            <h1 className="text-4xl font-bold">Athletic Background</h1>
          </div>
          <p className="text-purple-100 text-lg">Share your fitness experience and current training volume so we can set realistic progression rates.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-12">
        <div className="mb-8">
          <a href="/onboarding" className="text-purple-600 hover:text-purple-700 font-semibold mb-4 inline-block">
            ← Back to Onboarding
          </a>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
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
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Back
            </a>
            <button
              onClick={handleSubmit}
              disabled={loading || !athleticBackground || !weeklyLoadMinutes}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Next: Work Pattern →'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
