'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitOnboardingStep3 } from '@/src/lib/actions/onboarding';

export default function Step3Page() {
  const router = useRouter();
  const [workPattern, setWorkPattern] = useState('');
  const [physicalDemand, setPhysicalDemand] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!workPattern || !physicalDemand) {
      setError('Please select both work pattern and physical demand');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await submitOnboardingStep3(workPattern, physicalDemand);

      if (result.success) {
        router.push('/onboarding/step4');
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
                3
              </div>
              <h1 className="text-3xl font-bold text-gray-900 ml-4">Work Pattern & Physical Demand</h1>
            </div>
            <p className="text-gray-600">Tell us about your job and physical demands throughout the day</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold">{error}</p>
            </div>
          )}

          <div className="space-y-8">
            {/* Work Pattern */}
            <fieldset>
              <legend className="text-sm font-bold text-gray-900 mb-4">
                <span className="text-red-600">*</span> What is your typical work pattern?
              </legend>
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <input
                    type="radio"
                    name="workPattern"
                    value="SEDENTARY"
                    checked={workPattern === 'SEDENTARY'}
                    onChange={(e) => setWorkPattern(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900">Sedentary</p>
                    <p className="text-sm text-gray-600">Mostly sitting (office work, desk job)</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <input
                    type="radio"
                    name="workPattern"
                    value="LIGHT"
                    checked={workPattern === 'LIGHT'}
                    onChange={(e) => setWorkPattern(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900">Light</p>
                    <p className="text-sm text-gray-600">Mix of sitting and standing (retail, teaching)</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <input
                    type="radio"
                    name="workPattern"
                    value="MODERATE"
                    checked={workPattern === 'MODERATE'}
                    onChange={(e) => setWorkPattern(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900">Moderate</p>
                    <p className="text-sm text-gray-600">Mostly on feet (nursing, construction)</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <input
                    type="radio"
                    name="workPattern"
                    value="HEAVY"
                    checked={workPattern === 'HEAVY'}
                    onChange={(e) => setWorkPattern(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900">Heavy</p>
                    <p className="text-sm text-gray-600">Physically demanding labor (trades, manual work)</p>
                  </div>
                </label>
              </div>
            </fieldset>

            {/* Physical Demand */}
            <fieldset>
              <legend className="text-sm font-bold text-gray-900 mb-4">
                <span className="text-red-600">*</span> What is the typical physical demand of your work?
              </legend>
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <input
                    type="radio"
                    name="physicalDemand"
                    value="LOW"
                    checked={physicalDemand === 'LOW'}
                    onChange={(e) => setPhysicalDemand(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900">Low</p>
                    <p className="text-sm text-gray-600">Minimal physical stress or strength required</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <input
                    type="radio"
                    name="physicalDemand"
                    value="MODERATE"
                    checked={physicalDemand === 'MODERATE'}
                    onChange={(e) => setPhysicalDemand(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900">Moderate</p>
                    <p className="text-sm text-gray-600">Some lifting or sustained effort needed</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <input
                    type="radio"
                    name="physicalDemand"
                    value="HIGH"
                    checked={physicalDemand === 'HIGH'}
                    onChange={(e) => setPhysicalDemand(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900">High</p>
                    <p className="text-sm text-gray-600">Heavy lifting or intense physical effort daily</p>
                  </div>
                </label>
              </div>
            </fieldset>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Why we ask:</strong> Understanding your occupational demands helps us manage total training
              load and prevent overuse injuries.
            </p>
          </div>

          <div className="mt-8 flex gap-4">
            <a
              href="/onboarding/step2"
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Back
            </a>
            <button
              onClick={handleSubmit}
              disabled={loading || !workPattern || !physicalDemand}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Saving...' : 'Continue to Step 4'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
