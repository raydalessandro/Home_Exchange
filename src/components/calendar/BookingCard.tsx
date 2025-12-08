'use client'

import { useState } from 'react'
import { useStore } from '@/store'
import { Button } from '@/components/shared/Button'
import { CollaboratorPayment } from './CollaboratorPayment'
import { cn } from '@/lib/cn'
import { 
  Check, 
  X, 
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Coins
} from 'lucide-react'
import { 
  type WorkBooking, 
  BOOKING_STATUS_LABELS, 
  BOOKING_STATUS_COLORS,
  formatDateDisplay 
} from '@/types/calendar'

interface BookingCardProps {
  booking: WorkBooking
  showDate?: boolean
}

export function BookingCard({ booking, showDate = true }: BookingCardProps) {
  const currentUser = useStore(state => state.currentUser)
  const markBookingDone = useStore(state => state.markBookingDone)
  const confirmBooking = useStore(state => state.confirmBooking)
  const cancelBooking = useStore(state => state.cancelBooking)
  const getUnpaidCollaborators = useStore(state => state.getUnpaidCollaborators)

  const [showPayment, setShowPayment] = useState(false)

  const isOwner = booking.bookedBy === currentUser?.id
  const isCollaborator = booking.collaborators.includes(currentUser?.id || '')
  const isAdmin = currentUser?.isAdmin
  const canMarkDone = (isOwner || isCollaborator) && booking.status === 'BOOKED'
  const canConfirm = isAdmin && booking.status === 'MARKED_DONE'
  const canCancel = (isOwner || isAdmin) && 
                    booking.status !== 'CONFIRMED' && 
                    booking.status !== 'CANCELLED'
  
  const unpaidCollaborators = getUnpaidCollaborators(booking.id)
  const hasUnpaidCollaborators = isOwner && 
                                  booking.status === 'CONFIRMED' && 
                                  unpaidCollaborators.length > 0

  const getStatusIcon = () => {
    switch (booking.status) {
      case 'BOOKED': return <Clock size={14} />
      case 'MARKED_DONE': return <Check size={14} />
      case 'CONFIRMED': return <CheckCircle size={14} />
      case 'CANCELLED': return <XCircle size={14} />
    }
  }

  return (
    <div className={cn(
      'p-4 rounded-xl border transition-all',
      'bg-ink-700',
      booking.status === 'CONFIRMED' ? 'border-emerald-500/40' :
      booking.status === 'MARKED_DONE' ? 'border-amber-500/40' :
      booking.status === 'CANCELLED' ? 'border-red-500/40' :
      'border-ink-600'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{booking.templateEmoji}</span>
          <div>
            <div className="text-cream-50 font-medium">{booking.templateName}</div>
            {showDate && (
              <div className="text-cream-200 text-xs">
                {formatDateDisplay(booking.scheduledDate)}
              </div>
            )}
          </div>
        </div>

        {/* Status badge */}
        <div className={cn(
          'px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 border',
          BOOKING_STATUS_COLORS[booking.status]
        )}>
          {getStatusIcon()}
          {BOOKING_STATUS_LABELS[booking.status]}
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        {/* Owner */}
        <div className="flex items-center gap-1 text-cream-200">
          <span>👤</span>
          <span>{booking.bookedByName}</span>
          {isOwner && <span className="text-gold-400">(tu)</span>}
        </div>

        {/* Value */}
        <div className="flex items-center gap-1 text-gold-400 font-mono font-bold">
          <Coins size={14} />
          <span>{booking.baseValue}</span>
        </div>

        {/* Collaborators */}
        {booking.collaborators.length > 0 && (
          <div className="flex items-center gap-1 text-cream-200">
            <Users size={14} />
            <span>{booking.collaboratorNames.join(', ')}</span>
            {isCollaborator && <span className="text-emerald-400">(tu)</span>}
          </div>
        )}
      </div>

      {/* P2P Transfers (if any) */}
      {booking.p2pTransfers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-ink-600">
          <div className="text-xs text-cream-200 mb-2">Pagamenti effettuati:</div>
          {booking.p2pTransfers.map(transfer => (
            <div key={transfer.id} className="text-xs text-cream-100 flex items-center gap-2">
              <span>💸</span>
              <span>{transfer.fromName} → {transfer.toName}</span>
              <span className="text-gold-400 font-mono">🪙{transfer.amount}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {canMarkDone && (
          <Button
            variant="success"
            size="sm"
            onClick={() => markBookingDone(booking.id)}
            icon={Check}
          >
            Fatto
          </Button>
        )}

        {canConfirm && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => confirmBooking(booking.id)}
            icon={CheckCircle}
          >
            Conferma
          </Button>
        )}

        {hasUnpaidCollaborators && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPayment(true)}
            icon={Coins}
          >
            Paga collaboratori
          </Button>
        )}

        {canCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => cancelBooking(booking.id)}
            icon={X}
          >
            Cancella
          </Button>
        )}
      </div>

      {/* Collaborator Payment Modal */}
      {showPayment && (
        <CollaboratorPayment
          booking={booking}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  )
}

