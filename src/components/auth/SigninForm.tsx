'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signin } from '@/src/lib/actions/auth';
import styles from './auth.module.css';

export function SigninForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: [] }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const response = await signin({
      email: formData.email,
      password: formData.password,
    });

    if (response.success) {
      router.push('/dashboard');
    } else {
      setErrors(response.errors || { _form: ['An error occurred'] });
      setLoading(false);
    }
  };

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
          </fieldset>

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.auth_footer}>
          <p>
            Don't have an account?{' '}
            <a href="/signup" className={styles.link}>
              Create one
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
