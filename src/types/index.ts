// ==================== CORE ENTITIES ====================

/**
 * Livello di crescita del giocatore (1 = più piccolo, 4 = esperienza completa).
 * Config e feature-gate in src/lib/levels.ts
 */
export type PlayerLevel = 1 | 2 | 3 | 4

export interface Player {
  id: string
  name: string
  emoji: string
  balance: number
  holdings: Record<string, number> // assetId -> quantity
  isBank?: boolean
  isAdmin?: boolean
  level?: PlayerLevel // assente = 4 (comportamento pre-livelli)
  createdAt: number
  updatedAt: number
}

export interface Asset {
  id: string
  name: string
  emoji: string
  description: string
  
  // Supply Management
  totalSupply: number         // Max emettibili
  circulatingSupply: number   // In mano ai player
  bankReserve: number         // totalSupply - circulatingSupply
  
  // Bank Pricing
  bankBuyPrice: number        // Prezzo vendita banca -> player
  bankSellPrice: number       // Prezzo riacquisto banca <- player (0 = no buyback)
  buybackEnabled: boolean     // Banca riacquista?
  
  // Market Data (legacy + new)
  price: number               // Legacy: prezzo attuale (= bankBuyPrice)
  basePrice: number           // Legacy: prezzo base
  lastP2PPrice: number        // Ultimo prezzo P2P registrato
  
  // Meta
  persistent: boolean         // true = doesn't burn on sell
  active?: boolean            // false = archiviato, non visibile ai trader
  minLevel?: PlayerLevel      // visibile dal livello indicato in su (default 1)
  priceHistory: PricePoint[]
  supplyHistory: SupplyPoint[]
  createdAt: number
  updatedAt: number
}

export interface SupplyPoint {
  circulatingSupply: number
  bankReserve: number
  timestamp: number
}

export interface PricePoint {
  price: number
  timestamp: number
}

// ==================== TRANSACTIONS ====================

export type TransactionStatus =
  | 'IDLE'
  | 'PENDING'
  | 'VALIDATING'
  | 'EXECUTING'
  | 'CONFIRMED'
  | 'FAILED'
  | 'ROLLED_BACK'

export type TradeType = 'BUY' | 'SELL' | 'P2P'

export interface Trade {
  id: string
  type: TradeType
  playerId: string
  assetId: string
  quantity: number
  pricePerUnit: number
  totalAmount: number
  counterpartyId: string // 'bank' for BUY/SELL, playerId for P2P
  status: TransactionStatus
  error: TradeError | null
  createdAt: number
  updatedAt: number
  completedAt: number | null
}

export interface TradePayload {
  playerId: string
  assetId: string
  quantity: number
  type: TradeType
  counterpartyId?: string // For P2P trades
}

// ==================== OPERATIONS (State Machine) ====================

export interface TradeOperation {
  id: string
  status: TransactionStatus
  type: TradeType
  payload: TradePayload
  error: TradeError | null
  createdAt: number
  updatedAt: number
  retryCount: number
}

// ==================== ERRORS ====================

export type TradeErrorCode =
  | 'INSUFFICIENT_FUNDS'
  | 'INSUFFICIENT_ASSETS'
  | 'ASSET_NOT_FOUND'
  | 'PLAYER_NOT_FOUND'
  | 'OPERATION_IN_PROGRESS'
  | 'INVALID_QUANTITY'
  | 'SELF_TRADE_NOT_ALLOWED'
  | 'VALIDATION_FAILED'
  | 'UNKNOWN_ERROR'

export interface TradeError {
  code: TradeErrorCode
  message: string
  details?: Record<string, unknown>
}

// ==================== EVENTS ====================

export type EventType =
  | 'TRADE_EXECUTED'
  | 'P2P_TRANSFER'
  | 'PRICE_CHANGED'
  | 'ASSET_ADDED'
  | 'ASSET_REMOVED'
  | 'MONEY_GIVEN'
  | 'MONEY_TAKEN'
  | 'MARKET_EVENT'
  | 'ANNOUNCEMENT'
  | 'TOKEN_ISSUED'
  | 'TOKEN_REDEEMED'
  | 'TOKEN_REVOKED'
  // Asset Supply events
  | 'SUPPLY_CHANGED'
  | 'BANK_PRICES_CHANGED'
  | 'BUYBACK_TOGGLED'
  | 'ASSET_EMITTED'
  // Calendar events
  | 'BOOKING_CREATED'
  | 'BOOKING_MARKED_DONE'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'COLLAB_PAYMENT'
  | 'INACTIVITY_PENALTY'
  // Levels & Catalog
  | 'LEVEL_CHANGED'
  | 'CATALOG_CHANGED'

