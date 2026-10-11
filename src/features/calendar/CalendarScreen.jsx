import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRightLeft, Calendar as CalendarIcon, FastForward, Sparkles, Trophy, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useGameContext } from '../../context/GameContext'
import { calendarApi, SEASON_PHASES } from '../../api/calendar'
import { gameLoopApi } from '../../api/gameLoop'
import { queryCache } from '../../utils/cache'
import {
  CALENDAR_FILTERS, OUTCOME_LABEL, filterWeeks, findDueMatch, getUpcomingMatches, getRecentResults, groupWeeksByMonth, weekItemView
} from '../../domain/calendarView'
import { formatGameDate } from '../../lib/format'
import { friendlyError } from '../../lib/errors'
import { useAdvanceWeek } from '../week/useAdvanceWeek'
import { useOnline } from '../../hooks/useOnline'
import { readClubBudget } from '../week/readClubBudget'
import WeekProgress from '../week/WeekProgress'
import { cn } from '../../lib/utils'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, ChoiceChips, EmptyState, PageHeader, Segmented, Skeleton, Stat } from '../../components/ui'

const OUTCOME_TONE = { win: 'accent', draw: 'gold', loss: 'danger' }

/**
 * Una semana de la temporada, igual en las tres vistas: número de semana, rival (una línea, se corta con "…"), fecha y fase debajo,
 * y a la derecha el resultado o "Por jugar". En el celular nada se apila palabra por palabra ni se encima.
 */
function FixtureItem({ week, clubId, as: Tag = 'li', refProp, extraBadges = null, compact = false }) {
  const v = weekItemView(week, clubId)
  const tone = week.isCurrent ? 'current' : 'normal'
  return (
    <Tag
      ref={refProp}
      aria-current={week.isCurrent ? 'date' : undefined}
      className={cn(
        'flex min-w-0 items-center gap-3 rounded-lg border',
        compact ? 'p-2.5' : 'p-3',
        tone === 'current' ? 'border-accent bg-accent-soft' : 'border-line bg-surface',
        week.isPast && !week.isCurrent && 'opacity-75'
      )}
    >
      <div className={cn('grid size-11 shrink-0 place-items-center rounded-md text-center leading-none', tone === 'current' ? 'bg-accent text-accent-fg' : 'bg-surface-3 text-fg-muted')}>
        <span>
          <span className="block text-[10px] font-semibold uppercase">Sem</span>
          <span className="num font-display text-lg font-semibold">{week.weekNumber}</span>
        </span>
      </div>

      <div className="min-w-0 flex-1">
        {v.hasMatch ? (
          <>
            <p className="flex min-w-0 items-start gap-1.5 text-sm font-semibold leading-snug text-fg">
              <Trophy className="mt-0.5 size-3.5 shrink-0 text-gold" aria-hidden="true" />
              <span className="line-clamp-2 min-w-0 break-words">{v.isHome ? 'vs.' : '@'} {v.opponent}</span>
            </p>
            <p className="mt-0.5 text-xs text-fg-muted">{v.isHome ? 'Local' : 'Visitante'} · {formatGameDate(week.date)}{week.phaseLabel ? ` · ${week.phaseLabel}` : ''}</p>
          </>
        ) : (
          <>
            <p className="truncate text-sm font-medium text-fg-muted">Sin partido</p>
            <p className="mt-0.5 text-xs text-fg-muted">{formatGameDate(week.date)}{week.phaseLabel ? ` · ${week.phaseLabel}` : ''}</p>
          </>
        )}
        {(week.isCurrent || week.transferWindowOpen || extraBadges) && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {week.isCurrent && <Badge tone="accent">En curso</Badge>}
            {week.transferWindowOpen && <Badge><ArrowRightLeft className="size-3" aria-hidden="true" />Mercado</Badge>}
            {extraBadges}
          </div>
        )}
      </div>

      {v.hasMatch && (
        <div className="shrink-0 text-right">
          {v.hasScore ? (
            <>
              <p className="num font-display text-xl font-semibold leading-none text-fg">{v.score}</p>
              <Badge tone={OUTCOME_TONE[v.outcome]} className="mt-1">{OUTCOME_LABEL[v.outcome]}</Badge>
            </>
          ) : v.played ? (
            <span className="text-xs text-fg-subtle">Jugado</span>
          ) : (
            <Badge tone="accent">Por jugar</Badge>
          )}
        </div>
      )}
    </Tag>
  )
}

