'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { submitOnboardingStep1, getCurrentOnboarding } from '@/src/lib/actions/onboarding';
import styles from '../onboarding.module.css';

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
  const [pageLoading, setPageLoading] = useState(true);

  // Load existing onboarding data on mount
  useEffect(() => {
    const loadOnboarding = async () => {
      try {
        const result = await getCurrentOnboarding();
        if (result.success && result.onboarding) {
          setRank1(result.onboarding.stationRank1 || '');
          setRank2(result.onboarding.stationRank2 || '');
          setRank3(result.onboarding.stationRank3 || '');
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

  const getOptionsForRank = (currentRank: string, otherRank1: string, otherRank2: string) => {
    return STATIONS.filter((s) => s.id !== otherRank1 && s.id !== otherRank2);
  };

  if (pageLoading) {
    return (
      <main className={styles.container}>
        <div className={styles.header}>
          <div className={styles.stepIndicator}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepMeta}>
              <label className={styles.label}>Step 1 of 6</label>
              <h1 className={styles.title}>Rank Your Hardest Stations</h1>
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
          <div className={styles.stepNumber}>1</div>
          <div className={styles.stepMeta}>
            <label className={styles.label}>Step 1 of 6</label>
            <h1 className={styles.title}>Rank Your Hardest Stations</h1>
          </div>
        </div>
      </div>

      <div className={styles.breadcrumb}>
        <a href="/onboarding">← Back to Onboarding</a>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Select Your Stations</h2>
          <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
            Tell us which HYROX stations challenge you most. We'll customize your training plan to target these weak points.
          </p>

          <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
            <div className={styles.formItem}>
              <label className={styles.label}>Hardest Station (Rank 1) *</label>
              <select
                value={rank1}
                onChange={(e) => setRank1(e.target.value)}
                className={styles.select}
              >
                <option value="">-- Select a station --</option>
                {getOptionsForRank(rank1, rank2, rank3).map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formItem}>
              <label className={styles.label}>Second Hardest Station (Rank 2) *</label>
              <select
                value={rank2}
                onChange={(e) => setRank2(e.target.value)}
                className={styles.select}
              >
                <option value="">-- Select a station --</option>
                {getOptionsForRank(rank2, rank1, rank3).map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formItem}>
              <label className={styles.label}>Third Hardest Station (Rank 3) *</label>
              <select
                value={rank3}
                onChange={(e) => setRank3(e.target.value)}
                className={styles.select}
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

          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
              <strong>All 8 HYROX Stations:</strong> SkiErg, Sled Push, Sled Pull, Burpee Broad Jumps, RowErg, Farmer's Carry, Sandbag Lunges, Wall Balls
            </p>
          </div>
        </div>

        <div className={styles.actionButtons}>
          <a href="/onboarding" className={styles.backButton}>
            ← Back
          </a>
          <button
            onClick={handleSubmit}
            disabled={loading || !rank1 || !rank2 || !rank3}
            className={styles.nextButton}
          >
            {loading ? 'Saving...' : 'Next: Athletic Background →'}
          </button>
        </div>
      </div>
    </main>
  );
}
