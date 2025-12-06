'use client'

import { useStore } from '@/store'
import { LoginView } from '@/components/LoginView'
import { AdminView } from '@/components/admin/AdminView'
import { TraderView } from '@/components/trader/TraderView'
import { Header } from '@/components/shared/Header'
import { Toast } from '@/components/shared/Toast'

export default function Home() {
  const { currentUser, mode } = useStore()

  if (!currentUser) {
    return <LoginView />
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <Header />
      <main className="container mx-auto px-4 py-6">
        {mode === 'admin' && currentUser.isAdmin ? (
          <AdminView />
        ) : (
          <TraderView />
        )}
      </main>
      <Toast />
    </div>
  )
}

