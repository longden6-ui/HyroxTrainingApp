'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitOnboardingStep6 } from '@/src/lib/actions/onboarding';

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
      } else {
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
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <a href="/onboarding" className="text-blue-600 hover:text-blue-700 font-semibold mb-4 inline-block">
            ← Back to Onboarding
          </a>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold">
                6
              </div>
              <h1 className="text-3xl font-bold text-gray-900 ml-4">Training Availability</h1>
            </div>
            <p className="text-gray-600">When can you train each day of the week?</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">
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
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Back
            </a>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Saving...' : 'Complete Onboarding'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
