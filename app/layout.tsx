import type { Metadata } from 'next';
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
      <body>{children}</body>
    </html>
  );
}
