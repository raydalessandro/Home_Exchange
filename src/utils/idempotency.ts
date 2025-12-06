import { v4 as uuidv4 } from 'uuid'

// Idempotency key management for preventing duplicate operations
const processedKeys = new Set<string>()
const KEY_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes

interface IdempotencyEntry {
  key: string
  timestamp: number
}

const keyTimestamps: IdempotencyEntry[] = []

// Generate a new idempotency key
export function generateIdempotencyKey(): string {
  return uuidv4()
}

// Check if an operation with this key has already been processed
export function isProcessed(key: string): boolean {
  cleanupExpiredKeys()
  return processedKeys.has(key)
}

// Mark an operation as processed
export function markProcessed(key: string): void {
  processedKeys.add(key)
  keyTimestamps.push({ key, timestamp: Date.now() })
}

// Remove an operation from processed (for rollback scenarios)
export function unmarkProcessed(key: string): void {
  processedKeys.delete(key)
  const index = keyTimestamps.findIndex(entry => entry.key === key)
  if (index !== -1) {
    keyTimestamps.splice(index, 1)
  }
}

// Cleanup expired keys to prevent memory leaks
function cleanupExpiredKeys(): void {
  const now = Date.now()
  while (keyTimestamps.length > 0) {
    const oldest = keyTimestamps[0]
    if (oldest && now - oldest.timestamp > KEY_EXPIRY_MS) {
      processedKeys.delete(oldest.key)
      keyTimestamps.shift()
    } else {
      break
    }
  }
}

// Generate a deterministic key based on operation parameters
// Useful for detecting duplicate intentional operations
export function generateOperationKey(
  type: string,
  playerId: string,
  assetId: string,
  quantity: number,
  timestamp: number
): string {
  const roundedTimestamp = Math.floor(timestamp / 1000) // 1 second granularity
  return `${type}-${playerId}-${assetId}-${quantity}-${roundedTimestamp}`
}

// Check if an operation looks like a duplicate within a time window
export function isDuplicateOperation(
  type: string,
  playerId: string,
  assetId: string,
  quantity: number,
  windowMs: number = 2000
): boolean {
  const now = Date.now()
  const windowStart = now - windowMs
  
  for (const entry of keyTimestamps) {
    if (entry.timestamp >= windowStart) {
      const expectedKey = generateOperationKey(type, playerId, assetId, quantity, entry.timestamp)
      if (processedKeys.has(expectedKey)) {
        return true
      }
    }
  }
  
  return false
}

