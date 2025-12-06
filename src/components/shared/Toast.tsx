'use client'

import { useStore } from '@/store'
import { cn } from '@/lib/cn'

export function Toast() {
  const { toast, hideToast } = useStore()

  if (!toast.isVisible) return null

  const typeStyles = {
    success: 'bg-emerald-50 border-emerald-500 text-emerald-800',
    error: 'bg-red-50 border-red-500 text-red-800',
    warning: 'bg-amber-50 border-amber-500 text-amber-800',
    info: 'bg-blue-50 border-blue-500 text-blue-800',
  }

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 flex items-center gap-3',
        'px-4 py-3 rounded-lg border-l-4 shadow-lg',
        'animate-slide-down',
        typeStyles[toast.type]
      )}
    >
      <span className="text-xl">{icons[toast.type]}</span>
      <p className="font-medium">{toast.message}</p>
      {toast.action && (
        <button
          onClick={toast.action.onClick}
          className="ml-2 px-2 py-1 rounded bg-white/50 hover:bg-white/80 
                     text-sm font-medium transition-colors"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={hideToast}
        className="ml-2 text-current opacity-60 hover:opacity-100 transition-opacity"
      >
        ✕
      </button>
    </div>
  )
}

