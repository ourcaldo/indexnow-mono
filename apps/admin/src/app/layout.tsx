import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AdminClientProviders } from '@/components/providers/AdminClientProviders';
import { LayoutShell } from '@/components/LayoutShell';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'IndexNow Admin',
  description: 'IndexNow Studio administration panel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-[#f8f9fb] text-gray-900`}>
        <AdminClientProviders>
          <LayoutShell>{children}</LayoutShell>
        </AdminClientProviders>
      </body>
    </html>
  );
}
