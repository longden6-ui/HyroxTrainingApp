'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitOnboardingStep1 } from '@/src/lib/actions/onboarding';

const STATIONS = [
  { name: 'SkiErg (1,000m)', id: 'skierg' },
  { name: 'Sled Push (50m)', id: 'sled_push' },
  { name: 'Sled Pull (50m)', id: 'sled_pull' },
  { name: 'Burpee Broad Jumps (80m)', id: 'burpee_jumps' },
  { name: 'RowErg (1,000m)', id: 'rowerг' },
  { name: "Farmer's Carry (200m)", id: 'farmers_carry' },
  { name: 'Sandbag Lunges (100m)', id: 'sandbag_lunges' },
  { name: 'Wall Balls (100 reps)', id: 'wall_balls' },
];

export default function Step1Page() {
  const router = useRouter();
  const [rank1, setRank1] = useState('');
  const [rank2, setRank2] = useState('');
  const [rank3, setRank3] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validate selections
    if (!rank1 || !rank2 || !rank3) {
      setError('Please select all 3 stations');
      return;
    }

    if (rank1 === rank2 || rank1 === rank3 || rank2 === rank3) {
      setError('You cannot select the same station twice');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Save to database via server action [T-14]
      const result = await submitOnboardingStep1(rank1, rank2, rank3);

      if (result.success) {
        router.push('/onboarding/step2');
      } else {
        setError(result.error || 'Failed to save your selections');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Available options for each dropdown (exclude already selected stations)
  const getOptionsForRank = (currentRank: string, otherRank1: string, otherRank2: string) => {
    return STATIONS.filter((s) => s.id !== otherRank1 && s.id !== otherRank2);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-12 px-4 mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white bg-opacity-20 text-white font-bold text-lg">
              1
            </div>
            <h1 className="text-4xl font-bold">Rank Your Hardest Stations</h1>
          </div>
          <p className="text-purple-100 text-lg">Tell us which HYROX stations challenge you most. We'll customize your training plan to target these weak points.</p>
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
            {/* Rank 1 Dropdown */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-sm">
                    1
                  </div>
                  <span>Hardest Station (Rank 1)</span>
                </div>
              </label>
              <select
                value={rank1}
                onChange={(e) => setRank1(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold text-gray-900"
              >
                <option value="">-- Select a station --</option>
                {getOptionsForRank(rank1, rank2, rank3).map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Rank 2 Dropdown */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-500 text-white font-bold text-sm">
                    2
                  </div>
                  <span>Second Hardest Station (Rank 2)</span>
                </div>
              </label>
              <select
                value={rank2}
                onChange={(e) => setRank2(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold text-gray-900"
              >
                <option value="">-- Select a station --</option>
                {getOptionsForRank(rank2, rank1, rank3).map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Rank 3 Dropdown */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-400 text-white font-bold text-sm">
                    3
                  </div>
                  <span>Third Hardest Station (Rank 3)</span>
                </div>
              </label>
              <select
                value={rank3}
                onChange={(e) => setRank3(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold text-gray-900"
              >
                <option value="">-- Select a station --</option>
                {getOptionsForRank(rank3, rank1, rank2).map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>All 8 HYROX Stations:</strong> SkiErg (1,000m), Sled Push (50m), Sled Pull (50m),
              Burpee Broad Jumps (80m), RowErg (1,000m), Farmer's Carry (200m), Sandbag Lunges (100m),
              Wall Balls (100 reps)
            </p>
          </div>

          <div className="mt-8 flex gap-4">
            <a
              href="/onboarding"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Back
            </a>
            <button
              onClick={handleSubmit}
              disabled={loading || !rank1 || !rank2 || !rank3}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Next: Athletic Background →'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
