'use client'

import { cn } from '@/lib/cn'
import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'dark' | 'glass' | 'outline'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

export function Card({
  children,
  className,
  variant = 'default',
  padding = 'md',
  hover = false,
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-white border border-gold/10 shadow-sm',
    dark: 'bg-ink-800 border border-ink-700',
    glass: 'bg-white/5 backdrop-blur-lg border border-white/10',
    outline: 'bg-transparent border-2 border-gold/30',
  }

  const paddings = {
    none: '',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
  }

  return (
    <div
      className={cn(
        'rounded-xl sm:rounded-2xl transition-all duration-200',
        variants[variant],
        paddings[padding],
        hover && 'hover:shadow-lg hover:shadow-gold/10 hover:border-gold/30 hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Card Header component
interface CardHeaderProps {
  title: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function CardHeader({ title, icon, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <h3 className="font-serif text-lg sm:text-xl text-gold flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {action}
    </div>
  )
}

// Stat Card component
interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  subtext?: string
  variant?: 'default' | 'gold' | 'success' | 'warning' | 'danger'
}

export function StatCard({ label, value, icon, trend, subtext, variant = 'default' }: StatCardProps) {
  const variants = {
    default: 'bg-ink-800 border-ink-700',
    gold: 'bg-gold/10 border-gold/30',
    success: 'bg-emerald-500/10 border-emerald-500/30',
    warning: 'bg-amber-500/10 border-amber-500/30',
    danger: 'bg-red-500/10 border-red-500/30',
  }

  const valueColors = {
    default: 'text-cream',
    gold: 'text-gold',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-red-400',
  }

  return (
    <div className={cn(
      'rounded-xl sm:rounded-2xl border p-4 sm:p-5 transition-all',
      variants[variant]
    )}>
      <div className="flex items-center gap-2 text-cream/60 text-sm mb-2">
        {icon}
        <span>{label}</span>
      </div>
      <div className={cn('text-2xl sm:text-3xl font-mono font-bold', valueColors[variant])}>
        {value}
      </div>
      {subtext && (
        <div className="text-xs text-cream/40 mt-1">{subtext}</div>
      )}
    </div>
  )
}
