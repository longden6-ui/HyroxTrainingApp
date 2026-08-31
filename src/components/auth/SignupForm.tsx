'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signup } from '@/src/lib/actions/auth';
import styles from './auth.module.css';

export function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
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

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: ['Passwords do not match'] });
      setLoading(false);
      return;
    }

    const response = await signup({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName || undefined,
      lastName: formData.lastName || undefined,
    });

    if (response.success) {
      router.push('/onboarding');
    } else {
      setErrors(response.errors || { _form: ['An error occurred'] });
      setLoading(false);
    }
  };

  return (
    <div className={styles.auth_container}>
      <div className={styles.auth_card}>
        <h1>Create Your Account</h1>
        <p className={styles.subtitle}>Join HYROX Coach AI to get a personalized training plan</p>

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

          <div className={styles.form_row}>
            <fieldset className={styles.fieldset}>
              <label htmlFor="firstName" className={styles.label}>First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={styles.input}
              />
            </fieldset>

            <fieldset className={styles.fieldset}>
              <label htmlFor="lastName" className={styles.label}>Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={styles.input}
              />
            </fieldset>
          </div>

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
            <p className={styles.help_text}>
              At least 8 characters, including uppercase, lowercase, and a number
            </p>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <label htmlFor="confirmPassword" className={styles.label}>Confirm Password *</label>
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className={styles.auth_footer}>
          <p>
            Already have an account?{' '}
            <a href="/signin" className={styles.link}>
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