export interface AppEvent {
  id: string
  type: EventType
  message: string
  data?: Record<string, unknown>
  timestamp: number
}

// ==================== MARKET EVENTS ====================

export type MarketEventType = 'CRASH' | 'BOOM' | 'WEEKEND'

export type WorkMarketEventType = 'WORK_BOOM' | 'WORK_CRASH'

export interface MarketEvent {
  type: MarketEventType
  multiplier: number
  message: string
  affectedAssets: string[] | 'ALL'
}

// ==================== UI STATE ====================

export type AppMode = 'admin' | 'trader'

export interface ModalState {
  isOpen: boolean
  type: 'trade' | 'p2p' | 'confirm' | null
  data?: Record<string, unknown>
}

export interface ToastState {
  isVisible: boolean
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  action?: {
    label: string
    onClick: () => void
  }
}

// ==================== STORE STATE ====================

export interface AppState {
  // Auth
  currentUser: Player | null
  mode: AppMode
  // PIN per i profili genitore su dispositivo condiviso (null = nessun PIN)
  adminPin: string | null

  // Entities
  players: Player[]
  assets: Record<string, Asset>

  // Work Tokens
  workTokens: WorkToken[]
  workCategories: WorkCategory[]

  // Calendar Module
  bookings: import('./calendar').WorkBooking[]
  collabTransfers: import('./calendar').CollabP2PTransfer[]
  inactivityPenalties: import('./calendar').InactivityPenalty[]

  // Operations
  currentOperation: TradeOperation | null
  tradeHistory: Trade[]

  // Events
  events: AppEvent[]
  news: string

  // UI
  modal: ModalState
  toast: ToastState
  isLoading: boolean
  adminSection: AdminSection
  traderTab: TraderTab

  // Meta
  lastUpdated: number
  version: string
}

// ==================== ACTIONS ====================

export interface AppActions {
  // Auth
  login: (playerId: string) => void
  logout: () => void
  switchMode: (mode: AppMode) => void
  setAdminPin: (pin: string | null) => void

  // Trading
  executeTrade: (payload: TradePayload) => Promise<Result<Trade, TradeError>>
  executeP2PTransfer: (
    fromId: string,
    toId: string,
    assetId: string,
    quantity: number
  ) => Promise<Result<Trade, TradeError>>

  // Admin - Assets
  addAsset: (asset: Omit<Asset, 'id' | 'priceHistory' | 'createdAt' | 'updatedAt' | 'supplyHistory'>) => void
  removeAsset: (assetId: string) => void
  setAssetPrice: (assetId: string, newPrice: number) => void

  // Admin - Asset Supply Management
  setAssetSupply: (assetId: string, newTotalSupply: number) => void
  setBankPrices: (assetId: string, buyPrice: number, sellPrice: number) => void
  toggleBuyback: (assetId: string, enabled: boolean) => void
  emitAssetFromBank: (assetId: string, quantity: number) => void

  // Admin - Players
  giveMoney: (playerId: string, amount: number) => void
  takeMoney: (playerId: string, amount: number) => void
  setPlayerLevel: (playerId: string, level: PlayerLevel) => void
  updatePlayerProfile: (playerId: string, params: { name?: string; emoji?: string }) => void

  // Admin - Market
  triggerMarketEvent: (event: MarketEventType) => void
  sendAnnouncement: (message: string) => void

  // Work Tokens
  emitWorkToken: (params: {
    categoryId: string
    templateId: string
    issuedTo: string
    quality: WorkQuality
    customName?: string
    customValue?: number
  }) => void
  redeemWorkToken: (tokenId: string) => void
  redeemAllTokens: (playerId: string) => void
  revokeWorkToken: (tokenId: string) => void

  // Work Price Controls (Admin)
  setTemplatePrice: (categoryId: string, templateId: string, newValue: number) => void
  setCategoryMultiplier: (categoryId: string, multiplier: number) => void
  triggerWorkMarketEvent: (event: WorkMarketEventType) => void

