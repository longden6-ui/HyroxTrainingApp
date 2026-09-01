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

  if (pageLoading) {
    return (
      <main className={styles.container}>
        <div className={styles.header}>
          <div className={styles.stepIndicator}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepMeta}>
              <label className={styles.label}>Step 2 of 6</label>
              <h1 className={styles.title}>Athletic Background</h1>
            </div>
          </div>
        </div>
        <div className={styles.content}>
          <div className={styles.section} style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <p style={{ color: '#6b7280' }}>Loading your previous selections...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <div className={styles.stepIndicator}>
          <div className={styles.stepNumber}>2</div>
          <div className={styles.stepMeta}>
            <label className={styles.label}>Step 2 of 6</label>
            <h1 className={styles.title}>Athletic Background</h1>
          </div>
        </div>
      </div>

      <div className={styles.breadcrumb}>
        <a href="/onboarding">← Back to Onboarding</a>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Your Fitness Experience</h2>
          <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
            Share your fitness experience and current training volume so we can set realistic progression rates.
          </p>

          <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
            <div className={styles.formItem}>
              <label className={styles.label}>What best describes your athletic background? *</label>
              <select
                value={athleticBackground}
                onChange={(e) => setAthleticBackground(e.target.value)}
                className={styles.select}
              >
                <option value="">-- Select your background --</option>
                {ATHLETIC_BACKGROUNDS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className={styles.helpText}>
                This helps us understand your baseline fitness level and training experience.
              </p>
            </div>

            <div className={styles.formItem}>
              <label className={styles.label}>Current weekly training load *</label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={weeklyLoadMinutes}
                  onChange={(e) => setWeeklyLoadMinutes(e.target.value)}
                  placeholder="e.g., 300"
                  className={styles.input}
                  style={{ flex: 1 }}
                />
                <span style={{ color: '#6b7280', fontWeight: '500' }}>minutes/week</span>
              </div>
              <p className={styles.helpText}>
                How many minutes per week do you currently spend training? This includes all structured exercise (running, strength, gym sessions, etc.).
              </p>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
              <strong>💡 Why we ask:</strong> Your fitness experience and current training volume help us set realistic progression rates and avoid overload.
            </p>
          </div>
        </div>

        <div className={styles.actionButtons}>
          <a href="/onboarding/step1" className={styles.backButton}>
            ← Back
          </a>
          <button
            onClick={handleSubmit}
            disabled={loading || !athleticBackground || !weeklyLoadMinutes}
            className={styles.nextButton}
          >
            {loading ? 'Saving...' : 'Next: Work Pattern →'}
          </button>
        </div>
      </div>
    </main>
  );
}
