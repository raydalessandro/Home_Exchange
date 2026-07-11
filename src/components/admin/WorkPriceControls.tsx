'use client'

import { useState } from 'react'
import { useStore } from '@/store'
import type { PlayerLevel } from '@/types'
import { ALL_LEVELS, LEVELS } from '@/lib/levels'
import { Card, CardHeader } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { cn } from '@/lib/cn'
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  Sliders,
  ChevronDown,
  ChevronRight,
  Edit3,
  Check,
  X,
  Eye,
  EyeOff,
  Plus,
  Trash2
} from 'lucide-react'

export function WorkPriceControls() {
  const workCategories = useStore(state => state.workCategories)
  const setTemplatePrice = useStore(state => state.setTemplatePrice)
  const setCategoryMultiplier = useStore(state => state.setCategoryMultiplier)
  const triggerWorkMarketEvent = useStore(state => state.triggerWorkMarketEvent)
  const setTemplateAvailability = useStore(state => state.setTemplateAvailability)
  const addWorkTemplate = useStore(state => state.addWorkTemplate)
  const removeWorkTemplate = useStore(state => state.removeWorkTemplate)

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<{ catId: string; tplId: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newTemplate, setNewTemplate] = useState({ name: '', emoji: '', value: '', minLevel: 1 as PlayerLevel })

  const cycleMinLevel = (catId: string, tplId: string, current: PlayerLevel) => {
    const next = (current >= 4 ? 1 : current + 1) as PlayerLevel
    setTemplateAvailability(catId, tplId, { minLevel: next })
  }

  const handleAddTemplate = (categoryId: string) => {
    const value = parseInt(newTemplate.value)
    if (!newTemplate.name.trim() || !(value > 0)) return
    addWorkTemplate(categoryId, {
      name: newTemplate.name,
      emoji: newTemplate.emoji,
      baseValue: value,
      minLevel: newTemplate.minLevel,
    })
    setNewTemplate({ name: '', emoji: '', value: '', minLevel: 1 })
  }

  const handleStartEdit = (catId: string, tplId: string, currentValue: number) => {
    setEditingTemplate({ catId, tplId })
    setEditValue(currentValue.toString())
  }

  const handleSaveEdit = () => {
    if (!editingTemplate) return
    const value = parseInt(editValue)
    if (value > 0) {
      setTemplatePrice(editingTemplate.catId, editingTemplate.tplId, value)
    }
    setEditingTemplate(null)
    setEditValue('')
  }

  const handleCancelEdit = () => {
    setEditingTemplate(null)
    setEditValue('')
  }

  const handleMultiplierChange = (categoryId: string, delta: number) => {
    const category = workCategories.find(c => c.id === categoryId)
    if (!category) return
    const currentMultiplier = category.priceMultiplier ?? 1.0
    const newMultiplier = Math.round((currentMultiplier + delta) * 100) / 100
    if (newMultiplier >= 0.1 && newMultiplier <= 5) {
      setCategoryMultiplier(categoryId, newMultiplier)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <CardHeader 
        title="Controllo Prezzi Lavori" 
        icon={<Briefcase size={20} />}
      />

      {/* Market Events */}
      <Card variant="dark" className="border border-amber-500/40 bg-ink-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-amber-400 mb-1 flex items-center gap-2">
              <Sliders size={16} />
              Eventi Mercato Lavoro
            </div>
            <p className="text-cream-100 text-sm">
              Applica variazioni globali a tutti i prezzi dei lavori
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="success"
              size="sm"
              onClick={() => triggerWorkMarketEvent('WORK_BOOM')}
              icon={TrendingUp}
            >
              BOOM +20%
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => triggerWorkMarketEvent('WORK_CRASH')}
              icon={TrendingDown}
            >
              CRASH -20%
            </Button>
          </div>
        </div>
      </Card>

      {/* Categories */}
      <div className="space-y-3">
        {workCategories.map(category => {
          // Default values for backwards compatibility
          const multiplier = category.priceMultiplier ?? 1.0
          
          return (
          <Card key={category.id} variant="dark" padding="none">
            {/* Category Header */}
            <button
              onClick={() => setExpandedCategory(
                expandedCategory === category.id ? null : category.id
              )}
              className="w-full flex items-center justify-between p-4 hover:bg-ink-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{category.emoji}</span>
                <div className="text-left">
                  <div className="font-semibold text-cream-50">{category.name}</div>
                  <div className="text-xs text-cream-200">
                    {category.templates.length} lavori
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Multiplier Controls */}
                <div 
                  className="flex items-center gap-2"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleMultiplierChange(category.id, -0.1)}
                    className="w-7 h-7 rounded-lg bg-ink-600 hover:bg-ink-500 flex items-center justify-center text-cream-50 font-bold transition-colors"
                  >
                    -
                  </button>
                  <span className={cn(
                    'font-mono text-sm min-w-[50px] text-center font-bold',
                    multiplier > 1 ? 'text-emerald-400' :
                    multiplier < 1 ? 'text-red-400' :
                    'text-cream-50'
                  )}>
                    {multiplier.toFixed(1)}x
                  </span>
                  <button
                    onClick={() => handleMultiplierChange(category.id, 0.1)}
                    className="w-7 h-7 rounded-lg bg-ink-600 hover:bg-ink-500 flex items-center justify-center text-cream-50 font-bold transition-colors"
                  >
                    +
                  </button>
                </div>
                
                {expandedCategory === category.id ? (
                  <ChevronDown size={20} className="text-cream/50" />
                ) : (
                  <ChevronRight size={20} className="text-cream/50" />
                )}
              </div>
            </button>

            {/* Templates List */}
            {expandedCategory === category.id && (
              <div className="border-t border-ink-600">
                {category.templates.map(template => {
                  // Default values for backwards compatibility
                  const currentValue = template.currentValue ?? template.baseValue
                  const isEditing = editingTemplate?.catId === category.id &&
                                   editingTemplate?.tplId === template.id
                  const priceChanged = currentValue !== template.baseValue
                  const isActive = template.active ?? true
                  const minLevel = template.minLevel ?? 1

                  return (
                    <div
                      key={template.id}
                      className={cn(
                        'flex items-center justify-between px-4 py-3 border-b border-ink-700/50 last:border-b-0 hover:bg-ink-700/30',
                        !isActive && 'opacity-40'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{template.emoji}</span>
                        <div>
                          <div className="text-sm text-cream-50 font-medium">
                            {template.name}
                            {!isActive && <span className="ml-2 text-xs text-red-400">(archiviata)</span>}
                          </div>
                          <div className="text-xs text-cream-200">
                            Base: 🪙{template.baseValue}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Livello minimo: click per cambiare */}
                        <button
                          onClick={() => cycleMinLevel(category.id, template.id, minLevel)}
                          title={`Visibile dal livello ${LEVELS[minLevel].name} in su (click per cambiare)`}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-ink-600 hover:bg-ink-500 text-xs text-cream-100 transition-colors"
                        >
                          {LEVELS[minLevel].emoji} Lv{minLevel}+
                        </button>

                        {/* Attiva/archivia */}
                        <button
                          onClick={() => setTemplateAvailability(category.id, template.id, { active: !isActive })}
                          title={isActive ? 'Archivia (nascondi ai bambini)' : 'Riattiva'}
                          className={cn(
                            'w-7 h-7 rounded flex items-center justify-center transition-colors',
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                              : 'bg-ink-600 text-cream/40 hover:bg-ink-500'
                          )}
                        >
                          {isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>

                        {/* Elimina */}
                        <button
                          onClick={() => {
                            if (confirm(`Eliminare "${template.name}" definitivamente? (Per nasconderla temporaneamente usa l'occhio)`)) {
                              removeWorkTemplate(category.id, template.id)
                            }
                          }}
                          title="Elimina definitivamente"
                          className="w-7 h-7 rounded bg-red-500/10 text-red-400/70 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              min="1"
                              className="w-16 px-2 py-1 bg-ink-700 border border-gold rounded text-cream text-sm font-mono text-center"
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveEdit()
                                if (e.key === 'Escape') handleCancelEdit()
                              }}
                            />
                            <button
                              onClick={handleSaveEdit}
                              className="w-7 h-7 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 flex items-center justify-center"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="w-7 h-7 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center justify-center"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className={cn(
                              'font-mono text-lg font-bold',
                              priceChanged ? 'text-gold-400' : 'text-cream-50'
                            )}>
                              🪙{currentValue}
                            </span>
                            {priceChanged && (
                              <span className={cn(
                                'text-xs',
                                currentValue > template.baseValue 
                                  ? 'text-emerald-400' 
                                  : 'text-red-400'
                              )}>
                                {currentValue > template.baseValue ? '+' : ''}
                                {Math.round((currentValue / template.baseValue - 1) * 100)}%
                              </span>
                            )}
                            <button
                              onClick={() => handleStartEdit(category.id, template.id, currentValue)}
                              className="w-7 h-7 rounded bg-ink-600 hover:bg-ink-500 flex items-center justify-center text-cream-100 hover:text-white transition-colors"
                            >
                              <Edit3 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Aggiungi nuova attività */}
                <div className="px-4 py-3 bg-ink-800/50 flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={newTemplate.emoji}
                    onChange={e => setNewTemplate(f => ({ ...f, emoji: e.target.value }))}
                    placeholder="😀"
                    className="w-12 px-2 py-1.5 bg-ink-700 border border-ink-600 rounded-lg text-cream text-sm text-center focus:border-gold focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={e => setNewTemplate(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nuova attività..."
                    className="flex-1 min-w-[120px] px-3 py-1.5 bg-ink-700 border border-ink-600 rounded-lg text-cream text-sm focus:border-gold focus:outline-none"
                  />
                  <input
                    type="number"
                    value={newTemplate.value}
                    onChange={e => setNewTemplate(f => ({ ...f, value: e.target.value }))}
                    placeholder="🪙"
                    min="1"
                    className="w-16 px-2 py-1.5 bg-ink-700 border border-ink-600 rounded-lg text-cream text-sm font-mono text-center focus:border-gold focus:outline-none"
                  />
                  <button
                    onClick={() => setNewTemplate(f => ({
                      ...f,
                      minLevel: (f.minLevel >= 4 ? 1 : f.minLevel + 1) as PlayerLevel,
                    }))}
                    title={`Visibile dal livello ${LEVELS[newTemplate.minLevel].name} in su`}
                    className="px-2 py-1.5 rounded-lg bg-ink-600 hover:bg-ink-500 text-xs text-cream-100 transition-colors"
                  >
                    {LEVELS[newTemplate.minLevel].emoji} Lv{newTemplate.minLevel}+
                  </button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleAddTemplate(category.id)}
                    icon={Plus}
                  >
                    Aggiungi
                  </Button>
                </div>
              </div>
            )}
          </Card>
          )
        })}
      </div>

      {/* Info Box */}
      <Card variant="dark" className="bg-ink-800 border-sky-500/30">
        <div className="text-sm">
          <div className="font-semibold text-sky-400 mb-2">Come funziona:</div>
          <ul className="space-y-1 text-cream-100">
            <li>• Il <strong className="text-cream-50">moltiplicatore categoria</strong> modifica tutti i template della categoria</li>
            <li>• Puoi anche modificare il <strong className="text-cream-50">prezzo singolo</strong> di ogni template</li>
            <li>• Gli <strong className="text-cream-50">eventi mercato</strong> applicano variazioni globali (+20% o -20%)</li>
            <li>• Abbassare i prezzi = meno inflazione (meno moneta emessa per lavoro)</li>
            <li>• <strong className="text-cream-50">🌱 Lv+</strong> imposta da quale livello di crescita l&apos;attività è visibile</li>
            <li>• L&apos;<strong className="text-cream-50">occhio</strong> archivia un&apos;attività senza cancellarla: utile quando i bambini crescono e le attività cambiano</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}

