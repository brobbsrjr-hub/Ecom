import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Receptionist',
  description: 'Answers texts, texts back missed calls, and books appointments.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
