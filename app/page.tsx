'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Failed to check auth:', error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsLoggedIn(false);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <main className={styles.homepage}>
      <section className={styles.hero}>
        <h1>HYROX Coach AI</h1>
        <p className={styles.tagline}>Your personalized path to race day</p>
        <p className={styles.description}>
          Get a free finish-time estimate, then build a day-by-day training plan that fits your schedule and targets your biggest obstacles.
        </p>
        <div className={styles.button_group}>
          <a href="/predict" className={styles.cta_button}>
            Get Your Finish Time Estimate
          </a>
          {!loading && (
            isLoggedIn ? (
              <button onClick={handleLogout} className={styles.login_button}>
                Log Out
              </button>
            ) : (
              <a href="/signin" className={styles.login_button}>
                Sign In
              </a>
            )
          )}
        </div>
      </section>

      <section className={styles.features}>
        <h2>How It Works</h2>
        <div className={styles.feature_grid}>
          <div className={styles.feature}>
            <h3>1. Free Time Predictor</h3>
            <p>Enter your 5K time and race details to get an estimated finish-time range with confidence level.</p>
          </div>
          <div className={styles.feature}>
            <h3>2. Personalized Plan</h3>
            <p>Create an account to build a phased training plan that balances running, strength, and station skill.</p>
          </div>
          <div className={styles.feature}>
            <h3>3. Track Progress</h3>
            <p>Log workouts, track your progress, and adapt your plan based on how you feel and your schedule changes.</p>
          </div>
        </div>
      </section>

      <section className={styles.about}>
        <h2>What Is HYROX?</h2>
        <p>
          HYROX is a unique fitness competition combining 8 km of running with 8 obstacle stations. Athletes of all levels race in their local cities, making it accessible and competitive.
        </p>
        <p>
          Success requires running fitness, functional strength, obstacle skill, and mental resilience. HYROX Coach AI helps you build a realistic training plan that targets your individual weak points.
        </p>
      </section>
    </main>
  );
}
