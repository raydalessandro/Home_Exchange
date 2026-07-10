'use client'

import { useState } from 'react'
import { useStore } from '@/store'
import type { PlayerLevel } from '@/types'
import { LEVELS } from '@/lib/levels'
import { Card, CardHeader } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { cn } from '@/lib/cn'
import { Palette, Plus, Trash2, Lock, Flame, Eye, EyeOff } from 'lucide-react'

export function AssetManagement() {
  const assets = useStore(state => state.assets)
  const addAsset = useStore(state => state.addAsset)
  const removeAsset = useStore(state => state.removeAsset)
  const setAssetAvailability = useStore(state => state.setAssetAvailability)
  
  const [form, setForm] = useState({
    name: '',
    emoji: '',
    description: '',
    price: '',
    persistent: true,
    totalSupply: '100',
  })

  const handleAddAsset = () => {
    const price = parseInt(form.price)
    const totalSupply = parseInt(form.totalSupply) || 100
    if (form.name && form.emoji && price > 0) {
      addAsset({
        name: form.name,
        emoji: form.emoji,
        description: form.description || form.name,
        price,
        basePrice: price,
        persistent: form.persistent,
        // Supply Management
        totalSupply,
        circulatingSupply: 0,
        bankReserve: totalSupply,
        // Bank Pricing
        bankBuyPrice: price,
        bankSellPrice: Math.round(price * 0.7), // 30% spread default
        buybackEnabled: true,
        // Market Data
        lastP2PPrice: price,
      })
      setForm({ name: '', emoji: '', description: '', price: '', persistent: true, totalSupply: '100' })
    }
  }

  const handleRemoveAsset = (assetId: string) => {
    if (confirm('Eliminare questo asset?')) {
      removeAsset(assetId)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <CardHeader title="Gestione Asset" icon={<Palette size={20} />} />
      
      <Card variant="dark">
        {/* Add Asset Form */}
        <div className="space-y-3 mb-5 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nome Asset"
              className="w-full px-3 py-2.5 bg-ink-700 border border-ink-600 rounded-xl text-cream placeholder-cream/40 focus:border-gold focus:outline-none text-sm"
            />
            <input
              type="text"
              value={form.emoji}
              onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
              placeholder="Emoji (es: 🎯)"
              className="w-full px-3 py-2.5 bg-ink-700 border border-ink-600 rounded-xl text-cream placeholder-cream/40 focus:border-gold focus:outline-none text-sm"
            />
          </div>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Descrizione"
            rows={2}
            className="w-full px-3 py-2.5 bg-ink-700 border border-ink-600 rounded-xl text-cream placeholder-cream/40 focus:border-gold focus:outline-none text-sm resize-none"
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              type="number"
              value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              placeholder="Prezzo"
              min="1"
              className="w-full px-3 py-2.5 bg-ink-700 border border-ink-600 rounded-xl text-cream placeholder-cream/40 focus:border-gold focus:outline-none text-sm font-mono"
            />
            <input
              type="number"
              value={form.totalSupply}
              onChange={e => setForm(f => ({ ...f, totalSupply: e.target.value }))}
              placeholder="Supply"
              min="1"
              className="w-full px-3 py-2.5 bg-ink-700 border border-ink-600 rounded-xl text-cream placeholder-cream/40 focus:border-gold focus:outline-none text-sm font-mono"
            />
            <label className="flex items-center gap-2 cursor-pointer px-3 py-2.5 bg-ink-700 border border-ink-600 rounded-xl">
              <input
                type="checkbox"
                checked={form.persistent}
                onChange={e => setForm(f => ({ ...f, persistent: e.target.checked }))}
                className="w-4 h-4 rounded border-ink-500 text-gold focus:ring-gold"
              />
              <span className="text-sm text-cream/70 flex items-center gap-1">
                <Lock size={14} />
                Persistente
              </span>
            </label>
          </div>
          <Button variant="success" onClick={handleAddAsset} fullWidth icon={Plus}>
            Aggiungi Asset
          </Button>
        </div>

        {/* Asset List */}
        <div>
          <h3 className="text-sm font-medium text-cream/60 mb-2">Asset Esistenti:</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
            {Object.values(assets).map(asset => {
              const isActive = asset.active ?? true
              const minLevel = asset.minLevel ?? 1
              return (
              <div
                key={asset.id}
                className={cn(
                  'flex items-center justify-between p-3 bg-ink-700/50 rounded-xl border border-ink-600',
                  !isActive && 'opacity-40'
                )}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xl sm:text-2xl">{asset.emoji}</span>
                  <div>
                    <span className="font-medium text-cream text-sm sm:text-base">
                      {asset.name}
                      {!isActive && <span className="ml-2 text-xs text-red-400">(archiviato)</span>}
                    </span>
                    <span className="text-gold ml-2 font-mono text-sm">🪙{asset.price}</span>
                  </div>
                  <span className="text-cream/40">
                    {asset.persistent ? <Lock size={14} /> : <Flame size={14} />}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Livello minimo: click per cambiare */}
                  <button
                    onClick={() => setAssetAvailability(asset.id, {
                      minLevel: (minLevel >= 4 ? 1 : minLevel + 1) as PlayerLevel,
                    })}
                    title={`Visibile dal livello ${LEVELS[minLevel].name} in su (click per cambiare)`}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-ink-600 hover:bg-ink-500 text-xs text-cream-100 transition-colors"
                  >
                    {LEVELS[minLevel].emoji} Lv{minLevel}+
                  </button>
                  {/* Attiva/archivia */}
                  <button
                    onClick={() => setAssetAvailability(asset.id, { active: !isActive })}
                    title={isActive ? 'Archivia (nascondi ai bambini)' : 'Riattiva'}
                    className={cn(
                      'w-7 h-7 rounded flex items-center justify-center transition-colors',
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        : 'bg-ink-600 text-cream/40 hover:bg-ink-500'
                    )}
                  >
                    {isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => handleRemoveAsset(asset.id)}
                    icon={Trash2}
                  >
                    <span className="hidden sm:inline">Elimina</span>
                  </Button>
                </div>
              </div>
              )
            })}
          </div>
        </div>
      </Card>
    </div>
  )
}
