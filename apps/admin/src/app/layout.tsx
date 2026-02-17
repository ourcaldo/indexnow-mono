import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AdminClientProviders } from '@/components/providers/AdminClientProviders'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'IndexNow Studio Admin',
  description: 'Administration dashboard for IndexNow Studio. Manage users, packages, and platform settings.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AdminClientProviders>
          {children}
        </AdminClientProviders>
      </body>
    </html>
  )
}
