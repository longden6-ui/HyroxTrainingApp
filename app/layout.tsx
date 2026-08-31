import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HYROX Coach AI',
  description: 'Personalized training for HYROX athletes',
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
