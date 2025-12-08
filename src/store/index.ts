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
  AppEvent,
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

      // ==================== WORK PRICE CONTROLS (ADMIN) ====================

      setTemplatePrice: (categoryId: string, templateId: string, newValue: number) => {
        if (newValue < 1) {
          get().showToast({ message: 'Il valore minimo è 1', type: 'error' })
          return
        }

        set(state => {
          const category = state.workCategories.find(c => c.id === categoryId)
          if (!category) return

          const template = category.templates.find(t => t.id === templateId)
          if (!template) return

          const oldValue = template.currentValue
          template.currentValue = newValue
          template.priceHistory.push({ price: newValue, timestamp: Date.now() })
          state.lastUpdated = Date.now()

          // Log event
          get().logEvent(
            'PRICE_CHANGED',
            `💼 Prezzo ${template.emoji} ${template.name}: 🪙${oldValue} → 🪙${newValue}`,
            { categoryId, templateId, oldValue, newValue }
          )
        })

        get().showToast({ message: 'Prezzo template aggiornato', type: 'success' })
      },

      setCategoryMultiplier: (categoryId: string, multiplier: number) => {
        if (multiplier < 0.1 || multiplier > 5) {
          get().showToast({ message: 'Moltiplicatore deve essere tra 0.1 e 5', type: 'error' })
          return
        }

        set(state => {
          const category = state.workCategories.find(c => c.id === categoryId)
          if (!category) return

          const oldMultiplier = category.priceMultiplier
          category.priceMultiplier = multiplier

          // Applica il moltiplicatore a tutti i template della categoria
          category.templates.forEach(template => {
            const newValue = Math.round(template.baseValue * multiplier)
            template.currentValue = Math.max(1, newValue)
            template.priceHistory.push({ price: template.currentValue, timestamp: Date.now() })
          })

          state.lastUpdated = Date.now()

          get().logEvent(
            'PRICE_CHANGED',
            `📊 Categoria ${category.emoji} ${category.name}: moltiplicatore ${oldMultiplier}x → ${multiplier}x`,
            { categoryId, oldMultiplier, multiplier }
          )
        })

        get().showToast({ message: 'Moltiplicatore categoria aggiornato', type: 'success' })
      },

      triggerWorkMarketEvent: (event: 'WORK_BOOM' | 'WORK_CRASH') => {
        const multiplier = event === 'WORK_BOOM' ? 1.2 : 0.8
        const emoji = event === 'WORK_BOOM' ? '📈' : '📉'
        const label = event === 'WORK_BOOM' ? 'BOOM LAVORI (+20%)' : 'CRASH LAVORI (-20%)'

        set(state => {
          state.workCategories.forEach(category => {
            category.priceMultiplier = Math.round(category.priceMultiplier * multiplier * 100) / 100
            category.templates.forEach(template => {
              const newValue = Math.round(template.currentValue * multiplier)
              template.currentValue = Math.max(1, newValue)
              template.priceHistory.push({ price: template.currentValue, timestamp: Date.now() })
            })
          })
          state.lastUpdated = Date.now()
        })

        get().logEvent(
          'MARKET_EVENT',
          `${emoji} ${label} - Tutti i prezzi lavoro modificati!`,
          { event, multiplier }
        )
        get().sendAnnouncement(`${emoji} ${label}!`)
        get().showToast({ message: label, type: event === 'WORK_BOOM' ? 'success' : 'warning' })
      },

      // ==================== CALENDAR MODULE ====================

      createBooking: (params) => {
        const state = get()
        const currentUser = state.currentUser
        
        if (!currentUser) {
          state.showToast({ message: 'Devi essere loggato', type: 'error' })
          return
        }

        // Trova i nomi dei collaboratori
        const collaboratorNames = (params.collaboratorIds || []).map(id => {
          const player = state.players.find(p => p.id === id)
          return player?.name || 'Sconosciuto'
        })

        const booking = {
          id: uuidv4(),
          templateId: params.templateId,
          categoryId: params.categoryId,
          templateName: params.templateName,
          templateEmoji: params.templateEmoji,
          baseValue: params.baseValue,
          bookedBy: currentUser.id,
          bookedByName: currentUser.name,
          scheduledDate: params.scheduledDate,
          scheduledTime: params.scheduledTime,
          status: 'BOOKED' as const,
          collaborators: params.collaboratorIds || [],
          collaboratorNames,
          createdAt: Date.now(),
          p2pTransfers: [],
        }

        set(state => {
          state.bookings.push(booking)
          state.lastUpdated = Date.now()
        })

        const collabText = collaboratorNames.length > 0 
          ? ` con ${collaboratorNames.join(', ')}` 
          : ''
        
        get().logEvent(
          'BOOKING_CREATED',
          `📅 ${currentUser.name} ha prenotato ${params.templateEmoji} ${params.templateName} per ${params.scheduledDate}${collabText}`,
          { bookingId: booking.id }
        )
        
        get().showToast({ message: 'Prenotazione creata!', type: 'success' })
      },

      markBookingDone: (bookingId: string) => {
        const state = get()
        const currentUser = state.currentUser
        const booking = state.bookings.find(b => b.id === bookingId)

        if (!currentUser || !booking) {
          state.showToast({ message: 'Prenotazione non trovata', type: 'error' })
          return
        }

        const canMark = booking.bookedBy === currentUser.id || 
                        booking.collaborators.includes(currentUser.id)
        
        if (!canMark) {
          state.showToast({ message: 'Non sei autorizzato', type: 'error' })
          return
        }

        if (booking.status !== 'BOOKED') {
          state.showToast({ message: 'Prenotazione non in stato valido', type: 'error' })
          return
        }

        set(state => {
          const b = state.bookings.find(b => b.id === bookingId)
          if (b) {
            b.status = 'MARKED_DONE'
            b.markedDoneAt = Date.now()
            b.markedDoneBy = currentUser.id
          }
          state.lastUpdated = Date.now()
        })

        get().logEvent(
          'BOOKING_MARKED_DONE',
          `✅ ${currentUser.name} ha completato ${booking.templateEmoji} ${booking.templateName}`,
          { bookingId }
        )
        
        get().showToast({ message: 'Segnato come fatto! In attesa di conferma admin.', type: 'success' })
      },

      confirmBooking: (bookingId: string) => {
        const state = get()
        const currentUser = state.currentUser
        const booking = state.bookings.find(b => b.id === bookingId)

        if (!currentUser?.isAdmin) {
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
        get().emitWorkToken({
          categoryId: booking.categoryId,
          templateId: booking.templateId,
          issuedTo: booking.bookedBy,
          quality: 'BASIC',
          customName: `${booking.templateName} (Calendario)`,
          customValue: value,
        })

        const tokenId = `calendar-${bookingId}`

        set(state => {
          const b = state.bookings.find(b => b.id === bookingId)
          if (b) {
            b.status = 'CONFIRMED'
            b.confirmedAt = Date.now()
            b.confirmedBy = currentUser.id
            b.tokenId = tokenId
          }
          state.lastUpdated = Date.now()
        })

        get().logEvent(
          'BOOKING_CONFIRMED',
          `🎫 Admin ha confermato ${booking.templateEmoji} ${booking.templateName} di ${booking.bookedByName} (+🪙${value})`,
          { bookingId, value }
        )
        
        get().showToast({ message: `Confermato! Gettone di 🪙${value} emesso.`, type: 'success' })
      },

      cancelBooking: (bookingId: string) => {
        const state = get()
        const currentUser = state.currentUser
        const booking = state.bookings.find(b => b.id === bookingId)

        if (!currentUser || !booking) {
          state.showToast({ message: 'Prenotazione non trovata', type: 'error' })
          return
        }

        const canCancel = booking.bookedBy === currentUser.id || currentUser.isAdmin
        
        if (!canCancel) {
          state.showToast({ message: 'Non sei autorizzato', type: 'error' })
          return
        }

        if (booking.status === 'CONFIRMED' || booking.status === 'CANCELLED') {
          state.showToast({ message: 'Non puoi cancellare questa prenotazione', type: 'error' })
          return
        }

        set(state => {
          const b = state.bookings.find(b => b.id === bookingId)
          if (b) {
            b.status = 'CANCELLED'
          }
          state.lastUpdated = Date.now()
        })

        get().logEvent(
          'BOOKING_CANCELLED',
          `❌ ${currentUser.name} ha cancellato ${booking.templateEmoji} ${booking.templateName}`,
          { bookingId }
        )
        
        get().showToast({ message: 'Prenotazione cancellata', type: 'info' })
      },

      payCollaborator: (params) => {
        const state = get()
        const currentUser = state.currentUser
        const booking = state.bookings.find(b => b.id === params.bookingId)

        if (!currentUser || !booking) {
          state.showToast({ message: 'Prenotazione non trovata', type: 'error' })
          return
        }

        if (booking.bookedBy !== currentUser.id) {
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

        const fromPlayer = state.players.find(p => p.id === currentUser.id)
        const toPlayer = state.players.find(p => p.id === params.toPlayerId)

        if (!fromPlayer || !toPlayer) {
          state.showToast({ message: 'Player non trovato', type: 'error' })
          return
        }

        if (fromPlayer.balance < params.amount) {
          state.showToast({ message: 'Saldo insufficiente', type: 'error' })
          return
        }

        const transfer = {
          id: uuidv4(),
          from: currentUser.id,
          fromName: currentUser.name,
          to: params.toPlayerId,
          toName: toPlayer.name,
          amount: params.amount,
          bookingId: params.bookingId,
          templateName: booking.templateName,
          timestamp: Date.now(),
        }

        set(state => {
          // Update balances
          const from = state.players.find(p => p.id === currentUser.id)
          const to = state.players.find(p => p.id === params.toPlayerId)
          if (from) from.balance -= params.amount
          if (to) to.balance += params.amount
          
          // Record transfer
          state.collabTransfers.push(transfer)
          
          // Add to booking
          const b = state.bookings.find(b => b.id === params.bookingId)
          if (b) {
            b.p2pTransfers.push(transfer)
          }
          
          state.lastUpdated = Date.now()
        })

        get().logEvent(
          'COLLAB_PAYMENT',
          `💸 ${currentUser.name} ha pagato 🪙${params.amount} a ${toPlayer.name} per ${booking.templateEmoji} ${booking.templateName}`,
          { bookingId: params.bookingId, transfer }
        )
        
        get().showToast({ message: `Pagato 🪙${params.amount} a ${toPlayer.name}!`, type: 'success' })
      },

      applyInactivityPenalty: (playerId: string, date: string) => {
        const state = get()
        const currentUser = state.currentUser
        const PENALTY_AMOUNT = 5

        if (!currentUser?.isAdmin) {
          state.showToast({ message: 'Solo admin può applicare penalità', type: 'error' })
          return
        }

        const player = state.players.find(p => p.id === playerId)
        if (!player) {
          state.showToast({ message: 'Player non trovato', type: 'error' })
          return
        }

        // Check if already applied
        const alreadyApplied = state.inactivityPenalties.some(
          p => p.playerId === playerId && p.date === date
        )
        if (alreadyApplied) {
          state.showToast({ message: 'Penalità già applicata per questo giorno', type: 'warning' })
          return
        }

        const penalty = {
          id: uuidv4(),
          playerId,
          playerName: player.name,
          date,
          amount: PENALTY_AMOUNT,
          appliedAt: Date.now(),
          appliedBy: currentUser.id,
          appliedByName: currentUser.name,
        }

        set(state => {
          const p = state.players.find(p => p.id === playerId)
          if (p) p.balance -= PENALTY_AMOUNT
          state.inactivityPenalties.push(penalty)
          state.lastUpdated = Date.now()
        })

        get().logEvent(
          'INACTIVITY_PENALTY',
          `⚠️ Penalità inattività: ${player.name} -🪙${PENALTY_AMOUNT} per ${date}`,
          { penalty }
        )
        
        get().showToast({ message: `Penalità di 🪙${PENALTY_AMOUNT} applicata a ${player.name}`, type: 'warning' })
      },

      getBookingsForDate: (date: string) => {
        return get().bookings.filter(b => 
          b.scheduledDate === date && b.status !== 'CANCELLED'
        )
      },

      getBookingsForPlayer: (playerId: string) => {
        return get().bookings.filter(b => 
          (b.bookedBy === playerId || b.collaborators.includes(playerId)) &&
          b.status !== 'CANCELLED'
        )
      },

      getPendingConfirmations: () => {
        return get().bookings.filter(b => b.status === 'MARKED_DONE')
      },

      getInactivityReport: (date: string) => {
        const state = get()
        const childPlayers = state.players.filter(p => !p.isBank && !p.isAdmin)
        
        return childPlayers.map(player => {
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
            playerEmoji: player.emoji,
            date,
            hasActivity: hasBooking,
            penaltyApplied,
            penaltyAmount: 5,
          }
        })
      },

      getUnpaidCollaborators: (bookingId: string) => {
        const state = get()
        const booking = state.bookings.find(b => b.id === bookingId)
        
        if (!booking) return []
        
        const paidCollaborators = booking.p2pTransfers.map(t => t.to)
        return booking.collaborators.filter(c => !paidCollaborators.includes(c))
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
        // Calendar Module
        bookings: state.bookings,
        collabTransfers: state.collabTransfers,
        inactivityPenalties: state.inactivityPenalties,
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

  // NEW: Work production = value of completed/redeemed work (PRODUZIONE)
  const workProduction = state.workTokens
    .filter(t => t.redeemed)
    .reduce((sum, t) => sum + t.finalValue, 0)
  
  // NEW: Economy value = goods (asset) + services (work)
  const economyValue = totalAssetValue + workProduction

  // NEW: Inflation based on economy value (not just assets)
  // inflation = (M2 / economyValue) - 1
  const inflation = economyValue > 0 ? ((M2 / economyValue) - 1) * 100 : 0
  
  // GDP: total work tokens issued (count)
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
    workProduction,
    economyValue,
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

// ==================== SEED HISTORICAL DATA ====================
// Funzione per generare e iniettare dati storici di test
export function seedHistoricalData(days: number = 60) {
  const store = useStore.getState()
  const now = Date.now()
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  const startDate = now - (days * MS_PER_DAY)
  
  // Configurazione lavori
  const WORK_PATTERNS = [
    { category: 'KITCHEN', template: 'clear_table', value: 5, emoji: '🍽️', name: 'Sparecchiare', freq: 0.9 },
    { category: 'KITCHEN', template: 'wash_dishes', value: 10, emoji: '🧽', name: 'Lavare piatti', freq: 0.7 },
    { category: 'KITCHEN', template: 'cook_meal', value: 20, emoji: '👨‍🍳', name: 'Cucinare', freq: 0.3 },
    { category: 'CLEANING', template: 'vacuum', value: 15, emoji: '🧹', name: 'Aspirapolvere', freq: 0.4 },
    { category: 'CLEANING', template: 'tidy_room', value: 10, emoji: '🛏️', name: 'Sistemare camera', freq: 0.8 },
    { category: 'CLEANING', template: 'bathroom', value: 20, emoji: '🚿', name: 'Pulire bagno', freq: 0.2 },
    { category: 'OUTDOOR', template: 'trash', value: 5, emoji: '🗑️', name: 'Portare spazzatura', freq: 0.5 },
    { category: 'STUDY', template: 'homework', value: 15, emoji: '📚', name: 'Compiti', freq: 0.85 },
    { category: 'STUDY', template: 'reading', value: 10, emoji: '📖', name: 'Lettura', freq: 0.4 },
  ]
  
  const QUALITIES: WorkQuality[] = ['BASIC', 'GOOD', 'EXCELLENT', 'PERFECT']
  const QUALITY_WEIGHTS = [0.4, 0.35, 0.2, 0.05]
  
  const childPlayers = store.players.filter(p => !p.isBank && !p.isAdmin)
  if (childPlayers.length === 0) {
    console.error('❌ Nessun giocatore figlio trovato!')
    return
  }
  
  const newTokens: WorkToken[] = []
  const newEvents: AppEvent[] = []
  const balanceChanges: Record<string, number> = {}
  
  childPlayers.forEach(p => { balanceChanges[p.id] = 0 })
  
  // Genera dati giorno per giorno
  for (let day = 0; day < days; day++) {
    const dayTimestamp = startDate + (day * MS_PER_DAY)
    const isWeekend = new Date(dayTimestamp).getDay() === 0 || new Date(dayTimestamp).getDay() === 6
    
    for (const work of WORK_PATTERNS) {
      let freq = work.freq
      if (isWeekend) {
        freq = work.category === 'STUDY' ? freq * 0.3 : freq * 1.3
      }
      
      if (Math.random() > freq) continue
      
      const player = childPlayers[Math.floor(Math.random() * childPlayers.length)]
      if (!player) continue
      
      // Scegli qualità
      const rand = Math.random()
      let cumulative = 0
      let quality: WorkQuality = 'BASIC'
      for (let i = 0; i < QUALITIES.length; i++) {
        const weight = QUALITY_WEIGHTS[i]
        const q = QUALITIES[i]
        if (weight === undefined || q === undefined) continue
        cumulative += weight
        if (rand <= cumulative) {
          quality = q
          break
        }
      }
      
      const finalValue = Math.round(work.value * QUALITY_MULTIPLIERS[quality])
      const tokenTime = dayTimestamp + (14 + Math.floor(Math.random() * 8)) * 3600000 + Math.floor(Math.random() * 3600000)
      
      // 80% riscossi entro 2 giorni
      const willRedeem = Math.random() < 0.8
      const redeemTime = willRedeem ? tokenTime + Math.floor(Math.random() * 2 * MS_PER_DAY) : null
      const isRedeemed = redeemTime !== null && redeemTime < now
      
      const token: WorkToken = {
        id: `hist-${day}-${work.template}-${Math.random().toString(36).substr(2, 6)}`,
        categoryId: work.category,
        templateId: work.template,
        name: work.name,
        emoji: work.emoji,
        description: work.name,
        baseValue: work.value,
        quality,
        qualityMultiplier: QUALITY_MULTIPLIERS[quality],
        finalValue,
        issuedTo: player.id,
        issuedBy: 'papa',
        issuedAt: tokenTime,
        redeemed: isRedeemed,
        redeemedAt: isRedeemed && redeemTime ? redeemTime : null,
      }
      
      newTokens.push(token)
      
      if (isRedeemed) {
        balanceChanges[player.id] = (balanceChanges[player.id] ?? 0) + finalValue
      }
      
      newEvents.push({
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        type: 'TOKEN_EMITTED' as EventType,
        message: `🎫 ${work.emoji} ${work.name} emesso per ${player.name} (🪙${finalValue})`,
        timestamp: tokenTime,
      })
      
      if (isRedeemed && redeemTime) {
        newEvents.push({
          id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          type: 'TOKEN_REDEEMED' as EventType,
          message: `💵 ${player.name} ha riscosso ${work.name} (🪙${finalValue})`,
          timestamp: redeemTime,
        })
      }
    }
  }
  
  // Ordina per timestamp
  newTokens.sort((a, b) => a.issuedAt - b.issuedAt)
  newEvents.sort((a, b) => a.timestamp - b.timestamp)
  
  // Calcola statistiche
  const totalEmitted = newTokens.reduce((s, t) => s + t.finalValue, 0)
  const totalRedeemed = newTokens.filter(t => t.redeemed).reduce((s, t) => s + t.finalValue, 0)
  const pendingValue = totalEmitted - totalRedeemed
  const pendingCount = newTokens.filter(t => !t.redeemed).length
  
  console.log('\n📊 === SIMULAZIONE STORICO ===')
  console.log(`📅 Giorni simulati: ${days}`)
  console.log(`🎫 Token emessi: ${newTokens.length}`)
  console.log(`💰 Valore totale emesso: 🪙${totalEmitted}`)
  console.log(`💵 Valore riscosso: 🪙${totalRedeemed}`)
  console.log(`⏳ Token pending: ${pendingCount} (🪙${pendingValue})`)
  console.log(`📈 Tasso riscossione: ${Math.round((totalRedeemed / totalEmitted) * 100)}%`)
  console.log(`📊 Media token/giorno: ${(newTokens.length / days).toFixed(1)}`)
  console.log(`💎 Media valore/giorno: 🪙${Math.round(totalEmitted / days)}`)
  console.log('\n👤 Per giocatore:')
  childPlayers.forEach(p => {
    const playerTokens = newTokens.filter(t => t.issuedTo === p.id)
    const playerEmitted = playerTokens.reduce((s, t) => s + t.finalValue, 0)
    const playerRedeemed = playerTokens.filter(t => t.redeemed).reduce((s, t) => s + t.finalValue, 0)
    console.log(`   ${p.emoji} ${p.name}: ${playerTokens.length} token, 🪙${playerEmitted} emessi, 🪙${playerRedeemed} riscossi`)
  })
  
  // Inietta nello store
  useStore.setState(state => ({
    ...state,
    workTokens: [...state.workTokens, ...newTokens],
    events: [...state.events, ...newEvents].sort((a, b) => b.timestamp - a.timestamp).slice(0, 500),
    players: state.players.map(p => {
      const change = balanceChanges[p.id]
      if (change && change > 0) {
        return { ...p, balance: p.balance + change }
      }
      return p
    }),
  }))
  
  console.log('\n✅ Dati storici iniettati con successo!')
  console.log('🔄 Ricarica la pagina o controlla la Dashboard per vedere le metriche aggiornate.')
  
  return { tokens: newTokens.length, emitted: totalEmitted, redeemed: totalRedeemed, pending: pendingValue }
}

// Esponi globalmente per la console del browser
if (typeof window !== 'undefined') {
  (window as any).seedHistory = seedHistoricalData;
  (window as any).clearHistory = () => {
    useStore.setState(state => ({
      ...state,
      workTokens: [],
      events: [],
      players: state.players.map(p => p.isBank ? p : { ...p, balance: 100 }),
    }))
    console.log('🗑️ Storico cancellato, bilanci resettati a 100')
  };
  (window as any).store = useStore
  console.log('🎮 Casa Exchange Debug Tools:')
  console.log('   seedHistory(60)  - Genera 60 giorni di storico')
  console.log('   clearHistory()   - Cancella lo storico')
  console.log('   store.getState() - Visualizza lo stato')
}

