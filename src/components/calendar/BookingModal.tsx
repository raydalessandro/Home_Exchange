'use client'

import { useState } from 'react'
import { useStore } from '@/store'
import { getFeatures, getPlayerLevel, isTemplateVisible } from '@/lib/levels'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import { cn } from '@/lib/cn'
import { 
  Calendar, 
  Users, 
  Check,
  X
} from 'lucide-react'
import { formatDateDisplay } from '@/types/calendar'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: string
}

export function BookingModal({ isOpen, onClose, selectedDate }: BookingModalProps) {
  const currentUser = useStore(state => state.currentUser)
  const players = useStore(state => state.players)
  const workCategories = useStore(state => state.workCategories)
  const createBooking = useStore(state => state.createBooking)

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<{
    id: string
    name: string
    emoji: string
    value: number
  } | null>(null)
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([])
  const [step, setStep] = useState<'category' | 'template' | 'collaborators'>('category')

  // Get non-bank, non-current-user players for collaborator selection
  const otherPlayers = players.filter(p =>
    !p.isBank && p.id !== currentUser?.id
  )

  // Livello del giocatore: filtra le attività visibili e la funzione collaboratori
  const playerLevel = getPlayerLevel(currentUser)
  const features = getFeatures(playerLevel)
  const visibleCategories = workCategories
    .map(category => ({
      ...category,
      templates: category.templates.filter(t => isTemplateVisible(t, playerLevel)),
    }))
    .filter(category => category.templates.length > 0)

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setStep('template')
  }

  const handleTemplateSelect = (template: { id: string; name: string; emoji: string; currentValue: number }) => {
    setSelectedTemplate({
      id: template.id,
      name: template.name,
      emoji: template.emoji,
      value: template.currentValue,
    })
    setStep('collaborators')
  }

  const toggleCollaborator = (playerId: string) => {
    setSelectedCollaborators(prev => 
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }

  const handleConfirm = () => {
    if (!selectedCategory || !selectedTemplate) return

    createBooking({
      templateId: selectedTemplate.id,
      categoryId: selectedCategory,
      templateName: selectedTemplate.name,
      templateEmoji: selectedTemplate.emoji,
      baseValue: selectedTemplate.value,
      scheduledDate: selectedDate,
      collaboratorIds: selectedCollaborators.length > 0 ? selectedCollaborators : undefined,
    })

    handleClose()
  }

  const handleClose = () => {
    setSelectedCategory(null)
    setSelectedTemplate(null)
    setSelectedCollaborators([])
    setStep('category')
    onClose()
  }

  const handleBack = () => {
    if (step === 'collaborators') {
      setSelectedTemplate(null)
      setStep('template')
    } else if (step === 'template') {
      setSelectedCategory(null)
      setStep('category')
    }
  }

  const selectedCategoryData = visibleCategories.find(c => c.id === selectedCategory)

  return (
    <Modal isOpen={isOpen} onClose={handleClose} showHeader={false}>
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-serif text-gold flex items-center gap-2">
              <Calendar size={24} />
              Nuova Prenotazione
            </h2>
            <p className="text-cream-200 text-sm mt-1">
              {formatDateDisplay(selectedDate)}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg bg-ink-700 hover:bg-ink-600 flex items-center justify-center text-cream-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
            step === 'category' ? 'bg-gold text-ink-900' : 'bg-ink-600 text-cream-200'
          )}>
            1
          </div>
          <div className={cn(
            'flex-1 h-1 rounded',
            step !== 'category' ? 'bg-gold' : 'bg-ink-600'
          )} />
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
            step === 'template' ? 'bg-gold text-ink-900' : 
            step === 'collaborators' ? 'bg-gold text-ink-900' : 'bg-ink-600 text-cream-200'
          )}>
            2
          </div>
          <div className={cn(
            'flex-1 h-1 rounded',
            step === 'collaborators' ? 'bg-gold' : 'bg-ink-600'
          )} />
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
            step === 'collaborators' ? 'bg-gold text-ink-900' : 'bg-ink-600 text-cream-200'
          )}>
            3
          </div>
        </div>

        {/* Step Content */}
        {step === 'category' && (
          <div className="space-y-3">
            <h3 className="text-cream-100 font-medium mb-3">Scegli categoria:</h3>
            {visibleCategories.map(category => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className="w-full p-4 bg-ink-700 hover:bg-ink-600 border border-ink-600 hover:border-gold/50 rounded-xl flex items-center gap-3 transition-all"
              >
                <span className="text-2xl">{category.emoji}</span>
                <div className="text-left">
                  <div className="text-cream-50 font-medium">{category.name}</div>
                  <div className="text-cream-200 text-xs">
                    {category.templates.length} attività
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 'template' && selectedCategoryData && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={handleBack}
                className="text-cream-200 hover:text-cream-50"
              >
                ← Indietro
              </button>
              <span className="text-cream-100">
                {selectedCategoryData.emoji} {selectedCategoryData.name}
              </span>
            </div>
            <h3 className="text-cream-100 font-medium mb-3">Scegli attività:</h3>
            {selectedCategoryData.templates.map(template => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className="w-full p-4 bg-ink-700 hover:bg-ink-600 border border-ink-600 hover:border-gold/50 rounded-xl flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{template.emoji}</span>
                  <span className="text-cream-50">{template.name}</span>
                </div>
                <span className="text-gold-400 font-mono font-bold">
                  🪙 {template.currentValue ?? template.baseValue}
                </span>
              </button>
            ))}
          </div>
        )}

        {step === 'collaborators' && selectedTemplate && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={handleBack}
                className="text-cream-200 hover:text-cream-50"
              >
                ← Indietro
              </button>
            </div>

            {/* Selected activity summary */}
            <Card variant="dark" className="border-gold/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedTemplate.emoji}</span>
                  <div>
                    <div className="text-cream-50 font-medium">{selectedTemplate.name}</div>
                    <div className="text-cream-200 text-sm">{formatDateDisplay(selectedDate)}</div>
                  </div>
                </div>
                <span className="text-gold-400 font-mono font-bold text-lg">
                  🪙 {selectedTemplate.value}
                </span>
              </div>
            </Card>

            {/* Collaborators - solo dal livello Mercante in su */}
            {features.canCollaborate && (
            <div>
              <h3 className="text-cream-100 font-medium mb-3 flex items-center gap-2">
                <Users size={18} />
                Collaboratori (opzionale)
              </h3>
              <p className="text-cream-200 text-sm mb-3">
                Aggiungi chi ti aiuterà. Dopo la conferma potrai decidere quanto pagarli.
              </p>
              <div className="space-y-2">
                {otherPlayers.map(player => (
                  <label
                    key={player.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all',
                      selectedCollaborators.includes(player.id)
                        ? 'bg-emerald-500/20 border border-emerald-500/50'
                        : 'bg-ink-700 border border-ink-600 hover:border-ink-500'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{player.emoji}</span>
                      <span className="text-cream-50">{player.name}</span>
                    </div>
                    <div className={cn(
                      'w-6 h-6 rounded-lg flex items-center justify-center',
                      selectedCollaborators.includes(player.id)
                        ? 'bg-emerald-500'
                        : 'bg-ink-600'
                    )}>
                      {selectedCollaborators.includes(player.id) && (
                        <Check size={14} className="text-white" />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selectedCollaborators.includes(player.id)}
                      onChange={() => toggleCollaborator(player.id)}
                    />
                  </label>
                ))}
              </div>
            </div>
            )}

            {/* Confirm button */}
            <Button
              variant="primary"
              fullWidth
              onClick={handleConfirm}
              icon={Check}
            >
              Prenota
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

