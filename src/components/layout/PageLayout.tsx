'use client';

import styles from './layout.module.css';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showBackButton?: boolean;
  backHref?: string;
}

export function PageLayout({
  title,
  subtitle,
  children,
  showBackButton = false,
  backHref = '/',
}: PageLayoutProps) {
  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
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
