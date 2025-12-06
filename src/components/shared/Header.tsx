'use client'

import { useStore } from '@/store'
import { Building2, Crown, TrendingUp, LogOut, Coins } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Header() {
  const currentUser = useStore(state => state.currentUser)
  const mode = useStore(state => state.mode)
  const logout = useStore(state => state.logout)
  const switchMode = useStore(state => state.switchMode)

  if (!currentUser) return null

  return (
    <header className="bg-ink-900 text-white border-b border-gold/20">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-ink-900" strokeWidth={2} />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-serif text-lg font-bold tracking-wide text-cream">
                CASA EXCHANGE
              </h1>
            </div>
          </div>

          {/* User Info & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mode Switcher (for admins) */}
            {currentUser.isAdmin && (
              <div className="flex bg-ink-800 rounded-xl p-1">
                <button
                  onClick={() => switchMode('admin')}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all',
                    mode === 'admin'
                      ? 'bg-gold text-ink-900'
                      : 'text-cream/50 hover:text-cream'
                  )}
                >
                  <Crown size={14} />
                  <span className="hidden sm:inline">Admin</span>
                </button>
                <button
                  onClick={() => switchMode('trader')}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all',
                    mode === 'trader'
                      ? 'bg-gold text-ink-900'
                      : 'text-cream/50 hover:text-cream'
                  )}
                >
                  <TrendingUp size={14} />
                  <span className="hidden sm:inline">Trader</span>
                </button>
              </div>
            )}

            {/* Balance (quick view) */}
            <div className="hidden md:flex items-center gap-1.5 bg-ink-800 rounded-xl px-3 py-1.5">
              <Coins size={14} className="text-gold" />
              <span className="font-mono font-semibold text-gold">{currentUser.balance}</span>
            </div>

            {/* User Badge */}
            <div className="flex items-center gap-2 bg-ink-800 rounded-xl px-2.5 sm:px-3 py-1.5">
              <span className="text-lg sm:text-xl">{currentUser.emoji}</span>
              <span className="font-medium text-sm hidden sm:inline">{currentUser.name}</span>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl 
                         bg-ink-800 hover:bg-red-500/20 hover:text-red-400 transition-all"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