  // Catalog Management (Admin) - attività e premi modulari
  addWorkTemplate: (categoryId: string, params: {
    name: string
    emoji: string
    baseValue: number
    minLevel?: PlayerLevel
  }) => void
  removeWorkTemplate: (categoryId: string, templateId: string) => void
  setTemplateAvailability: (categoryId: string, templateId: string, params: {
    active?: boolean
    minLevel?: PlayerLevel
  }) => void
  setAssetAvailability: (assetId: string, params: {
    active?: boolean
    minLevel?: PlayerLevel
  }) => void

  // Calendar Module
  createBooking: (params: {
    templateId: string
    categoryId: string
    templateName: string
    templateEmoji: string
    baseValue: number
    scheduledDate: string
    scheduledTime?: string
    collaboratorIds?: string[]
    // Admin: assegna la missione a un altro giocatore (default: se stesso)
    forPlayerId?: string
  }) => void
  markBookingDone: (bookingId: string) => void
  confirmBooking: (bookingId: string) => void
  cancelBooking: (bookingId: string) => void
  payCollaborator: (params: { bookingId: string; toPlayerId: string; amount: number }) => void
  applyInactivityPenalty: (playerId: string, date: string) => void
  getBookingsForDate: (date: string) => import('./calendar').WorkBooking[]
  getBookingsForPlayer: (playerId: string) => import('./calendar').WorkBooking[]
  getPendingConfirmations: () => import('./calendar').WorkBooking[]
  getInactivityReport: (date: string) => import('./calendar').InactivityReport[]
  getUnpaidCollaborators: (bookingId: string) => string[]

  // UI
  openModal: (type: ModalState['type'], data?: Record<string, unknown>) => void
  closeModal: () => void
  showToast: (toast: Omit<ToastState, 'isVisible'>) => void
  hideToast: () => void

  // Navigation
  setAdminSection: (section: AdminSection) => void
  setTraderTab: (tab: TraderTab) => void

  // Events
  logEvent: (type: EventType, message: string, data?: Record<string, unknown>) => void

  // Persistence
  resetState: () => void
}

// ==================== RESULT TYPE ====================

export type Result<T, E = TradeError> =
  | { ok: true; value: T }
  | { ok: false; error: E }

// ==================== VALIDATION ====================

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// ==================== WORK TOKENS ====================

export type WorkQuality = 'BASIC' | 'GOOD' | 'EXCELLENT' | 'PERFECT'

export const QUALITY_MULTIPLIERS: Record<WorkQuality, number> = {
  BASIC: 1.0,
  GOOD: 1.2,
  EXCELLENT: 1.5,
  PERFECT: 2.0,
}

export const QUALITY_LABELS: Record<WorkQuality, { emoji: string; label: string }> = {
  BASIC: { emoji: '🥉', label: 'Base' },
  GOOD: { emoji: '🥈', label: 'Buono' },
  EXCELLENT: { emoji: '🥇', label: 'Eccellente' },
  PERFECT: { emoji: '💎', label: 'Perfetto' },
}

export interface WorkTemplate {
  id: string
  name: string
  emoji: string
  baseValue: number        // Prezzo iniziale di riferimento
  currentValue: number     // Prezzo attuale (modificabile admin)
  active?: boolean         // false = archiviato, non prenotabile
  minLevel?: PlayerLevel   // visibile dal livello indicato in su (default 1)
  priceHistory: PricePoint[]
}

export interface WorkCategory {
  id: string
  name: string
  emoji: string
  templates: WorkTemplate[]
  priceMultiplier: number  // Moltiplicatore categoria (default 1.0)
}

export interface WorkToken {
  id: string
  categoryId: string
  templateId: string
  name: string
  emoji: string
  description: string
  baseValue: number
  quality: WorkQuality
  qualityMultiplier: number
  finalValue: number
  issuedTo: string // playerId
  issuedBy: string // admin playerId
  issuedAt: number
  redeemed: boolean
  redeemedAt: number | null
}

// Helper per creare template con valori di default
function createTemplate(
  id: string,
  name: string,
  emoji: string,
  baseValue: number,
  minLevel: PlayerLevel = 1
): WorkTemplate {
  return {
    id,
    name,
    emoji,
    baseValue,
    currentValue: baseValue,
    active: true,
    minLevel,
    priceHistory: [{ price: baseValue, timestamp: Date.now() }],
  }
}

