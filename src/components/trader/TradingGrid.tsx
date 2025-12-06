'use client'

import { useStore } from '@/store'
import { TradingCard } from './TradingCard'

export function TradingGrid() {
  const assets = useStore(state => state.assets)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Object.values(assets).map(asset => (
        <TradingCard key={asset.id} asset={asset} />
      ))}
    </div>
  )
}

