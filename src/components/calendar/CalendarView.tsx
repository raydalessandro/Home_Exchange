'use client'

import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import { Card, CardHeader } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { BookingModal } from './BookingModal'
import { BookingCard } from './BookingCard'
import { cn } from '@/lib/cn'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Plus
} from 'lucide-react'
import { 
  getWeekDates, 
  formatDateDisplay, 
  formatDateISO,
  type WorkBooking 
} from '@/types/calendar'

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

export function CalendarView() {
  const currentUser = useStore(state => state.currentUser)
  const bookings = useStore(state => state.bookings)
  const getBookingsForDate = useStore(state => state.getBookingsForDate)
  
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

  // Calculate week dates based on offset
  const weekDates = useMemo(() => {
    const refDate = new Date()
    refDate.setDate(refDate.getDate() + weekOffset * 7)
    return getWeekDates(refDate)
  }, [weekOffset])

  const today = formatDateISO(new Date())

  // Get bookings for each day
  const bookingsByDate = useMemo(() => {
    const map: Record<string, WorkBooking[]> = {}
    weekDates.forEach(date => {
      map[date] = bookings.filter(b => 
        b.scheduledDate === date && 
        b.status !== 'CANCELLED'
      )
    })
    return map
  }, [weekDates, bookings])

  // User's bookings (as owner or collaborator)
  const myBookings = useMemo(() => {
    if (!currentUser) return []
    return bookings.filter(b => 
      (b.bookedBy === currentUser.id || b.collaborators.includes(currentUser.id)) &&
      b.status !== 'CANCELLED'
    )
  }, [bookings, currentUser])

  const handleDayClick = (date: string) => {
    setSelectedDate(date)
    setIsBookingModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsBookingModalOpen(false)
    setSelectedDate(null)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <CardHeader 
        title="Calendario Attività" 
        icon={<Calendar className="w-5 h-5 sm:w-6 sm:h-6" />}
      />

      {/* Week Navigation */}
      <Card variant="dark">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset(prev => prev - 1)}
            icon={ChevronLeft}
          >
            Precedente
          </Button>
          
          <div className="text-center">
            <div className="text-cream-50 font-semibold">
              {weekDates[0] && formatDateDisplay(weekDates[0])} - {weekDates[6] && formatDateDisplay(weekDates[6])}
            </div>
            {weekOffset === 0 && (
              <div className="text-xs text-gold-400">Settimana corrente</div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset(prev => prev + 1)}
            icon={ChevronRight}
            iconPosition="right"
          >
            Successiva
          </Button>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Header */}
          {WEEKDAY_NAMES.map((day, i) => (
            <div 
              key={day} 
              className={cn(
                'text-center text-xs font-medium py-2',
                i >= 5 ? 'text-amber-400' : 'text-cream-200'
              )}
            >
              {day}
            </div>
          ))}

          {/* Days */}
          {weekDates.map((date, i) => {
            const isToday = date === today
            const isPast = date < today
            const dayBookings = bookingsByDate[date] || []
            const hasMyBooking = dayBookings.some(b => 
              b.bookedBy === currentUser?.id || 
              b.collaborators.includes(currentUser?.id || '')
            )
            
            return (
              <button
                key={date}
                onClick={() => handleDayClick(date)}
                disabled={isPast}
                className={cn(
                  'relative p-2 sm:p-3 rounded-xl transition-all min-h-[80px] sm:min-h-[100px]',
                  'flex flex-col items-center',
                  isToday 
                    ? 'bg-gold/20 border-2 border-gold' 
                    : 'bg-ink-700 border border-ink-600 hover:border-gold/50',
                  isPast && 'opacity-50 cursor-not-allowed',
                  hasMyBooking && !isToday && 'border-emerald-500/50'
                )}
              >
                {/* Day number */}
                <span className={cn(
                  'text-lg font-bold',
                  isToday ? 'text-gold' : 'text-cream-50'
                )}>
                  {new Date(date).getDate()}
                </span>

                {/* Booking indicators */}
                {dayBookings.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1 justify-center">
                    {dayBookings.slice(0, 3).map(booking => (
                      <span 
                        key={booking.id} 
                        className="text-sm"
                        title={booking.templateName}
                      >
                        {booking.templateEmoji}
                      </span>
                    ))}
                    {dayBookings.length > 3 && (
                      <span className="text-xs text-cream-200">
                        +{dayBookings.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Add indicator for empty future days */}
                {dayBookings.length === 0 && !isPast && (
                  <Plus size={16} className="text-cream-300 mt-2 opacity-50" />
                )}
              </button>
            )
          })}
        </div>
      </Card>

      {/* My Bookings Summary */}
      {myBookings.length > 0 && (
        <Card variant="dark">
          <CardHeader 
            title="Le Mie Prenotazioni" 
            icon={<Calendar size={20} className="text-emerald-400" />}
          />
          <div className="space-y-3">
            {myBookings
              .filter(b => b.scheduledDate >= today)
              .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
              .slice(0, 5)
              .map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
          </div>
        </Card>
      )}

      {/* Bookings for selected date */}
      {selectedDate && (bookingsByDate[selectedDate]?.length ?? 0) > 0 && !isBookingModalOpen && (
        <Card variant="dark">
          <CardHeader 
            title={`Prenotazioni ${formatDateDisplay(selectedDate)}`}
            icon={<Calendar size={20} />}
          />
          <div className="space-y-3">
            {(bookingsByDate[selectedDate] ?? []).map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </Card>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={handleCloseModal}
        selectedDate={selectedDate || today}
      />
    </div>
  )
}

