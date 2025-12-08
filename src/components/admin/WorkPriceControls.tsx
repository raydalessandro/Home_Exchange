'use client'

import { useState } from 'react'
import { useStore } from '@/store'
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
  X
} from 'lucide-react'

export function WorkPriceControls() {
  const workCategories = useStore(state => state.workCategories)
  const setTemplatePrice = useStore(state => state.setTemplatePrice)
  const setCategoryMultiplier = useStore(state => state.setCategoryMultiplier)
  const triggerWorkMarketEvent = useStore(state => state.triggerWorkMarketEvent)
  
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<{ catId: string; tplId: string } | null>(null)
  const [editValue, setEditValue] = useState('')

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
    const newMultiplier = Math.round((category.priceMultiplier + delta) * 100) / 100
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
      <Card variant="dark" className="border border-amber-500/30 bg-amber-500/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="font-medium text-cream mb-1 flex items-center gap-2">
              <Sliders size={16} className="text-amber-400" />
              Eventi Mercato Lavoro
            </div>
            <p className="text-cream/60 text-sm">
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
        {workCategories.map(category => (
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
                  <div className="font-medium text-cream">{category.name}</div>
                  <div className="text-xs text-cream/50">
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
                    className="w-7 h-7 rounded-lg bg-ink-700 hover:bg-ink-600 flex items-center justify-center text-cream/70 hover:text-cream transition-colors"
                  >
                    -
                  </button>
                  <span className={cn(
                    'font-mono text-sm min-w-[50px] text-center',
                    category.priceMultiplier > 1 ? 'text-emerald-400' :
                    category.priceMultiplier < 1 ? 'text-red-400' :
                    'text-cream'
                  )}>
                    {category.priceMultiplier.toFixed(1)}x
                  </span>
                  <button
                    onClick={() => handleMultiplierChange(category.id, 0.1)}
                    className="w-7 h-7 rounded-lg bg-ink-700 hover:bg-ink-600 flex items-center justify-center text-cream/70 hover:text-cream transition-colors"
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
                  const isEditing = editingTemplate?.catId === category.id && 
                                   editingTemplate?.tplId === template.id
                  const priceChanged = template.currentValue !== template.baseValue
                  
                  return (
                    <div
                      key={template.id}
                      className="flex items-center justify-between px-4 py-3 border-b border-ink-700/50 last:border-b-0 hover:bg-ink-700/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{template.emoji}</span>
                        <div>
                          <div className="text-sm text-cream">{template.name}</div>
                          <div className="text-xs text-cream/40">
                            Base: 🪙{template.baseValue}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
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
                              'font-mono text-lg',
                              priceChanged ? 'text-gold' : 'text-cream'
                            )}>
                              🪙{template.currentValue}
                            </span>
                            {priceChanged && (
                              <span className={cn(
                                'text-xs',
                                template.currentValue > template.baseValue 
                                  ? 'text-emerald-400' 
                                  : 'text-red-400'
                              )}>
                                {template.currentValue > template.baseValue ? '+' : ''}
                                {Math.round((template.currentValue / template.baseValue - 1) * 100)}%
                              </span>
                            )}
                            <button
                              onClick={() => handleStartEdit(category.id, template.id, template.currentValue)}
                              className="w-7 h-7 rounded bg-ink-700 hover:bg-ink-600 flex items-center justify-center text-cream/50 hover:text-cream transition-colors"
                            >
                              <Edit3 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Info Box */}
      <Card variant="dark" className="bg-sky-500/5 border-sky-500/20">
        <div className="text-sm text-cream/70">
          <div className="font-medium text-sky-400 mb-2">Come funziona:</div>
          <ul className="space-y-1 text-cream/60">
            <li>• Il <strong>moltiplicatore categoria</strong> modifica tutti i template della categoria</li>
            <li>• Puoi anche modificare il <strong>prezzo singolo</strong> di ogni template</li>
            <li>• Gli <strong>eventi mercato</strong> applicano variazioni globali (+20% o -20%)</li>
            <li>• Abbassare i prezzi = meno inflazione (meno moneta emessa per lavoro)</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}

