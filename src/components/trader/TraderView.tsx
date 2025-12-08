'use client'

import { useStore } from '@/store'
import { Wallet } from './Wallet'
import { NewsTicker } from './NewsTicker'
import { TradingGrid } from './TradingGrid'
import { TradeModal } from './TradeModal'
import { P2PModal } from './P2PModal'
import { TraderTabs } from './TraderTabs'
import { TokenRedemption } from './TokenRedemption'
import { TraderStats } from './TraderStats'
import { CalendarView } from '@/components/calendar'

export function TraderView() {
  const traderTab = useStore(state => state.traderTab)

  const renderContent = () => {
    switch (traderTab) {
      case 'market':
        return (
          <div className="space-y-4">
            <NewsTicker />
            <TradingGrid />
          </div>
        )
      case 'calendar':
        return <CalendarView />
      case 'tokens':
        return <TokenRedemption />
      case 'stats':
        return <TraderStats />
      default:
        return <TradingGrid />
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Left Sidebar - Wallet (sticky on desktop) */}
        <div className="lg:sticky lg:top-4 lg:self-start space-y-4">
          <Wallet />
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          {/* Tab Navigation */}
          <TraderTabs />
          
          {/* Tab Content */}
          <div className="pb-20 lg:pb-0">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Modals */}
      <TradeModal />
      <P2PModal />

      {/* Mobile Bottom Padding for Tabs (if needed) */}
      <div className="h-4 lg:hidden" />
    </>
  )
}
