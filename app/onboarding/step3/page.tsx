'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { submitOnboardingStep3, getCurrentOnboarding } from '@/src/lib/actions/onboarding';
import styles from '../onboarding.module.css';

export default function Step3Page() {
  const router = useRouter();
  const [workPattern, setWorkPattern] = useState('');
  const [physicalDemand, setPhysicalDemand] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Load existing onboarding data on mount
  useEffect(() => {
    const loadOnboarding = async () => {
      try {
        const result = await getCurrentOnboarding();
        if (result.success && result.onboarding) {
          setWorkPattern(result.onboarding.workPattern || '');
          setPhysicalDemand(result.onboarding.physicalDemand || '');
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
    <main className={styles.container}>
      <div className="">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white bg-opacity-20 text-white font-bold text-lg">
              3
            </div>
            <h1 className="text-4xl font-bold">Work Pattern & Physical Demand</h1>
          </div>
          <p className="text-purple-100 text-lg">Help us understand your work schedule and physical demands so we can plan training around your lifestyle.</p>
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
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Back
            </a>
            <button
              onClick={handleSubmit}
              disabled={loading || !workPattern || !physicalDemand}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Next: Mobility & Pain →'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
