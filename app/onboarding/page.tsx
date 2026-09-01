import { redirect } from 'next/navigation';
import { getSession } from '@/src/lib/auth/session';
import styles from './onboarding.module.css';

export const metadata = {
  title: 'Onboarding - HYROX Coach AI',
  description: 'Complete your profile to get your personalized training plan',
};

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session?.athleteId) {
    redirect('/signin');
  }

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1>Onboarding</h1>
        <p className={styles.subtitle}>Complete these 6 quick steps to get your personalized training plan</p>
      </div>

      <div className={styles.content}>
        {/* Info Box */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Welcome to HYROX Coach AI</h2>
          <p style={{ marginBottom: '1rem' }}>
            Let's build your personalized training plan. Your answers help us create a program that fits your unique needs, schedule, and goals. This takes about 5-10 minutes.
          </p>
        </div>

        {/* Steps Overview */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Training Plan Steps</h2>
          <div className={styles.radioGroup}>
            <StepCard number={1} title="Rank Your Hardest Stations" description="Tell us which HYROX stations challenge you most" link="/onboarding/step1" />
            <StepCard number={2} title="Athletic Background" description="Share your fitness experience and weekly training load" link="/onboarding/step2" />
            <StepCard number={3} title="Work Pattern" description="Describe your work demands and physical requirements" link="/onboarding/step3" />
            <StepCard number={4} title="Mobility & Pain Screening" description="Help us understand any physical limitations" link="/onboarding/step4" />
            <StepCard number={5} title="Equipment Access" description="Which training equipment do you have available?" link="/onboarding/step5" />
            <StepCard number={6} title="Training Availability" description="When can you train each day of the week?" link="/onboarding/step6" />
          </div>
        </div>

        {/* Get Started Button */}
        <div className={styles.actionButtons}>
          <a href="/onboarding/step1" className={styles.nextButton} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Start Building Your Plan →
          </a>
        </div>
      </div>
    </main>
  );
}

function StepCard({
  number,
  title,
  description,
  link,
}: {
  number: number;
  title: string;
  description: string;
  link: string;
}) {
  return (
    <a
      href={link}
      className={styles.radioItem}
      style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
        <div className={styles.stepNumber} style={{ minWidth: '2.5rem', width: '2.5rem', height: '2.5rem', marginRight: '1rem' }}>
          {number}
        </div>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: '0 0 0.5rem 0' }}>{title}</h3>
          <p style={{ fontSize: '0.95rem', color: '#6b7280', margin: 0 }}>{description}</p>
        </div>
      </div>
      <div style={{ marginLeft: '1rem', color: '#667eea', fontSize: '1.5rem' }}>→</div>
    </a>
  );
}
