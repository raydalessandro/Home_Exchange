import type { TradeError, TradeErrorCode } from './index'

// Error factory functions for consistent error creation
export function createTradeError(
  code: TradeErrorCode,
  details?: Record<string, unknown>
): TradeError {
  const messages: Record<TradeErrorCode, string> = {
    INSUFFICIENT_FUNDS: 'Fondi insufficienti per completare l\'operazione',
    INSUFFICIENT_ASSETS: 'Asset insufficienti per completare la vendita',
    ASSET_NOT_FOUND: 'Asset non trovato',
    PLAYER_NOT_FOUND: 'Giocatore non trovato',
    OPERATION_IN_PROGRESS: 'Un\'altra operazione è già in corso',
    INVALID_QUANTITY: 'Quantità non valida',
    SELF_TRADE_NOT_ALLOWED: 'Non puoi fare trading con te stesso',
    VALIDATION_FAILED: 'Validazione fallita',
    UNKNOWN_ERROR: 'Si è verificato un errore sconosciuto',
  }

  return {
    code,
    message: messages[code],
    details,
  }
}

// Type guard for TradeError
export function isTradeError(error: unknown): error is TradeError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  )
}

// Get user-friendly error message
export function getErrorMessage(error: TradeError): string {
  switch (error.code) {
    case 'INSUFFICIENT_FUNDS': {
      const required = error.details?.required as number | undefined
      const available = error.details?.available as number | undefined
      if (required !== undefined && available !== undefined) {
        return `Fondi insufficienti: hai 🪙${available}, servono 🪙${required}`
      }
      return error.message
    }
    case 'INSUFFICIENT_ASSETS': {
      const required = error.details?.required as number | undefined
      const available = error.details?.available as number | undefined
      if (required !== undefined && available !== undefined) {
        return `Asset insufficienti: hai ${available}, servono ${required}`
      }
      return error.message
    }
    default:
      return error.message
  }
}

// Error severity for UI styling
export type ErrorSeverity = 'warning' | 'error' | 'critical'

export function getErrorSeverity(code: TradeErrorCode): ErrorSeverity {
  switch (code) {
    case 'INSUFFICIENT_FUNDS':
    case 'INSUFFICIENT_ASSETS':
    case 'INVALID_QUANTITY':
      return 'warning'
    case 'ASSET_NOT_FOUND':
    case 'PLAYER_NOT_FOUND':
    case 'VALIDATION_FAILED':
      return 'error'
    case 'OPERATION_IN_PROGRESS':
    case 'SELF_TRADE_NOT_ALLOWED':
    case 'UNKNOWN_ERROR':
      return 'critical'
  }
}

