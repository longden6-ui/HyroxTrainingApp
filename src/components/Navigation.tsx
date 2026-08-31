'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Navigation.module.css';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUserEmail(data.email);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    // Call logout server action
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        router.push('/');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className={styles.header}>
      <nav className={styles.navbar}>
        <Link href="/" className={styles.logo}>
          HYROX Coach AI
        </Link>

        <div className={styles.menuButton}>
          {userEmail && (
            <span className={styles.userEmail}>{userEmail}</span>
          )}
          <button
            className={styles.hamburger}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className={`${styles.dropdownMenu} ${isOpen ? styles.active : ''}`}>
            <div className={styles.menuSection}>
              <p className={styles.sectionLabel}>Main</p>
              <Link href="/" className={styles.menuItem} onClick={() => setIsOpen(false)}>
                Home
              </Link>
              <Link href="/predict" className={styles.menuItem} onClick={() => setIsOpen(false)}>
                Finish Time Predictor
              </Link>
            </div>

            <div className={styles.menuSection}>
              <p className={styles.sectionLabel}>Training</p>
              <Link href="/dashboard" className={styles.menuItem} onClick={() => setIsOpen(false)}>
                Dashboard
              </Link>
              <Link href="/dashboard/calendar" className={styles.menuItem} onClick={() => setIsOpen(false)}>
                Training Calendar
              </Link>
              <Link href="/dashboard/training-plan" className={styles.menuItem} onClick={() => setIsOpen(false)}>
                Full Training Plan
              </Link>
              <Link href="/onboarding" className={styles.menuItem} onClick={() => setIsOpen(false)}>
                Onboarding
              </Link>
            </div>

            <div className={styles.menuSection}>
              <p className={styles.sectionLabel}>Account</p>
              <Link href="/profile" className={styles.menuItem} onClick={() => setIsOpen(false)}>
                Profile
              </Link>
              <Link href="/signin" className={styles.menuItem} onClick={() => setIsOpen(false)}>
                Sign In
              </Link>
              <Link href="/signup" className={styles.menuItem} onClick={() => setIsOpen(false)}>
                Create Account
              </Link>
              <button
                className={`${styles.menuItem} ${styles.logoutButton}`}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
