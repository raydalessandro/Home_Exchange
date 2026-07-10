'use client'

import { useStore } from '@/store'
import { getPlayerLevel, isAssetVisible } from '@/lib/levels'
import { TradingCard } from './TradingCard'

export function TradingGrid() {
  const assets = useStore(state => state.assets)
  const currentUser = useStore(state => state.currentUser)

  const level = getPlayerLevel(currentUser)
  const visibleAssets = Object.values(assets).filter(a => isAssetVisible(a, level))

  if (visibleAssets.length === 0) {
    return (
      <p className="text-center text-ink-500 py-10">
        Nessun premio disponibile al momento.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {visibleAssets.map(asset => (
        <TradingCard key={asset.id} asset={asset} />
      ))}
    </div>
  )
}
