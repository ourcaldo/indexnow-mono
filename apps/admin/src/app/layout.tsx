'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@indexnow/auth'
import { ToastContainer, FaviconProvider, QueryProvider, AnalyticsProvider } from '@indexnow/ui'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <FaviconProvider />
        <AnalyticsProvider>
          <QueryProvider>
            <AuthProvider>
              <ToastContainer>
                {children}
              </ToastContainer>
            </AuthProvider>
          </QueryProvider>
        </AnalyticsProvider>
      </body>
    </html>
  )
}
