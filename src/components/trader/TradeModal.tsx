'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/shared/Button'
import { isErr } from '@/utils/result'
import { getErrorMessage } from '@/types/errors'

export function TradeModal() {
  const { 
    modal, 
    closeModal, 
    currentUser, 
    assets, 
    executeTrade, 
    isLoading,
    showToast 
  } = useStore()

  const [quantity, setQuantity] = useState(1)

  const isOpen = modal.isOpen && modal.type === 'trade'
  const assetId = modal.data?.assetId as string | undefined
  const action = modal.data?.action as 'BUY' | 'SELL' | undefined

  const asset = assetId ? assets[assetId] : undefined

  // Reset quantity when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuantity(1)
    }
  }, [isOpen])

  if (!isOpen || !asset || !currentUser || !action) return null

  const owned = currentUser.holdings[asset.id] ?? 0
  const maxQuantity = action === 'BUY' 
    ? Math.floor(currentUser.balance / asset.price) 
    : owned
  const totalAmount = asset.price * quantity
  const isBuy = action === 'BUY'

  const handleQuantityChange = (delta: number) => {
    setQuantity(q => Math.max(1, Math.min(q + delta, maxQuantity)))
  }

  const handleExecute = async () => {
    const result = await executeTrade({
      playerId: currentUser.id,
      assetId: asset.id,
      quantity,
      type: action,
    })

    if (isErr(result)) {
      showToast({
        message: getErrorMessage(result.error),
        type: 'error',
      })
    } else {
      showToast({
        message: `${isBuy ? 'Acquistato' : 'Venduto'} ${quantity}× ${asset.emoji} ${asset.name}!`,
        type: 'success',
      })
      closeModal()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={`${isBuy ? '🛒 COMPRA' : '💰 VENDI'} ${asset.name}`}
    >
      {/* Quantity Selector */}
      <div className="flex items-center justify-center gap-4 my-6">
        <button
          onClick={() => handleQuantityChange(-1)}
          disabled={quantity <= 1}
          className="w-12 h-12 rounded-full bg-gold-500 text-white text-2xl
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-gold-600 transition-colors"
        >
          −
        </button>
        <input
          type="number"
          value={quantity}
          onChange={e => {
            const val = parseInt(e.target.value) || 1
            setQuantity(Math.max(1, Math.min(val, maxQuantity)))
          }}
          className="w-24 text-center text-3xl font-bold font-mono
                     border-2 border-gold-500 rounded-lg p-2"
        />
        <button
          onClick={() => handleQuantityChange(1)}
          disabled={quantity >= maxQuantity}
          className="w-12 h-12 rounded-full bg-gold-500 text-white text-2xl
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-gold-600 transition-colors"
        >
          +
        </button>
      </div>

      {/* Trade Summary */}
      <div className="bg-cream-100 rounded-lg p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-ink-600">Prezzo unitario:</span>
          <span className="font-mono">🪙 {asset.price}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-600">Quantità:</span>
          <span className="font-mono">{quantity}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-600">{isBuy ? 'Il tuo cash:' : 'Riceverai:'}</span>
          <span className="font-mono">🪙 {isBuy ? currentUser.balance : totalAmount}</span>
        </div>
        <div className="flex justify-between pt-3 mt-3 border-t border-ink-200">
          <span className="text-lg font-bold text-ink-800">TOTALE:</span>
          <span className="text-lg font-bold font-mono text-gold-600">
            🪙 {totalAmount}
          </span>
        </div>
      </div>

      {/* Insufficient funds warning */}
      {isBuy && totalAmount > currentUser.balance && (
        <p className="text-red-500 text-sm text-center mt-3">
          ⚠️ Fondi insufficienti
        </p>
      )}

      {/* Action Buttons */}
      <div className="mt-6 space-y-2">
        <Button
          variant={isBuy ? 'success' : 'primary'}
          className="w-full"
          onClick={handleExecute}
          disabled={
            isLoading || 
            quantity <= 0 || 
            (isBuy && totalAmount > currentUser.balance) ||
            (!isBuy && quantity > owned)
          }
          isLoading={isLoading}
        >
          ✅ Conferma Trade
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={closeModal}
        >
          ❌ Annulla
        </Button>
      </div>
    </Modal>
  )
}

