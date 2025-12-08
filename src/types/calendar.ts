/**
 * Calendar Module Types
 * Modulo isolato per prenotazioni attività e gestione collaboratori
 */

// Status di una prenotazione
export type BookingStatus = 'BOOKED' | 'MARKED_DONE' | 'CONFIRMED' | 'CANCELLED'

// Prenotazione di un'attività
export interface WorkBooking {
  id: string
  templateId: string
  categoryId: string
  templateName: string
  templateEmoji: string
  baseValue: number
  bookedBy: string          // Player ID che ha prenotato
  bookedByName: string      // Nome player per display
  scheduledDate: string     // YYYY-MM-DD
  scheduledTime?: string    // HH:MM (opzionale)
  status: BookingStatus
  collaborators: string[]   // Array di Player IDs che partecipano
  collaboratorNames: string[] // Nomi per display
  createdAt: number
  markedDoneAt?: number
  markedDoneBy?: string     // Player ID che ha segnato "fatto"
  confirmedAt?: number
  confirmedBy?: string      // Admin ID che ha confermato
  tokenId?: string          // ID del gettone emesso dopo conferma
  p2pTransfers: CollabP2PTransfer[] // Tracciamento divisione tra collaboratori
}

// Trasferimento P2P legato a una prenotazione (tracciato separatamente)
export interface CollabP2PTransfer {
  id: string
  from: string              // Player ID (bookedBy)
  fromName: string
  to: string                // Player ID (collaboratore)
  toName: string
  amount: number
  bookingId: string
  templateName: string
  timestamp: number
}

// Report inattività per un giorno
export interface InactivityReport {
  playerId: string
  playerName: string
  playerEmoji: string
  date: string              // YYYY-MM-DD
  hasActivity: boolean      // Ha prenotato/completato qualcosa quel giorno?
  penaltyApplied: boolean   // È stata applicata la penalità?
  penaltyAmount: number     // Default 5
  penaltyAppliedAt?: number
  penaltyAppliedBy?: string // Admin ID
}

// Penalità applicata (storico)
export interface InactivityPenalty {
  id: string
  playerId: string
  playerName: string
  date: string
  amount: number
  appliedAt: number
  appliedBy: string
  appliedByName: string
}

// Stato del modulo calendario
export interface CalendarState {
  bookings: WorkBooking[]
  collabTransfers: CollabP2PTransfer[]
  inactivityPenalties: InactivityPenalty[]
}

// Azioni del calendario
export interface CalendarActions {
  // Prenotazioni
  createBooking: (params: {
    templateId: string
    categoryId: string
    scheduledDate: string
    scheduledTime?: string
    collaborators?: string[]
  }) => void
  
  markBookingDone: (bookingId: string) => void
  confirmBooking: (bookingId: string) => void
  cancelBooking: (bookingId: string) => void
  
  // Pagamento collaboratori
  payCollaborator: (params: {
    bookingId: string
    toPlayerId: string
    amount: number
  }) => void
  
  // Inattività
  applyInactivityPenalty: (playerId: string, date: string) => void
  
  // Selectors
  getBookingsForDate: (date: string) => WorkBooking[]
  getBookingsForPlayer: (playerId: string) => WorkBooking[]
  getInactivityReport: (date: string) => InactivityReport[]
  getPendingConfirmations: () => WorkBooking[]
  getUnpaidCollaborators: (bookingId: string) => string[]
}

// Helper per formattare date
export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0] ?? ''
}

export function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

export function getWeekDates(referenceDate: Date = new Date()): string[] {
  const dates: string[] = []
  const day = referenceDate.getDay()
  const diff = referenceDate.getDate() - day + (day === 0 ? -6 : 1) // Lunedì
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(referenceDate)
    d.setDate(diff + i)
    dates.push(formatDateISO(d))
  }
  
  return dates
}

// Costanti
export const INACTIVITY_PENALTY_AMOUNT = 5
export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  BOOKED: 'Prenotato',
  MARKED_DONE: 'Fatto (da confermare)',
  CONFIRMED: 'Confermato',
  CANCELLED: 'Cancellato'
}

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  BOOKED: 'text-sky-400 bg-sky-500/20 border-sky-500/40',
  MARKED_DONE: 'text-amber-400 bg-amber-500/20 border-amber-500/40',
  CONFIRMED: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40',
  CANCELLED: 'text-red-400 bg-red-500/20 border-red-500/40'
}

