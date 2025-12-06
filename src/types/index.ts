// ==================== CORE ENTITIES ====================

export interface Player {
  id: string
  name: string
  emoji: string
  balance: number
  holdings: Record<string, number> // assetId -> quantity
  isBank?: boolean
  isAdmin?: boolean
  createdAt: number
  updatedAt: number
}

export interface Asset {
  id: string
  name: string
  emoji: string
  description: string
  price: number
  basePrice: number
  persistent: boolean // true = doesn't burn on sell
  priceHistory: PricePoint[]
  createdAt: number
  updatedAt: number
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

export interface AppEvent {
  id: string
  type: EventType
  message: string
  data?: Record<string, unknown>
  timestamp: number
}

// ==================== MARKET EVENTS ====================

export type MarketEventType = 'CRASH' | 'BOOM' | 'WEEKEND'

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

  // Entities
  players: Player[]
  assets: Record<string, Asset>

  // Work Tokens
  workTokens: WorkToken[]
  workCategories: WorkCategory[]

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

  // Trading
  executeTrade: (payload: TradePayload) => Promise<Result<Trade, TradeError>>
  executeP2PTransfer: (
    fromId: string,
    toId: string,
    assetId: string,
    quantity: number
  ) => Promise<Result<Trade, TradeError>>

  // Admin - Assets
  addAsset: (asset: Omit<Asset, 'id' | 'priceHistory' | 'createdAt' | 'updatedAt'>) => void
  removeAsset: (assetId: string) => void
  setAssetPrice: (assetId: string, newPrice: number) => void

  // Admin - Players
  giveMoney: (playerId: string, amount: number) => void
  takeMoney: (playerId: string, amount: number) => void

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
  baseValue: number
}

export interface WorkCategory {
  id: string
  name: string
  emoji: string
  templates: WorkTemplate[]
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

// Default work categories
export const DEFAULT_WORK_CATEGORIES: WorkCategory[] = [
  {
    id: 'PULIZIE',
    name: 'Pulizie Casa',
    emoji: '🧹',
    templates: [
      { id: 'clean_room', name: 'Pulisce Camera', emoji: '🛏️', baseValue: 15 },
      { id: 'vacuum', name: 'Aspirapolvere', emoji: '🌪️', baseValue: 20 },
      { id: 'sweep', name: 'Spazza Cucina', emoji: '🧹', baseValue: 10 },
      { id: 'bathroom', name: 'Pulisce Bagno', emoji: '🚿', baseValue: 25 },
      { id: 'tidy_up', name: 'Riordina Stanza', emoji: '🗂️', baseValue: 12 },
    ],
  },
  {
    id: 'CUCINA',
    name: 'Cucina',
    emoji: '🍽️',
    templates: [
      { id: 'dishes', name: 'Lava Piatti', emoji: '🍽️', baseValue: 15 },
      { id: 'clear_table', name: 'Sparecchia', emoji: '🪑', baseValue: 8 },
      { id: 'set_table', name: 'Apparecchia', emoji: '🍴', baseValue: 8 },
      { id: 'cook_help', name: 'Aiuta a Cucinare', emoji: '👨‍🍳', baseValue: 20 },
      { id: 'grocery', name: 'Sistema Spesa', emoji: '🛒', baseValue: 15 },
    ],
  },
  {
    id: 'STUDIO',
    name: 'Studio',
    emoji: '📚',
    templates: [
      { id: 'homework', name: 'Compiti Completi', emoji: '📝', baseValue: 25 },
      { id: 'reading', name: 'Lettura 30min', emoji: '📖', baseValue: 15 },
      { id: 'practice', name: 'Esercizi Extra', emoji: '✍️', baseValue: 20 },
      { id: 'instrument', name: 'Pratica Strumento', emoji: '🎵', baseValue: 20 },
    ],
  },
  {
    id: 'COMPORTAMENTO',
    name: 'Comportamento',
    emoji: '⭐',
    templates: [
      { id: 'kind', name: 'Gentilezza', emoji: '💝', baseValue: 10 },
      { id: 'help_sibling', name: 'Aiuta Fratello/Sorella', emoji: '🤝', baseValue: 15 },
      { id: 'no_screen', name: 'Giornata No Screen', emoji: '📵', baseValue: 30 },
      { id: 'early_bed', name: 'A Letto Presto', emoji: '🌙', baseValue: 10 },
      { id: 'good_manners', name: 'Buone Maniere', emoji: '🎩', baseValue: 10 },
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
  | 'events'

export type TraderTab = 
  | 'market'
  | 'tokens'
  | 'stats'

// ==================== SELECTORS ====================

export interface EconomicMetrics {
  M1: number // Cash in circulation (players balance)
  M2: number // M1 + unredeemed tokens
  unredeemedValue: number // Value of pending tokens
  totalAssetValue: number
  inflation: number
  inflationTrend: 'UP' | 'DOWN' | 'STABLE'
  playerCount: number
  totalTrades: number
  gdp: number // Total completed work tokens
  productivity: number // Tokens per day
  outstandingTokens: number
  redemptionRate: number
}

