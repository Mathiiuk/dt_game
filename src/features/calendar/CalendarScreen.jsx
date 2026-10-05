import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRightLeft, FastForward, Sparkles, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { useGameContext } from '../../context/GameContext'
import { calendarApi, SEASON_PHASES } from '../../api/calendar'
import { gameLoopApi } from '../../api/gameLoop'
import { queryCache } from '../../utils/cache'
import { isFixturePlayed } from '../../domain/fixtureStatus'
import { CALENDAR_FILTERS, filterWeeks, findDueMatch } from '../../domain/calendarView'
import { formatGameDate } from '../../lib/format'
import { friendlyError } from '../../lib/errors'
import { cn } from '../../lib/utils'
import { Badge, Button, Card, CardBody, ChoiceChips, EmptyState, PageHeader, Skeleton, Stat } from '../../components/ui'

export default function CalendarScreen() {
  const navigate = useNavigate()
  const { club, manager, loading: contextLoading, refreshContext } = useGameContext()
  const [calendarData, setCalendarData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [advancing, setAdvancing] = useState(false)
  const [filter, setFilter] = useState('ALL')
  const currentRef = useRef(null)

  const loadCalendar = async () => {
    try {
      const careerId = await calendarApi.resolveCareerId(manager?.id)
      setCalendarData(await calendarApi.getSeasonCalendar(careerId, club?.id, 2026))
    } catch (e) {
      console.error('Error cargando calendario:', e)
      toast.error('No se pudo cargar el calendario de la temporada.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (contextLoading || !club) return
    loadCalendar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextLoading, club?.id, club?.game_date])

  // Al terminar de cargar, deja a la vista la semana en curso
  useEffect(() => {
    if (!loading) currentRef.current?.scrollIntoView?.({ block: 'center' })
  }, [loading])

  const state = calendarData?.currentState || { current_week: 1, current_season_year: 2026, season_phase: 'PRE_SEASON' }
  const weeks = useMemo(() => calendarData?.weeks || [], [calendarData])
  const visible = useMemo(() => filterWeeks(weeks, filter), [weeks, filter])
  const dueMatch = useMemo(() => findDueMatch(weeks, state.current_date), [weeks, state.current_date])

  const handleAdvance = async () => {
    if (!calendarData?.currentState) return
    setAdvancing(true)
    try {
      // Mismo motor que el Inicio: avance autoritativo, evaluación de la dirigencia y auditoría
      const res = await gameLoopApi.advanceWeek(club.id, manager?.id, {
        careerId: calendarData.currentState.career_id,
        expectedCurrentWeek: calendarData.currentState.current_week
      })

      queryCache.clear()
      await refreshContext()
      await loadCalendar()
      if (res.fired) {
        toast.error('La dirigencia te destituyó por los resultados deportivos.')
        navigate('/manager')
        return
      }
      toast.success(`Semana ${res.week} completada. El plantel recuperó condición física.`)
    } catch (e) {
      toast.error(friendlyError(e, 'No pudimos avanzar la semana. Probá de nuevo.'))
    } finally {
      setAdvancing(false)
    }
  }

  if (loading || contextLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-6 sm:px-6" role="status" aria-label="Cargando calendario">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-28" />
        {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
      </div>
    )
  }

  const phaseLabel = SEASON_PHASES[state.season_phase]?.label || state.season_phase

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        eyebrow={`Temporada ${state.current_season_year} · 52 semanas`}
        title="Calendario"
        actions={
          dueMatch ? (
            <Button onClick={() => navigate('/dashboard')}><Trophy />Jugar el partido pendiente</Button>
          ) : (
            <Button loading={advancing} onClick={handleAdvance}>{!advancing && <FastForward />}Avanzar semana</Button>
          )
        }
      />

      <Card className="mb-6">
        <CardBody className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          <Stat label="Semana" value={`${state.current_week} / 52`} valueClassName="text-accent" />
          <Stat label="Fase" value={phaseLabel} valueClassName="text-xl sm:text-2xl" />
          <Stat label="Fecha" value={state.current_date ? formatGameDate(state.current_date) : '—'} valueClassName="text-xl sm:text-2xl" />
          <Stat label="Mercado" value={state.transfer_window_open ? 'Abierto' : 'Cerrado'} hint={state.transfer_window_open ? 'Fichajes y cesiones' : 'Sin fichajes'} valueClassName="text-xl sm:text-2xl" />
        </CardBody>
      </Card>

      {dueMatch && (
        <p role="status" className="mb-6 rounded-lg border border-warning/40 bg-warning-soft p-3 text-sm text-warning">
          Tenés un partido pendiente. Para avanzar de semana primero hay que disputarlo.
        </p>
      )}

      <ChoiceChips label="Filtrar semanas" value={filter} onChange={setFilter} options={CALENDAR_FILTERS} className="mb-5" />

      {visible.length === 0 ? (
        <Card as="div"><EmptyState title="Sin semanas" description="Ninguna semana coincide con el filtro." action={<Button variant="outline" size="sm" onClick={() => setFilter('ALL')}>Ver todas</Button>} /></Card>
      ) : (
        <ol className="space-y-2.5" aria-label="Semanas de la temporada">
          {visible.map(w => {
            const played = w.match && isFixturePlayed(w.match.status)
            return (
              <li
                key={w.weekNumber}
                ref={w.isCurrent ? currentRef : undefined}
                aria-current={w.isCurrent ? 'date' : undefined}
                className={cn(
                  'rounded-lg border p-3.5',
                  w.isCurrent ? 'border-accent bg-accent-soft' : 'border-line bg-surface',
                  w.isPast && 'opacity-70'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={cn('grid size-11 shrink-0 place-items-center rounded-md text-center leading-none', w.isCurrent ? 'bg-accent text-accent-fg' : 'bg-surface-3 text-fg-muted')}>
                      <span>
                        <span className="block text-[10px] font-semibold uppercase">Sem</span>
                        <span className="num font-display text-lg font-semibold">{w.weekNumber}</span>
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-fg">
                        {formatGameDate(w.date)}
                        <span className="text-xs font-normal text-fg-muted">{w.phaseLabel}</span>
                        {w.isCurrent && <Badge tone="accent">En curso</Badge>}
                      </p>
                      {(w.transferWindowOpen || w.events.length > 0) && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {w.transferWindowOpen && <Badge><ArrowRightLeft className="size-3" aria-hidden="true" />Mercado</Badge>}
                          {w.events.map((ev, i) => <Badge key={i} tone="gold"><Sparkles className="size-3" aria-hidden="true" />{ev.label}</Badge>)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {w.match ? (
                      <>
                        <p className="flex items-center justify-end gap-1.5 text-sm font-semibold text-fg"><Trophy className="size-3.5 text-gold" aria-hidden="true" />{w.match.home_club_id === club?.id ? 'Local' : 'Visitante'}</p>
                        <p className={cn('num mt-0.5 text-xs font-semibold', played ? 'text-fg-muted' : 'text-accent')}>
                          {played ? `${w.match.home_score} - ${w.match.away_score}` : 'Por jugar'}
                        </p>
                      </>
                    ) : (
                      <span className="text-xs text-fg-subtle">Sin partido</span>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
