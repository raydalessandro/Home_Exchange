'use client'

import { useState } from 'react'
import { useStore } from '@/store'
import { Card, CardHeader } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { cn } from '@/lib/cn'
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  RefreshCw,
  Plus,
  Minus,
  Settings
} from 'lucide-react'

export function AssetSupplyControls() {
  const assets = useStore(state => state.assets)
  const setAssetSupply = useStore(state => state.setAssetSupply)
  const setBankPrices = useStore(state => state.setBankPrices)
  const toggleBuyback = useStore(state => state.toggleBuyback)
  const emitAssetFromBank = useStore(state => state.emitAssetFromBank)

  const [editingAsset, setEditingAsset] = useState<string | null>(null)
  const [buyPrice, setBuyPrice] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [newSupply, setNewSupply] = useState('')

  const handleSavePrices = (assetId: string) => {
    const buy = parseInt(buyPrice)
    const sell = parseInt(sellPrice)
    if (buy > 0) {
      setBankPrices(assetId, buy, Math.max(0, sell || 0))
    }
    setEditingAsset(null)
    setBuyPrice('')
    setSellPrice('')
  }

  const handleSaveSupply = (assetId: string) => {
    const supply = parseInt(newSupply)
    if (supply >= 0) {
      setAssetSupply(assetId, supply)
    }
    setNewSupply('')
  }

  const handleEmit = (assetId: string, quantity: number) => {
    emitAssetFromBank(assetId, quantity)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <CardHeader 
        title="Gestione Supply Asset" 
        icon={<Package className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />}
      />

      {/* Info Box */}
      <Card variant="dark" className="bg-sky-500/5 border-sky-500/20">
        <div className="text-sm">
          <div className="font-semibold text-sky-400 mb-2">Come funziona:</div>
          <ul className="space-y-1 text-cream-100">
            <li>• <strong className="text-cream-50">Supply</strong>: Quantità massima di asset emettibili</li>
            <li>• <strong className="text-cream-50">Riserva Banca</strong>: Asset disponibili per la vendita</li>
            <li>• <strong className="text-cream-50">Prezzo Vendita</strong>: Quanto paga il player per comprare dalla banca</li>
            <li>• <strong className="text-cream-50">Prezzo Riacquisto</strong>: Quanto riceve il player per vendere alla banca</li>
            <li>• Aumenta/riduci supply per controllare l'inflazione</li>
          </ul>
        </div>
      </Card>

      {/* Asset List */}
      <div className="space-y-4">
        {Object.values(assets).map(asset => {
          const circulating = asset.circulatingSupply ?? 0
          const reserve = asset.bankReserve ?? 0
          const total = asset.totalSupply ?? (circulating + reserve)
          const supplyPercent = total > 0 ? (circulating / total) * 100 : 0
          const buybackEnabled = asset.buybackEnabled ?? true
          const isEditing = editingAsset === asset.id

          return (
            <Card key={asset.id} variant="dark" className="border-ink-600">
              {/* Asset Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{asset.emoji}</span>
                  <div>
                    <div className="text-cream-50 font-semibold text-lg">{asset.name}</div>
                    <div className="text-cream-200 text-xs">{asset.description}</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingAsset(isEditing ? null : asset.id)}
                  icon={Settings}
                >
                  {isEditing ? 'Chiudi' : 'Modifica'}
                </Button>
              </div>

              {/* Supply Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-cream-200">Supply</span>
                  <span className="text-cream-100">
                    {circulating} / {total} circolanti ({supplyPercent.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-3 bg-ink-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-gold-500 transition-all"
                    style={{ width: `${supplyPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1 text-cream-300">
                  <span>Riserva Banca: {reserve}</span>
                  <span>In mano ai player: {circulating}</span>
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-ink-800 rounded-lg">
                  <div className="text-xs text-cream-300 mb-1 flex items-center gap-1">
                    <TrendingUp size={12} className="text-emerald-400" />
                    Prezzo Vendita
                  </div>
                  <div className="text-gold-400 font-mono font-bold text-lg">
                    🪙 {asset.bankBuyPrice ?? asset.price}
                  </div>
                </div>
                <div className="p-3 bg-ink-800 rounded-lg">
                  <div className="text-xs text-cream-300 mb-1 flex items-center gap-1">
                    <TrendingDown size={12} className="text-red-400" />
                    Prezzo Riacquisto
                  </div>
                  <div className={cn(
                    'font-mono font-bold text-lg',
                    buybackEnabled ? 'text-amber-400' : 'text-red-400'
                  )}>
                    {buybackEnabled ? `🪙 ${asset.bankSellPrice ?? 0}` : 'Disattivo'}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleEmit(asset.id, 10)}
                  icon={Plus}
                >
                  +10 Supply
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setAssetSupply(asset.id, Math.max(circulating, total - 10))}
                  icon={Minus}
                  disabled={reserve < 10}
                >
                  -10 Supply
                </Button>
                <Button
                  variant={buybackEnabled ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => toggleBuyback(asset.id, !buybackEnabled)}
                  icon={RefreshCw}
                >
                  Riacquisto: {buybackEnabled ? 'ON' : 'OFF'}
                </Button>
              </div>

              {/* Edit Panel */}
              {isEditing && (
                <div className="pt-4 border-t border-ink-600 space-y-4">
                  {/* Price Edit */}
                  <div>
                    <div className="text-sm text-cream-200 mb-2 flex items-center gap-2">
                      <DollarSign size={14} />
                      Modifica Prezzi Banca
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-cream-300">Prezzo Vendita</label>
                        <input
                          type="number"
                          min="1"
                          value={buyPrice}
                          onChange={(e) => setBuyPrice(e.target.value)}
                          placeholder={String(asset.bankBuyPrice ?? asset.price)}
                          className="w-full mt-1 px-3 py-2 bg-ink-800 border border-ink-600 rounded-lg text-cream-50 font-mono focus:border-gold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-cream-300">Prezzo Riacquisto</label>
                        <input
                          type="number"
                          min="0"
                          value={sellPrice}
                          onChange={(e) => setSellPrice(e.target.value)}
                          placeholder={String(asset.bankSellPrice ?? 0)}
                          className="w-full mt-1 px-3 py-2 bg-ink-800 border border-ink-600 rounded-lg text-cream-50 font-mono focus:border-gold focus:outline-none"
                        />
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleSavePrices(asset.id)}
                      disabled={!buyPrice}
                    >
                      Salva Prezzi
                    </Button>
                  </div>

                  {/* Supply Edit */}
                  <div>
                    <div className="text-sm text-cream-200 mb-2 flex items-center gap-2">
                      <Package size={14} />
                      Modifica Supply Totale
                    </div>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        min={circulating}
                        value={newSupply}
                        onChange={(e) => setNewSupply(e.target.value)}
                        placeholder={String(total)}
                        className="flex-1 px-3 py-2 bg-ink-800 border border-ink-600 rounded-lg text-cream-50 font-mono focus:border-gold focus:outline-none"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSaveSupply(asset.id)}
                        disabled={!newSupply}
                      >
                        Applica
                      </Button>
                    </div>
                    <div className="text-xs text-cream-300 mt-1">
                      Min: {circulating} (asset già in circolazione)
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

