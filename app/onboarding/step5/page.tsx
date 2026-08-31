'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitOnboardingStep5 } from '@/src/lib/actions/onboarding';
import { EQUIPMENT_OPTIONS } from '@/src/lib/onboarding/schema';

export default function Step5Page() {
  const router = useRouter();
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleEquipment = (item: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item],
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await submitOnboardingStep5(selectedEquipment);

      if (result.success) {
        router.push('/onboarding/step6');
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
                5
              </div>
              <h1 className="text-3xl font-bold text-gray-900 ml-4">Equipment Access</h1>
            </div>
            <p className="text-gray-600">Which training equipment do you have access to?</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Select all the equipment you have access to. This helps us suggest appropriate workouts and substitutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {EQUIPMENT_OPTIONS.map((equipment) => (
              <label
                key={equipment}
                className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                <input
                  type="checkbox"
                  checked={selectedEquipment.includes(equipment)}
                  onChange={() => toggleEquipment(equipment)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="ml-3 font-semibold text-gray-900">{equipment}</span>
              </label>
            ))}
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Why we ask:</strong> Equipment availability affects which exercises we recommend and how
              we structure your sessions. No equipment? We'll focus on bodyweight and minimal-equipment options.
            </p>
          </div>

          <div className="mt-8 flex gap-4">
            <a
              href="/onboarding/step4"
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Back
            </a>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Saving...' : 'Continue to Step 6'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
