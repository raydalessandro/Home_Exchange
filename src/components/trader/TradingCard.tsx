'use client'

import { useStore } from '@/store'
import type { Asset } from '@/types'
import { Button } from '@/components/shared/Button'
import { ShoppingCart, Coins, Lock, Flame } from 'lucide-react'

interface TradingCardProps {
  asset: Asset
}

export function TradingCard({ asset }: TradingCardProps) {
  const currentUser = useStore(state => state.currentUser)
  const openModal = useStore(state => state.openModal)

  if (!currentUser) return null

  const owned = currentUser.holdings[asset.id] ?? 0
  const canBuy = currentUser.balance >= asset.price
  const canSell = owned > 0

  return (
    <div className="card p-3 sm:p-4 hover:shadow-card-hover transition-all group">
      {/* Asset Icon */}
      <div className="text-center mb-2 sm:mb-3">
        <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform inline-block">
          {asset.emoji}
        </span>
      </div>

      {/* Asset Name */}
      <h3 className="font-serif text-base sm:text-lg text-center text-ink-800 mb-1.5 sm:mb-2 line-clamp-1">
        {asset.name}
      </h3>

      {/* Price */}
      <div className="text-center mb-2 sm:mb-3">
        <span className="text-xl sm:text-2xl font-bold font-mono text-gold-600">
          🪙 {asset.price}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs sm:text-sm text-ink-500 text-center mb-3 sm:mb-4 line-clamp-2">
        {asset.description}
      </p>

      {/* Holdings Info */}
      <div className="text-center text-xs sm:text-sm text-ink-600 mb-3 sm:mb-4 space-y-1">
        <div className="flex items-center justify-center gap-2">
          <span className="text-ink-400">Possiedi:</span>
          <strong className="font-mono text-ink-700">{owned}</strong>
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-ink-400">Valore:</span>
          <strong className="font-mono text-gold-600">🪙{owned * asset.price}</strong>
        </div>
        <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs text-ink-400">
          {asset.persistent ? (
            <>
              <Lock size={12} />
              <span>Persistente</span>
            </>
          ) : (
            <>
              <Flame size={12} />
              <span>Consumabile</span>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="success"
          size="sm"
          disabled={!canBuy}
          onClick={() => openModal('trade', { assetId: asset.id, action: 'BUY' })}
          icon={ShoppingCart}
        >
          Compra
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!canSell}
          onClick={() => openModal('trade', { assetId: asset.id, action: 'SELL' })}
          icon={Coins}
        >
          Vendi
        </Button>
      </div>
    </div>
  )
}
