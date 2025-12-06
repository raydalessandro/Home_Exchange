'use client'

import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
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
          'relative bg-white rounded-2xl shadow-2xl',
          'max-w-md w-full mx-4',
          'animate-slide-up',
          className
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-ink-100">
          <h2 className="font-serif text-xl text-ink-800">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full
                       hover:bg-ink-100 transition-colors text-ink-500"
          >
            ✕
          </button>
        </div>
        
        {/* Body */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

