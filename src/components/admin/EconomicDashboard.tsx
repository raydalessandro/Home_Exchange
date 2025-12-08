'use client'

import { useState } from 'react'
import { useEconomicMetrics, seedHistoricalData } from '@/store'
import { useStore } from '@/store'
import { Card, StatCard, CardHeader } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { cn } from '@/lib/cn'
import { 
  Banknote, 
  Ticket, 
  PiggyBank, 
  Package, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Activity,
  Users,
  ArrowLeftRight,
  AlertTriangle,
  LayoutDashboard,
  FlaskConical,
  Trash2,
  Calendar
} from 'lucide-react'

export function EconomicDashboard() {
  const metrics = useEconomicMetrics()
  const [isSeeding, setIsSeeding] = useState(false)
  const workTokens = useStore(state => state.workTokens)
  
  const handleSeedHistory = async (days: number) => {
    setIsSeeding(true)
    // Piccolo delay per mostrare lo spinner
    await new Promise(r => setTimeout(r, 100))
    seedHistoricalData(days)
    setIsSeeding(false)
  }
  
  const handleClearHistory = () => {
    if (confirm('Sei sicuro di voler cancellare tutto lo storico? I bilanci verranno resettati a 100.')) {
      useStore.setState(state => ({
        ...state,
        workTokens: [],
        events: [],
        players: state.players.map(p => p.isBank ? p : { ...p, balance: 100 }),
      }))
    }
  }

  const getInflationColor = (inflation: number) => {
    if (inflation > 15) return 'text-red-400'
    if (inflation > 5) return 'text-amber-400'
    if (inflation > -5) return 'text-emerald-400'
    return 'text-sky-400'
  }

  const getInflationBg = (inflation: number) => {
    if (inflation > 15) return 'bg-red-500/10 border-red-500/30'
    if (inflation > 5) return 'bg-amber-500/10 border-amber-500/30'
    if (inflation > -5) return 'bg-emerald-500/10 border-emerald-500/30'
    return 'bg-sky-500/10 border-sky-500/30'
  }

  const getInflationLabel = (inflation: number) => {
    if (inflation > 15) return { text: 'ALTA', icon: AlertTriangle }
    if (inflation > 5) return { text: 'MEDIA', icon: TrendingUp }
    if (inflation > -5) return { text: 'STABILE', icon: Minus }
    return { text: 'BASSA', icon: TrendingDown }
  }

  const inflationInfo = getInflationLabel(metrics.inflation)
  const InflationIcon = inflationInfo.icon

  return (
    <div className="space-y-4 sm:space-y-6">
      <CardHeader 
        title="Dashboard Economico" 
        icon={<LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6" />}
      />

      {/* Money Supply Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="M1 (Cash)"
          value={`🪙 ${metrics.M1}`}
          icon={<Banknote size={16} />}
          variant="default"
          subtext="Cash circolante"
        />
        <StatCard
          label="Gettoni Pending"
          value={`🪙 ${metrics.unredeemedValue}`}
          icon={<Ticket size={16} />}
          variant="warning"
          subtext={`${metrics.outstandingTokens} gettoni`}
        />
        <StatCard
          label="M2 (Total)"
          value={`🪙 ${metrics.M2}`}
          icon={<PiggyBank size={16} />}
          variant="gold"
          subtext="M1 + pending"
        />
        <StatCard
          label="Valore Asset"
          value={`🪙 ${metrics.totalAssetValue}`}
          icon={<Package size={16} />}
          variant="success"
          subtext="Beni acquistati"
        />
      </div>

      {/* Production vs Money - NEW */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label="Produzione Lavoro"
          value={`🪙 ${metrics.workProduction}`}
          icon={<Activity size={16} />}
          variant="success"
          subtext="Lavori completati"
        />
        <StatCard
          label="Economia Totale"
          value={`🪙 ${metrics.economyValue}`}
          icon={<TrendingUp size={16} />}
          variant="gold"
          subtext="Asset + Lavoro"
        />
        <div className="col-span-2 lg:col-span-1">
          <StatCard
            label="Rapporto M2/Economia"
            value={metrics.economyValue > 0 
              ? `${(metrics.M2 / metrics.economyValue * 100).toFixed(0)}%` 
              : '-%'}
            icon={<ArrowLeftRight size={16} />}
            variant={metrics.inflation > 10 ? 'danger' : metrics.inflation > 0 ? 'warning' : 'success'}
            subtext={metrics.inflation > 0 ? 'Eccesso moneta' : 'Equilibrio'}
          />
        </div>
      </div>

      {/* Inflation Panel */}
      <Card variant="dark" className={cn('border', getInflationBg(metrics.inflation))}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cream-100 text-sm mb-2">
              <Activity size={16} />
              <span>Inflazione</span>
            </div>
            <div className={cn('text-3xl sm:text-4xl font-mono font-bold', getInflationColor(metrics.inflation))}>
              {metrics.inflation > 0 ? '+' : ''}{metrics.inflation}%
            </div>
            <div className="flex items-center gap-2 text-cream-100 mt-2">
              <InflationIcon size={16} />
              <span>{inflationInfo.text}</span>
            </div>
          </div>
          
          {/* Gauge */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 relative flex-shrink-0">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-ink-700"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${Math.min(Math.abs(metrics.inflation), 100) * 2.51} 251`}
                strokeLinecap="round"
                className={getInflationColor(metrics.inflation)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <InflationIcon size={24} className={getInflationColor(metrics.inflation)} />
            </div>
          </div>
        </div>

        {metrics.inflation > 15 && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-start gap-2">
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
            <span><strong>Attenzione:</strong> Inflazione alta! Considera di ridurre l&apos;emissione di moneta o gettoni.</span>
          </div>
        )}
      </Card>

      {/* Productivity Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label="GDP (Lavori)"
          value={metrics.gdp}
          icon={<Activity size={16} />}
          subtext="gettoni emessi"
        />
        <StatCard
          label="Produttività"
          value={metrics.productivity}
          icon={<TrendingUp size={16} />}
          subtext="gettoni/giorno"
        />
        <StatCard
          label="Redemption"
          value={`${metrics.redemptionRate}%`}
          icon={<ArrowLeftRight size={16} />}
          subtext="gettoni riscossi"
        />
      </div>

      {/* System Stats */}
      <Card variant="dark">
        <CardHeader title="Statistiche Sistema" icon={<Users size={20} />} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="p-3 bg-ink-700 rounded-xl">
            <div className="text-cream-200 mb-1">Giocatori</div>
            <div className="text-xl font-mono font-bold text-cream-50">{metrics.playerCount}</div>
          </div>
          <div className="p-3 bg-ink-700 rounded-xl">
            <div className="text-cream-200 mb-1">Trade Totali</div>
            <div className="text-xl font-mono font-bold text-cream-50">{metrics.totalTrades}</div>
          </div>
          <div className="p-3 bg-ink-700 rounded-xl">
            <div className="text-cream-200 mb-1">Gettoni Outstanding</div>
            <div className="text-xl font-mono font-bold text-amber-400">{metrics.outstandingTokens}</div>
          </div>
          <div className="p-3 bg-ink-700 rounded-xl">
            <div className="text-cream-200 mb-1">Valore Pending</div>
            <div className="text-xl font-mono font-bold text-amber-400">🪙 {metrics.unredeemedValue}</div>
          </div>
        </div>
      </Card>

      {/* Test Panel - Seed Historical Data */}
      <Card variant="dark" className="border border-purple-500/40 bg-ink-800">
        <CardHeader 
          title="🧪 Test: Genera Storico" 
          icon={<FlaskConical size={20} className="text-purple-400" />}
        />
        <p className="text-cream-100 text-sm mb-4">
          Simula attività passate per testare le metriche economiche. 
          Genera token di lavoro, riscossioni e variazioni di bilancio.
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSeedHistory(7)}
            isLoading={isSeeding}
            icon={Calendar}
          >
            1 Settimana
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSeedHistory(30)}
            isLoading={isSeeding}
            icon={Calendar}
          >
            1 Mese
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSeedHistory(60)}
            isLoading={isSeeding}
            icon={Calendar}
          >
            2 Mesi
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSeedHistory(90)}
            isLoading={isSeeding}
            icon={Calendar}
          >
            3 Mesi
          </Button>
        </div>
        
        {workTokens.length > 0 && (
          <div className="flex items-center justify-between pt-3 border-t border-purple-500/30">
            <span className="text-cream-100 text-sm">
              📊 {workTokens.length} token nello storico
            </span>
            <Button
              variant="danger"
              size="xs"
              onClick={handleClearHistory}
              icon={Trash2}
            >
              Cancella Storico
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
