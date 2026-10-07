import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle, AlertCircle, Bell, CalendarDays, FastForward, Play, Shield, Trophy, Activity, Heart, Wallet, ListOrdered
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

// Los capítulos de una historia llevan su número en el título: "Un pibe que la rompe (1/4)"
const isStoryEvent = (event) => String(event.template_code || '').startsWith('ARC_')

/** Escudo provisional: iniciales del club sobre el color primario (hasta tener escudos reales) */
function Crest({ name, highlight }) {
  const initials = (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <span
      className={cn(
        'grid size-14 place-items-center rounded-lg border font-display text-xl font-semibold sm:size-16 sm:text-2xl',
        highlight ? 'border-accent/50 bg-accent-soft text-accent' : 'border-line-strong bg-surface-2 text-fg-muted'
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
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

/** Dilema del DT (evento dinámico) con sus opciones */
function EventCard({ event, budget, boardConfidence, onResolve }) {
  const critical = event.severity === 'CRITICAL'
  const category = EVENT_CATEGORY[event.category] || { label: event.category, tone: 'neutral' }
  const options = Array.isArray(event.options) ? event.options : []
  // Una sola elección por evento: al apretar una opción se bloquean todas hasta que termine
  const [choosing, setChoosing] = useState(false)
  const choose = async (opt) => {
    if (choosing) return
    setChoosing(true)
    try {
      await onResolve(event, opt)
    } finally {
      setChoosing(false)
    }
  }

  return (
    <Card className={cn(critical && 'border-danger/50')}>
      <CardBody className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {isStoryEvent(event) && <Badge tone="gold">Historia</Badge>}
          <Badge tone={category.tone}>{category.label}</Badge>
          {critical && <Badge tone="danger" dot>Decisión urgente</Badge>}
        </div>
        <div>
          <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-fg">
            <Bell className={cn('size-4.5', critical ? 'text-danger' : 'text-fg-subtle')} aria-hidden="true" />
            {event.title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{event.description}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {options.map(opt => {
            const cost = Number(opt.cost || 0)
            const canAfford = cost === 0 || budget >= cost
            const needsBoard = Number(opt.requires?.board || 0)
            const hasBackup = !needsBoard || boardConfidence >= needsBoard
            return (
              <Button key={opt.id} variant="outline" disabled={choosing || !canAfford || !hasBackup} onClick={() => choose(opt)} className="justify-between" title={opt.description}>
                <span>{opt.label}</span>
                {cost > 0 && <Badge tone={canAfford ? 'warning' : 'danger'} className="num">-{formatMoney(cost)}</Badge>}
                {!hasBackup && <Badge tone="danger">Sin respaldo de la dirigencia</Badge>}
              </Button>
            )
          })}
        </div>
      </CardBody>
    </Card>
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

  const handleResolveEvent = async (event, option) => {
    try {
      const outcome = await eventsApi.resolveEvent(event.id, option, manager?.id)
      await refreshContext()
      setReloadTick(t => t + 1)
      // Si el evento ya estaba resuelto (doble clic u otra pestaña) no se aplicó nada: solo se refresca la pantalla
      if (!outcome?.alreadyResolved) toast.success(outcome?.outcomeNote || 'Decisión ejecutada.')
    } catch (err) {
      toast.error(friendlyError(err, 'Error al procesar la decisión.'))
    }
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
                      <Crest name={nextFixture.home?.name} highlight={nextFixture.home_team_id === club.id} />
                      <p className="max-w-full truncate text-sm font-semibold text-fg">{nextFixture.home?.name || 'Local'}</p>
                      <p className="eyebrow">{nextFixture.home_team_id === club.id ? 'Tu club' : 'Rival'}</p>
                    </div>
                    <div className="shrink-0 text-center">
                      <p className="font-display text-2xl font-semibold text-fg-subtle">VS</p>
                      <p className="num mt-1 text-xs capitalize text-fg-muted">{formatGameDate(String(nextFixture.match_date).slice(0, 10))}</p>
                      <p className="mt-0.5 text-xs text-fg-subtle">{isHome ? 'De local' : 'De visitante'}</p>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
                      <Crest name={nextFixture.away?.name} highlight={nextFixture.away_team_id === club.id} />
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
