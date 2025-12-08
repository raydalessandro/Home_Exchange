/**
 * Calendar Slice - Modulo isolato per prenotazioni e collaborazioni
 * NON modifica lo store principale, viene integrato come slice separato
 */

import { StateCreator } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type {
  WorkBooking,
  CollabP2PTransfer,
  InactivityPenalty,
  InactivityReport,
  CalendarState,
  BookingStatus,
} from '@/types/calendar'
import { INACTIVITY_PENALTY_AMOUNT, formatDateISO } from '@/types/calendar'

// Stato iniziale del modulo calendario
export const initialCalendarState: CalendarState = {
  bookings: [],
  collabTransfers: [],
  inactivityPenalties: [],
}

// Tipo per le azioni del calendario (integrato nello store principale)
export interface CalendarSlice extends CalendarState {
  // === BOOKING ACTIONS ===
  
  createBooking: (params: {
    templateId: string
    categoryId: string
    templateName: string
    templateEmoji: string
    baseValue: number
    scheduledDate: string
    scheduledTime?: string
    collaboratorIds?: string[]
  }) => void
  
  markBookingDone: (bookingId: string) => void
  
  confirmBooking: (bookingId: string) => void
  
  cancelBooking: (bookingId: string) => void
  
  // === COLLABORATOR PAYMENT ===
  
  payCollaborator: (params: {
    bookingId: string
    toPlayerId: string
    amount: number
  }) => void
  
  // === INACTIVITY ===
  
  applyInactivityPenalty: (playerId: string, date: string) => void
  
  // === SELECTORS ===
  
  getBookingsForDate: (date: string) => WorkBooking[]
  
  getBookingsForPlayer: (playerId: string) => WorkBooking[]
  
  getPendingConfirmations: () => WorkBooking[]
  
  getInactivityReport: (date: string) => InactivityReport[]
  
  getUnpaidCollaborators: (bookingId: string) => string[]
}

// Creator per lo slice calendario
export const createCalendarSlice: StateCreator<
  CalendarSlice & { 
    currentPlayer: { id: string; name: string; emoji: string; isAdmin: boolean } | null
    players: Array<{ id: string; name: string; emoji: string; isBank: boolean; balance: number }>
    workCategories: Array<{ id: string; name: string; emoji: string; templates: Array<{ id: string; name: string; emoji: string; currentValue: number; baseValue: number }> }>
    emitWorkToken: (params: any) => void
    updatePlayerBalance: (playerId: string, amount: number) => void
    logEvent: (type: string, message: string, data?: any) => void
    showToast: (toast: { message: string; type: 'success' | 'error' | 'info' | 'warning' }) => void
  },
  [],
  [],
  CalendarSlice
