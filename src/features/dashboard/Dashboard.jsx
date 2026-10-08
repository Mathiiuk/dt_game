import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle, AlertCircle, BookOpen, Bell, ChevronRight, MessageSquareQuote, Sparkles, CalendarDays, FastForward, Play, Shield, Trophy, Activity, Heart, Wallet, ListOrdered
} from 'lucide-react'
import { toast } from 'sonner'
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
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, PageHeader, Progress, Skeleton, Stat } from '../../components/ui'
import SeasonCloseModal from '../season/SeasonCloseModal'
import { ClimatePanel, ConsequenceFeed } from './ClimatePanel'

const EVENT_CATEGORY = {
  COMMUNITY: { label: 'Comunidad y barrio', tone: 'accent' },
  LOCKER_ROOM: { label: 'Vestuario y disciplina', tone: 'neutral' },
  BOARD_PRESS: { label: 'Dirigencia y prensa', tone: 'neutral' },
  FINANCIAL_CRISIS: { label: 'Economía y crisis', tone: 'warning' }
}

import { ClubBadge } from '../../components/ui'
import StoryStage from './StoryStage'
import { splitBeats, reactionFor, effectChips } from '../../domain/storyFlavor'
import { parseArcCode } from '../../domain/arcs'
import { arcById } from '../../domain/arcCatalog'

const isStoryEvent = (event) => String(event.template_code || '').startsWith('ARC_')

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

/** Historia contada de a poco: cada toque muestra el siguiente momento; los diálogos van en globo */
function StoryText({ text, onDone }) {
  const beats = React.useMemo(() => splitBeats(text), [text])
  const [shown, setShown] = useState(1)
  const done = shown >= beats.length
  React.useEffect(() => { if (done) onDone?.() }, [done]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-2.5">
      {beats.slice(0, shown).map((beat, i) => (
        beat.type === 'say' ? (
          <p key={i} className="animate-rise-in ml-2 rounded-lg rounded-tl-none border-l-2 border-gold bg-gold-soft px-3 py-2 text-sm italic leading-relaxed text-fg">
            <MessageSquareQuote className="mr-1.5 inline size-3.5 align-[-2px] text-gold" aria-hidden="true" />“{beat.text}”
          </p>
        ) : (
          <p key={i} className="animate-rise-in text-sm leading-relaxed text-fg-muted">{beat.text}</p>
        )
      ))}
      {!done && (
        <div className="flex items-center gap-3 pt-1">
          <Button size="sm" variant="outline" onClick={() => setShown(n => n + 1)}>Seguir leyendo<ChevronRight /></Button>
          <button type="button" onClick={() => setShown(beats.length)} className="text-xs text-fg-subtle underline-offset-2 hover:text-fg hover:underline">Leer todo</button>
        </div>
      )}
    </div>
  )
}

