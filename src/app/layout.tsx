import type { Metadata } from 'next'
import './globals.css'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Casa Exchange',
  description: 'Borsa Domestica Educativa - Non giochiamo coi numeri, facciamo magie',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className="min-h-screen">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}

