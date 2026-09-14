'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword } from '@/src/lib/actions/auth';
import styles from './auth.module.css';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: [] }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    if (!token) {
      setErrors({ _form: ['This reset link is invalid or has expired'] });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ confirmPassword: ['Passwords do not match'] });
      return;
    }

    setLoading(true);
    const response = await resetPassword({ token, newPassword: formData.newPassword });

    if (response.success) {
      setSuccess(true);
      setTimeout(() => router.push('/signin'), 1500);
    } else {
      setErrors(response.errors || { _form: ['An error occurred'] });
      setLoading(false);
    }
  };

  return (
    <div className={styles.auth_container}>
      <div className={styles.auth_card}>
        <h1>Reset Password</h1>
        <p className={styles.subtitle}>Enter a new password for your account</p>

        {errors._form && (
          <div className={styles.error_banner} role="alert">
            {errors._form[0]}
          </div>
        )}

        {success ? (
          <p>Password reset. Redirecting you to sign in...</p>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <fieldset className={styles.fieldset}>
              <label htmlFor="newPassword" className={styles.label}>New Password *</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                required
                className={styles.input}
                aria-invalid={!!errors.newPassword}
              />
              {errors.newPassword && (
                <span className={styles.error_message}>{errors.newPassword[0]}</span>
              )}
            </fieldset>

            <fieldset className={styles.fieldset}>
              <label htmlFor="confirmPassword" className={styles.label}>Confirm New Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className={styles.input}
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <span className={styles.error_message}>{errors.confirmPassword[0]}</span>
              )}
            </fieldset>

            <button type="submit" disabled={loading} className={styles.button}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className={styles.auth_footer}>
          <p>
            Remembered your password?{' '}
            <a href="/signin" className={styles.link}>
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
