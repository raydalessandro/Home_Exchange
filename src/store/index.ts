'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { useShallow } from 'zustand/react/shallow'
import { v4 as uuidv4 } from 'uuid'
import type {
  AppState,
  AppActions,
  Player,
  Asset,
  Trade,
  TradePayload,
  TradeError,
  TradeOperation,
  AppMode,
  EventType,
  MarketEventType,
  ModalState,
  ToastState,
  Result,
  WorkToken,
  WorkQuality,
  AdminSection,
  TraderTab,
  EconomicMetrics,
} from '@/types'
import { QUALITY_MULTIPLIERS } from '@/types'
import { initialState, initialPlayers, initialAssets } from '@/types/state'
import { createTradeError } from '@/types/errors'
import { ok, err } from '@/utils/result'
import { generateIdempotencyKey, isProcessed, markProcessed } from '@/utils/idempotency'

type Store = AppState & AppActions

export const useStore = create<Store>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      // ==================== AUTH ====================
      login: (playerId: string) => {
        const player = get().players.find(p => p.id === playerId)
        if (player && !player.isBank) {
          set(state => {
            state.currentUser = player
            state.mode = player.isAdmin ? 'admin' : 'trader'
          })
        }
      },

      logout: () => {
        set(state => {
          state.currentUser = null
          state.mode = 'trader'
          state.modal = { isOpen: false, type: null }
        })
      },

      switchMode: (mode: AppMode) => {
        const currentUser = get().currentUser
        if (mode === 'admin' && !currentUser?.isAdmin) {
          return // Non-admins can't access admin mode
        }
        set(state => {
          state.mode = mode
        })
      },

      // ==================== TRADING ====================
      executeTrade: async (payload: TradePayload): Promise<Result<Trade, TradeError>> => {
        const { playerId, assetId, quantity, type } = payload
        const idempotencyKey = generateIdempotencyKey()

        // Check idempotency
        if (isProcessed(idempotencyKey)) {
          return err(createTradeError('OPERATION_IN_PROGRESS'))
        }

        // Check if operation already in progress
        if (get().currentOperation !== null) {
          return err(createTradeError('OPERATION_IN_PROGRESS'))
        }

        // Create operation
        const operation: TradeOperation = {
          id: idempotencyKey,
          status: 'PENDING',
          type,
          payload,
          error: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          retryCount: 0,
        }

        set(state => {
          state.currentOperation = operation
          state.isLoading = true
        })

        try {
          // Validation phase
          set(state => {
            if (state.currentOperation) {
              state.currentOperation.status = 'VALIDATING'
              state.currentOperation.updatedAt = Date.now()
            }
          })

          const state = get()
          const player = state.players.find(p => p.id === playerId)
          const asset = state.assets[assetId]
          const bank = state.players.find(p => p.isBank)

          if (!player) {
            throw createTradeError('PLAYER_NOT_FOUND', { playerId })
          }
          if (!asset) {
            throw createTradeError('ASSET_NOT_FOUND', { assetId })
          }
          if (!bank) {
            throw createTradeError('PLAYER_NOT_FOUND', { playerId: 'bank' })
          }
          if (quantity <= 0) {
            throw createTradeError('INVALID_QUANTITY', { quantity })
          }

          const totalAmount = asset.price * quantity

          if (type === 'BUY') {
            if (player.balance < totalAmount) {
              throw createTradeError('INSUFFICIENT_FUNDS', {
                required: totalAmount,
                available: player.balance,
              })
            }
          } else if (type === 'SELL') {
            const playerHoldings = player.holdings[assetId] ?? 0
            if (playerHoldings < quantity) {
              throw createTradeError('INSUFFICIENT_ASSETS', {
                required: quantity,
                available: playerHoldings,
              })
            }
          }

          // Execution phase
          set(state => {
            if (state.currentOperation) {
              state.currentOperation.status = 'EXECUTING'
              state.currentOperation.updatedAt = Date.now()
            }
          })

          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 100))

          // Atomic state update
          const trade: Trade = {
            id: uuidv4(),
            type,
            playerId,
            assetId,
            quantity,
            pricePerUnit: asset.price,
            totalAmount,
            counterpartyId: 'bank',
            status: 'CONFIRMED',
            error: null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            completedAt: Date.now(),
          }

          set(state => {
            const playerIndex = state.players.findIndex(p => p.id === playerId)
            const bankIndex = state.players.findIndex(p => p.isBank)

            if (playerIndex === -1 || bankIndex === -1) return

            if (type === 'BUY') {
              // Player pays, gets asset
              state.players[playerIndex]!.balance -= totalAmount
              state.players[playerIndex]!.holdings[assetId] = 
                (state.players[playerIndex]!.holdings[assetId] ?? 0) + quantity
              state.players[playerIndex]!.updatedAt = Date.now()
              
              // Bank receives payment
              state.players[bankIndex]!.balance += totalAmount
              state.players[bankIndex]!.updatedAt = Date.now()
            } else if (type === 'SELL') {
              // Player receives payment, loses asset
              state.players[playerIndex]!.balance += totalAmount
              state.players[playerIndex]!.holdings[assetId] = 
                (state.players[playerIndex]!.holdings[assetId] ?? 0) - quantity
              state.players[playerIndex]!.updatedAt = Date.now()
              
              // Bank pays
              state.players[bankIndex]!.balance -= totalAmount
              state.players[bankIndex]!.updatedAt = Date.now()
            }

            // Update current user if it's the same player
            if (state.currentUser?.id === playerId) {
              state.currentUser = state.players[playerIndex]!
            }

            // Add to trade history
            state.tradeHistory.push(trade)

            // Clear operation
            state.currentOperation = null
            state.isLoading = false
            state.lastUpdated = Date.now()
          })

          // Log event
          const actionVerb = type === 'BUY' ? 'compra' : 'vende'
          get().logEvent(
            'TRADE_EXECUTED',
            `${player.emoji} ${player.name} ${actionVerb} ${quantity}× ${asset.emoji} ${asset.name}`,
            { tradeId: trade.id, type, assetId, quantity, totalAmount }
          )

          markProcessed(idempotencyKey)
          return ok(trade)
        } catch (error) {
          const tradeError = error as TradeError
          
          set(state => {
            if (state.currentOperation) {
              state.currentOperation.status = 'FAILED'
              state.currentOperation.error = tradeError
              state.currentOperation.updatedAt = Date.now()
            }
            state.isLoading = false
          })

          // Clear operation after a delay
          setTimeout(() => {
            set(state => {
              state.currentOperation = null
            })
          }, 1000)

          return err(tradeError)
        }
      },

      executeP2PTransfer: async (
        fromId: string,
        toId: string,
        assetId: string,
        quantity: number
      ): Promise<Result<Trade, TradeError>> => {
        const idempotencyKey = generateIdempotencyKey()

        if (fromId === toId) {
          return err(createTradeError('SELF_TRADE_NOT_ALLOWED'))
        }

        if (get().currentOperation !== null) {
          return err(createTradeError('OPERATION_IN_PROGRESS'))
        }

        const operation: TradeOperation = {
          id: idempotencyKey,
          status: 'PENDING',
          type: 'P2P',
          payload: { playerId: fromId, assetId, quantity, type: 'P2P', counterpartyId: toId },
          error: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          retryCount: 0,
        }

        set(state => {
          state.currentOperation = operation
          state.isLoading = true
        })

        try {
          const state = get()
          const sender = state.players.find(p => p.id === fromId)
          const recipient = state.players.find(p => p.id === toId)
          const asset = state.assets[assetId]

          if (!sender) {
            throw createTradeError('PLAYER_NOT_FOUND', { playerId: fromId })
          }
          if (!recipient) {
            throw createTradeError('PLAYER_NOT_FOUND', { playerId: toId })
          }
          if (!asset) {
            throw createTradeError('ASSET_NOT_FOUND', { assetId })
          }
          if (quantity <= 0) {
            throw createTradeError('INVALID_QUANTITY', { quantity })
          }

          const senderHoldings = sender.holdings[assetId] ?? 0
          if (senderHoldings < quantity) {
            throw createTradeError('INSUFFICIENT_ASSETS', {
              required: quantity,
              available: senderHoldings,
            })
          }

          await new Promise(resolve => setTimeout(resolve, 100))

          const trade: Trade = {
            id: uuidv4(),
            type: 'P2P',
            playerId: fromId,
            assetId,
            quantity,
            pricePerUnit: asset.price,
            totalAmount: 0,
            counterpartyId: toId,
            status: 'CONFIRMED',
            error: null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            completedAt: Date.now(),
          }

          set(state => {
            const senderIndex = state.players.findIndex(p => p.id === fromId)
            const recipientIndex = state.players.findIndex(p => p.id === toId)

            if (senderIndex === -1 || recipientIndex === -1) return

            // Transfer asset
            state.players[senderIndex]!.holdings[assetId] = 
              (state.players[senderIndex]!.holdings[assetId] ?? 0) - quantity
            state.players[senderIndex]!.updatedAt = Date.now()

            state.players[recipientIndex]!.holdings[assetId] = 
              (state.players[recipientIndex]!.holdings[assetId] ?? 0) + quantity
            state.players[recipientIndex]!.updatedAt = Date.now()

            // Update current user if affected
            if (state.currentUser?.id === fromId) {
              state.currentUser = state.players[senderIndex]!
            } else if (state.currentUser?.id === toId) {
              state.currentUser = state.players[recipientIndex]!
            }

            state.tradeHistory.push(trade)
            state.currentOperation = null
            state.isLoading = false
            state.lastUpdated = Date.now()
          })

          get().logEvent(
            'P2P_TRANSFER',
            `${sender.emoji} ${sender.name} → ${recipient.emoji} ${recipient.name}: ${quantity}× ${asset.emoji} ${asset.name}`,
            { tradeId: trade.id, fromId, toId, assetId, quantity }
          )

          markProcessed(idempotencyKey)
          return ok(trade)
        } catch (error) {
          const tradeError = error as TradeError

          set(state => {
            if (state.currentOperation) {
              state.currentOperation.status = 'FAILED'
              state.currentOperation.error = tradeError
            }
            state.isLoading = false
          })

          setTimeout(() => {
            set(state => {
              state.currentOperation = null
            })
          }, 1000)

          return err(tradeError)
        }
      },

      // ==================== ADMIN - ASSETS ====================
      addAsset: (assetData) => {
        const id = assetData.name.toUpperCase().replace(/\s+/g, '_')
        
        if (get().assets[id]) {
          get().showToast({ message: 'Asset già esistente', type: 'error' })
          return
        }

        const asset: Asset = {
          ...assetData,
          id,
          priceHistory: [{ price: assetData.price, timestamp: Date.now() }],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        set(state => {
          state.assets[id] = asset
          state.lastUpdated = Date.now()
        })

        get().logEvent('ASSET_ADDED', `Nuovo asset: ${asset.emoji} ${asset.name}`, { assetId: id })
        get().showToast({ message: `Asset ${asset.name} aggiunto!`, type: 'success' })
      },

      removeAsset: (assetId: string) => {
        const asset = get().assets[assetId]
        if (!asset) return

        set(state => {
          delete state.assets[assetId]
          state.lastUpdated = Date.now()
        })

        get().logEvent('ASSET_REMOVED', `Asset eliminato: ${asset.emoji} ${asset.name}`, { assetId })
        get().showToast({ message: 'Asset eliminato', type: 'info' })
      },

      setAssetPrice: (assetId: string, newPrice: number) => {
        const asset = get().assets[assetId]
        if (!asset || newPrice <= 0) return

        const oldPrice = asset.price

        set(state => {
          const assetToUpdate = state.assets[assetId]
          if (assetToUpdate) {
            assetToUpdate.price = newPrice
            assetToUpdate.priceHistory.push({ price: newPrice, timestamp: Date.now() })
            assetToUpdate.updatedAt = Date.now()
          }
          state.lastUpdated = Date.now()
        })

        get().logEvent(
          'PRICE_CHANGED',
          `${asset.emoji} ${asset.name}: 🪙${oldPrice} → 🪙${newPrice}`,
          { assetId, oldPrice, newPrice }
        )
      },

      // ==================== ADMIN - PLAYERS ====================
      giveMoney: (playerId: string, amount: number) => {
        if (amount <= 0) return

        const state = get()
        const player = state.players.find(p => p.id === playerId)
        const bank = state.players.find(p => p.isBank)

        if (!player || !bank) return

        set(state => {
          const playerIndex = state.players.findIndex(p => p.id === playerId)
          const bankIndex = state.players.findIndex(p => p.isBank)

          if (playerIndex !== -1 && bankIndex !== -1) {
            state.players[playerIndex]!.balance += amount
            state.players[playerIndex]!.updatedAt = Date.now()
            state.players[bankIndex]!.balance -= amount
            state.players[bankIndex]!.updatedAt = Date.now()

            if (state.currentUser?.id === playerId) {
              state.currentUser = state.players[playerIndex]!
            }
          }
          state.lastUpdated = Date.now()
        })

        get().logEvent(
          'MONEY_GIVEN',
          `BANCA → ${player.emoji} ${player.name}: +🪙${amount}`,
          { playerId, amount }
        )
      },

      takeMoney: (playerId: string, amount: number) => {
        if (amount <= 0) return

        const state = get()
        const player = state.players.find(p => p.id === playerId)
        const bank = state.players.find(p => p.isBank)

        if (!player || !bank) return
        if (player.balance < amount) {
          get().showToast({ message: 'Fondi insufficienti', type: 'error' })
          return
        }

        set(state => {
          const playerIndex = state.players.findIndex(p => p.id === playerId)
          const bankIndex = state.players.findIndex(p => p.isBank)

          if (playerIndex !== -1 && bankIndex !== -1) {
            state.players[playerIndex]!.balance -= amount
            state.players[playerIndex]!.updatedAt = Date.now()
            state.players[bankIndex]!.balance += amount
            state.players[bankIndex]!.updatedAt = Date.now()

            if (state.currentUser?.id === playerId) {
              state.currentUser = state.players[playerIndex]!
            }
          }
          state.lastUpdated = Date.now()
        })

        get().logEvent(
          'MONEY_TAKEN',
          `${player.emoji} ${player.name} → BANCA: -🪙${amount}`,
          { playerId, amount }
        )
      },

      // ==================== ADMIN - MARKET ====================
      triggerMarketEvent: (eventType: MarketEventType) => {
        const multipliers: Record<MarketEventType, number> = {
          CRASH: 0.7,
          BOOM: 1.4,
          WEEKEND: 1.2,
        }
        const messages: Record<MarketEventType, string> = {
          CRASH: '💥 CRASH DEL MERCATO! -30%',
          BOOM: '🚀 BOOM DEL MERCATO! +40%',
          WEEKEND: '🎉 Weekend! Time Credits +20%',
        }

        const multiplier = multipliers[eventType]
        const message = messages[eventType]

        set(state => {
          if (eventType === 'WEEKEND') {
            // Only affect TIME_CREDITS
            const tc = state.assets['TIME_CREDITS']
            if (tc) {
              tc.price = Math.round(tc.price * multiplier)
              tc.priceHistory.push({ price: tc.price, timestamp: Date.now() })
              tc.updatedAt = Date.now()
            }
          } else {
            // Affect all assets
            Object.values(state.assets).forEach(asset => {
              asset.price = Math.max(1, Math.round(asset.price * multiplier))
              asset.priceHistory.push({ price: asset.price, timestamp: Date.now() })
              asset.updatedAt = Date.now()
            })
          }
          state.news = message
          state.lastUpdated = Date.now()
        })

        get().logEvent('MARKET_EVENT', message, { eventType, multiplier })
        get().showToast({ message, type: eventType === 'CRASH' ? 'warning' : 'success' })
      },

      sendAnnouncement: (message: string) => {
        if (!message.trim()) return

        set(state => {
          state.news = `📢 ORACLE: ${message}`
          state.lastUpdated = Date.now()
        })

        get().logEvent('ANNOUNCEMENT', message)
        get().showToast({ message: 'Annuncio inviato!', type: 'info' })
      },

      // ==================== UI ====================
      openModal: (type, data) => {
        set(state => {
          state.modal = { isOpen: true, type, data }
        })
      },

      closeModal: () => {
        set(state => {
          state.modal = { isOpen: false, type: null, data: undefined }
        })
      },

      showToast: (toast) => {
        set(state => {
          state.toast = { ...toast, isVisible: true }
        })

        // Auto-hide after 3 seconds
        setTimeout(() => {
          set(state => {
            state.toast.isVisible = false
          })
        }, 3000)
      },

      hideToast: () => {
        set(state => {
          state.toast.isVisible = false
        })
      },

      // ==================== EVENTS ====================
      logEvent: (type, message, data) => {
        set(state => {
          state.events.push({
            id: uuidv4(),
            type,
            message,
            data,
            timestamp: Date.now(),
          })
          // Keep only last 100 events
          if (state.events.length > 100) {
            state.events.shift()
          }
        })
      },

      // ==================== NAVIGATION ====================
      setAdminSection: (section: AdminSection) => {
        set(state => {
          state.adminSection = section
        })
      },

      setTraderTab: (tab: TraderTab) => {
        set(state => {
          state.traderTab = tab
        })
      },

      // ==================== WORK TOKENS ====================
      emitWorkToken: (params: {
        categoryId: string
        templateId: string
        issuedTo: string
        quality: WorkQuality
        customName?: string
        customValue?: number
      }) => {
        const { categoryId, templateId, issuedTo, quality, customName, customValue } = params
        const state = get()
        
        const category = state.workCategories.find(c => c.id === categoryId)
        const template = category?.templates.find(t => t.id === templateId)
        const player = state.players.find(p => p.id === issuedTo)
        const admin = state.currentUser

        if (!player || !admin) {
          get().showToast({ message: 'Errore: giocatore non trovato', type: 'error' })
          return
        }

        const name = customName ?? template?.name ?? 'Lavoro Custom'
        const emoji = template?.emoji ?? '📝'
        const baseValue = customValue ?? template?.baseValue ?? 10
        const multiplier = QUALITY_MULTIPLIERS[quality]
        const finalValue = Math.round(baseValue * multiplier)

        const token: WorkToken = {
          id: uuidv4(),
          categoryId,
          templateId,
          name,
          emoji,
          description: `${category?.name ?? 'Custom'}: ${name}`,
          baseValue,
          quality,
          qualityMultiplier: multiplier,
          finalValue,
          issuedTo,
          issuedBy: admin.id,
          issuedAt: Date.now(),
          redeemed: false,
          redeemedAt: null,
        }

        set(state => {
          state.workTokens.push(token)
          state.lastUpdated = Date.now()
        })

        get().logEvent(
          'TOKEN_ISSUED',
          `🎫 ${player.emoji} ${player.name} riceve: ${emoji} ${name} (🪙${finalValue})`,
          { tokenId: token.id, playerId: issuedTo, value: finalValue }
        )
        get().showToast({ 
          message: `Gettone emesso: ${emoji} ${name} → ${player.emoji}`, 
          type: 'success' 
        })
      },

      redeemWorkToken: (tokenId: string) => {
        const state = get()
        const token = state.workTokens.find(t => t.id === tokenId)
        
        if (!token) {
          get().showToast({ message: 'Gettone non trovato', type: 'error' })
          return
        }
        if (token.redeemed) {
          get().showToast({ message: 'Gettone già riscosso', type: 'warning' })
          return
        }

        const player = state.players.find(p => p.id === token.issuedTo)
        const bank = state.players.find(p => p.isBank)

        if (!player || !bank) return

        set(state => {
          const tokenIndex = state.workTokens.findIndex(t => t.id === tokenId)
          const playerIndex = state.players.findIndex(p => p.id === token.issuedTo)
          const bankIndex = state.players.findIndex(p => p.isBank)

          if (tokenIndex !== -1 && playerIndex !== -1 && bankIndex !== -1) {
            // Mark token as redeemed
            state.workTokens[tokenIndex]!.redeemed = true
            state.workTokens[tokenIndex]!.redeemedAt = Date.now()

            // Transfer money from bank to player
            state.players[playerIndex]!.balance += token.finalValue
            state.players[playerIndex]!.updatedAt = Date.now()
            state.players[bankIndex]!.balance -= token.finalValue
            state.players[bankIndex]!.updatedAt = Date.now()

            // Update current user if affected
            if (state.currentUser?.id === token.issuedTo) {
              state.currentUser = state.players[playerIndex]!
            }
          }
          state.lastUpdated = Date.now()
        })

        get().logEvent(
          'TOKEN_REDEEMED',
          `💰 ${player.emoji} ${player.name} riscuote: ${token.emoji} ${token.name} → +🪙${token.finalValue}`,
          { tokenId, playerId: player.id, value: token.finalValue }
        )
        get().showToast({ 
          message: `Riscosso: +🪙${token.finalValue}`, 
          type: 'success' 
        })
      },

      redeemAllTokens: (playerId: string) => {
        const state = get()
        const unredeemed = state.workTokens.filter(
          t => t.issuedTo === playerId && !t.redeemed
        )

        if (unredeemed.length === 0) {
          get().showToast({ message: 'Nessun gettone da riscuotere', type: 'info' })
          return
        }

        let totalValue = 0
        unredeemed.forEach(token => {
          get().redeemWorkToken(token.id)
          totalValue += token.finalValue
        })

        const player = state.players.find(p => p.id === playerId)
        if (player) {
          get().logEvent(
            'TOKEN_REDEEMED',
            `💰💰 ${player.emoji} ${player.name} riscuote ${unredeemed.length} gettoni → +🪙${totalValue}`,
            { playerId, count: unredeemed.length, totalValue }
          )
        }
      },

      revokeWorkToken: (tokenId: string) => {
        const state = get()
        const token = state.workTokens.find(t => t.id === tokenId)

        if (!token) {
          get().showToast({ message: 'Gettone non trovato', type: 'error' })
          return
        }
        if (token.redeemed) {
          get().showToast({ message: 'Impossibile revocare gettone già riscosso', type: 'error' })
          return
        }

        const player = state.players.find(p => p.id === token.issuedTo)

        set(state => {
          state.workTokens = state.workTokens.filter(t => t.id !== tokenId)
          state.lastUpdated = Date.now()
        })

        if (player) {
          get().logEvent(
            'TOKEN_REVOKED',
            `❌ Gettone revocato: ${token.emoji} ${token.name} da ${player.emoji} ${player.name}`,
            { tokenId, playerId: player.id }
          )
        }
        get().showToast({ message: 'Gettone revocato', type: 'info' })
      },

      // ==================== PERSISTENCE ====================
      resetState: () => {
        set(() => ({
          ...initialState,
          players: initialPlayers.map(p => ({ ...p, createdAt: Date.now(), updatedAt: Date.now() })),
          assets: Object.fromEntries(
            Object.entries(initialAssets).map(([id, asset]) => [
              id,
              { ...asset, createdAt: Date.now(), updatedAt: Date.now(), priceHistory: [{ price: asset.price, timestamp: Date.now() }] },
            ])
          ),
          lastUpdated: Date.now(),
        }))
      },
    })),
    {
      name: 'casa-exchange-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        players: state.players,
        assets: state.assets,
        workTokens: state.workTokens,
        workCategories: state.workCategories,
        tradeHistory: state.tradeHistory,
        events: state.events,
        news: state.news,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
)

