'use client'

import { useMemo } from 'react'
import { useStore } from '@/store'
import type { Player } from '@/types'
import { ALL_LEVELS, LEVELS, getPlayerLevel } from '@/lib/levels'
import { Card, CardHeader } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { cn } from '@/lib/cn'
import { Users, Plus, Minus, Wallet, Package, Coins, Crown } from 'lucide-react'

function PlayerCard({ player }: { player: Player }) {
  const giveMoney = useStore(state => state.giveMoney)
  const takeMoney = useStore(state => state.takeMoney)
  const setPlayerLevel = useStore(state => state.setPlayerLevel)
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

  const currentLevel = getPlayerLevel(player)

  return (
    <div className="p-3 sm:p-4 bg-ink-700/50 rounded-xl border border-ink-600">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl">{player.emoji}</span>
          <span className="font-medium text-cream text-sm sm:text-base">{player.name}</span>
        </div>
        {player.isAdmin ? (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gold/20 text-gold">
            <Crown size={12} />
            Admin
          </span>
        ) : (
          <span className="text-xs text-cream/50">
            {LEVELS[currentLevel].emoji} {LEVELS[currentLevel].name}
          </span>
        )}
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

      {/* Level Selector - solo per i figli */}
      {!player.isAdmin && (
        <div className="mb-3">
          <div className="text-xs text-cream/50 mb-1.5">Livello di crescita:</div>
          <div className="grid grid-cols-4 gap-1.5">
            {ALL_LEVELS.map(level => {
              const info = LEVELS[level]
              const isActive = currentLevel === level
              return (
                <button
                  key={level}
                  onClick={() => setPlayerLevel(player.id, level)}
                  title={`${info.name} (${info.ageHint}): ${info.description}`}
                  className={cn(
                    'flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[10px] transition-all',
                    isActive
                      ? 'bg-gold text-ink-900 font-bold shadow-lg shadow-gold/20'
                      : 'bg-ink-800/50 text-cream/60 hover:bg-ink-600 active:scale-95'
                  )}
                >
                  <span className="text-base leading-none">{info.emoji}</span>
                  <span>{info.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

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

      {/* Legenda livelli */}
      <Card variant="dark" className="bg-ink-800 border-sky-500/30">
        <div className="text-sm">
          <div className="font-semibold text-sky-400 mb-2">Livelli di crescita:</div>
          <ul className="space-y-1 text-cream-100">
            {ALL_LEVELS.map(level => {
              const info = LEVELS[level]
              return (
                <li key={level}>
                  {info.emoji} <strong className="text-cream-50">{info.name}</strong>{' '}
                  <span className="text-cream/50">({info.ageHint})</span> — {info.description}
                </li>
              )
            })}
          </ul>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {players.map(player => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  )
}
