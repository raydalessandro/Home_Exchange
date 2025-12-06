'use client'

import { useMemo } from 'react'
import { useStore, useEconomicMetrics } from '@/store'
import { useShallow } from 'zustand/react/shallow'
import { Card } from '@/components/shared/Card'

export function TraderStats() {
  const currentUser = useStore(state => state.currentUser)
  const assets = useStore(state => state.assets)
  const workTokens = useStore(useShallow(state => state.workTokens))
  const tradeHistory = useStore(useShallow(state => state.tradeHistory))
  const metrics = useEconomicMetrics()
  
  const { portfolioValue, playerTokens } = useMemo(() => {
    if (!currentUser) return { portfolioValue: 0, playerTokens: [] }
    
    const pValue = Object.entries(currentUser.holdings).reduce((total, [assetId, qty]) => {
      const asset = assets[assetId]
      return total + (asset ? asset.price * qty : 0)
    }, 0)
    
    return {
      portfolioValue: pValue,
      playerTokens: workTokens.filter(t => t.issuedTo === currentUser.id),
    }
  }, [currentUser, assets, workTokens])

  if (!currentUser) return null

  const myTrades = tradeHistory.filter(t => t.playerId === currentUser.id)
  const totalEarned = playerTokens.filter(t => t.redeemed).reduce((sum, t) => sum + t.finalValue, 0)
  const netWorth = currentUser.balance + portfolioValue

  return (
    <div className="space-y-6">
      {/* Personal Stats */}
      <div>
        <h3 className="text-lg font-display text-gold mb-4">📊 Le Mie Statistiche</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-gold/20 to-ink-800 text-center">
            <div className="text-3xl font-mono font-bold text-gold">🪙 {netWorth}</div>
            <div className="text-sm text-cream/60 mt-1">Patrimonio Totale</div>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/20 to-ink-800 text-center">
            <div className="text-3xl font-mono font-bold text-emerald-400">{myTrades.length}</div>
            <div className="text-sm text-cream/60 mt-1">Trade Effettuati</div>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/20 to-ink-800 text-center">
            <div className="text-3xl font-mono font-bold text-amber-400">{playerTokens.length}</div>
            <div className="text-sm text-cream/60 mt-1">Gettoni Ricevuti</div>
          </Card>
          <Card className="bg-gradient-to-br from-sky-500/20 to-ink-800 text-center">
            <div className="text-3xl font-mono font-bold text-sky-400">🪙 {totalEarned}</div>
            <div className="text-sm text-cream/60 mt-1">Guadagnato Lavori</div>
          </Card>
        </div>
      </div>

      {/* Holdings Breakdown */}
      <Card className="bg-ink-800/50">
        <h3 className="text-lg font-display text-cream mb-4">💼 I Miei Asset</h3>
        <div className="space-y-3">
          {Object.entries(currentUser.holdings).filter(([, qty]) => qty > 0).length === 0 ? (
            <div className="text-center py-8 text-cream/50">
              Non possiedi ancora nessun asset
            </div>
          ) : (
            Object.entries(currentUser.holdings)
              .filter(([, qty]) => qty > 0)
              .map(([assetId, qty]) => {
                const assets = useStore.getState().assets
                const asset = assets[assetId]
                if (!asset) return null
                return (
                  <div key={assetId} className="flex items-center gap-4 p-3 bg-ink-700/50 rounded-lg">
                    <span className="text-2xl">{asset.emoji}</span>
                    <div className="flex-1">
                      <div className="font-medium text-cream">{asset.name}</div>
                      <div className="text-sm text-cream/50">{asset.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-lg text-cream">×{qty}</div>
                      <div className="text-sm text-gold">🪙 {asset.price * qty}</div>
                    </div>
                  </div>
                )
              })
          )}
        </div>
      </Card>

      {/* Market Overview */}
      <Card className="bg-ink-800/50">
        <h3 className="text-lg font-display text-cream mb-4">🏛️ Stato del Mercato</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-3 bg-ink-700/50 rounded-lg">
            <div className="text-cream/60 text-sm">Inflazione</div>
            <div className={`text-xl font-mono font-bold ${
              metrics.inflation > 10 ? 'text-red-400' : 
              metrics.inflation > 0 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {metrics.inflation > 0 ? '+' : ''}{metrics.inflation}%
            </div>
          </div>
          <div className="p-3 bg-ink-700/50 rounded-lg">
            <div className="text-cream/60 text-sm">Money Supply (M2)</div>
            <div className="text-xl font-mono font-bold text-cream">🪙 {metrics.M2}</div>
          </div>
          <div className="p-3 bg-ink-700/50 rounded-lg">
            <div className="text-cream/60 text-sm">Valore Asset</div>
            <div className="text-xl font-mono font-bold text-cream">🪙 {metrics.totalAssetValue}</div>
          </div>
        </div>
      </Card>

      {/* Tips */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-ink-800 border-purple-500/20">
        <h3 className="text-lg font-display text-purple-300 mb-3">💡 Suggerimenti</h3>
        <ul className="space-y-2 text-sm text-cream/70">
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>Completa lavori domestici per guadagnare gettoni</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>Investi nei Time Credits per tempo libero extra</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>Tieni d&apos;occhio l&apos;inflazione: se è alta, i tuoi soldi valgono meno!</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>Diversifica: non mettere tutti i tuoi coins in un solo asset</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}

