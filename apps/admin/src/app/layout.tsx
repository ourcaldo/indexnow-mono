import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AdminClientProviders } from '@/components/providers/AdminClientProviders'
import { AdminSidebar } from '@/components/AdminSidebar'

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
      <body className={`${inter.className} bg-gray-50 dark:bg-[#0c0c14]`}>
        <AdminClientProviders>
          <div className="flex min-h-screen">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto">
              <div className="px-8 py-8">
                {children}
              </div>
            </main>
          </div>
        </AdminClientProviders>
      </body>
    </html>
  )
}

