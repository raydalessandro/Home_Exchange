'use client'

import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import { Card, CardHeader } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { cn } from '@/lib/cn'
import { 
  AlertTriangle, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Ban
} from 'lucide-react'
import { 
  formatDateISO, 
  formatDateDisplay,
  INACTIVITY_PENALTY_AMOUNT 
} from '@/types/calendar'

export function InactivityPanel() {
  const players = useStore(state => state.players)
  const inactivityPenalties = useStore(state => state.inactivityPenalties)
  const getInactivityReport = useStore(state => state.getInactivityReport)
  const applyInactivityPenalty = useStore(state => state.applyInactivityPenalty)

  const [selectedDate, setSelectedDate] = useState(formatDateISO(new Date()))

  const report = useMemo(() => {
    return getInactivityReport(selectedDate)
  }, [getInactivityReport, selectedDate])

  const inactivePlayers = report.filter(r => !r.hasActivity)
  const activePlayers = report.filter(r => r.hasActivity)

  const handlePreviousDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() - 1)
    setSelectedDate(formatDateISO(date))
  }

  const handleNextDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + 1)
    setSelectedDate(formatDateISO(date))
  }

  const handleToday = () => {
    setSelectedDate(formatDateISO(new Date()))
  }

  const handleApplyPenalty = (playerId: string) => {
    applyInactivityPenalty(playerId, selectedDate)
  }

  // Get penalty history for selected date
  const dayPenalties = inactivityPenalties.filter(p => p.date === selectedDate)

  return (
    <div className="space-y-4 sm:space-y-6">
      <CardHeader 
        title="Report Inattività" 
        icon={<AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />}
      />

      {/* Date Navigation */}
      <Card variant="dark">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousDay}
            icon={ChevronLeft}
          >
            Precedente
          </Button>
          
          <div className="text-center">
            <div className="text-cream-50 font-semibold flex items-center gap-2 justify-center">
              <Calendar size={18} />
              {formatDateDisplay(selectedDate)}
            </div>
            {selectedDate === formatDateISO(new Date()) && (
              <div className="text-xs text-gold-400">Oggi</div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextDay}
            icon={ChevronRight}
            iconPosition="right"
          >
            Successivo
          </Button>
        </div>
        
        {selectedDate !== formatDateISO(new Date()) && (
          <div className="mt-3 text-center">
            <Button
              variant="outline"
              size="xs"
              onClick={handleToday}
            >
              Torna a oggi
            </Button>
          </div>
        )}
      </Card>

      {/* Inactive Players */}
      <Card variant="dark" className="border-amber-500/30">
        <CardHeader 
          title={`Inattivi (${inactivePlayers.length})`}
          icon={<Ban size={20} className="text-amber-400" />}
        />
        
        {inactivePlayers.length === 0 ? (
          <div className="text-center py-6 text-cream-200">
            🎉 Tutti hanno partecipato oggi!
          </div>
        ) : (
          <div className="space-y-3">
            {inactivePlayers.map(player => (
              <div 
                key={player.playerId}
                className={cn(
                  'p-4 rounded-xl border flex items-center justify-between',
                  player.penaltyApplied 
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-ink-700 border-ink-600'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{player.playerEmoji}</span>
                  <div>
                    <div className="text-cream-50 font-medium">{player.playerName}</div>
                    <div className="text-xs text-cream-200">
                      {player.penaltyApplied 
                        ? `Penalità applicata (-🪙${INACTIVITY_PENALTY_AMOUNT})`
                        : 'Nessuna attività'}
                    </div>
                  </div>
                </div>

                {player.penaltyApplied ? (
                  <span className="text-red-400 text-sm flex items-center gap-1">
                    <Check size={16} />
                    Applicata
                  </span>
                ) : (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleApplyPenalty(player.playerId)}
                    icon={AlertTriangle}
                  >
                    Penalità -🪙{INACTIVITY_PENALTY_AMOUNT}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Active Players */}
      <Card variant="dark" className="border-emerald-500/30">
        <CardHeader 
          title={`Attivi (${activePlayers.length})`}
          icon={<Check size={20} className="text-emerald-400" />}
        />
        
        {activePlayers.length === 0 ? (
          <div className="text-center py-6 text-cream-200">
            Nessuno ha ancora prenotato attività per questo giorno.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {activePlayers.map(player => (
              <div 
                key={player.playerId}
                className="p-3 bg-ink-700 border border-emerald-500/20 rounded-xl flex items-center gap-2"
              >
                <span className="text-xl">{player.playerEmoji}</span>
                <span className="text-cream-100 text-sm">{player.playerName}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Penalty History for this day */}
      {dayPenalties.length > 0 && (
        <Card variant="dark">
          <CardHeader 
            title="Storico Penalità" 
            icon={<AlertTriangle size={20} className="text-red-400" />}
          />
          <div className="space-y-2">
            {dayPenalties.map(penalty => (
              <div 
                key={penalty.id}
                className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
              >
                <div className="text-sm">
                  <span className="text-cream-100">{penalty.playerName}</span>
                  <span className="text-cream-300 mx-2">•</span>
                  <span className="text-cream-200">da {penalty.appliedByName}</span>
                </div>
                <span className="text-red-400 font-mono font-bold">
                  -🪙{penalty.amount}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Info Box */}
      <Card variant="dark" className="bg-ink-800 border-amber-500/20">
        <div className="text-sm">
          <div className="font-semibold text-amber-400 mb-2">Come funziona:</div>
          <ul className="space-y-1 text-cream-100">
            <li>• I giocatori che <strong className="text-cream-50">non hanno prenotato</strong> attività per un giorno sono considerati inattivi</li>
            <li>• Puoi applicare una <strong className="text-cream-50">penalità di 🪙{INACTIVITY_PENALTY_AMOUNT}</strong> a chi non partecipa</li>
            <li>• La penalità viene <strong className="text-cream-50">scalata dal saldo</strong> del giocatore</li>
            <li>• Non puoi applicare la penalità due volte per lo stesso giorno</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}

