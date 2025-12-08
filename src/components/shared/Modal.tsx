'use client'

import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
  showHeader?: boolean
}

export function Modal({ isOpen, onClose, title, children, className, showHeader = true }: ModalProps) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink-900/70 backdrop-blur-sm" />
      
      {/* Modal Content */}
      <div
        className={cn(
          'relative bg-ink-800 rounded-2xl shadow-2xl border border-ink-600',
          'max-w-md w-full mx-4 max-h-[90vh] overflow-auto',
          'animate-slide-up',
          className
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Header (optional) */}
        {showHeader && title && (
          <div className="flex items-center justify-between p-4 border-b border-ink-600">
            <h2 className="font-serif text-xl text-gold">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full
                         hover:bg-ink-700 transition-colors text-cream-200"
            >
              ✕
            </button>
          </div>
        )}
        
        {/* Body */}
        <div className={title ? 'p-4' : ''}>
          {children}
        </div>
      </div>
    </div>
  )
}

