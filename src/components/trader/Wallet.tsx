'use client'

import { useMemo } from 'react'
import { useStore } from '@/store'
import { useShallow } from 'zustand/react/shallow'
import { getFeatures, getPlayerLevel } from '@/lib/levels'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import { 
  Wallet as WalletIcon, 
  Package, 
  Ticket, 
  ArrowLeftRight, 
  ChevronRight,
  Sparkles
} from 'lucide-react'

export function Wallet() {
  const currentUser = useStore(state => state.currentUser)
  const assets = useStore(state => state.assets)
  const openModal = useStore(state => state.openModal)
  const setTraderTab = useStore(state => state.setTraderTab)
  const workTokens = useStore(useShallow(state => state.workTokens))
  
  const { unredeemedTokens, unredeemedValue } = useMemo(() => {
    if (!currentUser) return { unredeemedTokens: [], unredeemedValue: 0 }
    const unredeemed = workTokens.filter(t => t.issuedTo === currentUser.id && !t.redeemed)
    return {
      unredeemedTokens: unredeemed,
      unredeemedValue: unredeemed.reduce((sum, t) => sum + t.finalValue, 0),
    }
  }, [workTokens, currentUser])
  
  const portfolioValue = useMemo(() => {
    if (!currentUser) return 0
    return Object.entries(currentUser.holdings).reduce((total, [assetId, qty]) => {
      const asset = assets[assetId]
      return total + (asset ? asset.price * qty : 0)
    }, 0)
  }, [currentUser, assets])

  if (!currentUser) return null

  const features = getFeatures(getPlayerLevel(currentUser))
  const holdings = Object.entries(currentUser.holdings).filter(([, qty]) => qty > 0)
  const totalNetWorth = currentUser.balance + portfolioValue

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Wallet Card */}
      <div className="wallet-card">
        <div className="flex items-center gap-2 text-gold-400 text-sm font-medium mb-1">
          <WalletIcon size={16} />
          PORTAFOGLIO
        </div>
        <div className="text-3xl sm:text-4xl font-bold font-mono mb-3 sm:mb-4">
          🪙 {currentUser.balance}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
          <div className="bg-white/5 rounded-xl p-2.5 sm:p-3">
            <div className="flex items-center gap-1.5 text-cream/60 mb-1">
              <Package size={14} />
              <span>Portfolio</span>
            </div>
            <span className="font-mono text-base sm:text-lg">🪙 {portfolioValue}</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 sm:p-3">
            <div className="text-cream/60 mb-1">Totale</div>
            <span className="font-mono text-base sm:text-lg text-gold">
              🪙 {totalNetWorth}
            </span>
          </div>
        </div>

        {/* Pending Tokens Alert */}
        {unredeemedTokens.length > 0 && (
          <button
            onClick={() => setTraderTab('tokens')}
            className="mt-3 sm:mt-4 w-full p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl text-left hover:bg-amber-500/30 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-amber-300 font-medium flex items-center gap-2 text-sm sm:text-base">
                  <Ticket size={16} />
                  {unredeemedTokens.length} Gettoni da Riscuotere
                  <Sparkles size={14} className="animate-pulse" />
                </div>
                <div className="text-amber-400/70 text-xs sm:text-sm mt-0.5">
                  Valore: 🪙 {unredeemedValue}
                </div>
              </div>
              <ChevronRight size={18} className="text-amber-300 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        )}

        {/* Holdings */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20">
          <div className="font-medium mb-2 flex items-center gap-2 text-sm">
            <Package size={16} />
            I Miei Asset
          </div>
          {holdings.length === 0 ? (
            <p className="text-cream/40 text-sm">Nessun asset</p>
          ) : (
            <div className="space-y-2">
              {holdings.map(([assetId, qty]) => {
                const asset = assets[assetId]
                if (!asset) return null
                return (
                  <div
                    key={assetId}
                    className="flex justify-between items-center text-sm bg-white/5 rounded-lg p-2"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{asset.emoji}</span>
                      <span className="text-cream/80">{asset.name}</span>
                    </span>
                    <span className="font-mono text-gold">
                      {qty} × 🪙{asset.price}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* P2P Trading Button */}
      {features.canP2P && (
      <Card variant="dark" padding="md">
        <div className="flex items-center gap-2 font-medium text-cream mb-3 text-sm">
          <ArrowLeftRight size={16} className="text-gold" />
          Trading P2P
        </div>
        <Button
          onClick={() => openModal('p2p')}
          fullWidth
          size="md"
          disabled={holdings.length === 0}
          icon={ArrowLeftRight}
        >
          Scambia con Altri
        </Button>
        {holdings.length === 0 && (
          <p className="text-xs text-cream/40 mt-2 text-center">
            Acquista asset per abilitare il trading P2P
          </p>
        )}
      </Card>
      )}
    </div>
  )
}
