'use client'

import { useStore } from '@/store'
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

interface NavItem {
  id: AdminSection
  label: string
  icon: LucideIcon
  description: string
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Metriche economiche' },
  { id: 'tokens', label: 'Gettoni', icon: Ticket, description: 'Emissione lavori' },
  { id: 'calendar', label: 'Calendario', icon: Calendar, description: 'Prenotazioni attività' },
  { id: 'inactivity', label: 'Inattività', icon: AlertTriangle, description: 'Report e penalità' },
  { id: 'assets', label: 'Asset', icon: Palette, description: 'Gestione titoli' },
  { id: 'players', label: 'Giocatori', icon: Users, description: 'Bilanci utenti' },
  { id: 'market', label: 'Mercato', icon: Settings, description: 'Eventi e annunci' },
  { id: 'events', label: 'Eventi', icon: ScrollText, description: 'Log attività' },
]

export function AdminSidebar() {
  const adminSection = useStore(state => state.adminSection)
  const setAdminSection = useStore(state => state.setAdminSection)

  return (
    <aside className="bg-ink-900 border-r border-gold/20 w-56 flex-shrink-0 flex flex-col">
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = adminSection === item.id
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => setAdminSection(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200',
                    isActive
                      ? 'bg-gold/20 text-gold border border-gold/30'
                      : 'text-cream/70 hover:bg-ink-800 hover:text-cream border border-transparent'
                  )}
                >
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                    isActive ? 'bg-gold/20' : 'bg-ink-800'
                  )}>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs opacity-50 truncate">{item.description}</div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer info */}
      <div className="p-4 border-t border-gold/10 text-xs text-cream/40">
        <div className="font-medium">Casa Exchange</div>
        <div className="mt-0.5 opacity-70">v0.3 • Admin</div>
      </div>
    </aside>
  )
}