export default function CalendarScreen() {
  const navigate = useNavigate()
  const { club, manager, loading: contextLoading, refreshContext } = useGameContext()
  const [calendarData, setCalendarData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [advancing, setAdvancing] = useState(false)
  const weekRun = useAdvanceWeek()
  const online = useOnline()
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
  // La semana en curso ya se muestra arriba: no se repite en la lista de próximos
  const upcomingMatches = useMemo(() => getUpcomingMatches(weeks, 6).filter(w => !w.isCurrent).slice(0, 5), [weeks])
  const recentResults = useMemo(() => getRecentResults(weeks, 5), [weeks])
  const monthGroups = useMemo(() => groupWeeksByMonth(weeks), [weeks])
  const currentWeekObj = useMemo(() => weeks.find(w => w.isCurrent) || null, [weeks])

  const handleAdvance = async () => {
    if (!calendarData?.currentState) return
    setAdvancing(true)
    try {
      const { result: res, shown } = await weekRun.advance({
        run: () => gameLoopApi.advanceWeek(club.id, manager?.id, {
          careerId: calendarData.currentState.career_id,
          expectedCurrentWeek: calendarData.currentState.current_week
        }),
        readBudget: readClubBudget(club.id)
      })

      queryCache.clear()
      await refreshContext()
      await loadCalendar()
      if (res.fired) {
        weekRun.close()
        toast.error('La dirigencia te destituyó por los resultados deportivos.')
        navigate('/manager')
        return
      }
      if (!shown) toast.success(`Semana ${res.week} completada. El plantel recuperó condición física.`)
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
      <WeekProgress visible={weekRun.visible} tick={weekRun.tick} summary={weekRun.summary} onClose={weekRun.close} />
      <PageHeader
        eyebrow={`Temporada ${state.current_season_year} · 52 semanas`}
        title="Calendario"
        actions={
          // En el celular el botón ocupa todo el ancho
          <div className="w-full sm:w-auto [&>button]:w-full sm:[&>button]:w-auto">
            {dueMatch ? (
              <Button onClick={() => navigate('/dashboard')}><Trophy />Jugar el partido pendiente</Button>
            ) : (
              <Button loading={advancing} onClick={handleAdvance} disabled={!online} title={online ? undefined : 'Necesitás conexión para esto'}>{!advancing && <FastForward />}Avanzar semana</Button>
            )}
          </div>
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
            { value: 'UPCOMING', label: 'Próximos' },
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
            <ul aria-label="Semana en curso"><FixtureItem week={currentWeekObj} clubId={club?.id} /></ul>
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
                {upcomingMatches.map(w => <FixtureItem key={w.weekNumber} week={w} clubId={club?.id} />)}
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
                {recentResults.map(w => <FixtureItem key={w.weekNumber} week={w} clubId={club?.id} />)}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* VISTA 2: POR MES (TEMPORADA COMPACTA) */}
      {viewMode === 'SEASON' && (
        <div className="space-y-6">
          {monthGroups.map(group => (
            <section key={group.key} aria-label={group.label}>
              <h2 className="eyebrow mb-2 px-1">{group.label}</h2>
              <ul className="space-y-2">
                {group.weeks.map(w => <FixtureItem key={w.weekNumber} week={w} clubId={club?.id} compact />)}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* VISTA 3: SEMANA A SEMANA (52 FILAS DETALLADA CON FILTROS) */}
      {viewMode === 'WEEKS' && (
        <div>
          <ChoiceChips label="Filtrar semanas" value={filter} onChange={setFilter} options={CALENDAR_FILTERS} className="mb-5 flex-nowrap overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap" />

          {visible.length === 0 ? (
            <Card as="div"><EmptyState title="Sin semanas" description="Ninguna semana coincide con el filtro." action={<Button variant="outline" size="sm" onClick={() => setFilter('ALL')}>Ver todas</Button>} /></Card>
          ) : (
            <ol className="space-y-2.5" aria-label="Semanas de la temporada">
              {visible.map(w => (
                <FixtureItem
                  key={w.weekNumber}
                  week={w}
                  clubId={club?.id}
                  as="li"
                  refProp={w.isCurrent ? currentRef : undefined}
                  extraBadges={w.events.map((ev, i) => <Badge key={i} tone="gold"><Sparkles className="size-3" aria-hidden="true" />{ev.label}</Badge>)}
                />
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  )
}
