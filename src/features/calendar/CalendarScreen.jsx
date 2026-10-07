import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRightLeft, Calendar as CalendarIcon, FastForward, Sparkles, Trophy, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useGameContext } from '../../context/GameContext'
import { calendarApi, SEASON_PHASES } from '../../api/calendar'
import { gameLoopApi } from '../../api/gameLoop'
import { queryCache } from '../../utils/cache'
import { isFixturePlayed } from '../../domain/fixtureStatus'
import {
  CALENDAR_FILTERS, filterWeeks, findDueMatch, getUpcomingMatches, getRecentResults, groupWeeksByMonth
} from '../../domain/calendarView'
import { formatGameDate } from '../../lib/format'
import { friendlyError } from '../../lib/errors'
import { cn } from '../../lib/utils'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, ChoiceChips, EmptyState, PageHeader, Segmented, Skeleton, Stat } from '../../components/ui'

export default function CalendarScreen() {
  const navigate = useNavigate()
  const { club, manager, loading: contextLoading, refreshContext } = useGameContext()
  const [calendarData, setCalendarData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [advancing, setAdvancing] = useState(false)
  const [viewMode, setViewMode] = useState('UPCOMING') // 'UPCOMING' | 'SEASON' | 'WEEKS'
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

  // Al terminar de cargar o cambiar a semanas, deja a la vista la semana en curso
  useEffect(() => {
    if (!loading && viewMode === 'WEEKS') {
      currentRef.current?.scrollIntoView?.({ block: 'center' })
    }
  }, [loading, viewMode])

  const state = calendarData?.currentState || { current_week: 1, current_season_year: 2026, season_phase: 'PRE_SEASON' }
  const weeks = useMemo(() => calendarData?.weeks || [], [calendarData])
  const visible = useMemo(() => filterWeeks(weeks, filter, club?.id), [weeks, filter, club?.id])
  const dueMatch = useMemo(() => findDueMatch(weeks, state.current_date), [weeks, state.current_date])
  const upcomingMatches = useMemo(() => getUpcomingMatches(weeks, 5), [weeks])
  const recentResults = useMemo(() => getRecentResults(weeks, 5), [weeks])
  const monthGroups = useMemo(() => groupWeeksByMonth(weeks), [weeks])
  const currentWeekObj = useMemo(() => weeks.find(w => w.isCurrent) || null, [weeks])

  const handleAdvance = async () => {
    if (!calendarData?.currentState) return
    setAdvancing(true)
    try {
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

      {/* Selector de Vista Principal */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Modo de vista"
          value={viewMode}
          onChange={setViewMode}
          options={[
            { value: 'UPCOMING', label: 'Próximos y resultados' },
            { value: 'SEASON', label: 'Por mes' },
            { value: 'WEEKS', label: 'Semanas' }
          ]}
        />
      </div>

      {/* VISTA 1: PRÓXIMOS PARTIDOS Y RESULTADOS (DEFAULT) */}
      {viewMode === 'UPCOMING' && (
        <div className="space-y-6">
          {/* Semana en curso */}
          {currentWeekObj && (
            <div
              role="listitem"
              aria-current="date"
              className="rounded-lg border border-accent bg-accent-soft p-4 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-md bg-accent text-accent-fg font-bold text-xs uppercase">
                  Sem {currentWeekObj.weekNumber}
                </span>
                <div>
                  <p className="text-sm font-semibold text-fg flex items-center gap-2">
                    {formatGameDate(currentWeekObj.date)}
                    <Badge tone="accent">En curso</Badge>
                  </p>
                  <p className="text-xs text-fg-muted">{currentWeekObj.phaseLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {currentWeekObj.transferWindowOpen && <Badge><ArrowRightLeft className="size-3" />Mercado abierto</Badge>}
                {currentWeekObj.match ? (
                  <span className="text-xs font-semibold text-fg">
                    {currentWeekObj.match.is_home ? 'Local' : 'Visitante'} vs {currentWeekObj.match.opponent_name || 'Rival'}
                  </span>
                ) : (
                  <span className="text-xs text-fg-subtle">Sin partido esta semana</span>
                )}
              </div>
            </div>
          )}

          {/* Próximos 5 partidos */}
          <section aria-labelledby="upcoming-matches">
            <h2 id="upcoming-matches" className="eyebrow mb-3 px-1 flex items-center gap-2">
              <Clock className="size-4 text-accent" />
              Próximos 5 partidos
            </h2>
            {upcomingMatches.length === 0 ? (
              <Card as="div"><EmptyState title="Sin próximos partidos" description="No hay partidos pendientes en el calendario." /></Card>
            ) : (
              <ul className="space-y-2.5">
                {upcomingMatches.map(w => {
                  const m = w.match
                  const isHome = m.is_home !== undefined ? m.is_home : (m.home_club_id === club?.id)
                  const opponent = m.opponent_name || (isHome ? 'Rival' : 'Rival')
                  return (
                    <li key={w.weekNumber} className="rounded-lg border border-line bg-surface p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-md bg-surface-3 text-fg-muted font-bold text-xs">
                          S{w.weekNumber}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-fg">
                            {isHome ? `vs. ${opponent}` : `@ ${opponent}`}
                            <span className="ml-2 text-xs font-normal text-fg-muted">({isHome ? 'Local' : 'Visitante'})</span>
                          </p>
                          <p className="text-xs text-fg-muted">{formatGameDate(w.date)} · {w.phaseLabel}</p>
                        </div>
                      </div>
                      <Badge tone="accent">Por jugar</Badge>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {/* Últimos resultados */}
          <section aria-labelledby="recent-results">
            <h2 id="recent-results" className="eyebrow mb-3 px-1 flex items-center gap-2">
              <CheckCircle className="size-4 text-fg-muted" />
              Últimos resultados
            </h2>
            {recentResults.length === 0 ? (
              <Card as="div"><EmptyState title="Sin resultados" description="Todavía no se disputaron partidos de la temporada." /></Card>
            ) : (
              <ul className="space-y-2.5">
                {recentResults.map(w => {
                  const m = w.match
                  const isHome = m.is_home !== undefined ? m.is_home : (m.home_club_id === club?.id)
                  const opponent = m.opponent_name || (isHome ? 'Rival' : 'Rival')
                  const userGoals = isHome ? m.home_score : m.away_score
                  const oppGoals = isHome ? m.away_score : m.home_score
                  const tone = userGoals > oppGoals ? 'accent' : userGoals < oppGoals ? 'danger' : 'gold'
                  return (
                    <li key={w.weekNumber} className="rounded-lg border border-line bg-surface p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-md bg-surface-3 text-fg-muted font-bold text-xs">
                          S{w.weekNumber}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-fg">
                            {isHome ? `vs. ${opponent}` : `@ ${opponent}`}
                            <span className="ml-2 text-xs font-normal text-fg-muted">({isHome ? 'Local' : 'Visitante'})</span>
                          </p>
                          <p className="text-xs text-fg-muted">{formatGameDate(w.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="num font-bold text-sm text-fg">
                          {m.home_score} - {m.away_score}
                        </p>
                        <Badge tone={tone} className="mt-0.5">
                          {userGoals > oppGoals ? 'Victoria' : userGoals < oppGoals ? 'Derrota' : 'Empate'}
                        </Badge>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* VISTA 2: POR MES (TEMPORADA COMPACTA) */}
      {viewMode === 'SEASON' && (
        <div className="space-y-6">
          {monthGroups.map(group => (
            <Card key={group.key}>
              <CardHeader className="py-3 px-4 border-b border-line bg-surface-2/60">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-fg-muted">
                  {group.label}
                </CardTitle>
              </CardHeader>
              <CardBody className="p-3 space-y-2">
                {group.weeks.map(w => {
                  const m = w.match
                  if (!m) {
                    return (
                      <div key={w.weekNumber} className="text-xs text-fg-subtle py-1 px-2.5 rounded bg-surface-2/30 flex items-center justify-between">
                        <span>Semana {w.weekNumber} · {w.phaseLabel}</span>
                        {w.transferWindowOpen && <span className="text-[10px] text-accent font-semibold uppercase">Mercado</span>}
                      </div>
                    )
                  }
                  const played = isFixturePlayed(m.status)
                  const isHome = m.is_home !== undefined ? m.is_home : (m.home_club_id === club?.id)
                  const opponent = m.opponent_name || (isHome ? 'Rival' : 'Rival')
                  return (
                    <div
                      key={w.weekNumber}
                      className={cn(
                        'flex items-center justify-between gap-3 p-2.5 rounded-lg border text-xs',
                        w.isCurrent ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-semibold text-fg-muted">S{w.weekNumber}</span>
                        <div>
                          <p className="font-semibold text-fg text-sm">
                            {isHome ? `vs. ${opponent}` : `@ ${opponent}`}
                            <span className="ml-1.5 font-normal text-xs text-fg-muted">({isHome ? 'Local' : 'Visitante'})</span>
                          </p>
                          <p className="text-[11px] text-fg-subtle">{formatGameDate(w.date)}</p>
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold">
                        {played ? (
                          <span className="text-fg">{m.home_score} - {m.away_score}</span>
                        ) : (
                          <span className="text-accent text-[11px]">Por jugar</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* VISTA 3: SEMANA A SEMANA (52 FILAS DETALLADA CON FILTROS) */}
      {viewMode === 'WEEKS' && (
        <div>
          <ChoiceChips label="Filtrar semanas" value={filter} onChange={setFilter} options={CALENDAR_FILTERS} className="mb-5" />

          {visible.length === 0 ? (
            <Card as="div"><EmptyState title="Sin semanas" description="Ninguna semana coincide con el filtro." action={<Button variant="outline" size="sm" onClick={() => setFilter('ALL')}>Ver todas</Button>} /></Card>
          ) : (
            <ol className="space-y-2.5" aria-label="Semanas de la temporada">
              {visible.map(w => {
                const played = w.match && isFixturePlayed(w.match.status)
                const isHome = w.match ? (w.match.is_home !== undefined ? w.match.is_home : w.match.home_club_id === club?.id) : false
                const opponent = w.match ? (w.match.opponent_name || (isHome ? 'Rival' : 'Rival')) : ''
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
                            <p className="flex items-center justify-end gap-1.5 text-sm font-semibold text-fg">
                              <Trophy className="size-3.5 text-gold" aria-hidden="true" />
                              {isHome ? `vs. ${opponent} (Local)` : `@ ${opponent} (Visitante)`}
                            </p>
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
      )}
    </div>
  )
}