// Selectors
export const selectBank = (state: Store) => state.players.find(p => p.isBank)
export const selectNonBankPlayers = (state: Store) => state.players.filter(p => !p.isBank)
export const selectAssetById = (assetId: string) => (state: Store) => state.assets[assetId]
export const selectPlayerById = (playerId: string) => (state: Store) => 
  state.players.find(p => p.id === playerId)

export const selectPlayerPortfolioValue = (playerId: string) => (state: Store) => {
  const player = state.players.find(p => p.id === playerId)
  if (!player) return 0
  
  return Object.entries(player.holdings).reduce((total, [assetId, qty]) => {
    const asset = state.assets[assetId]
    return total + (asset ? asset.price * qty : 0)
  }, 0)
}

// Helper function to compute economic metrics (pure, not a hook)
function computeEconomicMetrics(state: Store): EconomicMetrics {
  const nonBankPlayers = state.players.filter(p => !p.isBank)
  
  // M1: Cash in circulation (sum of all player balances)
  const M1 = nonBankPlayers.reduce((sum, p) => sum + p.balance, 0)
  
  // Unredeemed tokens value
  const unredeemedTokens = state.workTokens.filter(t => !t.redeemed)
  const unredeemedValue = unredeemedTokens.reduce((sum, t) => sum + t.finalValue, 0)
  
  // M2: M1 + unredeemed tokens (potential money supply)
  const M2 = M1 + unredeemedValue
  
  // Total asset value held by players
  const totalAssetValue = Object.values(state.assets).reduce((sum, asset) => {
    const totalQty = nonBankPlayers.reduce((qty, p) => qty + (p.holdings[asset.id] ?? 0), 0)
    return sum + asset.price * totalQty
  }, 0)

  // Inflation: (M2 / totalAssetValue) - 1
  const inflation = totalAssetValue > 0 ? ((M2 / totalAssetValue) - 1) * 100 : 0
  
  // GDP: total work tokens issued
  const gdp = state.workTokens.length
  
  // Calculate productivity (tokens per day, simplified)
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  const recentTokens = state.workTokens.filter(t => now - t.issuedAt < 7 * dayMs)
  const productivity = recentTokens.length / 7
  
  // Outstanding tokens
  const outstandingTokens = unredeemedTokens.length
  
  // Redemption rate
  const redemptionRate = state.workTokens.length > 0 
    ? (state.workTokens.filter(t => t.redeemed).length / state.workTokens.length) * 100 
    : 0

  // Inflation trend
  const inflationTrend: 'UP' | 'DOWN' | 'STABLE' = 
    inflation > 10 ? 'UP' : inflation < -10 ? 'DOWN' : 'STABLE'

  return {
    M1,
    M2,
    unredeemedValue,
    totalAssetValue,
    inflation: parseFloat(inflation.toFixed(2)),
    inflationTrend,
    playerCount: nonBankPlayers.length,
    totalTrades: state.tradeHistory.length,
    gdp,
    productivity: parseFloat(productivity.toFixed(2)),
    outstandingTokens,
    redemptionRate: parseFloat(redemptionRate.toFixed(2)),
  }
}

// Hook for components to use economic metrics with proper shallow comparison
export function useEconomicMetrics() {
  return useStore(
    useShallow((state: Store) => computeEconomicMetrics(state))
  )
}

// Legacy selector (avoid using in components - use useEconomicMetrics hook instead)
export const selectEconomicMetrics = computeEconomicMetrics

// Work Token Selectors
export const selectPlayerTokens = (playerId: string) => (state: Store) =>
  state.workTokens.filter(t => t.issuedTo === playerId)

export const selectUnredeemedPlayerTokens = (playerId: string) => (state: Store) =>
  state.workTokens.filter(t => t.issuedTo === playerId && !t.redeemed)

export const selectAllTokens = (state: Store) => state.workTokens

export const selectUnredeemedTokensValue = (playerId: string) => (state: Store) =>
  state.workTokens
    .filter(t => t.issuedTo === playerId && !t.redeemed)
    .reduce((sum, t) => sum + t.finalValue, 0)

