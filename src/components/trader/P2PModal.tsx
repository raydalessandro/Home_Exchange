'use client'

import { useState, useEffect, useMemo } from 'react'
import { useStore } from '@/store'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/shared/Button'
import { isErr } from '@/utils/result'
import { getErrorMessage } from '@/types/errors'

export function P2PModal() {
  const {
    modal,
    closeModal,
    currentUser,
    assets,
    executeP2PTransfer,
    isLoading,
    showToast,
    players,
  } = useStore()
  const allPlayers = useMemo(() => players.filter(p => !p.isBank), [players])

  const [recipientId, setRecipientId] = useState('')
  const [assetId, setAssetId] = useState('')
  const [quantity, setQuantity] = useState(1)

  const isOpen = modal.isOpen && modal.type === 'p2p'

  // Get list of recipients (everyone except current user)
  const recipients = allPlayers.filter(p => p.id !== currentUser?.id)

  // Get list of owned assets
  const ownedAssets = currentUser
    ? Object.entries(currentUser.holdings)
        .filter(([_, qty]) => qty > 0)
        .map(([id]) => assets[id])
        .filter(Boolean)
    : []

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && recipients.length > 0 && ownedAssets.length > 0) {
      setRecipientId(recipients[0]?.id ?? '')
      setAssetId(ownedAssets[0]?.id ?? '')
      setQuantity(1)
    }
  }, [isOpen])

  if (!isOpen || !currentUser) return null

  const selectedAsset = assetId ? assets[assetId] : undefined
  const maxQuantity = selectedAsset ? (currentUser.holdings[assetId] ?? 0) : 0
  const recipient = recipients.find(p => p.id === recipientId)

  const handleQuantityChange = (delta: number) => {
    setQuantity(q => Math.max(1, Math.min(q + delta, maxQuantity)))
  }

  const handleTransfer = async () => {
    if (!recipientId || !assetId || quantity <= 0) return

    const result = await executeP2PTransfer(
      currentUser.id,
      recipientId,
      assetId,
      quantity
    )

    if (isErr(result)) {
      showToast({
        message: getErrorMessage(result.error),
        type: 'error',
      })
    } else {
      showToast({
        message: `Inviato ${quantity}× ${selectedAsset?.emoji} a ${recipient?.name}!`,
        type: 'success',
      })
      closeModal()
    }
  }

  if (ownedAssets.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={closeModal} title="🔄 Scambio P2P">
        <p className="text-center text-ink-500 py-8">
          Non hai asset da scambiare. Acquista qualcosa prima!
        </p>
        <Button variant="ghost" className="w-full" onClick={closeModal}>
          Chiudi
        </Button>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title="🔄 Scambio Peer-to-Peer">
      {/* Recipient Select */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-ink-600 mb-1">
          A chi vuoi inviare?
        </label>
        <select
          value={recipientId}
          onChange={e => setRecipientId(e.target.value)}
          className="input"
        >
          {recipients.map(p => (
            <option key={p.id} value={p.id}>
              {p.emoji} {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Asset Select */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-ink-600 mb-1">
          Cosa vuoi inviare?
        </label>
        <select
          value={assetId}
          onChange={e => {
            setAssetId(e.target.value)
            setQuantity(1)
          }}
          className="input"
        >
          {ownedAssets.map(a => a && (
            <option key={a.id} value={a.id}>
              {a.emoji} {a.name} (hai: {currentUser.holdings[a.id] ?? 0})
            </option>
          ))}
        </select>
      </div>

      {/* Quantity Selector */}
      <div className="flex items-center justify-center gap-4 my-6">
        <button
          onClick={() => handleQuantityChange(-1)}
          disabled={quantity <= 1}
          className="w-10 h-10 rounded-full bg-gold-500 text-white text-xl
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
          className="w-20 text-center text-2xl font-bold font-mono
                     border-2 border-gold-500 rounded-lg p-2"
        />
        <button
          onClick={() => handleQuantityChange(1)}
          disabled={quantity >= maxQuantity}
          className="w-10 h-10 rounded-full bg-gold-500 text-white text-xl
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-gold-600 transition-colors"
        >
          +
        </button>
      </div>

      {/* Summary */}
      <div className="text-center text-ink-600 mb-4">
        <div className="text-sm">Hai: {maxQuantity}</div>
        <div className="text-lg mt-2">
          Invierai:{' '}
          <strong>
            {quantity}× {selectedAsset?.emoji} {selectedAsset?.name}
          </strong>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button
          variant="success"
          className="w-full"
          onClick={handleTransfer}
          disabled={isLoading || quantity <= 0 || quantity > maxQuantity}
          isLoading={isLoading}
        >
          ✅ Invia
        </Button>
        <Button variant="ghost" className="w-full" onClick={closeModal}>
          ❌ Annulla
        </Button>
      </div>
    </Modal>
  )
}

