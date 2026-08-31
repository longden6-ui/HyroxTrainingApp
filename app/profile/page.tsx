'use client';

import { useEffect, useState } from 'react';
import { getAthleteProfile, updateAthleteProfile } from '@/src/lib/actions/profile';
import styles from './profile.module.css';

interface ProfileData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
  onboarding?: {
    finishTimeEstimate?: string;
    raceDate?: Date | null;
    age?: string;
    gender?: string;
    hyroxExperience?: string;
    fitnessLevel?: string;
    primaryGoal?: string;
    trainingDaysPerWeek?: number;
    availabilityByDay?: Record<string, string> | null;
    equipment?: string[];
    stationRank1?: string;
    stationRank2?: string;
  } | null;
}

const EditableField = ({ label, value, onChange, type = 'text' }: any) => (
  <div className={styles.formItem}>
    <label>{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      className={styles.input}
    />
  </div>
);

const DisplayField = ({ label, value }: any) => (
  <div className={styles.infoItem}>
    <label>{label}</label>
    <p>{value || 'Not provided'}</p>
  </div>
);

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      const result = await getAthleteProfile();

      if ('success' in result && result.success && result.profile) {
        setProfile(result.profile);
        setFormData({
          firstName: result.profile.firstName || '',
          lastName: result.profile.lastName || '',
          ageGroup: result.profile.onboarding?.age || '',
          gender: result.profile.onboarding?.gender || '',
          finishTimeEstimate: result.profile.onboarding?.finishTimeEstimate || '',
          raceDate: result.profile.onboarding?.raceDate ? new Date(result.profile.onboarding.raceDate).toISOString().split('T')[0] : '',
          hyroxExperience: result.profile.onboarding?.hyroxExperience || '',
          fitnessLevel: result.profile.onboarding?.fitnessLevel || '',
          primaryGoal: result.profile.onboarding?.primaryGoal || '',
          trainingDaysPerWeek: result.profile.onboarding?.trainingDaysPerWeek || '',
          stationRank1: result.profile.onboarding?.stationRank1 || '',
          stationRank2: result.profile.onboarding?.stationRank2 || '',
        });
      } else if ('error' in result) {
        setError(result.error || 'Unable to load profile');
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await updateAthleteProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        ageGroup: formData.ageGroup,
        gender: formData.gender,
        finishTimeEstimate: formData.finishTimeEstimate,
        raceDate: formData.raceDate,
        hyroxExperience: formData.hyroxExperience,
        fitnessLevel: formData.fitnessLevel,
        primaryGoal: formData.primaryGoal,
        trainingDaysPerWeek: formData.trainingDaysPerWeek ? parseInt(formData.trainingDaysPerWeek) : undefined,
        stationRank1: formData.stationRank1,
        stationRank2: formData.stationRank2,
      });

      if ('success' in result && result.success) {
        setIsEditing(false);
        const newProfile = await getAthleteProfile();
        if ('success' in newProfile && newProfile.success) {
          setProfile(newProfile.profile || null);
        }
      } else if ('error' in result) {
        setError(result.error || 'Failed to save changes');
      }
    } catch (e) {
      setError('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

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

  if (!profile) {
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
        <div className={styles.headerTop}>
          <h1>My Profile</h1>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className={styles.editButton}>
              ✎ Edit Profile
            </button>
          )}
        </div>
        <p className={styles.subtitle}>Your personal training profile and onboarding details</p>
        {error && <div className={styles.errorBanner}>{error}</div>}
      </div>

      <div className={styles.profileContent}>
        {/* Basic Information */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Basic Information</h2>
          <div className={styles.infoGrid}>
            {isEditing ? (
              <>
                <EditableField label="First Name" value={formData.firstName} onChange={(e: any) => setFormData({ ...formData, firstName: e.target.value })} />
                <EditableField label="Last Name" value={formData.lastName} onChange={(e: any) => setFormData({ ...formData, lastName: e.target.value })} />
              </>
            ) : (
              <DisplayField label="Full Name" value={`${profile.firstName || ''} ${profile.lastName || ''}`.trim()} />
            )}
            <DisplayField label="Email" value={profile.email} />
            <DisplayField label="Member Since" value={new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
          </div>
        </section>

        {profile.onboarding && (
          <>
            {/* Race Information */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Race Information</h2>
              <div className={styles.infoGrid}>
                {isEditing ? (
                  <>
                    <EditableField label="Target Race Date" type="date" value={formData.raceDate} onChange={(e: any) => setFormData({ ...formData, raceDate: e.target.value })} />
                    <EditableField label="Estimated Finish Time" value={formData.finishTimeEstimate} onChange={(e: any) => setFormData({ ...formData, finishTimeEstimate: e.target.value })} />
                  </>
                ) : (
                  <>
                    <DisplayField label="Target Race Date" value={profile.onboarding.raceDate ? new Date(profile.onboarding.raceDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not set'} />
                    <DisplayField label="Estimated Finish Time" value={profile.onboarding.finishTimeEstimate} />
                  </>
                )}
              </div>
            </section>

            {/* Demographics */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Demographics</h2>
              <div className={styles.infoGrid}>
                {isEditing ? (
                  <>
                    <EditableField label="Age Group" value={formData.ageGroup} onChange={(e: any) => setFormData({ ...formData, ageGroup: e.target.value })} />
                    <EditableField label="Gender" value={formData.gender} onChange={(e: any) => setFormData({ ...formData, gender: e.target.value })} />
                  </>
                ) : (
                  <>
                    <DisplayField label="Age Group" value={profile.onboarding.age} />
                    <DisplayField label="Gender" value={profile.onboarding.gender} />
                  </>
                )}
              </div>
            </section>

            {/* Experience & Fitness */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Experience & Fitness</h2>
              <div className={styles.infoGrid}>
                {isEditing ? (
                  <>
                    <EditableField label="HYROX Experience" value={formData.hyroxExperience} onChange={(e: any) => setFormData({ ...formData, hyroxExperience: e.target.value })} />
                    <EditableField label="Current Fitness Level" value={formData.fitnessLevel} onChange={(e: any) => setFormData({ ...formData, fitnessLevel: e.target.value })} />
                    <EditableField label="Training Days Per Week" type="number" value={formData.trainingDaysPerWeek} onChange={(e: any) => setFormData({ ...formData, trainingDaysPerWeek: e.target.value })} />
                  </>
                ) : (
                  <>
                    <DisplayField label="HYROX Experience" value={profile.onboarding.hyroxExperience} />
                    <DisplayField label="Current Fitness Level" value={profile.onboarding.fitnessLevel} />
                    <DisplayField label="Training Days Per Week" value={profile.onboarding.trainingDaysPerWeek ? `${profile.onboarding.trainingDaysPerWeek} days` : 'Not set'} />
                  </>
                )}
              </div>
            </section>

            {/* Training Goals */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Training Goals</h2>
              <div className={styles.infoGrid}>
                {isEditing ? (
                  <EditableField label="Primary Goal" value={formData.primaryGoal} onChange={(e: any) => setFormData({ ...formData, primaryGoal: e.target.value })} />
                ) : (
                  <DisplayField label="Primary Goal" value={profile.onboarding.primaryGoal} />
                )}
              </div>
            </section>

            {/* Equipment */}
            {profile.onboarding.equipment && profile.onboarding.equipment.length > 0 && !isEditing && (
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

            {/* Station Preferences */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Station Preferences</h2>
              <div className={styles.infoGrid}>
                {isEditing ? (
                  <>
                    <EditableField label="Most Preferred Station" value={formData.stationRank1} onChange={(e: any) => setFormData({ ...formData, stationRank1: e.target.value })} />
                    <EditableField label="Second Preferred Station" value={formData.stationRank2} onChange={(e: any) => setFormData({ ...formData, stationRank2: e.target.value })} />
                  </>
                ) : (
                  <>
                    <DisplayField label="Most Preferred Station" value={profile.onboarding.stationRank1} />
                    <DisplayField label="Second Preferred Station" value={profile.onboarding.stationRank2} />
                  </>
                )}
              </div>
            </section>
          </>
        )}

        {isEditing && (
          <div className={styles.actionButtons}>
            <button onClick={handleSave} disabled={isSaving} className={styles.saveButton}>
              {isSaving ? 'Saving...' : '✓ Save Changes'}
            </button>
            <button onClick={() => setIsEditing(false)} disabled={isSaving} className={styles.cancelButton}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
