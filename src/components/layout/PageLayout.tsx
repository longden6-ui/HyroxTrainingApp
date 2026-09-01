'use client';

import styles from './layout.module.css';

interface ActionButton {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showBackButton?: boolean;
  backHref?: string;
  actionButton?: ActionButton;
  actionButtons?: ActionButton[];
}

export function PageLayout({
  title,
  subtitle,
  children,
  showBackButton = false,
  backHref = '/',
  actionButton,
  actionButtons = [],
}: PageLayoutProps) {
  // Support both single actionButton and multiple actionButtons
  const buttons = actionButton ? [actionButton, ...actionButtons] : actionButtons;

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {buttons.length > 0 && (
            <div className={styles.headerActions}>
              {buttons.map((btn, idx) => (
                <button
                  key={idx}
                  onClick={btn.onClick}
                  className={`${styles.actionButton} ${btn.variant === 'secondary' ? styles.actionButtonSecondary : styles.actionButtonPrimary}`}
                  {...(btn.href && { as: 'a', href: btn.href })}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showBackButton && (
        <div className={styles.breadcrumb}>
          <a href={backHref}>← Back</a>
        </div>
      )}

      <div className={styles.content}>{children}</div>
    </main>
  );
}
