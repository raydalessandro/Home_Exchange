'use client'

import { useMemo, useState } from 'react'
import { useStore } from '@/store'
import { useShallow } from 'zustand/react/shallow'
import { getPlayerLevel, isAssetVisible } from '@/lib/levels'
import { cn } from '@/lib/cn'

/**
 * Schermata semplificata per i bambini piccoli (livello 1 - Germoglio).
 * Niente tab, niente numeri complicati: salvadanaio, gettoni da riscuotere
 * con un bottone gigante, negozio a un tocco e "le mie cose".
 */
export function KidView() {
  const currentUser = useStore(state => state.currentUser)
  const assets = useStore(state => state.assets)
  const workTokens = useStore(useShallow(state => state.workTokens))
  const redeemWorkToken = useStore(state => state.redeemWorkToken)
  const redeemAllTokens = useStore(state => state.redeemAllTokens)
  const executeTrade = useStore(state => state.executeTrade)
  const showToast = useStore(state => state.showToast)
  const isLoading = useStore(state => state.isLoading)

  const [buyingAssetId, setBuyingAssetId] = useState<string | null>(null)

  const unredeemed = useMemo(() => {
    if (!currentUser) return []
    return workTokens.filter(t => t.issuedTo === currentUser.id && !t.redeemed)
  }, [workTokens, currentUser])

  const shopAssets = useMemo(() => {
    if (!currentUser) return []
    const level = getPlayerLevel(currentUser)
    return Object.values(assets).filter(a => isAssetVisible(a, level))
  }, [assets, currentUser])

  if (!currentUser) return null

  const totalUnredeemed = unredeemed.reduce((sum, t) => sum + t.finalValue, 0)
  const myThings = Object.entries(currentUser.holdings)
    .filter(([, qty]) => qty > 0)
    .flatMap(([assetId, qty]) => {
      const asset = assets[assetId]
      return asset ? [{ asset, qty }] : []
    })

  const handleBuy = async (assetId: string) => {
    if (isLoading) return
    setBuyingAssetId(assetId)
    const result = await executeTrade({
      playerId: currentUser.id,
      assetId,
      quantity: 1,
      type: 'BUY',
    })
    setBuyingAssetId(null)
    const asset = assets[assetId]
    if (result.ok && asset) {
      showToast({ message: `Evviva! Hai comprato ${asset.emoji} ${asset.name}!`, type: 'success' })
    } else if (!result.ok) {
      showToast({ message: 'Ops, non è andata! Riprova.', type: 'error' })
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Saluto */}
      <div className="text-center pt-2">
        <div className="text-6xl mb-2">{currentUser.emoji}</div>
        <h1 className="font-serif text-2xl sm:text-3xl text-ink-800">
          Ciao {currentUser.name}!
        </h1>
      </div>

      {/* Salvadanaio */}
      <div className="wallet-card text-center py-6 sm:py-8">
        <div className="text-5xl mb-2">🐷</div>
        <div className="text-cream/70 text-lg mb-1">Il mio salvadanaio</div>
        <div className="text-5xl sm:text-6xl font-bold font-mono text-gold">
          🪙 {currentUser.balance}
        </div>
      </div>

      {/* Gettoni da riscuotere */}
      {unredeemed.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl text-gold text-center">
            🎫 I miei gettoni
          </h2>
          {unredeemed.map(token => (
            <div
              key={token.id}
              className="bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl p-4 sm:p-5 flex items-center gap-4"
            >
              <span className="text-5xl flex-shrink-0">{token.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-ink-800 text-lg font-medium truncate">{token.name}</div>
                <div className="text-amber-600 font-mono text-2xl font-bold">🪙 {token.finalValue}</div>
              </div>
              <button
                onClick={() => redeemWorkToken(token.id)}
                className="flex-shrink-0 bg-gold text-ink-900 font-bold text-lg rounded-2xl px-5 py-4 shadow-lg shadow-gold/30 active:scale-95 transition-all"
              >
                🐷 Metti!
              </button>
            </div>
          ))}
          {unredeemed.length > 1 && (
            <button
              onClick={() => redeemAllTokens(currentUser.id)}
              className="w-full bg-gold text-ink-900 font-bold text-xl rounded-3xl py-5 shadow-lg shadow-gold/30 active:scale-95 transition-all"
            >
              🐷 Metti tutto nel salvadanaio! (🪙 {totalUnredeemed})
            </button>
          )}
        </div>
      )}

      {/* Negozio */}
      <div className="space-y-3">
        <h2 className="font-serif text-xl sm:text-2xl text-gold text-center">
          🏪 Il negozio
        </h2>
        {shopAssets.length === 0 ? (
          <p className="text-center text-ink-500 py-6">Il negozio è vuoto per ora!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shopAssets.map(asset => {
              const price = asset.bankBuyPrice ?? asset.price
              const outOfStock = (asset.bankReserve ?? Infinity) <= 0
              const canAfford = currentUser.balance >= price
              const missing = price - currentUser.balance
              const disabled = outOfStock || !canAfford || isLoading

              return (
                <div
                  key={asset.id}
                  className={cn(
                    'card p-4 sm:p-5 text-center space-y-2',
                    (outOfStock || !canAfford) && 'opacity-60'
                  )}
                >
                  <div className="text-6xl">{asset.emoji}</div>
                  <div className="font-serif text-lg text-ink-800">{asset.name}</div>
                  <div className="text-sm text-ink-500">{asset.description}</div>
                  <button
                    onClick={() => handleBuy(asset.id)}
                    disabled={disabled}
                    className={cn(
                      'w-full font-bold text-lg rounded-2xl py-4 transition-all',
                      disabled
                        ? 'bg-ink-200 text-ink-400 cursor-not-allowed'
                        : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 active:scale-95'
                    )}
                  >
                    {buyingAssetId === asset.id
                      ? '...'
                      : outOfStock
                        ? 'Finito 😢'
                        : canAfford
                          ? `Compra 🪙 ${price}`
                          : `Mancano 🪙 ${missing}`}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Le mie cose */}
      {myThings.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl text-gold text-center">
            🎁 Le mie cose
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {myThings.map(({ asset, qty }) => (
              <div
                key={asset.id}
                className="bg-ink-800/60 border border-ink-600 rounded-2xl px-4 py-3 flex items-center gap-2"
              >
                <span className="text-3xl">{asset.emoji}</span>
                <span className="text-cream text-lg font-bold">× {qty}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
