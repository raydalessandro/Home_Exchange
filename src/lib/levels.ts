import type { Asset, Player, PlayerLevel, WorkTemplate } from '@/types'

// ==================== LIVELLI DI CRESCITA ====================
// Ogni bambino ha un livello impostato dall'admin (pannello Giocatori).
// Il livello determina quali funzioni vede: si parte semplicissimi (4-5 anni)
// e si arriva all'esperienza completa quando crescono.

export interface LevelFeatures {
  /** UI ultra-semplificata (KidView): niente tab, bottoni giganti */
  simpleMode: boolean
  /** Può comprare premi dalla banca */
  canBuy: boolean
  /** Può rivendere alla banca */
  canSell: boolean
  /** Può scambiare con fratelli/sorelle (P2P) */
  canP2P: boolean
  /** Vede e usa il calendario prenotazioni */
  canCalendar: boolean
  /** Può aggiungere collaboratori alle prenotazioni */
  canCollaborate: boolean
  /** Vede la tab statistiche */
  canStats: boolean
  /** Vede il news ticker degli eventi di mercato */
  showNews: boolean
  /** Vede dettagli di mercato avanzati (supply, spread, persistenza) */
  showMarketDetails: boolean
}

export interface LevelConfig {
  id: PlayerLevel
  name: string
  emoji: string
  ageHint: string
  description: string
  features: LevelFeatures
}

export const LEVELS: Record<PlayerLevel, LevelConfig> = {
  1: {
    id: 1,
    name: 'Germoglio',
    emoji: '🌱',
    ageHint: '~4-5 anni',
    description: 'Salvadanaio, gettoni da riscuotere e negozio a un tocco',
    features: {
      simpleMode: true,
      canBuy: true,
      canSell: false,
      canP2P: false,
      canCalendar: false,
      canCollaborate: false,
      canStats: false,
      showNews: false,
      showMarketDetails: false,
    },
  },
  2: {
    id: 2,
    name: 'Esploratore',
    emoji: '🌿',
    ageHint: '~6-7 anni',
    description: 'Si aggiungono calendario attività e vendita alla banca',
    features: {
      simpleMode: false,
      canBuy: true,
      canSell: true,
      canP2P: false,
      canCalendar: true,
      canCollaborate: false,
      canStats: false,
      showNews: false,
      showMarketDetails: false,
    },
  },
  3: {
    id: 3,
    name: 'Mercante',
    emoji: '🌳',
    ageHint: '~8-10 anni',
    description: 'Si aggiungono scambi P2P, collaboratori e notizie di mercato',
    features: {
      simpleMode: false,
      canBuy: true,
      canSell: true,
      canP2P: true,
      canCalendar: true,
      canCollaborate: true,
      canStats: false,
      showNews: true,
      showMarketDetails: false,
    },
  },
  4: {
    id: 4,
    name: 'Esperto',
    emoji: '🚀',
    ageHint: '10+ anni',
    description: 'Esperienza completa: statistiche, supply, tutto il mercato',
    features: {
      simpleMode: false,
      canBuy: true,
      canSell: true,
      canP2P: true,
      canCalendar: true,
      canCollaborate: true,
      canStats: true,
      showNews: true,
      showMarketDetails: true,
    },
  },
}

export const ALL_LEVELS: PlayerLevel[] = [1, 2, 3, 4]

/**
 * Livello effettivo di un giocatore.
 * Admin e giocatori senza livello impostato (dati pre-esistenti) = Esperto,
 * così il comportamento attuale non cambia finché non imposti i livelli.
 */
export function getPlayerLevel(player: Player | null | undefined): PlayerLevel {
  if (!player) return 4
  if (player.isAdmin || player.isBank) return 4
  return player.level ?? 4
}

export function getFeatures(level: PlayerLevel): LevelFeatures {
  return LEVELS[level].features
}

// ==================== CATALOGO MODULARE ====================
// Attività (WorkTemplate) e premi (Asset) hanno `active` e `minLevel`:
// l'admin li accende/spegne e decide da quale livello sono visibili,
// senza toccare il codice quando i bambini crescono.

export function isTemplateVisible(template: WorkTemplate, level: PlayerLevel): boolean {
  return (template.active ?? true) && level >= (template.minLevel ?? 1)
}

export function isAssetVisible(asset: Asset, level: PlayerLevel): boolean {
  return (asset.active ?? true) && level >= (asset.minLevel ?? 1)
}
