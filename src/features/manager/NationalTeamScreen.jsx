import React, { useEffect, useMemo, useState } from 'react'
import { Calendar, CheckCircle2, ChevronRight, Flag, LogOut, Play, Sparkles, Users } from 'lucide-react'
import { toast } from 'sonner'
import { nationalTeamApi } from '../../api/nationalTeam'
import { playerApi } from '../../api/player'
import { useGameContext } from '../../context/GameContext'
import { formatMoney } from '../../lib/format'
import { friendlyError } from '../../lib/errors'
import { cn } from '../../lib/utils'
import { isGoalkeeper } from '../../domain/positions'
import {
  getCountryIdentity,
  evaluateNationalRadar,
  generateNationalHeadlines
} from '../../domain/nationalRadar'
import {
  Badge, Button, Card, CardBody, EmptyState, PageHeader, Skeleton, Stat, Tabs, TabsContent, TabsList, TabsTrigger
} from '../../components/ui'
import NationalCareerGauge from './national/NationalCareerGauge'
import NationalRadarCard from './national/NationalRadarCard'
import NationalHeadlinesTicker from './national/NationalHeadlinesTicker'
import NationalMatchModal from './national/NationalMatchModal'

const SQUAD_SIZE = 23
const MIN_GOALKEEPERS = 3
const isKeeper = (c) => isGoalkeeper(c.player?.position)

