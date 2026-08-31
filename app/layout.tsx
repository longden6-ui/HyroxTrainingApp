import type { Metadata } from 'next';
import Navigation from '@/src/components/Navigation';
import './globals.css';

export const metadata: Metadata = {
  title: 'HYROX Coach AI',
  description: 'Personalized training for HYROX athletes',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
