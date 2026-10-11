import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle, AlertCircle, BookOpen, Bell, ChevronRight, MessageSquareQuote, Sparkles, CalendarDays, FastForward, Play, Shield, Trophy, Activity, Heart, Wallet, ListOrdered, Maximize2
} from 'lucide-react'
import { toast } from 'sonner'
import { pickAutoStage, isArcEvent, chapterOf } from '../../domain/storyStage'
import { closePendingText, closeProgressPercent } from '../../domain/seasonCloseStages'
import { seasonCloseApi } from '../../api/seasonClose'
import { dashboardApi } from '../../api/dashboard'
import { eventsApi } from '../../api/events'
import { queryCache } from '../../utils/cache'
import { friendlyError } from '../../lib/errors'
import { useGameContext } from '../../context/GameContext'
import { isFixtureDue } from '../../domain/fixtureStatus'
import { isSeasonEnded, seasonYearOf } from '../../domain/gameWeek'
import { divisionName } from '../../domain/divisions'
import { rivalLevel, rivalOf } from '../../domain/rivalLevel'
import { formatGameDate, formatLongDate, daysBetween, formatMoney } from '../../lib/format'
import { cn } from '../../lib/utils'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, PageHeader, Progress, Skeleton, Stat } from '../../components/ui'
import SeasonCloseModal from '../season/SeasonCloseModal'
import WageCapMeter from '../finances/WageCapMeter'
import { ClimatePanel, ConsequenceFeed } from './ClimatePanel'
import EffectMeters from '../../components/EffectMeters'
import FirstStepsCard from '../onboarding/FirstStepsCard'
import NextStepCard from '../onboarding/NextStepCard'
import { readSteps, markStep } from '../onboarding/firstStepsStore'
import { missionProgress, showMission, nextStep } from '../../domain/firstSteps'
import { isNewAccount } from '../tutorial/tourState'

const EVENT_CATEGORY = {
  COMMUNITY: { label: 'Comunidad y barrio', tone: 'accent' },
  LOCKER_ROOM: { label: 'Vestuario y disciplina', tone: 'neutral' },
  BOARD_PRESS: { label: 'Dirigencia y prensa', tone: 'neutral' },
  FINANCIAL_CRISIS: { label: 'Economía y crisis', tone: 'warning' }
}

import { ClubBadge } from '../../components/ui'
import { useAdvanceWeek } from '../week/useAdvanceWeek'
import { readClubBudget } from '../week/readClubBudget'
import WeekProgress from '../week/WeekProgress'
import StoryStage from './StoryStage'
import { reactionFor, effectChips } from '../../domain/storyFlavor'

/** Escudo heráldico vectorial arcade con colores oficiales del club */
function Crest({ club, name, highlight }) {
  return (
    <div className={cn('relative p-1 rounded-xl transition-all flex items-center justify-center', highlight && 'ring-2 ring-accent/60 bg-accent-soft/20')}>
      <ClubBadge club={club} name={name} size="lg" />
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6" aria-busy="true" aria-label="Cargando el centro de mando">
      <Skeleton className="h-12 w-2/3" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  )
}

