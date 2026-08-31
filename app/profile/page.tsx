'use client';

import { useEffect, useState } from 'react';
import { getAthleteProfile } from '@/src/lib/actions/profile';
import styles from './profile.module.css';

interface ProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  onboarding?: {
    finishTimeEstimate?: string;
    raceDate?: Date;
    age?: string;
    gender?: string;
    hyroxExperience?: string;
    fitnessLevel?: string;
    primaryGoal?: string;
    trainingDaysPerWeek?: number;
    availabilityByDay?: Record<string, string>;
    equipment?: string[];
    stationRank1?: string;
    stationRank2?: string;
  } | null;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      const result = await getAthleteProfile();

      if (result.success) {
        setProfile(result.profile);
      } else {
        setError(result.error || 'Unable to load profile');
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <main className={styles.container}>
        <div className={styles.header}>
          <h1>My Profile</h1>
        </div>
        <div className={styles.loadingMessage}>Loading your profile...</div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className={styles.container}>
        <div className={styles.header}>
          <h1>My Profile</h1>
        </div>
        <div className={styles.errorMessage}>
          <p>{error || 'Unable to load profile'}</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1>My Profile</h1>
        <p className={styles.subtitle}>Your personal training profile and onboarding details</p>
      </div>

      <div className={styles.profileContent}>
        {/* Basic Information */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Basic Information</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>Full Name</label>
              <p>{profile.firstName} {profile.lastName}</p>
            </div>
            <div className={styles.infoItem}>
              <label>Email</label>
              <p>{profile.email}</p>
            </div>
            <div className={styles.infoItem}>
              <label>Member Since</label>
              <p>{new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
        </section>

        {profile.onboarding ? (
          <>
            {/* Race Information */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Race Information</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>Target Race Date</label>
                  <p>{profile.onboarding.raceDate ? new Date(profile.onboarding.raceDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not set'}</p>
                </div>
                <div className={styles.infoItem}>
                  <label>Estimated Finish Time</label>
                  <p>{profile.onboarding.finishTimeEstimate || 'Not provided'}</p>
                </div>
              </div>
            </section>

            {/* Demographics */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Demographics</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>Age Group</label>
                  <p>{profile.onboarding.age || 'Not provided'}</p>
                </div>
                <div className={styles.infoItem}>
                  <label>Gender</label>
                  <p>{profile.onboarding.gender || 'Not provided'}</p>
                </div>
              </div>
            </section>

            {/* Experience & Fitness */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Experience & Fitness</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>HYROX Experience</label>
                  <p>{profile.onboarding.hyroxExperience || 'Not provided'}</p>
                </div>
                <div className={styles.infoItem}>
                  <label>Current Fitness Level</label>
                  <p>{profile.onboarding.fitnessLevel || 'Not provided'}</p>
                </div>
                <div className={styles.infoItem}>
                  <label>Training Days Per Week</label>
                  <p>{profile.onboarding.trainingDaysPerWeek || 'Not set'} days</p>
                </div>
              </div>
            </section>

            {/* Training Goals */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Training Goals</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>Primary Goal</label>
                  <p>{profile.onboarding.primaryGoal || 'Not provided'}</p>
                </div>
              </div>
            </section>

            {/* Equipment */}
            {profile.onboarding.equipment && profile.onboarding.equipment.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Available Equipment</h2>
                <div className={styles.equipmentList}>
                  {profile.onboarding.equipment.map((item, idx) => (
                    <div key={idx} className={styles.equipmentBadge}>
                      {item}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Training Availability */}
            {profile.onboarding.availabilityByDay && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Weekly Availability</h2>
                <div className={styles.availabilityGrid}>
                  {Object.entries(profile.onboarding.availabilityByDay).map(([day, availability]) => (
                    <div key={day} className={styles.availabilityItem}>
                      <label>{day}</label>
                      <p>{availability}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Station Preferences */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Station Preferences</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>Most Preferred Station</label>
                  <p>{profile.onboarding.stationRank1 || 'Not set'}</p>
                </div>
                <div className={styles.infoItem}>
                  <label>Second Preferred Station</label>
                  <p>{profile.onboarding.stationRank2 || 'Not set'}</p>
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className={styles.section}>
            <p className={styles.noOnboarding}>Complete onboarding to view additional profile details.</p>
          </section>
        )}
      </div>
    </main>
  );
}
