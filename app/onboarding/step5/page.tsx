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
    <main className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-12 px-4 mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white bg-opacity-20 text-white font-bold text-lg">
              5
            </div>
            <h1 className="text-4xl font-bold">Equipment Access</h1>
          </div>
          <p className="text-purple-100 text-lg">Select all the equipment you have access to. This helps us suggest appropriate workouts and substitutions.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-12">
        <div className="mb-8">
          <a href="/onboarding/step4" className="text-purple-600 hover:text-purple-700 font-semibold mb-4 inline-block">
            ← Back to Onboarding
          </a>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold">{error}</p>
            </div>
          }}

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
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Back
            </a>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Next: Training Availability →'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
