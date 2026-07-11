import type { AppState } from './index'
import { DEFAULT_WORK_CATEGORIES } from './index'

// Initial state for the store
export const initialPlayers = [
  {
    id: 'bank',
    name: 'BANCA',
    emoji: '🏛️',
    balance: 10000,
    holdings: {},
    isBank: true,
    isAdmin: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'papa',
    name: 'Papà',
    emoji: '👨',
    balance: 100,
    holdings: {},
    isBank: false,
    isAdmin: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'mamma',
    name: 'Mamma',
    emoji: '👩',
    balance: 100,
    holdings: {},
    isBank: false,
    isAdmin: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'figlio1',
    name: 'Figlio 1',
    emoji: '👦',
    balance: 100,
    holdings: {},
    isBank: false,
    isAdmin: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'figlio2',
    name: 'Figlio 2',
    emoji: '👧',
    balance: 100,
    holdings: {},
    isBank: false,
    isAdmin: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'figlio3',
    name: 'Figlio 3',
    emoji: '🧒',
    balance: 100,
    holdings: {},
    isBank: false,
    isAdmin: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

export const initialAssets = {
  TIME_CREDITS: {
    id: 'TIME_CREDITS',
    name: 'Time Credits',
    emoji: '📺',
    description: '15 minuti di tempo libero',
    // Supply Management
    totalSupply: 100,
    circulatingSupply: 0,
    bankReserve: 100,
    // Bank Pricing
    bankBuyPrice: 5,
    bankSellPrice: 3,  // Spread 40%
    buybackEnabled: true,
    // Market Data
    price: 5,
    basePrice: 5,
    lastP2PPrice: 5,
    // Meta
    persistent: true,
    priceHistory: [{ price: 5, timestamp: Date.now() }],
    supplyHistory: [{ circulatingSupply: 0, bankReserve: 100, timestamp: Date.now() }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  PRIVILEGE_TOKENS: {
    id: 'PRIVILEGE_TOKENS',
    name: 'Privilege Tokens',
    emoji: '🎮',
    description: 'Scegli il film o il gioco',
    // Supply Management
    totalSupply: 50,
    circulatingSupply: 0,
    bankReserve: 50,
    // Bank Pricing
    bankBuyPrice: 15,
    bankSellPrice: 10,  // Spread 33%
    buybackEnabled: true,
    // Market Data
    price: 15,
    basePrice: 15,
    lastP2PPrice: 15,
    // Meta
    persistent: true,
    priceHistory: [{ price: 15, timestamp: Date.now() }],
    supplyHistory: [{ circulatingSupply: 0, bankReserve: 50, timestamp: Date.now() }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  CHORE_SHARES: {
    id: 'CHORE_SHARES',
    name: 'Chore Shares',
    emoji: '🧹',
    description: 'Evita lavori domestici',
    // Supply Management
    totalSupply: 30,
    circulatingSupply: 0,
    bankReserve: 30,
    // Bank Pricing
    bankBuyPrice: 10,
    bankSellPrice: 7,  // Spread 30%
    buybackEnabled: true,
    // Market Data
    price: 10,
    basePrice: 10,
    lastP2PPrice: 10,
    // Meta
    persistent: true,
    priceHistory: [{ price: 10, timestamp: Date.now() }],
    supplyHistory: [{ circulatingSupply: 0, bankReserve: 30, timestamp: Date.now() }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  SWEET_FUTURES: {
    id: 'SWEET_FUTURES',
    name: 'Sweet Futures',
    emoji: '🍬',
    description: 'Dolce garantito nel weekend',
    // Supply Management
    totalSupply: 20,
    circulatingSupply: 0,
    bankReserve: 20,
    // Bank Pricing
    bankBuyPrice: 8,
    bankSellPrice: 5,  // Spread 37%
    buybackEnabled: true,
    // Market Data
    price: 8,
    basePrice: 8,
    lastP2PPrice: 8,
    // Meta
    persistent: false,
    priceHistory: [{ price: 8, timestamp: Date.now() }],
    supplyHistory: [{ circulatingSupply: 0, bankReserve: 20, timestamp: Date.now() }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
}

export const initialState: Omit<AppState, keyof import('./index').AppActions> = {
  // Auth
  currentUser: null,
  mode: 'trader',
  adminPin: null,

  // Entities
  players: initialPlayers,
  assets: initialAssets,

  // Work Tokens
  workTokens: [],
  workCategories: DEFAULT_WORK_CATEGORIES,

  // Calendar Module
  bookings: [],
  collabTransfers: [],
  inactivityPenalties: [],

  // Operations
  currentOperation: null,
  tradeHistory: [],

  // Events
  events: [],
  news: 'Benvenuto alla Casa Exchange!',

  // UI
  modal: {
    isOpen: false,
    type: null,
    data: undefined,
  },
  toast: {
    isVisible: false,
    message: '',
    type: 'info',
  },
  isLoading: false,
  adminSection: 'dashboard',
  traderTab: 'market',

  // Meta
  lastUpdated: Date.now(),
  version: '0.3.0',
}

