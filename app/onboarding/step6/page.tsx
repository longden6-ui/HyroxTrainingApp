'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { submitOnboardingStep6, getCurrentOnboarding } from '@/src/lib/actions/onboarding';
import styles from '../onboarding.module.css';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Step6Page() {
  const router = useRouter();
  const [availability, setAvailability] = useState<Record<string, number>>({
    MONDAY: 60,
    TUESDAY: 60,
    WEDNESDAY: 60,
    THURSDAY: 60,
    FRIDAY: 60,
    SATURDAY: 120,
    SUNDAY: 120,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Load existing onboarding data on mount
  useEffect(() => {
    const loadOnboarding = async () => {
      try {
        const result = await getCurrentOnboarding();
        if (result.success && result.onboarding && result.onboarding.availabilityByDay) {
          setAvailability(result.onboarding.availabilityByDay);
        }
      } catch (err) {
        console.error('Failed to load onboarding data:', err);
      } finally {
        setPageLoading(false);
      }
    };
    loadOnboarding();
  }, []);

  const handleMinutesChange = (day: string, minutes: string) => {
    const value = parseInt(minutes, 10);
    if (!isNaN(value) && value >= 0 && value <= 10000) {
      setAvailability((prev) => ({ ...prev, [day]: value }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await submitOnboardingStep6(availability);

      if (result.success) {
        router.push('/dashboard');
      } else if ('error' in result) {
        setError(result.error || 'Failed to save your information');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalMinutes = Object.values(availability).reduce((a, b) => a + b, 0);

  return (
    <main className={styles.container}>
      <div className="">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white bg-opacity-20 text-white font-bold text-lg">
              6
            </div>
            <h1 className="text-4xl font-bold">Training Availability</h1>
          </div>
          <p className="text-purple-100 text-lg">Tell us when you can train each day of the week so we can schedule sessions that fit your life.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-12">
        <div className="mb-8">
          <a href="/onboarding/step5" className="text-purple-600 hover:text-purple-700 font-semibold mb-4 inline-block">
            ← Back to Onboarding
          </a>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Enter how many minutes you can dedicate to training each day (0 if unavailable).
            </p>
            <div className="flex gap-4 items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <p className="text-sm font-bold text-blue-900">Total availability per week:</p>
                <p className="text-2xl font-bold text-blue-600">{totalMinutes} minutes</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {DAYS.map((day, index) => (
              <div key={day} className="flex items-center gap-4">
                <label className="w-24 font-semibold text-gray-900">{DAY_LABELS[index]}</label>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={availability[day]}
                    onChange={(e) => handleMinutesChange(day, e.target.value)}
                    className="flex-1 p-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold text-gray-900"
                  />
                  <span className="text-gray-700 font-semibold w-20">minutes</span>
                </div>
              </div>
            ))}
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Why we ask:</strong> We'll schedule your sessions within the time you've indicated as
              available. Sessions never get placed when you've marked 0 minutes available. [T-14, US-03]
            </p>
          </div>

          <div className="mt-8 flex gap-4">
            <a
              href="/onboarding/step5"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Back
            </a>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Complete Onboarding ✓'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
