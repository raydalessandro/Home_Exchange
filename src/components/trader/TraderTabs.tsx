'use client'

import { useEffect, useMemo } from 'react'
import { useStore } from '@/store'
import { useShallow } from 'zustand/react/shallow'
import type { TraderTab } from '@/types'
import { getFeatures, getPlayerLevel } from '@/lib/levels'
import { cn } from '@/lib/cn'
import { ShoppingCart, Ticket, BarChart3, Calendar, type LucideIcon } from 'lucide-react'

interface TabItem {
  id: TraderTab
  label: string
  icon: LucideIcon
}

const allTabItems: TabItem[] = [
  { id: 'market', label: 'Mercato', icon: ShoppingCart },
  { id: 'calendar', label: 'Calendario', icon: Calendar },
  { id: 'tokens', label: 'Gettoni', icon: Ticket },
  { id: 'stats', label: 'Statistiche', icon: BarChart3 },
]

export function TraderTabs() {
  const traderTab = useStore(state => state.traderTab)
  const setTraderTab = useStore(state => state.setTraderTab)
  const currentUser = useStore(state => state.currentUser)
  const workTokens = useStore(useShallow(state => state.workTokens))

  const features = getFeatures(getPlayerLevel(currentUser))

  const tabItems = useMemo(() => allTabItems.filter(tab => {
    if (tab.id === 'calendar') return features.canCalendar
    if (tab.id === 'stats') return features.canStats
    return true
  }), [features.canCalendar, features.canStats])

  // Se la tab attiva non è più disponibile (es. livello abbassato), torna al mercato
  useEffect(() => {
    if (!tabItems.some(t => t.id === traderTab)) {
      setTraderTab('market')
    }
  }, [tabItems, traderTab, setTraderTab])

  const unredeemedTokens = useMemo(() => {
    if (!currentUser) return []
    return workTokens.filter(t => t.issuedTo === currentUser.id && !t.redeemed)
  }, [workTokens, currentUser])

  return (
    <div className="flex gap-2 bg-ink-800/50 p-1.5 rounded-2xl">
      {tabItems.map(tab => {
        const Icon = tab.icon
        const isActive = traderTab === tab.id
        const hasNotification = tab.id === 'tokens' && unredeemedTokens.length > 0
        
        return (
          <button
            key={tab.id}
            onClick={() => setTraderTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 relative',
              isActive
                ? 'bg-gold text-ink-900 font-semibold shadow-lg shadow-gold/30'
                : 'text-cream/60 hover:bg-ink-700 hover:text-cream active:scale-95'
            )}
          >
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-sm">{tab.label}</span>
            
            {/* Notification Badge */}
            {hasNotification && (
              <span className={cn(
                'absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold',
                isActive
                  ? 'bg-ink-900 text-gold'
                  : 'bg-gold text-ink-900 animate-pulse'
              )}>
                {unredeemedTokens.length}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
