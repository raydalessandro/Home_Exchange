'use client'

import {
  LayoutDashboard,
  Ticket,
  Palette,
  Users,
  Settings,
  ScrollText,
  ShoppingCart,
  BarChart3,
  Coins,
  LogOut,
  Crown,
  TrendingUp,
  Wallet,
  ArrowLeftRight,
  Plus,
  Minus,
  Check,
  X,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronDown,
  Home,
  Sparkles,
  Zap,
  Award,
  Star,
  Clock,
  Calendar,
  RefreshCw,
  Send,
  Download,
  Upload,
  Filter,
  Search,
  Menu,
  Building2,
  Banknote,
  PiggyBank,
  CircleDollarSign,
  type LucideIcon,
} from 'lucide-react'

// Re-export all icons
export {
  LayoutDashboard,
  Ticket,
  Palette,
  Users,
  Settings,
  ScrollText,
  ShoppingCart,
  BarChart3,
  Coins,
  LogOut,
  Crown,
  TrendingUp,
  Wallet,
  ArrowLeftRight,
  Plus,
  Minus,
  Check,
  X,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronDown,
  Home,
  Sparkles,
  Zap,
  Award,
  Star,
  Clock,
  Calendar,
  RefreshCw,
  Send,
  Download,
  Upload,
  Filter,
  Search,
  Menu,
  Building2,
  Banknote,
  PiggyBank,
  CircleDollarSign,
}

export type { LucideIcon }

// Icon wrapper with consistent sizing
interface IconProps {
  icon: LucideIcon
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
}

export function Icon({ icon: IconComponent, size = 'md', className = '' }: IconProps) {
  return <IconComponent size={sizeMap[size]} className={className} strokeWidth={2} />
}

// Coin icon with gold styling
export function CoinIcon({ size = 'md', className = '' }: Omit<IconProps, 'icon'>) {
  return (
    <div className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 ${className}`}
         style={{ width: sizeMap[size] + 4, height: sizeMap[size] + 4 }}>
      <Coins size={sizeMap[size] - 4} className="text-ink-900" strokeWidth={2.5} />
    </div>
  )
}

// Bank icon
export function BankIcon({ size = 'md', className = '' }: Omit<IconProps, 'icon'>) {
  return <Building2 size={sizeMap[size]} className={`text-gold ${className}`} strokeWidth={2} />
}

