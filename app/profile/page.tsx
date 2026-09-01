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

const EditableSelect = ({ label, value, onChange, options }: any) => (
  <div className={styles.formItem}>
    <label>{label}</label>
    <select
      value={value}
      onChange={onChange}
      className={styles.input}
    >
      <option value="">-- Select --</option>
      {options.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const SINGLES_AGE_GROUPS = [
  { value: 'U24', label: 'U24 (16–24 years)' },
  { value: '25-29', label: '25–29 years' },
  { value: '30-34', label: '30–34 years' },
  { value: '35-39', label: '35–39 years' },
  { value: '40-44', label: '40–44 years' },
  { value: '45-49', label: '45–49 years' },
  { value: '50-54', label: '50–54 years' },
  { value: '55-59', label: '55–59 years' },
  { value: '60-64', label: '60–64 years' },
  { value: '65-69', label: '65–69 years' },
  { value: '70-74', label: '70–74 years' },
  { value: '75-79', label: '75–79 years' },
  { value: '80-84', label: '80–84 years' },
  { value: '85-89', label: '85–89 years' },
];

const DOUBLES_AGE_GROUPS = [
  { value: 'U29', label: 'U29 (16–29 years)' },
  { value: '30-39', label: '30–39 years' },
  { value: '40-49', label: '40–49 years' },
  { value: '50-59', label: '50–59 years' },
  { value: '60-69', label: '60–69 years' },
  { value: '70+', label: '70+ years' },
];

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
];

const HYROX_EXPERIENCE_OPTIONS = [
  { value: 'Novice', label: 'Novice' },
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
  { value: 'Pro', label: 'Pro' },
];

const STATIONS = [
  { value: 'SkiErg', label: 'SkiErg' },
  { value: 'Rowing Machine', label: 'Rowing Machine' },
  { value: 'Wall Balls', label: 'Wall Balls' },
  { value: 'Tire Flip', label: 'Tire Flip' },
  { value: 'Rope Climb', label: 'Rope Climb' },
  { value: 'Rig', label: 'Rig' },
  { value: 'Sanctum', label: 'Sanctum' },
  { value: 'Fire Jump', label: 'Fire Jump' },
];

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

        // Parse finish time from "120 min" format to hours and minutes
        let finishTimeHours = '';
        let finishTimeMins = '';
        if (result.profile.onboarding?.finishTimeEstimate) {
          const minutes = parseInt(result.profile.onboarding.finishTimeEstimate);
          if (!isNaN(minutes)) {
            finishTimeHours = Math.floor(minutes / 60).toString();
            finishTimeMins = (minutes % 60).toString();
          }
        }

        setFormData({
          firstName: result.profile.firstName || '',
          lastName: result.profile.lastName || '',
          ageGroup: result.profile.onboarding?.age || '',
          gender: result.profile.onboarding?.gender || '',
          finishTimeHours,
          finishTimeMins,
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
      // Combine hours and minutes into a single finish time estimate
      const finishTimeEstimate = formData.finishTimeHours || formData.finishTimeMins
        ? `${(parseInt(formData.finishTimeHours || '0') * 60) + parseInt(formData.finishTimeMins || '0')} min`
        : '';

      const result = await updateAthleteProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        ageGroup: formData.ageGroup,
        gender: formData.gender,
        finishTimeEstimate,
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
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <div className={styles.formItem}>
                          <label>Estimated Finish Time (Hours)</label>
                          <select
                            value={formData.finishTimeHours}
                            onChange={(e) => setFormData({ ...formData, finishTimeHours: e.target.value })}
                            className={styles.input}
                          >
                            <option value="">-- Hours --</option>
                            {Array.from({ length: 6 }, (_, i) => (
                              <option key={i} value={i.toString()}>
                                {i} hr
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className={styles.formItem}>
                          <label>Minutes</label>
                          <select
                            value={formData.finishTimeMins}
                            onChange={(e) => setFormData({ ...formData, finishTimeMins: e.target.value })}
                            className={styles.input}
                          >
                            <option value="">-- Minutes --</option>
                            {Array.from({ length: 60 }, (_, i) => (
                              <option key={i} value={i.toString()}>
                                {i.toString().padStart(2, '0')} min
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
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
                    <div>
                      <div className={styles.formItem}>
                        <label>Age Group</label>
                        <select
                          value={formData.ageGroup}
                          onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                          className={styles.input}
                        >
                          <option value="">-- Select Age Group --</option>
                          <optgroup label="Singles Age Groups">
                            {SINGLES_AGE_GROUPS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Doubles Age Groups">
                            {DOUBLES_AGE_GROUPS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                    </div>
                    <EditableSelect label="Gender" value={formData.gender} onChange={(e: any) => setFormData({ ...formData, gender: e.target.value })} options={GENDER_OPTIONS} />
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
                    <EditableSelect label="HYROX Experience" value={formData.hyroxExperience} onChange={(e: any) => setFormData({ ...formData, hyroxExperience: e.target.value })} options={HYROX_EXPERIENCE_OPTIONS} />
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
                    <EditableSelect label="Most Preferred Station" value={formData.stationRank1} onChange={(e: any) => setFormData({ ...formData, stationRank1: e.target.value })} options={STATIONS} />
                    <EditableSelect label="Second Preferred Station" value={formData.stationRank2} onChange={(e: any) => setFormData({ ...formData, stationRank2: e.target.value })} options={STATIONS} />
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
