import type { Player, Asset, EconomicMetrics, WorkToken } from '@/types'

/**
 * Calculate M1 (cash in circulation)
 * Excludes the bank's balance
 */
export function calculateM1(players: Player[]): number {
  return players
    .filter(p => !p.isBank)
    .reduce((sum, p) => sum + p.balance, 0)
}

/**
 * Calculate unredeemed tokens value
 */
export function calculateUnredeemedValue(workTokens: WorkToken[]): number {
  return workTokens
    .filter(t => !t.redeemed)
    .reduce((sum, t) => sum + t.finalValue, 0)
}

/**
 * Calculate M2 (M1 + unredeemed tokens)
 */
export function calculateM2(players: Player[], workTokens: WorkToken[] = []): number {
  return calculateM1(players) + calculateUnredeemedValue(workTokens)
}

/**
 * Calculate total value of all assets held by non-bank players
 */
export function calculateTotalAssetValue(
  players: Player[],
  assets: Record<string, Asset>
): number {
  const nonBankPlayers = players.filter(p => !p.isBank)
  
  return Object.values(assets).reduce((sum, asset) => {
    const totalQty = nonBankPlayers.reduce(
      (qty, p) => qty + (p.holdings[asset.id] ?? 0),
      0
    )
    return sum + asset.price * totalQty
  }, 0)
}

/**
 * Calculate portfolio value for a single player
 */
export function calculatePortfolioValue(
  player: Player,
  assets: Record<string, Asset>
): number {
  return Object.entries(player.holdings).reduce((total, [assetId, qty]) => {
    const asset = assets[assetId]
    return total + (asset ? asset.price * qty : 0)
  }, 0)
}

/**
 * Calculate work production value (completed/redeemed work tokens)
 * This represents the PRODUCTION side of the economy
 */
export function calculateWorkProduction(workTokens: WorkToken[]): number {
  return workTokens
    .filter(t => t.redeemed)
    .reduce((sum, t) => sum + t.finalValue, 0)
}

/**
 * Calculate total economy value (assets + work production)
 */
export function calculateEconomyValue(totalAssetValue: number, workProduction: number): number {
  return totalAssetValue + workProduction
}

/**
 * Calculate inflation rate
 * NEW FORMULA: inflation = ((M2 / economyValue) - 1) * 100
 * Where economyValue = totalAssetValue + workProduction
 * 
 * This balances money supply (M2) against:
 * - Goods purchased (totalAssetValue)
 * - Services rendered (workProduction)
 */
export function calculateInflation(M2: number, economyValue: number): number {
  if (economyValue <= 0) return 0
  return ((M2 / economyValue) - 1) * 100
}

/**
 * Get inflation trend indicator
 */
export function getInflationTrend(inflation: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (inflation < 5) return 'LOW'
  if (inflation < 15) return 'MEDIUM'
  if (inflation < 30) return 'HIGH'
  return 'CRITICAL'
}

/**
 * Calculate all economic metrics
 */
export function calculateEconomicMetrics(
  players: Player[],
  assets: Record<string, Asset>,
  tradeCount: number,
  workTokens: WorkToken[] = []
): EconomicMetrics {
  const nonBankPlayers = players.filter(p => !p.isBank)
  const M1 = calculateM1(players)
  const unredeemedValue = calculateUnredeemedValue(workTokens)
  const M2 = M1 + unredeemedValue
  const totalAssetValue = calculateTotalAssetValue(players, assets)
  
  // NEW: Work production = value of completed/redeemed work
  const workProduction = calculateWorkProduction(workTokens)
  
  // NEW: Economy value = goods + services
  const economyValue = calculateEconomyValue(totalAssetValue, workProduction)
  
  // NEW: Inflation uses economyValue (not just assets)
  const inflation = calculateInflation(M2, economyValue)
  
  // GDP = total work tokens issued (count)
  const gdp = workTokens.length
  
  // Productivity: tokens per day over last 7 days
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  const recentTokens = workTokens.filter(t => now - t.issuedAt < 7 * dayMs)
  const productivity = recentTokens.length / 7
  
  // Outstanding tokens
  const outstandingTokens = workTokens.filter(t => !t.redeemed).length
  
  // Redemption rate
  const redemptionRate = workTokens.length > 0 
    ? (workTokens.filter(t => t.redeemed).length / workTokens.length) * 100 
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
    totalTrades: tradeCount,
    gdp,
    productivity: parseFloat(productivity.toFixed(2)),
    outstandingTokens,
    redemptionRate: parseFloat(redemptionRate.toFixed(2)),
  }
}

/**
 * Market event multipliers
 */
export const MARKET_EVENT_MULTIPLIERS = {
  CRASH: 0.7,
  BOOM: 1.4,
  WEEKEND: 1.2,
} as const

/**
 * Apply market event to assets
 */
export function applyMarketEvent(
  assets: Record<string, Asset>,
  eventType: 'CRASH' | 'BOOM' | 'WEEKEND'
): Record<string, Asset> {
  const multiplier = MARKET_EVENT_MULTIPLIERS[eventType]
  const now = Date.now()
  
  const updatedAssets: Record<string, Asset> = {}
  
  for (const [id, asset] of Object.entries(assets)) {
    // Weekend only affects TIME_CREDITS
    if (eventType === 'WEEKEND' && id !== 'TIME_CREDITS') {
      updatedAssets[id] = asset
      continue
    }
    
    const newPrice = Math.max(1, Math.round(asset.price * multiplier))
    
    updatedAssets[id] = {
      ...asset,
      price: newPrice,
      priceHistory: [...asset.priceHistory, { price: newPrice, timestamp: now }],
      updatedAt: now,
    }
  }
  
  return updatedAssets
}

/**
 * Calculate net worth for a player
 */
export function calculateNetWorth(
  player: Player,
  assets: Record<string, Asset>
): number {
  const portfolioValue = calculatePortfolioValue(player, assets)
  return player.balance + portfolioValue
}

/**
 * Get leaderboard sorted by net worth
 */
export function getLeaderboard(
  players: Player[],
  assets: Record<string, Asset>
): Array<{ player: Player; netWorth: number; rank: number }> {
  const nonBankPlayers = players.filter(p => !p.isBank)
  
  return nonBankPlayers
    .map(player => ({
      player,
      netWorth: calculateNetWorth(player, assets),
      rank: 0,
    }))
    .sort((a, b) => b.netWorth - a.netWorth)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))
}