/** Los capítulos de una historia llevan su número en el título: "Un pibe que la rompe (1/4)" */
function chapterOf(title) {
  const m = String(title || '').match(/\((\d+)\s*\/\s*(\d+)\)\s*$/)
  return m ? { current: Number(m[1]), total: Number(m[2]), clean: String(title).replace(m[0], '').trim() } : null
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E']

/** Dilema del DT (evento dinámico) con sus opciones */
function EventCard({ event, budget, boardConfidence, onResolve }) {
  const critical = event.severity === 'CRITICAL'
  const story = isStoryEvent(event)
  const chapter = story ? chapterOf(event.title) : null
  const category = EVENT_CATEGORY[event.category] || { label: event.category, tone: 'neutral' }
  const options = Array.isArray(event.options) ? event.options : []
  // Una sola elección por evento: al apretar una opción se bloquean todas hasta que termine
  const [choosing, setChoosing] = useState(null)
  // En las historias las opciones aparecen cuando terminás de leer el capítulo
  const [read, setRead] = useState(!story)
  const arc = story ? arcById(parseArcCode(event.template_code)?.arcId) : null
  const choose = async (opt) => {
    if (choosing) return
    setChoosing(opt.id)
    try {
      await onResolve(event, opt)
    } finally {
      setChoosing(null)
    }
  }

  return (
    <Card className={cn('min-w-0 overflow-hidden', critical && 'border-danger/50', story && !critical && 'border-gold/40')}>
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {story && <Badge tone="gold"><BookOpen className="size-3" aria-hidden="true" />Historia</Badge>}
          <Badge tone={category.tone}>{category.label}</Badge>
          {critical && <Badge tone="danger" dot>Decisión urgente</Badge>}
        </div>
        {chapter && (
          <div className="flex items-center gap-2" aria-label={`Capítulo ${chapter.current} de ${chapter.total}`}>
            <span className="flex gap-1" aria-hidden="true">
              {Array.from({ length: chapter.total }, (_, i) => (
                <span key={i} className={cn('h-1.5 w-6 rounded-full', i < chapter.current ? 'bg-gold' : 'bg-surface-3', i === chapter.current - 1 && 'animate-pulse')} />
              ))}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-gold">Capítulo {chapter.current} de {chapter.total}</span>
          </div>
        )}
        <div>
          <h3 className="flex items-start gap-2 font-display text-xl font-semibold text-fg">
            {story ? <Sparkles className="mt-1 size-4.5 shrink-0 text-gold" aria-hidden="true" /> : <Bell className={cn('mt-1 size-4.5 shrink-0', critical ? 'text-danger' : 'text-fg-subtle')} aria-hidden="true" />}
            <span className="min-w-0 break-words">{chapter ? chapter.clean : event.title}</span>
          </h3>
          {arc?.title && <p className="mt-0.5 text-xs italic text-fg-subtle">{arc.title} — {arc.tagline}</p>}
          {story
            ? <div className="mt-3"><StoryText text={event.description} onDone={() => setRead(true)} /></div>
            : <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{event.description}</p>}
        </div>
        {read && <div className={story ? 'animate-rise-in' : undefined}>
          {story && <p className="eyebrow mb-2">¿Qué hacés?</p>}
          <div className="flex flex-col gap-2">
            {options.map((opt, index) => {
              const cost = Number(opt.cost || 0)
              const canAfford = cost === 0 || budget >= cost
              const needsBoard = Number(opt.requires?.board || 0)
              const hasBackup = !needsBoard || boardConfidence >= needsBoard
              const disabled = !!choosing || !canAfford || !hasBackup
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => choose(opt)}
                  className={cn(
                    'group flex w-full min-w-0 items-start gap-3 rounded-lg border p-3 text-left transition-all',
                    'border-line-strong bg-surface-2 hover:border-accent hover:bg-accent-soft active:scale-[0.99]',
                    'disabled:pointer-events-none disabled:opacity-50',
                    choosing === opt.id && 'border-accent bg-accent-soft'
                  )}
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-3 font-display text-sm font-semibold text-fg-muted transition-colors group-hover:bg-accent group-hover:text-accent-fg" aria-hidden="true">
                    {OPTION_LETTERS[index] || index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-sm font-semibold text-fg">{opt.label}</span>
                    {opt.description && <span className="mt-0.5 block break-words text-xs leading-relaxed text-fg-muted">{opt.description}</span>}
                    {(cost > 0 || !hasBackup) && (
                      <span className="mt-1.5 flex flex-wrap gap-1.5">
                        {cost > 0 && <Badge tone={canAfford ? 'warning' : 'danger'} className="num">-{formatMoney(cost)}</Badge>}
                        {!hasBackup && <Badge tone="danger">Sin respaldo de la dirigencia</Badge>}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>}
      </CardBody>
    </Card>
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
          {chips.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Lo que cambió">
              {chips.map(c => (
                <li key={c.key}><Badge tone={c.value > 0 ? 'accent' : 'danger'} className="num">{c.label} {c.value > 0 ? '+' : ''}{c.value}</Badge></li>
              ))}
            </ul>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0">Seguir</Button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { manager, club, loading: contextLoading, refreshContext } = useGameContext()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [advancing, setAdvancing] = useState(false)
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
      const result = await gameLoopApi.advanceWeek(club.id, manager.id)

      queryCache.clear()
      await refreshContext()

      if (result.fired) {
        // El contexto detecta al DT desempleado y lo lleva a la Carrera para elegir una oferta
        toast.error('La dirigencia te destituyó por los resultados deportivos.')
        navigate('/manager')
        return
      }
      toast.success('Semana completada. Plan de trabajo ejecutado.')
    } catch (e) {
      toast.error(friendlyError(e, 'No pudimos avanzar la semana. Probá de nuevo.'))
    } finally {
      setAdvancing(false)
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
      const result = { note: outcome?.outcomeNote || 'Decisión ejecutada.', choice: option.label, effects: option.effects || {}, reaction: reactionFor(option.effects || {}, `${event.id}:${option.id}`) }
      if (!silent) setLastOutcome(result)
      return result
    } catch (err) {
      toast.error(friendlyError(err, 'Error al procesar la decisión.'))
      return null
    }
  }

  // Las historias se abren solas a pantalla completa (una por vez); "decidir más tarde" las deja en el inicio
  const nextStory = (dashboardData?.pendingEvents || []).find(e => isStoryEvent(e) && !postponed.has(e.id))
  useEffect(() => {
    if (!stage && nextStory) setStage({ event: nextStory, result: null })
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

  const { managerSummary, clubSummary, financesSummary, squadHealth, standingsSnippet, nextFixture, urgentAlerts, pendingEvents } = dashboardData

  const matchDue = !!nextFixture && isFixtureDue(nextFixture.match_date, clubSummary.gameDate)
  const matchFuture = !!nextFixture && !matchDue
  const daysToMatch = matchFuture ? daysBetween(clubSummary.gameDate, String(nextFixture.match_date).slice(0, 10)) : 0
  const seasonEnded = isSeasonEnded(clubSummary.gameDate)
  const isHome = nextFixture?.home_team_id === club.id
  const rival = nextFixture ? rivalLevel(rivalOf(nextFixture, club.id)?.strength) : null
  const wageUsage = financesSummary.wageBudget > 0 ? Math.round((financesSummary.weeklyWageBill / financesSummary.wageBudget) * 100) : 0

  // Acción principal según el momento: jugar, avanzar o cerrar la temporada
  const primaryAction = seasonEnded ? (
    <Button onClick={() => setShowSeasonCloseModal(true)}><Trophy />Gala de fin de temporada</Button>
  ) : matchDue ? (
    <Button onClick={() => navigate('/match', { state: { fixtureId: nextFixture.id } })}><Play />Disputar partido</Button>
  ) : (
    <Button onClick={handleAdvanceWeek} loading={advancing}>{!advancing && <FastForward />}Avanzar semana</Button>
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
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
        <AlertList alerts={urgentAlerts} />

        {lastOutcome && <OutcomeCard outcome={lastOutcome} onClose={() => setLastOutcome(null)} />}

        {pendingEvents?.length > 0 && (
          <section aria-label="Decisiones pendientes" className="space-y-3">
            {pendingEvents.map(ev => (
              <EventCard key={ev.id} event={ev} budget={Number(club?.budget || 0)} boardConfidence={Number(club?.board_confidence ?? 100)} onResolve={handleResolveEvent} />
            ))}
          </section>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ClimatePanel key={`climate-${reloadTick}`} club={club} gameDate={clubSummary.gameDate} />
          <ConsequenceFeed key={`feed-${reloadTick}`} clubId={club?.id} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Próximo compromiso */}
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
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm text-fg-muted">
                  <span>Sueldos semanales</span>
                  <span className="num">{formatMoney(financesSummary.weeklyWageBill)} / {formatMoney(financesSummary.wageBudget)}</span>
                </div>
                <Progress auto={false} tone={wageUsage > 100 ? 'danger' : wageUsage > 85 ? 'warning' : 'accent'} value={Math.min(100, wageUsage)} label="Uso del tope salarial" />
              </div>
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
