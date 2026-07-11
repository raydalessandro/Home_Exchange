'use client'

import { useMemo, useState } from 'react'
import { useStore } from '@/store'
import { LEVELS, getPlayerLevel } from '@/lib/levels'
import { Building2, Crown, Sparkles, Lock, X } from 'lucide-react'

export function LoginView() {
  const login = useStore(state => state.login)
  const allPlayers = useStore(state => state.players)
  const adminPin = useStore(state => state.adminPin)

  // PIN prompt per i profili genitore su dispositivo condiviso
  const [pinFor, setPinFor] = useState<string | null>(null)
  const [pinValue, setPinValue] = useState('')
  const [pinError, setPinError] = useState(false)

  const players = useMemo(
    () => allPlayers.filter(p => !p.isBank),
    [allPlayers]
  )

  const handleProfileClick = (playerId: string, isAdmin: boolean) => {
    if (isAdmin && adminPin) {
      setPinFor(playerId)
      setPinValue('')
      setPinError(false)
      return
    }
    login(playerId)
  }

  const handlePinSubmit = (value: string) => {
    if (value === adminPin && pinFor) {
      login(pinFor)
      setPinFor(null)
      setPinValue('')
    } else {
      setPinError(true)
      setPinValue('')
    }
  }

  const handlePinChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    setPinValue(digits)
    setPinError(false)
    if (digits.length === 4) {
      handlePinSubmit(digits)
    }
  }

  const pinPlayer = pinFor ? players.find(p => p.id === pinFor) : null

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-gold/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="relative inline-flex items-center justify-center mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold/30">
              <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-ink-900" strokeWidth={1.5} />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 text-gold-400 animate-pulse" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white mb-2 sm:mb-3 tracking-tight">
            CASA EXCHANGE
          </h1>
          <p className="text-gold-400 italic text-base sm:text-lg md:text-xl font-light px-4">
            &quot;Non giochiamo coi numeri, facciamo magie&quot;
          </p>
        </div>

        {/* Login Card */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-white/20 shadow-2xl mx-2 sm:mx-0">
          <h2 className="font-serif text-xl sm:text-2xl text-white text-center mb-6 sm:mb-8 flex items-center justify-center gap-2 sm:gap-3">
            <span className="text-gold-400">🔐</span>
            Seleziona Profilo
          </h2>
          
          {/* Players Grid - responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {players.map((player, index) => (
              <button
                key={player.id}
                onClick={() => handleProfileClick(player.id, Boolean(player.isAdmin))}
                className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-5 rounded-xl sm:rounded-2xl
                           bg-white/90 backdrop-blur border-2 border-transparent
                           hover:border-gold hover:shadow-lg hover:shadow-gold/20
                           active:scale-95 transition-all duration-200
                           group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-3xl sm:text-4xl md:text-5xl group-hover:scale-110 transition-transform duration-200">
                  {player.emoji}
                </span>
                <span className="font-medium text-sm sm:text-base text-ink-700 group-hover:text-gold-600 transition-colors text-center">
                  {player.name}
                </span>
                {player.isAdmin ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-ink-900 font-bold">
                    <Crown className="w-3 h-3" />
                    Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-ink-100 text-ink-600 font-medium">
                    {LEVELS[getPlayerLevel(player)].emoji} {LEVELS[getPlayerLevel(player)].name}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-ink-400/60 text-xs sm:text-sm mt-6 sm:mt-10 tracking-wide">
          Borsa Domestica Educativa • v0.6.0
        </p>
      </div>

      {/* PIN Prompt per profili genitore */}
      {pinPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/80 backdrop-blur-sm">
          <div className="w-full max-w-xs bg-ink-800 border border-ink-600 rounded-3xl p-6 text-center relative">
            <button
              onClick={() => setPinFor(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-ink-700 hover:bg-ink-600 flex items-center justify-center text-cream/60"
              aria-label="Chiudi"
            >
              <X size={16} />
            </button>
            <div className="text-4xl mb-2">{pinPlayer.emoji}</div>
            <div className="text-cream font-medium mb-1">{pinPlayer.name}</div>
            <div className="text-cream/50 text-sm mb-4 flex items-center justify-center gap-1">
              <Lock size={14} />
              Inserisci il PIN genitori
            </div>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pinValue}
              onChange={e => handlePinChange(e.target.value)}
              placeholder="••••"
              className={`w-32 mx-auto px-3 py-3 bg-ink-700 border rounded-xl text-cream text-center text-2xl tracking-[0.5em] font-mono focus:outline-none ${
                pinError ? 'border-red-500 animate-pulse' : 'border-ink-600 focus:border-gold'
              }`}
            />
            {pinError && (
              <p className="text-red-400 text-sm mt-3">PIN sbagliato, riprova!</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
