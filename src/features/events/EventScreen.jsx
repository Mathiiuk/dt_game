import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useGameContext } from '../../context/GameContext'
import { dashboardApi } from '../../api/dashboard'
import { eventsApi } from '../../api/events'
import { friendlyError } from '../../lib/errors'
import { formatMoney } from '../../lib/format'
import { cn } from '../../lib/utils'
import { Button, Badge, Progress } from '../../components/ui'
import AppShell from '../../components/layout/AppShell'

const EVENT_CATEGORY = {
  COMMUNITY: { label: 'Comunidad y barrio', tone: 'accent' },
  LOCKER_ROOM: { label: 'Vestuario y disciplina', tone: 'neutral' },
  BOARD_PRESS: { label: 'Dirigencia y prensa', tone: 'neutral' },
  FINANCIAL_CRISIS: { label: 'Economía y crisis', tone: 'warning' }
}

const isStoryEvent = (event) => String(event.template_code || '').startsWith('ARC_')

export default function EventScreen() {
  const navigate = useNavigate()
  const { manager, club, refreshContext, loading: contextLoading } = useGameContext()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [choosing, setChoosing] = useState(false)
  const [outcome, setOutcome] = useState(null)

  useEffect(() => {
    if (contextLoading || !club || !manager) return
    let isMounted = true

    const loadData = async () => {
      try {
        const overview = await dashboardApi.getOverview(club, manager)
        if (isMounted) {
          setEvents(overview.pendingEvents || [])
          setLoading(false)
        }
      } catch (e) {
        console.error('Error cargando eventos:', e)
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => { isMounted = false }
  }, [contextLoading, club, manager])

  const currentEvent = events[0]

  const handleResolve = async (event, option) => {
    if (choosing) return
    setChoosing(true)
    try {
      const result = await eventsApi.resolveEvent(event.id, option, manager?.id)
      await refreshContext()
      setOutcome(result)
    } catch (err) {
      toast.error(friendlyError(err, 'Error al procesar la decisión.'))
      setChoosing(false)
    }
  }

  const handleContinue = () => {
    setOutcome(null)
    setChoosing(false)
    const remaining = events.slice(1)
    setEvents(remaining)
    if (remaining.length === 0) {
      navigate('/dashboard')
    }
  }

  if (loading || contextLoading) {
    return (
      <>
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <div className="text-sm text-fg-muted">Cargando evento...</div>
        </div>
      </>
    )
  }

  if (!currentEvent && !outcome) {
    return (
      <>
        <div className="mx-auto max-w-2xl p-6 text-center">
          <p className="mb-4 text-fg">No hay decisiones pendientes.</p>
          <Button onClick={() => navigate('/dashboard')}>Volver al inicio</Button>
        </div>
      </>
    )
  }

  if (outcome) {
    return (
      <>
        <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:py-10">
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <h1 className="font-display text-2xl font-bold text-fg sm:text-4xl">Decisión tomada</h1>
            
            <div className="rounded-xl border border-line bg-surface p-6 shadow-xl text-left w-full max-w-xl">
              <p className="text-lg leading-relaxed text-fg">{outcome.outcomeNote || 'Decisión ejecutada.'}</p>
            </div>

            <Button size="lg" onClick={handleContinue} className="w-full sm:w-auto">
              Continuar
            </Button>
          </div>
        </div>
      </>
    )
  }

  const category = EVENT_CATEGORY[currentEvent.category] || { label: currentEvent.category, tone: 'neutral' }
  const options = Array.isArray(currentEvent.options) ? currentEvent.options : []
  const critical = currentEvent.severity === 'CRITICAL'
  const budget = Number(club?.budget || 0)
  const boardConfidence = Number(club?.board_confidence ?? 100)

  return (
    <>
      <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:py-10">
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm font-semibold text-fg-muted hover:text-fg transition-colors">
            <ArrowLeft className="size-4" /> Volver al Inicio
          </button>
          <div className="flex gap-2">
            {isStoryEvent(currentEvent) && <Badge tone="gold">Historia</Badge>}
            <Badge tone={category.tone}>{category.label}</Badge>
            {critical && <Badge tone="danger" dot>Urgente</Badge>}
          </div>
        </div>

        <div className="mb-8">
          <h1 className="flex items-center gap-3 font-display text-2xl font-bold text-fg sm:text-4xl">
            <Bell className={cn('size-6 sm:size-8', critical ? 'text-danger' : 'text-fg-subtle')} aria-hidden="true" />
            {currentEvent.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-fg-muted sm:text-lg">{currentEvent.description}</p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-fg-subtle">¿Qué querés hacer?</p>
          {options.map(opt => {
            const cost = Number(opt.cost || 0)
            const canAfford = cost === 0 || budget >= cost
            const needsBoard = Number(opt.requires?.board || 0)
            const hasBackup = !needsBoard || boardConfidence >= needsBoard

            return (
              <button
                key={opt.id}
                disabled={choosing || !canAfford || !hasBackup}
                onClick={() => handleResolve(currentEvent, opt)}
                className={cn(
                  "group relative flex w-full flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
                  canAfford && hasBackup && !choosing
                    ? "border-line bg-surface hover:border-accent hover:shadow-md hover:shadow-accent/5"
                    : "border-line/50 bg-surface/50 opacity-60 cursor-not-allowed"
                )}
              >
                <div className="flex w-full min-w-0 flex-wrap items-start justify-between gap-x-4 gap-y-1.5">
                  <span className="min-w-0 break-words font-semibold text-fg group-hover:text-accent">{opt.label}</span>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {cost > 0 && <Badge tone={canAfford ? 'warning' : 'danger'} className="num">-{formatMoney(cost)}</Badge>}
                    {!hasBackup && <Badge tone="danger">Sin respaldo</Badge>}
                  </div>
                </div>
                {opt.description && (
                  <p className="text-sm text-fg-muted line-clamp-2 group-hover:text-fg">{opt.description}</p>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

