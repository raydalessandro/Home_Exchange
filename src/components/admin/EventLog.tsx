'use client'

import { useStore } from '@/store'
import { Card, CardHeader } from '@/components/shared/Card'
import { ScrollText, Clock } from 'lucide-react'

export function EventLog() {
  const events = useStore(state => state.events)

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <CardHeader title="Log Eventi" icon={<ScrollText size={20} />} />
      
      <Card variant="dark">
        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin space-y-2">
          {events.length === 0 ? (
            <div className="text-cream/40 text-center py-8">
              <ScrollText size={32} className="mx-auto mb-2 opacity-50" />
              <p>Nessun evento registrato</p>
            </div>
          ) : (
            [...events].reverse().slice(0, 50).map(event => (
              <div
                key={event.id}
                className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 bg-ink-700/50 rounded-xl border border-ink-600"
              >
                <span className="flex items-center gap-1 text-[10px] sm:text-xs text-cream/50 font-mono whitespace-nowrap">
                  <Clock size={12} className="hidden sm:block" />
                  {formatTime(event.timestamp)}
                </span>
                <span className="text-xs sm:text-sm text-cream/80">{event.message}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
