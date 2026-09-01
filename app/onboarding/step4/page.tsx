'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { submitOnboardingStep4, getCurrentOnboarding } from '@/src/lib/actions/onboarding';
import styles from '../onboarding.module.css';

export default function Step4Page() {
  const router = useRouter();
  const [mobilityStatus, setMobilityStatus] = useState('UNRESTRICTED');
  const [activePain, setActivePain] = useState(false);
  const [painDetails, setPainDetails] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Load existing onboarding data on mount
  useEffect(() => {
    const loadOnboarding = async () => {
      try {
        const result = await getCurrentOnboarding();
        if (result.success && result.onboarding) {
          setMobilityStatus(result.onboarding.mobilityStatus || 'UNRESTRICTED');
          setActivePain(result.onboarding.activePain || false);
          setPainDetails(result.onboarding.painDetails || '');
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

  if (pageLoading) {
    return (
      <main className={styles.container}>
        <div className={styles.header}>
          <div className={styles.stepIndicator}>
            <div className={styles.stepNumber}>4</div>
            <div className={styles.stepMeta}>
              <label className={styles.label}>Step 4 of 6</label>
              <h1 className={styles.title}>Mobility & Pain Screening</h1>
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
          <div className={styles.stepNumber}>4</div>
          <div className={styles.stepMeta}>
            <label className={styles.label}>Step 4 of 6</label>
            <h1 className={styles.title}>Mobility & Pain Screening</h1>
          </div>
        </div>
      </div>

      <div className={styles.breadcrumb}>
        <a href="/onboarding">← Back to Onboarding</a>
      </div>

      <div className={styles.content}>
        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Your Physical Limitations</h2>
          <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
            Help us understand any physical limitations so we can adapt your training safely.
          </p>

          <div style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>
              Mobility Status
            </p>
            <div className={styles.radioGroup}>
              <label className={styles.radioItem}>
                <input
                  type="radio"
                  name="mobility"
                  value="UNRESTRICTED"
                  checked={mobilityStatus === 'UNRESTRICTED'}
                  onChange={(e) => setMobilityStatus(e.target.value)}
                />
                <div>
                  <p style={{ fontWeight: '600', color: '#111827', margin: '0 0 0.25rem 0' }}>Unrestricted</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Full range of motion, no limitations</p>
                </div>
              </label>
              <label className={styles.radioItem}>
                <input
                  type="radio"
                  name="mobility"
                  value="LIMITED_MOBILITY"
                  checked={mobilityStatus === 'LIMITED_MOBILITY'}
                  onChange={(e) => setMobilityStatus(e.target.value)}
                />
                <div>
                  <p style={{ fontWeight: '600', color: '#111827', margin: '0 0 0.25rem 0' }}>Limited Mobility</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Some restricted movements or range limitations</p>
                </div>
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem' }}>
              Do you currently experience any pain?
            </p>
            <div className={styles.radioGroup}>
              <label className={styles.radioItem}>
                <input
                  type="radio"
                  name="pain"
                  value="no"
                  checked={!activePain}
                  onChange={() => {
                    setActivePain(false);
                    setPainDetails('');
                  }}
                />
                <div>
                  <p style={{ fontWeight: '600', color: '#111827', margin: '0 0 0.25rem 0' }}>No current pain</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>I'm pain-free or manage minor discomfort well</p>
                </div>
              </label>
              <label className={styles.radioItem}>
                <input
                  type="radio"
                  name="pain"
                  value="yes"
                  checked={activePain}
                  onChange={() => setActivePain(true)}
                />
                <div>
                  <p style={{ fontWeight: '600', color: '#111827', margin: '0 0 0.25rem 0' }}>Yes, I experience pain</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>I have ongoing or recurring pain concerns</p>
                </div>
              </label>
            </div>
          </div>

          {activePain && (
            <div className={styles.formItem}>
              <label className={styles.label}>Please describe your pain (location, type, severity)</label>
              <textarea
                value={painDetails}
                onChange={(e) => setPainDetails(e.target.value)}
                placeholder="e.g., Lower back pain, mild to moderate, worse when bending forward"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontFamily: 'inherit',
                  fontSize: '1rem',
                  minHeight: '96px',
                  fontWeight: '500',
                  color: '#111827'
                }}
              />
            </div>
          )}

          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
              <strong>💡 Why we ask:</strong> Understanding your mobility and any pain helps us create safe modifications and prevent aggravating existing issues.
            </p>
          </div>
        </div>

        <div className={styles.actionButtons}>
          <a href="/onboarding/step3" className={styles.backButton}>
            ← Back
          </a>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={styles.nextButton}
          >
            {loading ? 'Saving...' : 'Next: Equipment Access →'}
          </button>
        </div>
      </div>
    </main>
  );
}
