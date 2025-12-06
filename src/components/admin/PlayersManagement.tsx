'use client'

import { useMemo } from 'react'
import { useStore } from '@/store'
import { Card, CardHeader } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { Users, Plus, Minus, Wallet, Package, Coins } from 'lucide-react'

function PlayerCard({ player }: { player: { id: string; name: string; emoji: string; balance: number } }) {
  const giveMoney = useStore(state => state.giveMoney)
  const takeMoney = useStore(state => state.takeMoney)
  const assets = useStore(state => state.assets)
  const allPlayers = useStore(state => state.players)
  
  const portfolioValue = useMemo(() => {
    const p = allPlayers.find(pl => pl.id === player.id)
    if (!p) return 0
    return Object.entries(p.holdings).reduce((total, [assetId, qty]) => {
      const asset = assets[assetId]
      return total + (asset ? asset.price * qty : 0)
    }, 0)
  }, [allPlayers, player.id, assets])

  return (
    <div className="p-3 sm:p-4 bg-ink-700/50 rounded-xl border border-ink-600">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl">{player.emoji}</span>
          <span className="font-medium text-cream text-sm sm:text-base">{player.name}</span>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-xs sm:text-sm">
        <div className="bg-ink-800/50 rounded-lg p-2 text-center">
          <Wallet size={14} className="mx-auto mb-1 text-cream/50" />
          <div className="font-mono text-gold">🪙{player.balance}</div>
        </div>
        <div className="bg-ink-800/50 rounded-lg p-2 text-center">
          <Package size={14} className="mx-auto mb-1 text-cream/50" />
          <div className="font-mono text-cream/80">🪙{portfolioValue}</div>
        </div>
        <div className="bg-ink-800/50 rounded-lg p-2 text-center">
          <Coins size={14} className="mx-auto mb-1 text-cream/50" />
          <div className="font-mono text-emerald-400">🪙{player.balance + portfolioValue}</div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="success"
          size="sm"
          onClick={() => giveMoney(player.id, 50)}
          icon={Plus}
        >
          <span className="hidden sm:inline">Aggiungi</span> 50
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => takeMoney(player.id, 30)}
          icon={Minus}
        >
          <span className="hidden sm:inline">Togli</span> 30
        </Button>
      </div>
    </div>
  )
}

export function PlayersManagement() {
  const allPlayers = useStore(state => state.players)
  const players = useMemo(() => allPlayers.filter(p => !p.isBank), [allPlayers])

  return (
    <div className="space-y-4 sm:space-y-6">
      <CardHeader title="Giocatori" icon={<Users size={20} />} />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {players.map(player => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  )
}
