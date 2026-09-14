'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signin } from '@/src/lib/actions/auth';
import MfaChallengeScreen from '@/src/components/mfa/MfaChallengeScreen';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import styles from './auth.module.css';

export function SigninForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // MFA state — set when signin returns mfa_required
  const [pendingMfaToken, setPendingMfaToken] = useState<string | null>(null);

  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: [] }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const response = await signin({ email: formData.email, password: formData.password });

    if (response.success && response.mfa_required && response.mfaToken) {
      // Transition to MFA challenge — don't redirect yet
      setPendingMfaToken(response.mfaToken);
      setLoading(false);
      return;
    }

    if (response.success) {
      router.push('/dashboard');
    } else {
      setErrors(response.errors || { _form: ['An error occurred'] });
      setLoading(false);
    }
  };

  // ── MFA challenge screen ────────────────────────────────────────────────────
  if (pendingMfaToken) {
    return (
      <MfaChallengeScreen
        mfaToken={pendingMfaToken}
        onSuccess={() => router.push('/dashboard')}
        onCancel={() => {
          setPendingMfaToken(null);
          setErrors({});
        }}
      />
    );
  }

  // ── Standard login form ─────────────────────────────────────────────────────
  return (
    <div className={styles.auth_container}>
      <div className={styles.auth_card}>
        <h1>Sign In</h1>
        <p className={styles.subtitle}>Welcome back to HYROX Coach AI</p>

        {errors._form && (
          <div className={styles.error_banner} role="alert">
            {errors._form[0]}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <fieldset className={styles.fieldset}>
            <label htmlFor="email" className={styles.label}>Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={styles.input}
              aria-invalid={!!errors.email}
            />
            {errors.email && <span className={styles.error_message}>{errors.email[0]}</span>}
          </fieldset>

          <fieldset className={styles.fieldset}>
            <label htmlFor="password" className={styles.label}>Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className={styles.input}
              aria-invalid={!!errors.password}
            />
            {errors.password && <span className={styles.error_message}>{errors.password[0]}</span>}
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className={styles.link}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', alignSelf: 'flex-end', fontSize: '0.85rem' }}
            >
              Forgot password?
            </button>
          </fieldset>

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.auth_footer}>
          <p>
            Don&apos;t have an account?{' '}
            <a href="/signup" className={styles.link}>
              Create one
            </a>
          </p>
        </div>
      </div>

      {showForgotPassword && (
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}
    </div>
  );
}