/** Alertas urgentes: una fila por aviso, con acción directa */
function AlertList({ alerts }) {
  if (!alerts?.length) return null
  return (
    <ul className="space-y-2" aria-label="Avisos del club">
      {alerts.map(alert => {
        const high = alert.priority === 'HIGH'
        const Icon = high ? AlertTriangle : AlertCircle
        return (
          <li
            key={alert.id}
            className={cn(
              'flex items-start gap-3 rounded-lg border px-4 py-3',
              high ? 'border-danger/40 bg-danger-soft' : 'border-warning/30 bg-warning-soft'
            )}
          >
            <Icon className={cn('mt-0.5 size-4.5 shrink-0', high ? 'text-danger' : 'text-warning')} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-fg">{alert.title}</p>
              <p className="mt-0.5 text-sm text-fg-muted">{alert.message}</p>
            </div>
            {alert.actionUrl && (
              <Button asChild variant="ghost" size="sm" className="shrink-0">
                <Link to={alert.actionUrl}>Resolver</Link>
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** Decisiones pendientes: una fila por decisión; el relato y las opciones se leen en la pantalla completa */
function DecisionRows({ events, onOpen }) {
  if (!events?.length) return null
  return (
    <section aria-label="Decisiones pendientes">
      <ul className="space-y-2">
        {events.map(ev => {
          const critical = ev.severity === 'CRITICAL'
          const arc = isArcEvent(ev)
          const chapter = arc ? chapterOf(ev.title) : null
          const category = EVENT_CATEGORY[ev.category] || { label: ev.category, tone: 'neutral' }
          const title = chapter ? chapter.clean : ev.title
          return (
            <li key={ev.id}>
              <button
                type="button"
                onClick={() => onOpen(ev)}
                aria-label={`Decidir: ${title}`}
                className={cn(
                  'flex min-h-14 w-full items-center gap-3 rounded-lg border bg-surface px-3 py-2.5 text-left transition-colors hover:bg-surface-2 active:bg-surface-3',
                  critical ? 'border-danger/50' : arc ? 'border-gold/40' : 'border-line'
                )}
              >
                {arc ? <Sparkles className="size-5 shrink-0 text-gold" aria-hidden="true" /> : <Bell className={cn('size-5 shrink-0', critical ? 'text-danger' : 'text-fg-subtle')} aria-hidden="true" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-fg">{title}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    {critical && <Badge tone="danger" dot>Urgente</Badge>}
                    {arc && <Badge tone="gold">Historia{chapter ? ` · ${chapter.current}/${chapter.total}` : ''}</Badge>}
                    <Badge tone={category.tone}>{category.label}</Badge>
                  </span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-fg-subtle" aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** Celular: caja, plantel y puesto en tres tarjetitas (el detalle está en cada sección) */
function StatTiles({ finances, squad, standings }) {
  const tile = 'flex min-w-0 flex-col gap-0.5 rounded-lg border border-line bg-surface px-3 py-2.5 transition-colors hover:bg-surface-2'
  return (
    <ul className="grid grid-cols-3 gap-2" aria-label="Resumen del club">
      <li className="min-w-0"><Link to="/finances" className={tile}>
        <span className="eyebrow">Caja</span>
        <span className={cn('num truncate font-display text-lg font-semibold', finances.balance < 0 ? 'text-danger' : 'text-fg')}>{formatMoney(finances.balance)}</span>
      </Link></li>
      <li className="min-w-0"><Link to="/squad" className={tile}>
        <span className="eyebrow">Plantel</span>
        <span className={cn('num font-display text-lg font-semibold', squad.availableCount < 11 ? 'text-warning' : 'text-fg')}>{squad.availableCount}/{squad.totalPlayers}</span>
        <span className="text-[0.6875rem] text-fg-subtle">aptos · {squad.averageFitness}% físico</span>
      </Link></li>
      <li className="min-w-0"><Link to="/standings" className={tile}>
        <span className="eyebrow">Puesto</span>
        <span className="num font-display text-lg font-semibold text-fg">{standings?.rank ? `${standings.rank}º` : '—'}</span>
        <span className="text-[0.6875rem] text-fg-subtle">{standings ? `${standings.points || 0} pts · ${standings.played || 0} PJ` : 'sin partidos'}</span>
      </Link></li>
    </ul>
  )
}

const MORE_KEY = 'vestuario-dashboard-more'

/** "Ver más": lo que no hace falta en el primer pantallazo, plegado; recuerda si quedó abierto en este navegador */
function MoreSection({ children }) {
  const [open, setOpen] = useState(() => {
    try { return window.localStorage.getItem(MORE_KEY) === '1' } catch { return false }
  })
  const toggle = () => {
    const next = !open
    setOpen(next)
    try { window.localStorage.setItem(MORE_KEY, next ? '1' : '0') } catch { /* sin almacenamiento: no se recuerda */ }
  }
  return (
    <section aria-label="Más del club">
      <Button variant="outline" className="w-full justify-between" aria-expanded={open} aria-controls="dashboard-more" onClick={toggle}>
        {open ? 'Ver menos' : 'Ver más: clima, consecuencias y carrera'}<ChevronRight className={cn('transition-transform', open && 'rotate-90')} />
      </Button>
      {open && <div id="dashboard-more" className="mt-4 space-y-4 animate-rise-in">{children}</div>}
    </section>
  )
}

/** Resultado de la última decisión: se queda a la vista hasta que el DT lo cierra */
function OutcomeCard({ outcome, onClose }) {
  const chips = effectChips(outcome.effects)
  return (
    <div role="status" className="animate-rise-in rounded-xl border border-accent/50 bg-accent-soft p-4">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="eyebrow text-accent">Así quedó la cosa</p>
          {outcome.choice && <p className="break-words text-xs text-fg-subtle">Elegiste: <span className="font-semibold text-fg-muted">{outcome.choice}</span></p>}
          <p className="break-words text-sm leading-relaxed text-fg">{outcome.note}</p>
          <p className="break-words text-sm italic leading-relaxed text-fg-muted">{outcome.reaction}</p>
          <EffectMeters chips={chips} />
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0">Seguir</Button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  // Escritorio: grilla completa; celular: resumen arriba y lo demás plegado
  const isLg = useMediaQuery('(min-width: 1024px)')
  const { manager, club, user, loading: contextLoading, refreshContext } = useGameContext()
  // Lo que ya hizo la persona de la misión inicial (se actualiza al visitar la pizarra o resolver una decisión)
  const [firstSteps, setFirstSteps] = useState({})
  useEffect(() => {
    const load = () => setFirstSteps(readSteps(user?.id))
    load()
    window.addEventListener('vestuario:first-steps', load)
    return () => window.removeEventListener('vestuario:first-steps', load)
  }, [user?.id])
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [advancing, setAdvancing] = useState(false)
  const weekRun = useAdvanceWeek()
  const [finishingClose, setFinishingClose] = useState(false)
  const [showSeasonCloseModal, setShowSeasonCloseModal] = useState(false)
  // Se sube al resolver una decisión: el club puede quedar igual (caja y fecha) y aun así hay que recargar eventos, clima y bitácora
  const [reloadTick, setReloadTick] = useState(0)
  // Texto del resultado de la última decisión tomada (se muestra hasta que el DT lo cierra)
  const [lastOutcome, setLastOutcome] = useState(null)
  // Historia a pantalla completa: { event, result } y las que el DT dejó para más tarde
  const [stage, setStage] = useState(null)
  const [stageBusy, setStageBusy] = useState(false)
  const [postponed, setPostponed] = useState(() => new Set())

  useEffect(() => {
    if (contextLoading || !club || !manager) return
    let isMounted = true

    const loadData = async () => {
      try {
        const overview = await dashboardApi.getOverview(club, manager)
        if (isMounted) { setDashboardData(overview); setLoading(false) }
      } catch (e) {
        console.error('Error cargando proyección del dashboard:', e)
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => { isMounted = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- la proyección se recarga solo con estos datos del club y del DT; `club` y `manager` completos cambian en cada refresco
  }, [contextLoading, club?.id, club?.game_date, club?.budget, manager?.id, manager?.xp, reloadTick])

  const handleAdvanceWeek = async () => {
    // Menos de 11 aptos no impide avanzar (la recuperación ocurre al avanzar); sólo un partido vencido lo frena
    if (dashboardData?.nextFixture && isFixtureDue(dashboardData.nextFixture.match_date, club.game_date)) {
      toast.error('Debes disputar tu partido pendiente antes de avanzar de semana.')
      return
    }

    setAdvancing(true)
    try {
      const { gameLoopApi } = await import('../../api/gameLoop')
      const { result, shown } = await weekRun.advance({
        run: () => gameLoopApi.advanceWeek(club.id, manager.id),
        readBudget: readClubBudget(club.id)
      })

      queryCache.clear()
      await refreshContext()

      if (result.fired) {
        // El contexto detecta al DT desempleado y lo lleva a la Carrera para elegir una oferta
        weekRun.close()
        toast.error('La dirigencia te destituyó por los resultados deportivos.')
        navigate('/manager')
        return
      }
      if (!shown) toast.success('Semana completada. Plan de trabajo ejecutado.')
    } catch (e) {
      toast.error(friendlyError(e, 'No pudimos avanzar la semana. Probá de nuevo.'))
    } finally {
      setAdvancing(false)
    }
  }

  // El cierre de la temporada quedó a medias: se completa con los resultados que ya estaban guardados (no se vuelve a sortear ni a cobrar nada)
  const handleFinishClose = async () => {
    setFinishingClose(true)
    try {
      const res = await seasonCloseApi.resumeSeasonClose({ clubId: club.id, careerId: club.career_id })
      queryCache.clear()
      await refreshContext()
      setReloadTick(t => t + 1)
      if (res?.alreadyClosed) toast.info(res.message || 'El cierre ya estaba completo.')
      else toast.success('Cierre completo. Empieza la pretemporada.')
    } catch (e) {
      toast.error(friendlyError(e, 'No pudimos terminar el cierre. Tus resultados siguen guardados: probá de nuevo.'))
    } finally {
      setFinishingClose(false)
    }
  }

  /** Resuelve una decisión. Devuelve cómo quedó (o null si no se aplicó); con `silent` no muestra la tarjeta de resultado del inicio */
  const handleResolveEvent = async (event, option, { silent = false } = {}) => {
    try {
      const outcome = await eventsApi.resolveEvent(event.id, option, manager?.id)
      await refreshContext()
      setReloadTick(t => t + 1)
      // Si el evento ya estaba resuelto (doble clic u otra pestaña) no se aplicó nada: solo se refresca la pantalla
      if (outcome?.alreadyResolved) return null
      markStep(user?.id, 'decision')
      const result = { note: outcome?.outcomeNote || 'Decisión ejecutada.', choice: option.label, effects: option.effects || {}, reaction: reactionFor(option.effects || {}, `${event.id}:${option.id}`) }
      if (!silent) setLastOutcome(result)
      return result
    } catch (err) {
      toast.error(friendlyError(err, 'Error al procesar la decisión.'))
      return null
    }
  }

  // Al entrar se abre solo a pantalla completa UN evento (lo urgente primero, después las historias); el resto queda en el inicio con su botón "Jugar".
  // Así no se encadenan y no cansan. "Decidir más tarde" lo deja en el inicio.
  const autoOpened = useRef(false)
  const nextStory = pickAutoStage(dashboardData?.pendingEvents, postponed)
  useEffect(() => {
    if (!stage && !autoOpened.current && nextStory) { autoOpened.current = true; setStage({ event: nextStory, result: null }) }
  }, [stage, nextStory?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const chooseInStage = async (option) => {
    if (!stage || stageBusy) return
    setStageBusy(true)
    const result = await handleResolveEvent(stage.event, option, { silent: true })
    setStageBusy(false)
    if (result) setStage(st => st && { ...st, result })
    else setStage(null)
  }

  if (loading || contextLoading || !dashboardData) return <DashboardSkeleton />

  const { managerSummary, clubSummary, financesSummary, squadHealth, standingsSnippet, nextFixture, urgentAlerts, pendingEvents, pendingClose } = dashboardData

  const matchDue = !!nextFixture && isFixtureDue(nextFixture.match_date, clubSummary.gameDate)
  const matchFuture = !!nextFixture && !matchDue
  const daysToMatch = matchFuture ? daysBetween(clubSummary.gameDate, String(nextFixture.match_date).slice(0, 10)) : 0
  const seasonEnded = isSeasonEnded(clubSummary.gameDate)
  const isHome = nextFixture?.home_team_id === club.id
  const rival = nextFixture ? rivalLevel(rivalOf(nextFixture, club.id)?.strength) : null

  // Qué conviene hacer ahora y, para cuentas nuevas, la misión inicial
  const step = nextStep({
    pendingClose: Boolean(pendingClose), seasonEnded, pendingEvents: pendingEvents?.length || 0, available: squadHealth.availableCount,
    matchDue, daysToMatch, hasFixture: Boolean(nextFixture), tacticsVisited: Boolean(firstSteps.tactics), played: standingsSnippet?.played || 0
  })
  const mission = missionProgress(firstSteps, standingsSnippet?.played || 0)
  const missionVisible = showMission({ isNew: isNewAccount(user?.created_at), dismissed: Boolean(firstSteps.dismissed), complete: mission.complete })

  // Acción principal según el momento: jugar, avanzar o cerrar la temporada
  const primaryAction = pendingClose ? (
    <Button onClick={handleFinishClose} loading={finishingClose}>{!finishingClose && <Trophy />}Terminar el cierre de temporada</Button>
  ) : seasonEnded ? (
    <Button onClick={() => setShowSeasonCloseModal(true)}><Trophy />Gala de fin de temporada</Button>
  ) : matchDue ? (
    <Button onClick={() => navigate('/match', { state: { fixtureId: nextFixture.id } })}><Play />Disputar partido</Button>
  ) : (
    <Button onClick={handleAdvanceWeek} loading={advancing}>{!advancing && <FastForward />}Avanzar semana</Button>
  )

  const missionCard = missionVisible ? <FirstStepsCard progress={mission} onDismiss={() => markStep(user?.id, 'dismissed')} /> : null

  // Tarjeta del próximo partido (escritorio: dentro de la grilla; celular: arriba de todo, sin repetir el botón de jugar)
  const matchCard = (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <CalendarDays className="size-5 text-accent" aria-hidden="true" />
                <CardTitle>Próximo compromiso</CardTitle>
              </div>
              {nextFixture && <Badge className="num">Fecha {nextFixture.match_week || 1}</Badge>}
            </CardHeader>
            <CardBody>
              {nextFixture ? (
                <>
                  <div className="flex items-center justify-between gap-4 py-4">
                    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
                      <Crest club={nextFixture.home} name={nextFixture.home?.name} highlight={nextFixture.home_team_id === club.id} />
                      <p className="max-w-full truncate text-sm font-semibold text-fg">{nextFixture.home?.name || 'Local'}</p>
                      <p className="eyebrow">{nextFixture.home_team_id === club.id ? 'Tu club' : 'Rival'}</p>
                    </div>
                    <div className="shrink-0 text-center">
                      <p className="font-display text-2xl font-semibold text-fg-subtle">VS</p>
                      <p className="num mt-1 text-xs capitalize text-fg-muted">{formatGameDate(String(nextFixture.match_date).slice(0, 10))}</p>
                      <p className="mt-0.5 text-xs text-fg-subtle">{isHome ? 'De local' : 'De visitante'}</p>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
                      <Crest club={nextFixture.away} name={nextFixture.away?.name} highlight={nextFixture.away_team_id === club.id} />
                      <p className="max-w-full truncate text-sm font-semibold text-fg">{nextFixture.away?.name || 'Visitante'}</p>
                      <p className="eyebrow">{nextFixture.away_team_id === club.id ? 'Tu club' : 'Rival'}</p>
                    </div>
                  </div>

                  {rival && (
                    <p className="flex flex-wrap items-center gap-2 border-t border-line py-3 text-sm text-fg-muted" data-testid="rival-level">
                      <Badge tone={rival.tone}>Rival: {rival.label} · nivel {rival.level}</Badge>
                      <span>{rival.hint}</span>
                    </p>
                  )}

                  <div className="flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center">
                    <Button asChild variant="outline"><Link to="/tactics">Ajustar táctica y once</Link></Button>
                    <Button
                      onClick={() => navigate('/match', { state: { fixtureId: nextFixture.id } })}
                      disabled={!matchDue}
                      aria-describedby="match-reason"
                      className="hidden lg:inline-flex"
                    >
                      <Play />Disputar partido
                    </Button>
                    {matchFuture && (
                      <p id="match-reason" className="text-sm text-fg-muted sm:ml-1">
                        Se juega en {daysToMatch} {daysToMatch === 1 ? 'día' : 'días'}. Avanza la semana para llegar a la fecha.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-6">
                  <p className="font-display text-xl font-semibold text-fg">Pretemporada</p>
                  <p className="mt-1 max-w-prose text-sm text-fg-muted">No hay compromisos oficiales agendados. Aprovecha para entrenar y cerrar fichajes.</p>
                </div>
              )}
            </CardBody>
          </Card>
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <WeekProgress visible={weekRun.visible} tick={weekRun.tick} summary={weekRun.summary} onClose={weekRun.close} />
      {stage && (
        <StoryStage
          event={stage.event}
          budget={Number(club?.budget || 0)}
          boardConfidence={Number(club?.board_confidence ?? 100)}
          result={stage.result}
          busy={stageBusy}
          onChoose={chooseInStage}
          onLater={() => { setPostponed(prev => new Set(prev).add(stage.event.id)); setStage(null) }}
          onClose={() => setStage(null)}
        />
      )}
      <PageHeader
        eyebrow={`${formatLongDate(clubSummary.gameDate)} · ${divisionName(club?.league_tier)}`}
        title={clubSummary.name}
        description={`${clubSummary.city}, ${clubSummary.country} · ${clubSummary.stadiumName}`}
        actions={primaryAction}
        className="hidden lg:flex"
      />

      {/* En móvil el título vive en la barra superior; la acción principal se destaca a ancho completo y el estadio se muestra sin cortarse */}
      <div className="mb-5 space-y-2 lg:hidden">
        <div className="flex items-center justify-between text-xs text-fg-muted">
          <span className="truncate">{clubSummary.stadiumName}</span>
          <span className="shrink-0 text-fg-subtle">· {clubSummary.city}</span>
        </div>
        <div className="[&>button]:w-full">
          {primaryAction}
        </div>
      </div>

      <div className="min-w-0 space-y-6">
        {pendingClose && (
          <Card className="border-warning/50" aria-label="Cierre de temporada pendiente">
            <CardBody className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-semibold text-fg">El cierre de la temporada {pendingClose.season_year} quedó a medias</h2>
                  <p className="mt-1 text-sm text-fg-muted">Tu temporada ya está cerrada y archivada: el puesto, el premio y los contratos están guardados. {closePendingText(pendingClose.stage)} Hasta que se termine no se puede avanzar de semana.</p>
                </div>
              </div>
              <Progress value={closeProgressPercent(pendingClose.stage)} label="Avance del cierre" />
              <Button onClick={handleFinishClose} loading={finishingClose}>{!finishingClose && <Trophy />}Terminar el cierre</Button>
            </CardBody>
          </Card>
        )}

        {step.kind !== 'CLOSE' && <NextStepCard step={step} onDecide={() => setStage({ event: nextStory || pendingEvents[0], result: null })} />}

        {isLg && missionCard}

        <AlertList alerts={urgentAlerts} />

        {lastOutcome && <OutcomeCard outcome={lastOutcome} onClose={() => setLastOutcome(null)} />}

        <DecisionRows events={pendingEvents} onOpen={(event) => setStage({ event, result: null })} />

        {!isLg && (
          <>
            {matchCard}
            <StatTiles finances={financesSummary} squad={squadHealth} standings={standingsSnippet} />
            {missionCard}
            <MoreSection>
              <ClimatePanel key={`climate-${reloadTick}`} club={club} gameDate={clubSummary.gameDate} />
              <ConsequenceFeed key={`feed-${reloadTick}`} clubId={club?.id} />
              <Card>
                <CardHeader><CardTitle>Tope salarial</CardTitle><Button asChild variant="link" size="sm"><Link to="/finances">Detalle</Link></Button></CardHeader>
                <CardBody><WageCapMeter bill={financesSummary.weeklyWageBill} cap={financesSummary.wageBudget} /></CardBody>
              </Card>
              <Card>
                <CardHeader><CardTitle>Tu carrera</CardTitle><Badge tone="gold">Nivel {managerSummary.level}</Badge></CardHeader>
                <CardBody className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-fg">{managerSummary.name}</p>
                    <p className="text-sm text-fg-muted">{managerSummary.title} · reputación <span className="num font-semibold">{managerSummary.reputation}</span></p>
                  </div>
                  <Progress tone="accent" value={managerSummary.progressPercent} label="Progreso al próximo nivel" />
                  <Button asChild variant="link" size="sm"><Link to="/manager">Ver mi carrera</Link></Button>
                </CardBody>
              </Card>
            </MoreSection>
          </>
        )}

        {isLg && (
          <>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ClimatePanel key={`climate-${reloadTick}`} club={club} gameDate={clubSummary.gameDate} />
          <ConsequenceFeed key={`feed-${reloadTick}`} clubId={club?.id} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {matchCard}

          {/* Estado del plantel */}
          <Card>
            <CardHeader>
              <CardTitle>Estado del plantel</CardTitle>
              <Badge tone={squadHealth.availableCount < 11 ? 'warning' : 'accent'} dot className="num">
                {squadHealth.availableCount}/{squadHealth.totalPlayers} aptos
              </Badge>
            </CardHeader>
            <CardBody className="space-y-5">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-fg-muted"><Activity className="size-4" aria-hidden="true" />Condición física</span>
                  <span className="num font-semibold text-fg">{squadHealth.averageFitness}%</span>
                </div>
                <Progress auto value={squadHealth.averageFitness} label="Condición física media" />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-fg-muted"><Heart className="size-4" aria-hidden="true" />Moral del vestuario</span>
                  <span className="num font-semibold text-fg">{squadHealth.averageMorale}%</span>
                </div>
                <Progress auto value={squadHealth.averageMorale} label="Moral media" />
              </div>
              {(squadHealth.injuredCount > 0 || squadHealth.suspendedCount > 0) && (
                <p className="text-sm text-fg-muted">
                  {squadHealth.injuredCount > 0 && <>{squadHealth.injuredCount} lesionado(s)</>}
                  {squadHealth.injuredCount > 0 && squadHealth.suspendedCount > 0 && ' · '}
                  {squadHealth.suspendedCount > 0 && <>{squadHealth.suspendedCount} suspendido(s)</>}
                </p>
              )}
            </CardBody>
          </Card>

          {/* Finanzas */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <Wallet className="size-5 text-accent" aria-hidden="true" />
                <CardTitle>Finanzas</CardTitle>
              </div>
              <Button asChild variant="link" size="sm"><Link to="/finances">Detalle</Link></Button>
            </CardHeader>
            <CardBody className="space-y-4">
              <Stat label="Caja del club" value={formatMoney(financesSummary.balance)} valueClassName={financesSummary.balance < 0 ? 'text-danger' : undefined} />
              <WageCapMeter bill={financesSummary.weeklyWageBill} cap={financesSummary.wageBudget} />
            </CardBody>
          </Card>

          {/* Posición en la liga */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <ListOrdered className="size-5 text-accent" aria-hidden="true" />
                <CardTitle>Posición en liga</CardTitle>
              </div>
              <Button asChild variant="link" size="sm"><Link to="/standings">Ver tabla</Link></Button>
            </CardHeader>
            <CardBody>
              {standingsSnippet ? (
                <div className="grid grid-cols-3 gap-4">
                  <Stat label="Puesto" value={standingsSnippet.rank ? `${standingsSnippet.rank}º` : '—'} />
                  <Stat label="Puntos" value={standingsSnippet.points || 0} />
                  <Stat label="Jugados" value={standingsSnippet.played || 0} />
                </div>
              ) : (
                <p className="text-sm text-fg-muted">La tabla aparece cuando se dispute la primera fecha.</p>
              )}
            </CardBody>
          </Card>

          {/* Progreso del DT */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <Shield className="size-5 text-accent" aria-hidden="true" />
                <CardTitle>Tu carrera</CardTitle>
              </div>
              <Badge tone="gold">Nivel {managerSummary.level}</Badge>
            </CardHeader>
            <CardBody className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-fg">{managerSummary.name}</p>
                <p className="text-sm text-fg-muted">{managerSummary.title}</p>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs text-fg-muted">
                  <span>Experiencia</span>
                  <span className="num">{managerSummary.currentXp} / {managerSummary.xpRequiredForNext} XP</span>
                </div>
                <Progress tone="accent" value={managerSummary.progressPercent} label="Progreso al próximo nivel" />
              </div>
              <p className="text-xs text-fg-subtle">Reputación <span className="num font-semibold text-fg-muted">{managerSummary.reputation}</span> pts</p>
            </CardBody>
          </Card>
        </div>
          </>
        )}
      </div>

      {showSeasonCloseModal && (
        <SeasonCloseModal
          club={club}
          manager={manager}
          careerId={club?.career_id}
          seasonYear={seasonYearOf(clubSummary.gameDate)}
          onClose={() => setShowSeasonCloseModal(false)}
          // El modal queda abierto para mostrar el resumen de la transición; se cierra con "Comenzar pretemporada"
          onSuccess={() => { queryCache.clear() }}
        />
      )}
    </div>
  )
}