// Default work categories.
// minLevel indica da quale livello di crescita l'attività è visibile:
// 1 = anche i più piccoli (~4-5 anni), 2 = ~6-7, 3 = ~8-10.
export const DEFAULT_WORK_CATEGORIES: WorkCategory[] = [
  {
    id: 'PULIZIE',
    name: 'Pulizie Casa',
    emoji: '🧹',
    priceMultiplier: 1.0,
    templates: [
      createTemplate('tidy_toys', 'Mette a Posto i Giochi', '🧸', 8, 1),
      createTemplate('tidy_up', 'Riordina Stanza', '🗂️', 12, 1),
      createTemplate('clean_room', 'Pulisce Camera', '🛏️', 15, 2),
      createTemplate('vacuum', 'Aspirapolvere', '🌪️', 20, 2),
      createTemplate('sweep', 'Spazza Cucina', '🧹', 10, 2),
      createTemplate('bathroom', 'Pulisce Bagno', '🚿', 25, 3),
    ],
  },
  {
    id: 'CUCINA',
    name: 'Cucina',
    emoji: '🍽️',
    priceMultiplier: 1.0,
    templates: [
      createTemplate('set_table', 'Apparecchia', '🍴', 8, 1),
      createTemplate('clear_table', 'Sparecchia', '🪑', 8, 1),
      createTemplate('dishes', 'Lava Piatti', '🍽️', 15, 2),
      createTemplate('cook_help', 'Aiuta a Cucinare', '👨‍🍳', 20, 2),
      createTemplate('grocery', 'Sistema Spesa', '🛒', 15, 2),
    ],
  },
  {
    id: 'STUDIO',
    name: 'Studio',
    emoji: '📚',
    priceMultiplier: 1.0,
    templates: [
      createTemplate('reading', 'Lettura Insieme', '📖', 15, 1),
      createTemplate('homework', 'Compiti Completi', '📝', 25, 2),
      createTemplate('practice', 'Esercizi Extra', '✍️', 20, 2),
      createTemplate('instrument', 'Pratica Strumento', '🎵', 20, 2),
    ],
  },
  {
    id: 'COMPORTAMENTO',
    name: 'Comportamento',
    emoji: '⭐',
    priceMultiplier: 1.0,
    templates: [
      createTemplate('kind', 'Gentilezza', '💝', 10, 1),
      createTemplate('dress_alone', 'Si Veste da Solo', '👕', 8, 1),
      createTemplate('early_bed', 'A Letto Presto', '🌙', 10, 1),
      createTemplate('help_sibling', 'Aiuta Fratello/Sorella', '🤝', 15, 1),
      createTemplate('good_manners', 'Buone Maniere', '🎩', 10, 1),
      createTemplate('no_screen', 'Giornata No Screen', '📵', 30, 2),
    ],
  },
]

// ==================== NAVIGATION ====================

export type AdminSection = 
  | 'dashboard'
  | 'tokens'
  | 'assets'
  | 'players'
  | 'market'
  | 'calendar'
  | 'inactivity'
  | 'events'

export type TraderTab = 
  | 'market'
  | 'calendar'
  | 'tokens'
  | 'stats'

// ==================== SELECTORS ====================

export interface EconomicMetrics {
  M1: number // Cash in circulation (players balance)
  M2: number // M1 + unredeemed tokens
  unredeemedValue: number // Value of pending tokens
  totalAssetValue: number
  workProduction: number // Valore lavori completati (riscossi) = PRODUZIONE
  economyValue: number // totalAssetValue + workProduction
  inflation: number
  inflationTrend: 'UP' | 'DOWN' | 'STABLE'
  playerCount: number
  totalTrades: number
  gdp: number // Total completed work tokens count
  productivity: number // Tokens per day
  outstandingTokens: number
  redemptionRate: number
  // Asset Supply Metrics
  assetNominalValue: number // Circulating × bankBuyPrice
  assetMarketValue: number // Circulating × lastP2PPrice
  marketPremium: number // (marketValue - nominalValue) / nominalValue %
  totalAssetSupply: number // Total supply across all assets
  totalCirculating: number // Total circulating across all assets
  bankReserveValue: number // Value of bank reserves
  supplyRatio: number // circulating / totalSupply %
}

