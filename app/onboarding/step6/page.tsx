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

  if (pageLoading) {
    return (
      <main className={styles.container}>
        <div className={styles.header}>
          <div className={styles.stepIndicator}>
            <div className={styles.stepNumber}>6</div>
            <div className={styles.stepMeta}>
              <label className={styles.label}>Step 6 of 6</label>
              <h1 className={styles.title}>Training Availability</h1>
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
          <div className={styles.stepNumber}>6</div>
          <div className={styles.stepMeta}>
            <label className={styles.label}>Step 6 of 6</label>
            <h1 className={styles.title}>Training Availability</h1>
          </div>
        </div>
      </div>

      <div className={styles.breadcrumb}>
        <a href="/onboarding">← Back to Onboarding</a>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>When Can You Train?</h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)' }}>
            Tell us when you can train each day of the week so we can schedule sessions that fit your life.
          </p>

          <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '0.5rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
              Enter how many minutes you can dedicate to training each day (0 if unavailable).
            </p>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-brand)' }}>
              Total availability per week: <strong>{totalMinutes} minutes</strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {DAYS.map((day, index) => (
              <div key={day} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <label style={{ width: '100px', fontWeight: '600', color: 'var(--color-text)' }}>
                  {DAY_LABELS[index]}
                </label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1 }}>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={availability[day]}
                    onChange={(e) => handleMinutesChange(day, e.target.value)}
                    className={styles.input}
                    style={{ flex: 1 }}
                  />
                  <span style={{ color: 'var(--color-text-secondary)', fontWeight: '500', minWidth: '80px' }}>minutes</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '0.5rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              <strong>💡 Why we ask:</strong> We'll schedule your sessions within the time you've indicated as available. Sessions never get placed when you've marked 0 minutes available. [T-14, US-03]
            </p>
          </div>
        </div>

        <div className={styles.actionButtons}>
          <a href="/onboarding/step5" className={styles.backButton}>
            ← Back
          </a>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={styles.nextButton}
          >
            {loading ? 'Saving...' : 'Complete Onboarding ✓'}
          </button>
        </div>
      </div>
    </main>
  );
}
