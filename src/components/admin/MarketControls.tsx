'use client'

import { useState } from 'react'
import { useStore } from '@/store'
import { Card, CardHeader } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { Settings, TrendingDown, TrendingUp, PartyPopper, Send, Megaphone } from 'lucide-react'

export function MarketControls() {
  const assets = useStore(state => state.assets)
  const setAssetPrice = useStore(state => state.setAssetPrice)
  const triggerMarketEvent = useStore(state => state.triggerMarketEvent)
  const sendAnnouncement = useStore(state => state.sendAnnouncement)
  
  const [selectedAsset, setSelectedAsset] = useState<string>(Object.keys(assets)[0] ?? '')
  const [newPrice, setNewPrice] = useState('')
  const [announcement, setAnnouncement] = useState('')

  const handleSetPrice = () => {
    const price = parseInt(newPrice)
    if (selectedAsset && price > 0) {
      setAssetPrice(selectedAsset, price)
      setNewPrice('')
    }
  }

  const handleAnnouncement = () => {
    if (announcement.trim()) {
      sendAnnouncement(announcement)
      setAnnouncement('')
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <CardHeader title="Controlli Market Maker" icon={<Settings size={20} />} />
      
      <Card variant="dark">
        {/* Price Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div>
            <label className="block text-sm font-medium text-cream/70 mb-1.5">
              Asset
            </label>
            <select
              value={selectedAsset}
              onChange={e => setSelectedAsset(e.target.value)}
              className="w-full px-3 py-2.5 bg-ink-700 border border-ink-600 rounded-xl text-cream focus:border-gold focus:outline-none text-sm"
            >
              {Object.values(assets).map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.emoji} {asset.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-cream/70 mb-1.5">
              Nuovo Prezzo
            </label>
            <input
              type="number"
              value={newPrice}
              onChange={e => setNewPrice(e.target.value)}
              placeholder="Prezzo"
              min="1"
              className="w-full px-3 py-2.5 bg-ink-700 border border-ink-600 rounded-xl text-cream placeholder-cream/40 focus:border-gold focus:outline-none text-sm font-mono"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSetPrice} fullWidth size="md">
              Imposta Prezzo
            </Button>
          </div>
        </div>

        {/* Market Events */}
        <div className="mb-5 sm:mb-6">
          <label className="block text-sm font-medium text-cream/70 mb-2">
            Eventi di Mercato
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={() => triggerMarketEvent('CRASH')}
              icon={TrendingDown}
            >
              CRASH (-30%)
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={() => triggerMarketEvent('BOOM')}
              icon={TrendingUp}
            >
              BOOM (+40%)
            </Button>
            <Button
              size="sm"
              onClick={() => triggerMarketEvent('WEEKEND')}
              icon={PartyPopper}
            >
              WEEKEND
            </Button>
          </div>
        </div>

        {/* Oracle Announcement */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-cream/70 mb-1.5">
            <Megaphone size={16} />
            Annuncio Oracle
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={announcement}
              onChange={e => setAnnouncement(e.target.value)}
              placeholder="Es: Domani pizza party!"
              className="flex-1 px-3 py-2.5 bg-ink-700 border border-ink-600 rounded-xl text-cream placeholder-cream/40 focus:border-gold focus:outline-none text-sm"
              onKeyDown={e => e.key === 'Enter' && handleAnnouncement()}
            />
            <Button onClick={handleAnnouncement} icon={Send}>
              Invia
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