> = (set, get) => ({
  ...initialCalendarState,

  // === BOOKING ACTIONS ===

  createBooking: (params) => {
    const state = get()
    const currentPlayer = state.currentPlayer
    
    if (!currentPlayer) {
      state.showToast({ message: 'Devi essere loggato', type: 'error' })
      return
    }

    // Trova i nomi dei collaboratori
    const collaboratorNames = (params.collaboratorIds || []).map(id => {
      const player = state.players.find(p => p.id === id)
      return player?.name || 'Sconosciuto'
    })

    const booking: WorkBooking = {
      id: uuidv4(),
      templateId: params.templateId,
      categoryId: params.categoryId,
      templateName: params.templateName,
      templateEmoji: params.templateEmoji,
      baseValue: params.baseValue,
      bookedBy: currentPlayer.id,
      bookedByName: currentPlayer.name,
      scheduledDate: params.scheduledDate,
      scheduledTime: params.scheduledTime,
      status: 'BOOKED',
      collaborators: params.collaboratorIds || [],
      collaboratorNames,
      createdAt: Date.now(),
      p2pTransfers: [],
    }

    set(state => ({
      bookings: [...state.bookings, booking]
    }))

    const collabText = collaboratorNames.length > 0 
      ? ` con ${collaboratorNames.join(', ')}` 
      : ''
    
    state.logEvent(
      'BOOKING_CREATED',
      `📅 ${currentPlayer.name} ha prenotato ${params.templateEmoji} ${params.templateName} per ${params.scheduledDate}${collabText}`,
      { bookingId: booking.id }
    )
    
    state.showToast({ message: 'Prenotazione creata!', type: 'success' })
  },

  markBookingDone: (bookingId) => {
    const state = get()
    const currentPlayer = state.currentPlayer
    const booking = state.bookings.find(b => b.id === bookingId)

    if (!currentPlayer || !booking) {
      state.showToast({ message: 'Prenotazione non trovata', type: 'error' })
      return
    }

    // Solo chi ha prenotato o un collaboratore può segnare fatto
    const canMark = booking.bookedBy === currentPlayer.id || 
                    booking.collaborators.includes(currentPlayer.id)
    
    if (!canMark) {
      state.showToast({ message: 'Non sei autorizzato', type: 'error' })
      return
    }

    if (booking.status !== 'BOOKED') {
      state.showToast({ message: 'Prenotazione non in stato valido', type: 'error' })
      return
    }

    set(state => ({
      bookings: state.bookings.map(b => 
        b.id === bookingId 
          ? { 
              ...b, 
              status: 'MARKED_DONE' as BookingStatus, 
              markedDoneAt: Date.now(),
              markedDoneBy: currentPlayer.id 
            }
          : b
      )
    }))

    state.logEvent(
      'BOOKING_MARKED_DONE',
      `✅ ${currentPlayer.name} ha completato ${booking.templateEmoji} ${booking.templateName}`,
      { bookingId }
    )
    
    state.showToast({ message: 'Segnato come fatto! In attesa di conferma admin.', type: 'success' })
  },

  confirmBooking: (bookingId) => {
    const state = get()
    const currentPlayer = state.currentPlayer
    const booking = state.bookings.find(b => b.id === bookingId)

    if (!currentPlayer?.isAdmin) {
      state.showToast({ message: 'Solo admin può confermare', type: 'error' })
      return
    }

    if (!booking || booking.status !== 'MARKED_DONE') {
      state.showToast({ message: 'Prenotazione non pronta per conferma', type: 'error' })
      return
    }

    // Trova il template per ottenere il valore corrente
    const category = state.workCategories.find(c => c.id === booking.categoryId)
    const template = category?.templates.find(t => t.id === booking.templateId)
    const value = template?.currentValue || booking.baseValue

    // Emetti il gettone a chi ha prenotato
    state.emitWorkToken({
      categoryId: booking.categoryId,
      templateId: booking.templateId,
      issuedTo: booking.bookedBy,
      quality: 'BASIC', // Default, potrebbe essere parametrizzato
      customName: `${booking.templateName} (Calendario)`,
      customValue: value,
    })

    // Trova il token ID appena creato (ultimo aggiunto)
    const tokenId = `calendar-${bookingId}`

    set(state => ({
      bookings: state.bookings.map(b => 
        b.id === bookingId 
          ? { 
              ...b, 
              status: 'CONFIRMED' as BookingStatus,
              confirmedAt: Date.now(),
              confirmedBy: currentPlayer.id,
              tokenId,
            }
          : b
      )
    }))

    state.logEvent(
      'BOOKING_CONFIRMED',
      `🎫 Admin ha confermato ${booking.templateEmoji} ${booking.templateName} di ${booking.bookedByName} (+🪙${value})`,
      { bookingId, value }
    )
    
    state.showToast({ message: `Confermato! Gettone di 🪙${value} emesso.`, type: 'success' })
  },

  cancelBooking: (bookingId) => {
    const state = get()
    const currentPlayer = state.currentPlayer
    const booking = state.bookings.find(b => b.id === bookingId)

    if (!currentPlayer || !booking) {
      state.showToast({ message: 'Prenotazione non trovata', type: 'error' })
      return
    }

    // Solo chi ha prenotato o admin può cancellare
    const canCancel = booking.bookedBy === currentPlayer.id || currentPlayer.isAdmin
    
    if (!canCancel) {
      state.showToast({ message: 'Non sei autorizzato', type: 'error' })
      return
    }

    if (booking.status === 'CONFIRMED' || booking.status === 'CANCELLED') {
      state.showToast({ message: 'Non puoi cancellare questa prenotazione', type: 'error' })
      return
    }

    set(state => ({
      bookings: state.bookings.map(b => 
        b.id === bookingId 
          ? { ...b, status: 'CANCELLED' as BookingStatus }
          : b
      )
    }))

    state.logEvent(
      'BOOKING_CANCELLED',
      `❌ ${currentPlayer.name} ha cancellato ${booking.templateEmoji} ${booking.templateName}`,
      { bookingId }
    )
    
    state.showToast({ message: 'Prenotazione cancellata', type: 'info' })
  },

  // === COLLABORATOR PAYMENT ===

  payCollaborator: (params) => {
    const state = get()
    const currentPlayer = state.currentPlayer
    const booking = state.bookings.find(b => b.id === params.bookingId)

    if (!currentPlayer || !booking) {
      state.showToast({ message: 'Prenotazione non trovata', type: 'error' })
      return
    }

    if (booking.bookedBy !== currentPlayer.id) {
      state.showToast({ message: 'Solo chi ha prenotato può pagare i collaboratori', type: 'error' })
      return
    }

    if (booking.status !== 'CONFIRMED') {
      state.showToast({ message: 'La prenotazione deve essere confermata', type: 'error' })
      return
    }

    if (!booking.collaborators.includes(params.toPlayerId)) {
      state.showToast({ message: 'Questo player non è un collaboratore', type: 'error' })
      return
    }

    const fromPlayer = state.players.find(p => p.id === currentPlayer.id)
    const toPlayer = state.players.find(p => p.id === params.toPlayerId)

    if (!fromPlayer || !toPlayer) {
      state.showToast({ message: 'Player non trovato', type: 'error' })
      return
    }

    if (fromPlayer.balance < params.amount) {
      state.showToast({ message: 'Saldo insufficiente', type: 'error' })
      return
    }

    // Esegui il trasferimento
    state.updatePlayerBalance(currentPlayer.id, -params.amount)
    state.updatePlayerBalance(params.toPlayerId, params.amount)

    // Registra il trasferimento
    const transfer: CollabP2PTransfer = {
      id: uuidv4(),
      from: currentPlayer.id,
      fromName: currentPlayer.name,
      to: params.toPlayerId,
      toName: toPlayer.name,
      amount: params.amount,
      bookingId: params.bookingId,
      templateName: booking.templateName,
      timestamp: Date.now(),
    }

    set(state => ({
      collabTransfers: [...state.collabTransfers, transfer],
      bookings: state.bookings.map(b => 
        b.id === params.bookingId
          ? { ...b, p2pTransfers: [...b.p2pTransfers, transfer] }
          : b
      )
    }))

    state.logEvent(
      'COLLAB_PAYMENT',
      `💸 ${currentPlayer.name} ha pagato 🪙${params.amount} a ${toPlayer.name} per ${booking.templateEmoji} ${booking.templateName}`,
      { bookingId: params.bookingId, transfer }
    )
    
    state.showToast({ message: `Pagato 🪙${params.amount} a ${toPlayer.name}!`, type: 'success' })
  },

  // === INACTIVITY ===

  applyInactivityPenalty: (playerId, date) => {
    const state = get()
    const currentPlayer = state.currentPlayer

    if (!currentPlayer?.isAdmin) {
      state.showToast({ message: 'Solo admin può applicare penalità', type: 'error' })
      return
    }

    const player = state.players.find(p => p.id === playerId)
    if (!player) {
      state.showToast({ message: 'Player non trovato', type: 'error' })
      return
    }

    // Controlla se già applicata
    const alreadyApplied = state.inactivityPenalties.some(
      p => p.playerId === playerId && p.date === date
    )
    if (alreadyApplied) {
      state.showToast({ message: 'Penalità già applicata per questo giorno', type: 'warning' })
      return
    }

    // Applica la penalità
    state.updatePlayerBalance(playerId, -INACTIVITY_PENALTY_AMOUNT)

    const penalty: InactivityPenalty = {
      id: uuidv4(),
      playerId,
      playerName: player.name,
      date,
      amount: INACTIVITY_PENALTY_AMOUNT,
      appliedAt: Date.now(),
      appliedBy: currentPlayer.id,
      appliedByName: currentPlayer.name,
    }

    set(state => ({
      inactivityPenalties: [...state.inactivityPenalties, penalty]
    }))

    state.logEvent(
      'INACTIVITY_PENALTY',
      `⚠️ Penalità inattività: ${player.name} -🪙${INACTIVITY_PENALTY_AMOUNT} per ${date}`,
      { penalty }
    )
    
    state.showToast({ message: `Penalità di 🪙${INACTIVITY_PENALTY_AMOUNT} applicata a ${player.name}`, type: 'warning' })
  },

  // === SELECTORS ===

  getBookingsForDate: (date) => {
    return get().bookings.filter(b => 
      b.scheduledDate === date && b.status !== 'CANCELLED'
    )
  },

  getBookingsForPlayer: (playerId) => {
    return get().bookings.filter(b => 
      (b.bookedBy === playerId || b.collaborators.includes(playerId)) &&
      b.status !== 'CANCELLED'
    )
  },

  getPendingConfirmations: () => {
    return get().bookings.filter(b => b.status === 'MARKED_DONE')
  },

  getInactivityReport: (date) => {
    const state = get()
    const childPlayers = state.players.filter(p => !p.isBank)
    
    return childPlayers.map(player => {
      // Controlla se ha attività quel giorno
      const hasBooking = state.bookings.some(b => 
        b.scheduledDate === date &&
        (b.bookedBy === player.id || b.collaborators.includes(player.id)) &&
        b.status !== 'CANCELLED'
      )
      
      const penaltyApplied = state.inactivityPenalties.some(
        p => p.playerId === player.id && p.date === date
      )

      return {
        playerId: player.id,
        playerName: player.name,
        playerEmoji: '👤', // Placeholder, ideally from player data
        date,
        hasActivity: hasBooking,
        penaltyApplied,
        penaltyAmount: INACTIVITY_PENALTY_AMOUNT,
      }
    })
  },

  getUnpaidCollaborators: (bookingId) => {
    const state = get()
    const booking = state.bookings.find(b => b.id === bookingId)
    
    if (!booking) return []
    
    const paidCollaborators = booking.p2pTransfers.map(t => t.to)
    return booking.collaborators.filter(c => !paidCollaborators.includes(c))
  },
})

