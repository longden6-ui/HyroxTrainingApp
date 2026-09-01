'use client';

import styles from './layout.module.css';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: 'default' | 'info' | 'warning' | 'error';
}

export function Card({ title, subtitle, children, variant = 'default' }: CardProps) {
  const variantClass = {
    default: styles.card,
    info: styles.cardInfo,
    warning: styles.cardWarning,
    error: styles.cardError,
  }[variant];

  return (
    <div className={variantClass}>
      {title && <h2 className={styles.cardTitle}>{title}</h2>}
      {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
      {children}
    </div>
  );
}
