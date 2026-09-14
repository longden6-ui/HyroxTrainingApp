'use client';

import { useState } from 'react';
import { requestPasswordReset } from '@/src/lib/actions/auth';
import styles from './ForgotPasswordModal.module.css';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const response = await requestPasswordReset({ email });

    if (response.success) {
      setSent(true);
    } else {
      setErrors(response.errors || { _form: ['An error occurred'] });
    }
    setLoading(false);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Reset your password</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {sent ? (
          <>
            <p className={styles.successMessage}>
              Check your email for a link to reset your password.
            </p>
            <div className={styles.actions}>
              <button type="button" className={styles.primaryBtn} onClick={onClose}>
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <p className={styles.body}>
              Enter the email address for your account and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <label htmlFor="reset-email" className={styles.label}>Email</label>
              <input
                type="email"
                id="reset-email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className={styles.input}
                aria-invalid={!!errors.email}
              />
              {errors.email && <span className={styles.errorMessage}>{errors.email[0]}</span>}
              {errors._form && <span className={styles.errorMessage}>{errors._form[0]}</span>}

              <div className={styles.actions}>
                <button type="button" className={styles.cancelBtn} onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} className={styles.primaryBtn}>
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
