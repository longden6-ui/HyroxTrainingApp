'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitOnboardingStep4 } from '@/src/lib/actions/onboarding';

export default function Step4Page() {
  const router = useRouter();
  const [mobilityStatus, setMobilityStatus] = useState('UNRESTRICTED');
  const [activePain, setActivePain] = useState(false);
  const [painDetails, setPainDetails] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await submitOnboardingStep4(mobilityStatus, activePain, painDetails);

      if (result.success) {
        router.push('/onboarding/step5');
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
              4
            </div>
            <h1 className="text-4xl font-bold">Mobility & Pain Screening</h1>
          </div>
          <p className="text-purple-100 text-lg">Help us understand any physical limitations so we can adapt your training safely.</p>
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

          <div className="space-y-8">
            {/* Mobility Status */}
            <fieldset>
              <legend className="text-sm font-bold text-gray-900 mb-4">Mobility Status</legend>
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <input
                    type="radio"
                    name="mobility"
                    value="UNRESTRICTED"
                    checked={mobilityStatus === 'UNRESTRICTED'}
                    onChange={(e) => setMobilityStatus(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900">Unrestricted</p>
                    <p className="text-sm text-gray-600">Full range of motion, no limitations</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <input
                    type="radio"
                    name="mobility"
                    value="LIMITED_MOBILITY"
                    checked={mobilityStatus === 'LIMITED_MOBILITY'}
                    onChange={(e) => setMobilityStatus(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900">Limited Mobility</p>
                    <p className="text-sm text-gray-600">Some restricted movements or range limitations</p>
                  </div>
                </label>
              </div>
            </fieldset>

            {/* Active Pain */}
            <fieldset>
              <legend className="text-sm font-bold text-gray-900 mb-4">Do you currently experience any pain?</legend>
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <input
                    type="radio"
                    name="pain"
                    value="no"
                    checked={!activePain}
                    onChange={() => {
                      setActivePain(false);
                      setPainDetails('');
                    }}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900">No current pain</p>
                    <p className="text-sm text-gray-600">I'm pain-free or manage minor discomfort well</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <input
                    type="radio"
                    name="pain"
                    value="yes"
                    checked={activePain}
                    onChange={() => setActivePain(true)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900">Yes, I experience pain</p>
                    <p className="text-sm text-gray-600">I have ongoing or recurring pain concerns</p>
                  </div>
                </label>
              </div>
            </fieldset>

            {/* Pain Details */}
            {activePain && (
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Please describe your pain (location, type, severity)
                </label>
                <textarea
                  value={painDetails}
                  onChange={(e) => setPainDetails(e.target.value)}
                  placeholder="e.g., Lower back pain, mild to moderate, worse when bending forward"
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold text-gray-900 min-h-24"
                />
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Why we ask:</strong> Understanding your mobility and any pain helps us create safe
              modifications and prevent aggravating existing issues.
            </p>
          </div>

          <div className="mt-8 flex gap-4">
            <a
              href="/onboarding/step3"
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Back
            </a>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Saving...' : 'Continue to Step 5'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
