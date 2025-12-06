import { z } from 'zod'
import type { TradePayload, Asset, Player } from '@/types'
import { createTradeError } from '@/types/errors'
import { ok, err } from '@/utils/result'
import type { Result, TradeError } from '@/types'

// ==================== ZOD SCHEMAS ====================

export const PlayerIdSchema = z.string().min(1, 'Player ID è richiesto')

export const AssetIdSchema = z.string().min(1, 'Asset ID è richiesto')

export const QuantitySchema = z.number()
  .positive('Quantità deve essere positiva')
  .int('Quantità deve essere un numero intero')

export const PriceSchema = z.number()
  .positive('Prezzo deve essere positivo')

export const TradePayloadSchema = z.object({
  playerId: PlayerIdSchema,
  assetId: AssetIdSchema,
  quantity: QuantitySchema,
  type: z.enum(['BUY', 'SELL', 'P2P']),
  counterpartyId: PlayerIdSchema.optional(),
})

export const NewAssetSchema = z.object({
  name: z.string().min(1, 'Nome è richiesto').max(50, 'Nome troppo lungo'),
  emoji: z.string().min(1, 'Emoji è richiesta').max(4, 'Emoji non valida'),
  description: z.string().max(200, 'Descrizione troppo lunga').optional(),
  price: PriceSchema,
  basePrice: PriceSchema,
  persistent: z.boolean(),
})

export const AnnouncementSchema = z.string()
  .min(1, 'Messaggio è richiesto')
  .max(200, 'Messaggio troppo lungo')

// ==================== VALIDATION FUNCTIONS ====================

export function validateTradePayload(payload: unknown): Result<TradePayload, TradeError> {
  const result = TradePayloadSchema.safeParse(payload)
  
  if (!result.success) {
    return err(createTradeError('VALIDATION_FAILED', {
      errors: result.error.errors.map(e => e.message),
    }))
  }
  
  return ok(result.data)
}

export function validateQuantity(quantity: unknown): Result<number, TradeError> {
  const result = QuantitySchema.safeParse(quantity)
  
  if (!result.success) {
    return err(createTradeError('INVALID_QUANTITY', {
      errors: result.error.errors.map(e => e.message),
    }))
  }
  
  return ok(result.data)
}

export function validatePrice(price: unknown): Result<number, TradeError> {
  const result = PriceSchema.safeParse(price)
  
  if (!result.success) {
    return err(createTradeError('VALIDATION_FAILED', {
      errors: result.error.errors.map(e => e.message),
    }))
  }
  
  return ok(result.data)
}

// ==================== PRE-FLIGHT CHECKS ====================

export interface TradeContext {
  player: Player
  asset: Asset
  bank: Player
}

export function checkPlayerExists(
  players: Player[],
  playerId: string
): Result<Player, TradeError> {
  const player = players.find(p => p.id === playerId)
  
  if (!player) {
    return err(createTradeError('PLAYER_NOT_FOUND', { playerId }))
  }
  
  return ok(player)
}

export function checkAssetExists(
  assets: Record<string, Asset>,
  assetId: string
): Result<Asset, TradeError> {
  const asset = assets[assetId]
  
  if (!asset) {
    return err(createTradeError('ASSET_NOT_FOUND', { assetId }))
  }
  
  return ok(asset)
}

export function checkSufficientFunds(
  player: Player,
  totalAmount: number
): Result<true, TradeError> {
  if (player.balance < totalAmount) {
    return err(createTradeError('INSUFFICIENT_FUNDS', {
      required: totalAmount,
      available: player.balance,
    }))
  }
  
  return ok(true)
}

export function checkSufficientAssets(
  player: Player,
  assetId: string,
  quantity: number
): Result<true, TradeError> {
  const holdings = player.holdings[assetId] ?? 0
  
  if (holdings < quantity) {
    return err(createTradeError('INSUFFICIENT_ASSETS', {
      required: quantity,
      available: holdings,
    }))
  }
  
  return ok(true)
}

export function checkNotSelfTrade(
  fromId: string,
  toId: string
): Result<true, TradeError> {
  if (fromId === toId) {
    return err(createTradeError('SELF_TRADE_NOT_ALLOWED'))
  }
  
  return ok(true)
}

// ==================== COMPOSITE VALIDATION ====================

export function validateBuyTrade(
  players: Player[],
  assets: Record<string, Asset>,
  payload: TradePayload
): Result<TradeContext, TradeError> {
  // Validate payload
  const payloadResult = validateTradePayload(payload)
  if (!payloadResult.ok) return payloadResult
  
  // Check player exists
  const playerResult = checkPlayerExists(players, payload.playerId)
  if (!playerResult.ok) return playerResult
  
  // Check asset exists
  const assetResult = checkAssetExists(assets, payload.assetId)
  if (!assetResult.ok) return assetResult
  
  // Check bank exists
  const bankResult = checkPlayerExists(players, 'bank')
  if (!bankResult.ok) return bankResult
  
  // Check sufficient funds
  const totalAmount = assetResult.value.price * payload.quantity
  const fundsResult = checkSufficientFunds(playerResult.value, totalAmount)
  if (!fundsResult.ok) return fundsResult
  
  return ok({
    player: playerResult.value,
    asset: assetResult.value,
    bank: bankResult.value,
  })
}

export function validateSellTrade(
  players: Player[],
  assets: Record<string, Asset>,
  payload: TradePayload
): Result<TradeContext, TradeError> {
  // Validate payload
  const payloadResult = validateTradePayload(payload)
  if (!payloadResult.ok) return payloadResult
  
  // Check player exists
  const playerResult = checkPlayerExists(players, payload.playerId)
  if (!playerResult.ok) return playerResult
  
  // Check asset exists
  const assetResult = checkAssetExists(assets, payload.assetId)
  if (!assetResult.ok) return assetResult
  
  // Check bank exists
  const bankResult = checkPlayerExists(players, 'bank')
  if (!bankResult.ok) return bankResult
  
  // Check sufficient assets
  const assetsResult = checkSufficientAssets(playerResult.value, payload.assetId, payload.quantity)
  if (!assetsResult.ok) return assetsResult
  
  return ok({
    player: playerResult.value,
    asset: assetResult.value,
    bank: bankResult.value,
  })
}

export function validateP2PTransfer(
  players: Player[],
  assets: Record<string, Asset>,
  fromId: string,
  toId: string,
  assetId: string,
  quantity: number
): Result<{ sender: Player; recipient: Player; asset: Asset }, TradeError> {
  // Check not self trade
  const selfResult = checkNotSelfTrade(fromId, toId)
  if (!selfResult.ok) return selfResult
  
  // Validate quantity
  const qtyResult = validateQuantity(quantity)
  if (!qtyResult.ok) return qtyResult
  
  // Check sender exists
  const senderResult = checkPlayerExists(players, fromId)
  if (!senderResult.ok) return senderResult
  
  // Check recipient exists
  const recipientResult = checkPlayerExists(players, toId)
  if (!recipientResult.ok) return recipientResult
  
  // Check asset exists
  const assetResult = checkAssetExists(assets, assetId)
  if (!assetResult.ok) return assetResult
  
  // Check sender has enough assets
  const assetsResult = checkSufficientAssets(senderResult.value, assetId, quantity)
  if (!assetsResult.ok) return assetsResult
  
  return ok({
    sender: senderResult.value,
    recipient: recipientResult.value,
    asset: assetResult.value,
  })
}

