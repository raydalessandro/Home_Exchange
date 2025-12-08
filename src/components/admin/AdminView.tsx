'use client'

import { useStore } from '@/store'
import { AdminSidebar } from './AdminSidebar'
import { EconomicDashboard } from './EconomicDashboard'
import { TokenEmission } from './TokenEmission'
import { TokenManagement } from './TokenManagement'
import { MarketControls } from './MarketControls'
import { WorkPriceControls } from './WorkPriceControls'
import { AssetManagement } from './AssetManagement'
import { PlayersManagement } from './PlayersManagement'
import { EventLog } from './EventLog'
import { InactivityPanel } from './InactivityPanel'
import { CalendarView } from '@/components/calendar'
import type { AdminSection } from '@/types'
import { cn } from '@/lib/cn'
import { 
  LayoutDashboard, 
  Ticket, 
  Palette, 
  Users, 
  Settings, 
  ScrollText,
  Calendar,
  AlertTriangle,
  type LucideIcon
} from 'lucide-react'

export function AdminView() {
  const adminSection = useStore(state => state.adminSection)

  const renderContent = () => {
    switch (adminSection) {
      case 'dashboard':
        return <EconomicDashboard />
      case 'tokens':
        return (
          <div className="space-y-6 sm:space-y-8">
            <TokenEmission />
            <TokenManagement />
          </div>
        )
      case 'assets':
        return <AssetManagement />
      case 'players':
        return <PlayersManagement />
      case 'market':
        return (
          <div className="space-y-6 sm:space-y-8">
            <WorkPriceControls />
            <MarketControls />
          </div>
        )
      case 'calendar':
        return <CalendarView />
      case 'inactivity':
        return <InactivityPanel />
      case 'events':
        return <EventLog />
      default:
        return <EconomicDashboard />
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 overflow-auto pb-24 lg:pb-6">
        {renderContent()}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileAdminNav />
    </div>
  )
}

interface MobileNavItem {
  id: AdminSection
  icon: LucideIcon
  label: string
}

const mobileNavItems: MobileNavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'tokens', icon: Ticket, label: 'Gettoni' },
  { id: 'calendar', icon: Calendar, label: 'Calendario' },
  { id: 'inactivity', icon: AlertTriangle, label: 'Inattività' },
  { id: 'market', icon: Settings, label: 'Market' },
  { id: 'events', icon: ScrollText, label: 'Log' },
]

function MobileAdminNav() {
  const adminSection = useStore(state => state.adminSection)
  const setAdminSection = useStore(state => state.setAdminSection)

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-ink-900/95 backdrop-blur-lg border-t border-gold/20 z-50 safe-area-pb">
      <div className="flex justify-around py-2 px-1">
        {mobileNavItems.map(item => {
          const Icon = item.icon
          const isActive = adminSection === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => setAdminSection(item.id)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-xl min-w-[56px] transition-all',
                isActive
                  ? 'bg-gold/20 text-gold'
                  : 'text-cream/50 active:bg-ink-800'
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
