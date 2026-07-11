'use client'

import { useStore } from '@/store'
import type { Asset } from '@/types'
import { getFeatures, getPlayerLevel } from '@/lib/levels'
import { Button } from '@/components/shared/Button'
import { cn } from '@/lib/cn'
import { ShoppingCart, Coins, Lock, Flame, Package, Ban } from 'lucide-react'

interface TradingCardProps {
  asset: Asset
}

export function TradingCard({ asset }: TradingCardProps) {
  const currentUser = useStore(state => state.currentUser)
  const openModal = useStore(state => state.openModal)

  if (!currentUser) return null

  const features = getFeatures(getPlayerLevel(currentUser))
  const owned = currentUser.holdings[asset.id] ?? 0
  const bankReserve = asset.bankReserve ?? Infinity
  const buybackEnabled = asset.buybackEnabled ?? true
  const bankBuyPrice = asset.bankBuyPrice ?? asset.price
  const bankSellPrice = asset.bankSellPrice ?? 0
  const totalSupply = asset.totalSupply ?? Infinity
  const circulatingSupply = asset.circulatingSupply ?? 0

  const canBuy = currentUser.balance >= bankBuyPrice && bankReserve > 0
  const canSell = owned > 0 && buybackEnabled

  const isOutOfStock = bankReserve <= 0
  const supplyPercent = totalSupply > 0 ? (circulatingSupply / totalSupply) * 100 : 0

  return (
    <div className={cn(
      "card p-3 sm:p-4 hover:shadow-card-hover transition-all group",
      isOutOfStock && "opacity-75"
    )}>
      {/* Asset Icon */}
      <div className="text-center mb-2 sm:mb-3 relative">
        <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform inline-block">
          {asset.emoji}
        </span>
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              ESAURITO
            </span>
          </div>
        )}
      </div>

      {/* Asset Name */}
      <h3 className="font-serif text-base sm:text-lg text-center text-ink-800 mb-1.5 sm:mb-2 line-clamp-1">
        {asset.name}
      </h3>

      {/* Price - Buy/Sell */}
      <div className="text-center mb-2 sm:mb-3 space-y-1">
        <div className="flex items-center justify-center gap-3">
          <div className="text-center">
            <div className="text-[10px] text-emerald-600 font-medium">Compra</div>
            <span className="text-lg sm:text-xl font-bold font-mono text-emerald-600">
              🪙{bankBuyPrice}
            </span>
          </div>
          {features.canSell && (
            <>
              <div className="text-ink-300">/</div>
              <div className="text-center">
                <div className="text-[10px] text-amber-600 font-medium">Vendi</div>
                <span className={cn(
                  "text-lg sm:text-xl font-bold font-mono",
                  buybackEnabled ? "text-amber-600" : "text-ink-400 line-through"
                )}>
                  🪙{buybackEnabled ? bankSellPrice : '-'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Supply Info */}
      {features.showMarketDetails && (
        <div className="mb-2 sm:mb-3">
          <div className="flex items-center justify-center gap-1 text-[10px] text-ink-500 mb-1">
            <Package size={10} />
            <span>Disponibili: {bankReserve} / {totalSupply}</span>
          </div>
          <div className="h-1.5 bg-ink-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-gold-500 transition-all"
              style={{ width: `${supplyPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Description */}
      <p className="text-xs sm:text-sm text-ink-500 text-center mb-2 sm:mb-3 line-clamp-2">
        {asset.description}
      </p>

      {/* Holdings Info */}
      <div className="text-center text-xs sm:text-sm text-ink-600 mb-3 sm:mb-4 space-y-1">
        <div className="flex items-center justify-center gap-2">
          <span className="text-ink-400">Possiedi:</span>
          <strong className="font-mono text-ink-700">{owned}</strong>
        </div>
        {features.showMarketDetails && (
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
            {!buybackEnabled && (
              <>
                <span className="mx-1">•</span>
                <Ban size={12} className="text-red-400" />
                <span className="text-red-400">No riacquisto</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className={cn('grid gap-2', features.canSell ? 'grid-cols-2' : 'grid-cols-1')}>
        <Button
          variant="success"
          size="sm"
          disabled={!canBuy}
          onClick={() => openModal('trade', { assetId: asset.id, action: 'BUY' })}
          icon={ShoppingCart}
        >
          Compra
        </Button>
        {features.canSell && (
          <Button
            variant="secondary"
            size="sm"
            disabled={!canSell}
            onClick={() => openModal('trade', { assetId: asset.id, action: 'SELL' })}
            icon={Coins}
          >
            Vendi
          </Button>
        )}
      </div>
    </div>
  )
}
