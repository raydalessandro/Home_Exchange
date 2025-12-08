'use client'

import { useState } from 'react'
import { useStore } from '@/store'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import { cn } from '@/lib/cn'
import { Coins, Send, X } from 'lucide-react'
import type { WorkBooking } from '@/types/calendar'

interface CollaboratorPaymentProps {
  booking: WorkBooking
  onClose: () => void
}

export function CollaboratorPayment({ booking, onClose }: CollaboratorPaymentProps) {
  const currentUser = useStore(state => state.currentUser)
  const players = useStore(state => state.players)
  const payCollaborator = useStore(state => state.payCollaborator)
  const getUnpaidCollaborators = useStore(state => state.getUnpaidCollaborators)

  const unpaidCollaboratorIds = getUnpaidCollaborators(booking.id)
  const [amounts, setAmounts] = useState<Record<string, string>>({})

  const currentUserBalance = players.find(p => p.id === currentUser?.id)?.balance || 0

  const handleAmountChange = (playerId: string, value: string) => {
    setAmounts(prev => ({
      ...prev,
      [playerId]: value
    }))
  }

  const handlePay = (playerId: string) => {
    const amount = parseInt(amounts[playerId] || '0')
    if (amount <= 0) return

    payCollaborator({
      bookingId: booking.id,
      toPlayerId: playerId,
      amount
    })

    // Clear the input
    setAmounts(prev => ({
      ...prev,
      [playerId]: ''
    }))
  }

  const handlePayAll = () => {
    unpaidCollaboratorIds.forEach(playerId => {
      const amount = parseInt(amounts[playerId] || '0')
      if (amount > 0) {
        payCollaborator({
          bookingId: booking.id,
          toPlayerId: playerId,
          amount
        })
      }
    })
    onClose()
  }

  const totalToPay = unpaidCollaboratorIds.reduce((sum, id) => {
    return sum + parseInt(amounts[id] || '0')
  }, 0)

  const canPayAll = totalToPay > 0 && totalToPay <= currentUserBalance

  return (
    <Modal isOpen={true} onClose={onClose} showHeader={false}>
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-serif text-gold flex items-center gap-2">
              <Coins size={24} />
              Paga Collaboratori
            </h2>
            <p className="text-cream-200 text-sm mt-1">
              {booking.templateEmoji} {booking.templateName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-ink-700 hover:bg-ink-600 flex items-center justify-center text-cream-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Your balance */}
        <Card variant="dark" className="mb-4 border-gold/30">
          <div className="flex items-center justify-between">
            <span className="text-cream-200">Il tuo saldo:</span>
            <span className="text-gold-400 font-mono font-bold text-lg">
              🪙 {currentUserBalance}
            </span>
          </div>
        </Card>

        {/* Already paid */}
        {booking.p2pTransfers.length > 0 && (
          <div className="mb-4">
            <div className="text-cream-200 text-sm mb-2">Già pagati:</div>
            {booking.p2pTransfers.map(transfer => {
              const player = players.find(p => p.id === transfer.to)
              return (
                <div 
                  key={transfer.id}
                  className="flex items-center justify-between p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg mb-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{player?.emoji}</span>
                    <span className="text-cream-100">{player?.name}</span>
                  </div>
                  <span className="text-emerald-400 font-mono font-bold">
                    🪙 {transfer.amount}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Unpaid collaborators */}
        {unpaidCollaboratorIds.length > 0 ? (
          <div className="space-y-3 mb-6">
            <div className="text-cream-200 text-sm">Da pagare:</div>
            {unpaidCollaboratorIds.map(playerId => {
              const player = players.find(p => p.id === playerId)
              const amount = parseInt(amounts[playerId] || '0')
              
              return (
                <div 
                  key={playerId}
                  className="p-3 bg-ink-700 border border-ink-600 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{player?.emoji}</span>
                      <span className="text-cream-50 font-medium">{player?.name}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-300">
                        🪙
                      </span>
                      <input
                        type="number"
                        min="0"
                        max={currentUserBalance}
                        value={amounts[playerId] || ''}
                        onChange={(e) => handleAmountChange(playerId, e.target.value)}
                        placeholder="0"
                        className="w-full pl-10 pr-4 py-2 bg-ink-800 border border-ink-600 rounded-lg text-cream-50 font-mono text-center focus:border-gold focus:outline-none"
                      />
                    </div>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handlePay(playerId)}
                      disabled={amount <= 0 || amount > currentUserBalance}
                      icon={Send}
                    >
                      Paga
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-cream-200">
            Tutti i collaboratori sono stati pagati! ✅
          </div>
        )}

        {/* Summary and actions */}
        {unpaidCollaboratorIds.length > 0 && totalToPay > 0 && (
          <div className="border-t border-ink-600 pt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-cream-200">Totale da pagare:</span>
              <span className={cn(
                'font-mono font-bold text-lg',
                totalToPay > currentUserBalance ? 'text-red-400' : 'text-gold-400'
              )}>
                🪙 {totalToPay}
              </span>
            </div>
            
            {totalToPay > currentUserBalance && (
              <div className="text-red-400 text-sm mb-4">
                ⚠️ Saldo insufficiente
              </div>
            )}

            <Button
              variant="primary"
              fullWidth
              onClick={handlePayAll}
              disabled={!canPayAll}
              icon={Send}
            >
              Paga tutti
            </Button>
          </div>
        )}

        {/* Close button */}
        <Button
          variant="ghost"
          fullWidth
          onClick={onClose}
          className="mt-3"
        >
          Chiudi
        </Button>
      </div>
    </Modal>
  )
}

