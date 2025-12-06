'use client'

import { cn } from '@/lib/cn'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingState({ 
  message = 'Caricamento...', 
  size = 'md',
  className 
}: LoadingStateProps) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div 
        className={cn(
          'relative animate-spin-slow',
          sizes[size]
        )}
      >
        <span className="absolute inset-0 flex items-center justify-center text-2xl">
          🪙
        </span>
      </div>
      {message && (
        <p className={cn('text-ink-600 animate-pulse', textSizes[size])}>
          {message}
        </p>
      )}
    </div>
  )
}

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div 
      className={cn(
        'animate-pulse bg-ink-200 rounded',
        className
      )} 
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <Skeleton className="h-12 w-12 rounded-full mx-auto" />
      <Skeleton className="h-4 w-3/4 mx-auto" />
      <Skeleton className="h-6 w-1/2 mx-auto" />
      <Skeleton className="h-3 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
      </div>
    </div>
  )
}

export function WalletSkeleton() {
  return (
    <div className="wallet-card space-y-4">
      <Skeleton className="h-4 w-1/3 bg-white/20" />
      <Skeleton className="h-10 w-2/3 bg-white/20" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-8 bg-white/20" />
        <Skeleton className="h-8 bg-white/20" />
      </div>
    </div>
  )
}

