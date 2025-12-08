'use client'

import { cn } from '@/lib/cn'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2, type LucideIcon } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  children: ReactNode
  isLoading?: boolean
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className,
  disabled,
  isLoading,
  icon: Icon,
  iconPosition = 'left',
  fullWidth,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-gradient-to-r from-gold-400 to-gold-500 text-ink-900 hover:from-gold-500 hover:to-gold-600 shadow-md shadow-gold/20 font-bold',
    secondary: 'bg-ink-700 text-cream-50 hover:bg-ink-600 border border-ink-500 font-medium',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-600/30 font-bold',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/30 font-bold',
    ghost: 'bg-transparent text-cream-100 hover:bg-ink-700 hover:text-white',
    outline: 'bg-transparent border-2 border-gold text-gold-400 hover:bg-gold/20 hover:border-gold-300 font-medium',
  }

  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs gap-1.5 rounded-lg',
    sm: 'px-3 py-2 text-sm gap-1.5 rounded-lg',
    md: 'px-4 py-2.5 text-sm gap-2 rounded-xl',
    lg: 'px-6 py-3 text-base gap-2 rounded-xl',
  }

  const iconSizes = {
    xs: 14,
    sm: 16,
    md: 18,
    lg: 20,
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 focus:ring-offset-ink-900',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'active:scale-[0.98]',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        isLoading && 'cursor-wait',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 size={iconSizes[size]} className="animate-spin" />
          <span>Caricamento...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={iconSizes[size]} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon size={iconSizes[size]} />}
        </>
      )}
    </button>
  )
}
