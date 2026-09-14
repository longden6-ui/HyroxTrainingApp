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

  if (pageLoading) {
    return (
      <main className={styles.container}>
        <div className={styles.header}>
          <div className={styles.stepIndicator}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepMeta}>
              <label className={styles.label}>Step 3 of 6</label>
              <h1 className={styles.title}>Work Pattern & Physical Demand</h1>
            </div>
          </div>
        </div>
        <div className={styles.content}>
          <div className={styles.section} style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>Loading your previous selections...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <div className={styles.stepIndicator}>
          <div className={styles.stepNumber}>3</div>
          <div className={styles.stepMeta}>
            <label className={styles.label}>Step 3 of 6</label>
            <h1 className={styles.title}>Work Pattern & Physical Demand</h1>
          </div>
        </div>
      </div>

      <div className={styles.breadcrumb}>
        <a href="/onboarding">← Back to Onboarding</a>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Your Work & Lifestyle</h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)' }}>
            Help us understand your work schedule and physical demands so we can plan training around your lifestyle.
          </p>

          <div style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>
              What is your typical work pattern? *
            </p>
            <div className={styles.radioGroup}>
              <label className={styles.radioItem}>
                <input
                  type="radio"
                  name="workPattern"
                  value="SEDENTARY"
                  checked={workPattern === 'SEDENTARY'}
                  onChange={(e) => setWorkPattern(e.target.value)}
                />
                <div className={styles.radioItem}>
                  <p style={{ fontWeight: '600', color: 'var(--color-text)', margin: '0 0 0.25rem 0' }}>Sedentary</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>Mostly sitting (office work, desk job)</p>
                </div>
              </label>
              <label className={styles.radioItem}>
                <input
                  type="radio"
                  name="workPattern"
                  value="LIGHT"
                  checked={workPattern === 'LIGHT'}
                  onChange={(e) => setWorkPattern(e.target.value)}
                />
                <div>
                  <p style={{ fontWeight: '600', color: 'var(--color-text)', margin: '0 0 0.25rem 0' }}>Light</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>Mix of sitting and standing (retail, teaching)</p>
                </div>
              </label>
              <label className={styles.radioItem}>
                <input
                  type="radio"
                  name="workPattern"
                  value="MODERATE"
                  checked={workPattern === 'MODERATE'}
                  onChange={(e) => setWorkPattern(e.target.value)}
                />
                <div>
                  <p style={{ fontWeight: '600', color: 'var(--color-text)', margin: '0 0 0.25rem 0' }}>Moderate</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>Mostly on feet (nursing, construction)</p>
                </div>
              </label>
              <label className={styles.radioItem}>
                <input
                  type="radio"
                  name="workPattern"
                  value="HEAVY"
                  checked={workPattern === 'HEAVY'}
                  onChange={(e) => setWorkPattern(e.target.value)}
                />
                <div>
                  <p style={{ fontWeight: '600', color: 'var(--color-text)', margin: '0 0 0.25rem 0' }}>Heavy</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>Physically demanding labor (trades, manual work)</p>
                </div>
              </label>
            </div>
          </div>

          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>
              What is the typical physical demand of your work? *
            </p>
            <div className={styles.radioGroup}>
              <label className={styles.radioItem}>
                <input
                  type="radio"
                  name="physicalDemand"
                  value="LOW"
                  checked={physicalDemand === 'LOW'}
                  onChange={(e) => setPhysicalDemand(e.target.value)}
                />
                <div>
                  <p style={{ fontWeight: '600', color: 'var(--color-text)', margin: '0 0 0.25rem 0' }}>Low</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>Minimal physical stress or strength required</p>
                </div>
              </label>
              <label className={styles.radioItem}>
                <input
                  type="radio"
                  name="physicalDemand"
                  value="MODERATE"
                  checked={physicalDemand === 'MODERATE'}
                  onChange={(e) => setPhysicalDemand(e.target.value)}
                />
                <div>
                  <p style={{ fontWeight: '600', color: 'var(--color-text)', margin: '0 0 0.25rem 0' }}>Moderate</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>Some lifting or sustained effort needed</p>
                </div>
              </label>
              <label className={styles.radioItem}>
                <input
                  type="radio"
                  name="physicalDemand"
                  value="HIGH"
                  checked={physicalDemand === 'HIGH'}
                  onChange={(e) => setPhysicalDemand(e.target.value)}
                />
                <div>
                  <p style={{ fontWeight: '600', color: 'var(--color-text)', margin: '0 0 0.25rem 0' }}>High</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>Heavy lifting or intense physical effort daily</p>
                </div>
              </label>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '0.5rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              <strong>💡 Why we ask:</strong> Understanding your occupational demands helps us manage total training load and prevent overuse injuries.
            </p>
          </div>
        </div>

        <div className={styles.actionButtons}>
          <a href="/onboarding/step2" className={styles.backButton}>
            ← Back
          </a>
          <button
            onClick={handleSubmit}
            disabled={loading || !workPattern || !physicalDemand}
            className={styles.nextButton}
          >
            {loading ? 'Saving...' : 'Next: Mobility & Pain →'}
          </button>
        </div>
      </div>
    </main>
  );
}
