import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: {
    default: 'Kleroge — Where Ownership Begins',
    template: '%s | Kleroge',
  },
  description:
    'Discover, acquire, and own property anywhere. Kleroge is the digital infrastructure for property ownership.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
