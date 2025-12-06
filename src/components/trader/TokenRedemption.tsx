'use client'

import { useMemo } from 'react'
import { useStore } from '@/store'
import { useShallow } from 'zustand/react/shallow'
import { Card, StatCard } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { QUALITY_LABELS } from '@/types'
import { cn } from '@/lib/cn'
import { 
  Ticket, 
  Coins, 
  CheckCircle, 
  Clock, 
  Download,
  Sparkles,
  History
} from 'lucide-react'

export function TokenRedemption() {
  const currentUser = useStore(state => state.currentUser)
  const workTokens = useStore(useShallow(state => state.workTokens))
  const redeemWorkToken = useStore(state => state.redeemWorkToken)
  const redeemAllTokens = useStore(state => state.redeemAllTokens)
  
  const { unredeemed, allTokens } = useMemo(() => {
    if (!currentUser) return { unredeemed: [], allTokens: [] }
    const playerTokens = workTokens.filter(t => t.issuedTo === currentUser.id)
    return {
      unredeemed: playerTokens.filter(t => !t.redeemed),
      allTokens: playerTokens,
    }
  }, [workTokens, currentUser])

  if (!currentUser) return null

  const totalUnredeemedValue = unredeemed.reduce((sum, t) => sum + t.finalValue, 0)
  const redeemedTokens = allTokens.filter(t => t.redeemed)

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (days > 0) return `${days}g fa`
    if (hours > 0) return `${hours}h fa`
    if (minutes > 0) return `${minutes}m fa`
    return 'ora'
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label="Da Riscuotere"
          value={unredeemed.length}
          icon={<Ticket size={16} />}
          variant="warning"
        />
        <StatCard
          label="Valore Totale"
          value={`🪙${totalUnredeemedValue}`}
          icon={<Coins size={16} />}
          variant="gold"
        />
        <div className="hidden lg:block">
          <StatCard
            label="Già Riscossi"
            value={redeemedTokens.length}
            icon={<CheckCircle size={16} />}
            variant="success"
          />
        </div>
      </div>

      {/* Unredeemed Tokens */}
      <div>
        <h3 className="text-base sm:text-lg font-serif text-gold mb-3 sm:mb-4 flex items-center gap-2">
          <Ticket size={20} />
          I Miei Gettoni da Riscuotere
        </h3>

        {unredeemed.length === 0 ? (
          <Card variant="dark" className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-ink-700 flex items-center justify-center">
              <Ticket size={32} className="text-cream/30" />
            </div>
            <div className="text-lg sm:text-xl text-cream/60 mb-2">Nessun gettone da riscuotere</div>
            <div className="text-sm text-cream/40">
              Completa dei lavori per ricevere gettoni!
            </div>
          </Card>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {unredeemed.map(token => (
              <Card 
                key={token.id}
                variant="dark"
                padding="sm"
                className="bg-gradient-to-r from-amber-500/10 to-ink-800 border-amber-500/20 hover:border-amber-500/40 transition-all"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Token Icon */}
                  <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-ink-700 flex items-center justify-center text-2xl sm:text-3xl">
                    {token.emoji}
                  </div>

                  {/* Token Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif text-sm sm:text-lg text-cream">{token.name}</span>
                      {token.quality !== 'BASIC' && (
                        <span className={cn(
                          'text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full inline-flex items-center gap-1',
                          token.quality === 'PERFECT' ? 'bg-purple-500/20 text-purple-300' :
                          token.quality === 'EXCELLENT' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-sky-500/20 text-sky-300'
                        )}>
                          <Sparkles size={10} />
                          {QUALITY_LABELS[token.quality].label}
                        </span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-cream/50 mt-0.5 sm:mt-1 flex items-center gap-1">
                      <Clock size={12} />
                      Emesso {formatTimeAgo(token.issuedAt)}
                    </div>
                  </div>

                  {/* Value & Action */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg sm:text-2xl font-mono font-bold text-gold mb-1.5 sm:mb-2">
                      🪙 {token.finalValue}
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => redeemWorkToken(token.id)}
                      icon={Download}
                    >
                      <span className="hidden sm:inline">Riscuoti</span>
                      <span className="sm:hidden">💵</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {/* Redeem All Button */}
            {unredeemed.length > 1 && (
              <Card variant="dark" className="bg-gold/10 border-gold/30">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-cream/60 text-sm">Riscuoti tutti i gettoni</div>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-gold">
                      Totale: 🪙 {totalUnredeemedValue}
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => redeemAllTokens(currentUser.id)}
                    icon={Coins}
                    fullWidth
                    className="sm:w-auto"
                  >
                    RISCUOTI TUTTI
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Recent History */}
      {redeemedTokens.length > 0 && (
        <div>
          <h3 className="text-base sm:text-lg font-serif text-cream/60 mb-3 sm:mb-4 flex items-center gap-2">
            <History size={20} />
            Gettoni Riscossi di Recente
          </h3>
          <div className="space-y-2 opacity-60">
            {redeemedTokens.slice(0, 5).map(token => (
              <Card key={token.id} variant="dark" padding="sm" className="bg-ink-800/30">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-lg sm:text-xl">{token.emoji}</span>
                  <span className="flex-1 text-cream/70 text-sm sm:text-base truncate">{token.name}</span>
                  <span className="text-xs sm:text-sm text-cream/50 hidden sm:block">
                    {token.redeemedAt && formatTimeAgo(token.redeemedAt)}
                  </span>
                  <span className="font-mono text-emerald-400 text-sm sm:text-base">+🪙{token.finalValue}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
