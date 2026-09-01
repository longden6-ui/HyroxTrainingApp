'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { submitOnboardingStep5, getCurrentOnboarding } from '@/src/lib/actions/onboarding';
import { EQUIPMENT_OPTIONS } from '@/src/lib/onboarding/schema';
import styles from '../onboarding.module.css';

export default function Step5Page() {
  const router = useRouter();
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Load existing onboarding data on mount
  useEffect(() => {
    const loadOnboarding = async () => {
      try {
        const result = await getCurrentOnboarding();
        if (result.success && result.onboarding && result.onboarding.equipment) {
          setSelectedEquipment(result.onboarding.equipment || []);
        }
      } catch (err) {
        console.error('Failed to load onboarding data:', err);
      } finally {
        setPageLoading(false);
      }
    };
    loadOnboarding();
  }, []);

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

  if (pageLoading) {
    return (
      <main className={styles.container}>
        <div className={styles.header}>
          <div className={styles.stepIndicator}>
            <div className={styles.stepNumber}>5</div>
            <div className={styles.stepMeta}>
              <label className={styles.label}>Step 5 of 6</label>
              <h1 className={styles.title}>Equipment Access</h1>
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
          <div className={styles.stepNumber}>5</div>
          <div className={styles.stepMeta}>
            <label className={styles.label}>Step 5 of 6</label>
            <h1 className={styles.title}>Equipment Access</h1>
          </div>
        </div>
      </div>

      <div className={styles.breadcrumb}>
        <a href="/onboarding">← Back to Onboarding</a>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Your Available Equipment</h2>
          <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
            Select all the equipment you have access to. This helps us suggest appropriate workouts and substitutions.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {EQUIPMENT_OPTIONS.map((equipment) => (
              <label key={equipment} className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={selectedEquipment.includes(equipment)}
                  onChange={() => toggleEquipment(equipment)}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxLabel}>{equipment}</span>
              </label>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
              <strong>💡 Why we ask:</strong> Equipment availability affects which exercises we recommend and how we structure your sessions. No equipment? We'll focus on bodyweight and minimal-equipment options.
            </p>
          </div>
        </div>

        <div className={styles.actionButtons}>
          <a href="/onboarding/step4" className={styles.backButton}>
            ← Back
          </a>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={styles.nextButton}
          >
            {loading ? 'Saving...' : 'Next: Training Availability →'}
          </button>
        </div>
      </div>
    </main>
  );
}
