'use client'

import { useStore } from '@/store'

export function NewsTicker() {
  const news = useStore(state => state.news)

  return (
    <div className="bg-gradient-to-r from-gold-500 to-gold-600 
                    text-white rounded-xl px-4 py-3 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="text-xl">📢</span>
        <p className="font-medium">{news}</p>
      </div>
    </div>
  )
}

