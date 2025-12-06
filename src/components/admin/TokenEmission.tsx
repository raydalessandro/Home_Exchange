'use client'

import { useState } from 'react'
import { useStore } from '@/store'
import { useShallow } from 'zustand/react/shallow'
import { Card, CardHeader } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import type { WorkQuality } from '@/types'
import { QUALITY_LABELS, QUALITY_MULTIPLIERS } from '@/types'
import { cn } from '@/lib/cn'
import { 
  Ticket, 
  ClipboardList, 
  PenLine, 
  Send,
  Star,
  Sparkles
} from 'lucide-react'

export function TokenEmission() {
  const players = useStore(useShallow(state => state.players.filter(p => !p.isBank)))
  const workCategories = useStore(state => state.workCategories)
  const emitWorkToken = useStore(state => state.emitWorkToken)

  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [selectedQuality, setSelectedQuality] = useState<WorkQuality>('BASIC')
  const [customName, setCustomName] = useState('')
  const [customValue, setCustomValue] = useState('')
  const [useCustom, setUseCustom] = useState(false)

  const category = workCategories.find(c => c.id === selectedCategory)
  const template = category?.templates.find(t => t.id === selectedTemplate)
  
  const baseValue = useCustom ? (parseInt(customValue) || 0) : (template?.baseValue ?? 0)
  const multiplier = QUALITY_MULTIPLIERS[selectedQuality]
  const finalValue = Math.round(baseValue * multiplier)

  const handleEmit = () => {
    if (!selectedPlayer) return
    if (!useCustom && (!selectedCategory || !selectedTemplate)) return
    if (useCustom && (!customName || !customValue)) return

    emitWorkToken({
      categoryId: useCustom ? 'CUSTOM' : selectedCategory,
      templateId: useCustom ? 'custom' : selectedTemplate,
      issuedTo: selectedPlayer,
      quality: selectedQuality,
      customName: useCustom ? customName : undefined,
      customValue: useCustom ? parseInt(customValue) : undefined,
    })

    // Reset form
    setSelectedPlayer('')
    setSelectedCategory('')
    setSelectedTemplate('')
    setSelectedQuality('BASIC')
    setCustomName('')
    setCustomValue('')
    setUseCustom(false)
  }

  const canEmit = selectedPlayer && (
    (useCustom && customName && customValue) ||
    (!useCustom && selectedCategory && selectedTemplate)
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      <CardHeader 
        title="Emissione Gettoni Lavoro" 
        icon={<Ticket size={20} />} 
      />

      <Card variant="dark">
        <div className="space-y-5 sm:space-y-6">
          {/* Player Selection */}
          <div>
            <label className="block text-cream/80 mb-2 text-sm font-medium">
              Chi ha fatto il lavoro?
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {players.filter(p => !p.isAdmin).map(player => (
                <button
                  key={player.id}
                  onClick={() => setSelectedPlayer(player.id)}
                  className={cn(
                    'p-2.5 sm:p-3 rounded-xl border-2 transition-all duration-200 text-center active:scale-95',
                    selectedPlayer === player.id
                      ? 'border-gold bg-gold/20 text-gold'
                      : 'border-ink-600 bg-ink-700/50 text-cream/70 hover:border-gold/50'
                  )}
                >
                  <div className="text-2xl sm:text-3xl mb-1">{player.emoji}</div>
                  <div className="text-xs sm:text-sm font-medium truncate">{player.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setUseCustom(false)}
              className={cn(
                'flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                !useCustom
                  ? 'bg-gold text-ink-900'
                  : 'bg-ink-700 text-cream/70 hover:bg-ink-600'
              )}
            >
              <ClipboardList size={16} />
              <span>Template</span>
            </button>
            <button
              onClick={() => setUseCustom(true)}
              className={cn(
                'flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                useCustom
                  ? 'bg-gold text-ink-900'
                  : 'bg-ink-700 text-cream/70 hover:bg-ink-600'
              )}
            >
              <PenLine size={16} />
              <span>Custom</span>
            </button>
          </div>

          {!useCustom ? (
            <>
              {/* Category Selection */}
              <div>
                <label className="block text-cream/80 mb-2 text-sm font-medium">
                  Categoria
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {workCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id)
                        setSelectedTemplate('')
                      }}
                      className={cn(
                        'p-2.5 sm:p-3 rounded-xl border-2 transition-all duration-200 text-left active:scale-95',
                        selectedCategory === cat.id
                          ? 'border-gold bg-gold/20'
                          : 'border-ink-600 bg-ink-700/50 hover:border-gold/50'
                      )}
                    >
                      <div className="text-xl sm:text-2xl mb-1">{cat.emoji}</div>
                      <div className="text-xs sm:text-sm font-medium text-cream">{cat.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Selection */}
              {category && (
                <div>
                  <label className="block text-cream/80 mb-2 text-sm font-medium">
                    Lavoro specifico
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {category.templates.map(tmpl => (
                      <button
                        key={tmpl.id}
                        onClick={() => setSelectedTemplate(tmpl.id)}
                        className={cn(
                          'p-2.5 sm:p-3 rounded-xl border-2 transition-all duration-200 text-left active:scale-95',
                          selectedTemplate === tmpl.id
                            ? 'border-gold bg-gold/20'
                            : 'border-ink-600 bg-ink-700/50 hover:border-gold/50'
                        )}
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                          <span className="text-base sm:text-lg">{tmpl.emoji}</span>
                          <span className="text-amber-400 text-[10px] sm:text-xs font-mono">🪙{tmpl.baseValue}</span>
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-cream truncate">{tmpl.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Custom Work */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-cream/80 mb-2 text-sm font-medium">
                  Nome lavoro
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="Es: Aiuta con il trasloco"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-ink-700 border border-ink-600 rounded-xl text-cream placeholder-cream/40 focus:border-gold focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-cream/80 mb-2 text-sm font-medium">
                  Valore base (🪙)
                </label>
                <input
                  type="number"
                  value={customValue}
                  onChange={e => setCustomValue(e.target.value)}
                  placeholder="Es: 25"
                  min="1"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-ink-700 border border-ink-600 rounded-xl text-cream placeholder-cream/40 focus:border-gold focus:outline-none font-mono text-sm"
                />
              </div>
            </div>
          )}

          {/* Quality Selection */}
          <div>
            <label className="flex items-center gap-2 text-cream/80 mb-2 text-sm font-medium">
              <Star size={16} />
              Qualità del lavoro
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(QUALITY_LABELS) as WorkQuality[]).map(q => (
                <button
                  key={q}
                  onClick={() => setSelectedQuality(q)}
                  className={cn(
                    'p-2.5 sm:p-3 rounded-xl border-2 transition-all duration-200 text-center active:scale-95',
                    selectedQuality === q
                      ? 'border-gold bg-gold/20'
                      : 'border-ink-600 bg-ink-700/50 hover:border-gold/50'
                  )}
                >
                  <div className="text-xl sm:text-2xl mb-1">{QUALITY_LABELS[q].emoji}</div>
                  <div className="text-xs sm:text-sm font-medium text-cream">{QUALITY_LABELS[q].label}</div>
                  <div className="text-[10px] sm:text-xs text-cream/60">×{QUALITY_MULTIPLIERS[q]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Summary & Emit Button */}
          <div className="pt-4 border-t border-ink-600">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="text-cream/60 text-sm">
                {selectedPlayer && (
                  <span>
                    Destinatario: <span className="text-cream font-medium">
                      {players.find(p => p.id === selectedPlayer)?.emoji} {players.find(p => p.id === selectedPlayer)?.name}
                    </span>
                  </span>
                )}
              </div>
              <div className="text-right w-full sm:w-auto">
                {baseValue > 0 && (
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-0">
                    <div className="text-xs sm:text-sm text-cream/60">
                      Base: 🪙{baseValue} × {multiplier}
                    </div>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-gold flex items-center gap-1">
                      <Sparkles size={16} className="text-gold/60" />
                      🪙 {finalValue}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleEmit}
              disabled={!canEmit}
              fullWidth
              size="lg"
              variant="primary"
              icon={Send}
            >
              EMETTI GETTONE
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
