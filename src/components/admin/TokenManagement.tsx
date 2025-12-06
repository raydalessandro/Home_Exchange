'use client'

import { useState } from 'react'
import { useStore } from '@/store'
import { useShallow } from 'zustand/react/shallow'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { cn } from '@/lib/cn'
import { QUALITY_LABELS } from '@/types'

type FilterStatus = 'ALL' | 'PENDING' | 'REDEEMED'
type FilterPlayer = string | 'ALL'

export function TokenManagement() {
  const players = useStore(useShallow(state => state.players.filter(p => !p.isBank)))
  const allTokens = useStore(useShallow(state => state.workTokens))
  const revokeWorkToken = useStore(state => state.revokeWorkToken)

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL')
  const [filterPlayer, setFilterPlayer] = useState<FilterPlayer>('ALL')

  const filteredTokens = allTokens.filter(token => {
    if (filterStatus === 'PENDING' && token.redeemed) return false
    if (filterStatus === 'REDEEMED' && !token.redeemed) return false
    if (filterPlayer !== 'ALL' && token.issuedTo !== filterPlayer) return false
    return true
  }).sort((a, b) => b.issuedAt - a.issuedAt)

  const stats = {
    total: allTokens.length,
    pending: allTokens.filter(t => !t.redeemed).length,
    redeemed: allTokens.filter(t => t.redeemed).length,
    totalValue: allTokens.reduce((sum, t) => sum + t.finalValue, 0),
    pendingValue: allTokens.filter(t => !t.redeemed).reduce((sum, t) => sum + t.finalValue, 0),
  }

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
    <div className="space-y-6">
      <h2 className="text-2xl font-display text-gold flex items-center gap-2">
        🎫 Gestione Gettoni
      </h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-ink-800/50 text-center">
          <div className="text-3xl font-mono font-bold text-cream">{stats.total}</div>
          <div className="text-sm text-cream/60">Totali</div>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/30 text-center">
          <div className="text-3xl font-mono font-bold text-amber-400">{stats.pending}</div>
          <div className="text-sm text-cream/60">Pending</div>
        </Card>
        <Card className="bg-emerald-500/10 border-emerald-500/30 text-center">
          <div className="text-3xl font-mono font-bold text-emerald-400">{stats.redeemed}</div>
          <div className="text-sm text-cream/60">Riscossi</div>
        </Card>
        <Card className="bg-gold/10 border-gold/30 text-center">
          <div className="text-3xl font-mono font-bold text-gold">🪙{stats.pendingValue}</div>
          <div className="text-sm text-cream/60">Valore Pending</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-ink-800/50">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <span className="text-cream/60 text-sm self-center">Stato:</span>
            {(['ALL', 'PENDING', 'REDEEMED'] as FilterStatus[]).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'px-3 py-1 rounded text-sm transition-all',
                  filterStatus === status
                    ? 'bg-gold text-ink-900'
                    : 'bg-ink-700 text-cream/70 hover:bg-ink-600'
                )}
              >
                {status === 'ALL' ? 'Tutti' : status === 'PENDING' ? '⏳ Pending' : '✅ Riscossi'}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <span className="text-cream/60 text-sm self-center">Giocatore:</span>
            <select
              value={filterPlayer}
              onChange={e => setFilterPlayer(e.target.value)}
              className="px-3 py-1 bg-ink-700 border border-ink-600 rounded text-cream text-sm focus:border-gold focus:outline-none"
            >
              <option value="ALL">Tutti</option>
              {players.filter(p => !p.isAdmin).map(p => (
                <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Token List */}
      <div className="space-y-2">
        {filteredTokens.length === 0 ? (
          <Card className="bg-ink-800/30 text-center py-8">
            <div className="text-4xl mb-2">🎫</div>
            <div className="text-cream/60">Nessun gettone trovato</div>
          </Card>
        ) : (
          filteredTokens.map(token => {
            const player = players.find(p => p.id === token.issuedTo)
            return (
              <Card 
                key={token.id} 
                className={cn(
                  'flex items-center gap-4',
                  token.redeemed ? 'bg-ink-800/30 opacity-60' : 'bg-ink-800/50'
                )}
              >
                {/* Token Info */}
                <div className="flex-shrink-0 text-3xl">{token.emoji}</div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-cream">{token.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-ink-700 text-cream/60">
                      {QUALITY_LABELS[token.quality].emoji} {QUALITY_LABELS[token.quality].label}
                    </span>
                    {token.redeemed && (
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                        ✅ Riscosso
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-cream/60 mt-1">
                    {player?.emoji} {player?.name} • {formatTimeAgo(token.issuedAt)}
                    {token.redeemed && token.redeemedAt && (
                      <span> • Riscosso {formatTimeAgo(token.redeemedAt)}</span>
                    )}
                  </div>
                </div>

                {/* Value */}
                <div className="text-right">
                  <div className="text-xl font-mono font-bold text-gold">🪙{token.finalValue}</div>
                  {token.qualityMultiplier > 1 && (
                    <div className="text-xs text-cream/40">
                      base: {token.baseValue} × {token.qualityMultiplier}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {!token.redeemed && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => revokeWorkToken(token.id)}
                  >
                    ❌ Revoca
                  </Button>
                )}
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