export default function NationalTeamScreen() {
  const { manager, club, loading: contextLoading, confirmAction } = useGameContext()
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState(null)
  const [offers, setOffers] = useState([])
  const [callups, setCallups] = useState([])
  const [fixtures, setFixtures] = useState([])
  const [clubPlayers, setClubPlayers] = useState([])
  const [playingMatchId, setPlayingMatchId] = useState(null)
  const [matchModalFixture, setMatchModalFixture] = useState(null)

  const countryIdentity = useMemo(() => {
    return getCountryIdentity(manager?.nationality || club?.country || 'AR')
  }, [manager?.nationality, club?.country])

  const loadData = async () => {
    try {
      if (!manager?.id) return
      setLoading(true)
      const currentTeam = await nationalTeamApi.getCurrentNationalTeam(manager.id)
      setTeam(currentTeam)

      // Cargar jugadores del club para el radar
      if (club?.id) {
        const pList = await playerApi.getSquad(club.id).catch(() => [])
        setClubPlayers(pList || [])
      }

      if (currentTeam) {
        const [cList, fList] = await Promise.all([
          nationalTeamApi.getCallups(currentTeam.id),
          nationalTeamApi.getFixtures(currentTeam.id)
        ])
        setCallups(cList || [])
        setFixtures(fList || [])
      } else {
        setOffers((await nationalTeamApi.getAvailableOffers(manager.id)) || [])
      }
    } catch (e) {
      console.error(e)
      toast.error('Error al cargar datos de selección nacional')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (contextLoading || !manager) return
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextLoading, manager?.id, club?.id])

  // Evaluación dinámica del radar
  const radar = useMemo(() => {
    return evaluateNationalRadar(clubPlayers, manager?.reputation || 20, countryIdentity.code)
  }, [clubPlayers, manager?.reputation, countryIdentity.code])

  // Titulares de prensa
  const headlines = useMemo(() => {
    return generateNationalHeadlines(radar.players, manager, countryIdentity.nickname)
  }, [radar.players, manager, countryIdentity.nickname])

  const handleAcceptOffer = async (offer) => {
    try {
      if (!offer.is_eligible) {
        return toast.error(`Necesitás al menos ${offer.required_reputation} de reputación para esta selección.`)
      }
      const confirmed = await confirmAction({
        title: `Asumir en ${offer.name}`,
        description: `¿Aceptar dirigir a ${offer.name}? Iniciarás la doble carrera (club + selección) cobrando ${formatMoney(offer.weekly_wage)}/semana adicionales.`,
        confirmText: 'Aceptar el cargo',
        cancelText: 'Rechazar',
        variant: 'emerald'
      })
      if (!confirmed) return
      setLoading(true)
      await nationalTeamApi.acceptOffer(manager.id, offer.id)
      toast.success(`¡Felicitaciones! Asumiste como seleccionador de ${offer.name}`)
      await loadData()
    } catch (e) {
      toast.error(friendlyError(e))
      setLoading(false)
    }
  }

  const handleResign = async () => {
    const confirmed = await confirmAction({
      title: 'Renunciar a la selección nacional',
      description: '¿Renunciar al cargo de seleccionador? Seguirás al mando de tu club normalmente, sin penalización de liga.',
      confirmText: 'Presentar renuncia',
      cancelText: 'Cancelar',
      variant: 'red'
    })
    if (!confirmed) return
    try {
      setLoading(true)
      await nationalTeamApi.resign(manager.id, team.id)
      toast.warning('Presentaste tu renuncia a la selección nacional.')
      await loadData()
    } catch (e) {
      toast.error(friendlyError(e))
      setLoading(false)
    }
  }

  const handlePlayMatch = async (fixture) => {
    try {
      setPlayingMatchId(fixture.id)
      const res = await nationalTeamApi.playMatch(fixture.id, team.id, manager.id)
      if (res.won) toast.success(`¡Victoria con la Selección! ${res.teamGoals}-${res.oppGoals}. (+${res.xpBonus} XP, +prestigio)`)
      else if (res.drawn) toast.info(`Empate internacional: ${res.teamGoals}-${res.oppGoals}`)
      else toast.error(`Derrota con la Selección: ${res.teamGoals}-${res.oppGoals}`)
      await loadData()
    } catch (e) {
      toast.error(friendlyError(e, 'No pudimos disputar el partido. Probá de nuevo.'))
    } finally {
      setPlayingMatchId(null)
    }
  }

  if (loading || contextLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6" role="status" aria-label="Cargando selección nacional">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-28" />
        <Skeleton className="h-44" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  // Sin selección activa: radar de promesas + termómetro + bolsa de ofertas
  if (!team) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8 space-y-6">
        <PageHeader
          backTo="/manager"
          eyebrow={`Tu reputación: ${manager?.reputation || 20} pts · doble carrera`}
          title="Selecciones nacionales"
          description="Dirigir a tu país no afecta tu contrato ni el día a día del club. Dirigís en las fechas FIFA con 23 convocados y 3 arqueros como mínimo."
        />

        {/* 1. Titulares de prensa */}
        <NationalHeadlinesTicker headlines={headlines} />

        {/* 2. Termómetro de Carrera hacia la Selección */}
        <NationalCareerGauge manager={manager} country={countryIdentity} />

        {/* 3. Radar de Convocatorias del Club */}
        <NationalRadarCard radar={radar} club={club} />

        {/* 4. Ofertas y Oportunidades Federativas */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-fg sm:text-lg flex items-center gap-2">
              <Flag className="size-5 text-accent" />
              Ofertas y Puestos Disponibles
            </h3>
            <span className="text-xs text-fg-subtle">{offers.length} vacantes</span>
          </div>

          {offers.length === 0 ? (
            <Card as="div">
              <EmptyState 
                icon={Flag} 
                title="Sin ofertas de selección" 
                description="Ninguna federación está buscando seleccionador en este momento. Seguí sumando prestigio en el club." 
              />
            </Card>
          ) : (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {offers.map(offer => (
                <li key={offer.id}>
                  <Card as="article" className={cn('h-full transition-all hover:border-line-strong', !offer.is_eligible && 'opacity-70')}>
                    <CardBody className="flex h-full flex-col gap-4 p-5">
                      <div className="flex items-center justify-between gap-2">
                        <Badge tone={offer.is_eligible ? 'accent' : 'neutral'}>{offer.category_label}</Badge>
                        <span className="num text-xs text-fg-subtle">Rep. requerida: {offer.required_reputation}</span>
                      </div>
                      <div>
                        <h2 className="font-display text-xl font-bold text-fg">{offer.name}</h2>
                        <p className="mt-1 text-xs text-fg-muted leading-relaxed">{offer.objective}</p>
                      </div>
                      <Stat 
                        label="Sueldo federativo" 
                        value={`${formatMoney(offer.weekly_wage)}/sem`} 
                        valueClassName="text-xl text-accent font-bold" 
                      />
                      <Button 
                        className="mt-auto" 
                        disabled={!offer.is_eligible} 
                        onClick={() => handleAcceptOffer(offer)}
                      >
                        {offer.is_eligible ? <>Aceptar el cargo<ChevronRight className="size-4" /></> : 'Reputación insuficiente'}
                      </Button>
                    </CardBody>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    )
  }

  // Selección activa
  const played = team.matches_played || 0
  const winRate = played > 0 ? Math.round(((team.matches_won || 0) / played) * 100) : 0
  const keepers = callups.filter(isKeeper).length

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8 space-y-6">
      <PageHeader
        backTo="/manager"
        eyebrow={`Puesto FIFA #${team.world_ranking || 1}`}
        title={team.name}
        actions={<Button variant="outline" size="sm" onClick={handleResign}><LogOut className="size-4" />Renunciar a la selección</Button>}
      />

      {/* Termómetro de Selección como Seleccionador Activo */}
      <NationalCareerGauge manager={manager} country={countryIdentity} />

      {/* Estadísticas de la era */}
      <Card>
        <CardBody className="grid grid-cols-2 gap-5 sm:grid-cols-4 p-5">
          <Stat label="Victorias" value={team.matches_won || 0} valueClassName="text-accent font-bold text-2xl" />
          <Stat label="Empates" value={team.matches_drawn || 0} valueClassName="text-warning font-bold text-2xl" />
          <Stat label="Derrotas" value={team.matches_lost || 0} valueClassName="text-danger font-bold text-2xl" />
          <Stat label="Efectividad" value={`${winRate}%`} hint={`${played} partidos disputados`} valueClassName="font-bold text-2xl" />
        </CardBody>
      </Card>

      <Tabs defaultValue="convocatoria">
        <TabsList aria-label="Secciones de la selección">
          <TabsTrigger value="convocatoria">Convocatoria ({callups.length}/{SQUAD_SIZE})</TabsTrigger>
          <TabsTrigger value="partidos">Fechas FIFA ({fixtures.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="convocatoria" className="space-y-4 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="flex items-center gap-2 text-fg-muted">
              <Users className="size-4" aria-hidden="true" />
              Nómina reglamentaria: <strong className="num text-fg">{callups.length} / {SQUAD_SIZE}</strong>
            </p>
            <Badge tone={keepers >= MIN_GOALKEEPERS ? 'accent' : 'danger'} dot>
              Arqueros: {keepers} / {MIN_GOALKEEPERS} mínimo
            </Badge>
          </div>
          {callups.length === 0 ? (
            <Card as="div">
              <EmptyState 
                icon={Users} 
                title="Sin convocados" 
                description="La nómina se arma con los mejores talentos elegibles del país." 
              />
            </Card>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {callups.map(c => (
                <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4 shadow-sm">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-fg">
                      <span className="truncate">{c.player?.first_name} {c.player?.last_name}</span>
                      <Badge>{c.player?.position}</Badge>
                    </p>
                    <p className="text-xs text-fg-muted mt-0.5">
                      {c.player?.clubs?.short_name || 'Club'} · {c.player?.age || 22} años · Moral {c.player?.state_morale || 70}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="num text-sm font-semibold text-fg">{c.caps || 0} caps</p>
                    <p className="num text-xs text-fg-subtle">{c.international_goals || 0} goles</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="partidos" className="space-y-4 pt-2">
          {fixtures.length === 0 ? (
            <Card as="div">
              <EmptyState 
                icon={Calendar} 
                title="Sin fechas FIFA" 
                description="Todavía no hay partidos programados para la selección." 
              />
            </Card>
          ) : (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {fixtures.map(f => (
                <li key={f.id}>
                  <Card as="article" className="h-full">
                    <CardBody className="flex h-full flex-col gap-3 p-5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="eyebrow">{f.tournament_name}</span>
                        {f.played ? (
                          <Badge tone="accent">
                            <CheckCircle2 className="size-3" aria-hidden="true" />
                            Finalizado
                          </Badge>
                        ) : (
                          <span className="flex items-center gap-1 text-fg-muted">
                            <Calendar className="size-3" aria-hidden="true" />
                            {f.match_date}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-3 text-sm font-bold text-fg">
                        <span className="truncate text-right">{f.is_home ? team.name : f.opponent_name}</span>
                        <span className="num rounded-xl bg-surface-2 px-3.5 py-1.5 font-mono text-lg border border-line">
                          {f.played ? `${f.home_score} - ${f.away_score}` : 'vs'}
                        </span>
                        <span className="truncate">{f.is_home ? f.opponent_name : team.name}</span>
                      </div>
                      {!f.played && (
                        <div className="mt-auto pt-2">
                          <Button 
                            className="w-full" 
                            loading={playingMatchId === f.id} 
                            onClick={() => handlePlayMatch(f)}
                          >
                            {playingMatchId !== f.id && <Play className="size-4" />}
                            Disputar partido de selección
                          </Button>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal interactivo de partido si se selecciona */}
      {matchModalFixture && (
        <NationalMatchModal
          fixture={matchModalFixture}
          team={team}
          onClose={() => setMatchModalFixture(null)}
          onSimulateFast={(fix) => {
            setMatchModalFixture(null)
            handlePlayMatch(fix)
          }}
          onPlayLive={(fix) => {
            setMatchModalFixture(null)
            handlePlayMatch(fix)
          }}
        />
      )}
    </div>
  )
}
