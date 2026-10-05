import React, { useEffect, useState } from 'react'
import { Calendar, CheckCircle2, Flame, Globe, Play, Shield, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { internationalCupApi } from '../../api/internationalCup'
import { useGameContext } from '../../context/GameContext'
import { formatMoney } from '../../lib/format'
import { cn } from '../../lib/utils'
import { Badge, Button, Card, CardBody, EmptyState, PageHeader, Skeleton, Stat } from '../../components/ui'

const STAGE_LABEL = { quarter_finals: 'Cuartos', semi_finals: 'Semifinal', final: 'Gran final' }

function FixtureCard({ fixture, userClubId, onPlay, playing, highlight = false }) {
  const mine = fixture.home_club_id === userClubId || fixture.away_club_id === userClubId
  const sides = [
    [fixture.home_club?.name || 'Equipo 1', fixture.home_club_id === userClubId, fixture.home_score],
    [fixture.away_club?.name || 'Equipo 2', fixture.away_club_id === userClubId, fixture.away_score]
  ]

  return (
    <Card as="article" className={cn(mine && 'border-gold/50', highlight && 'ring-1 ring-gold/30')}>
      <CardBody className="space-y-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="eyebrow">{STAGE_LABEL[fixture.stage] || fixture.stage}</span>
          {fixture.played ? (
            <Badge tone="accent"><CheckCircle2 className="size-3" aria-hidden="true" />Finalizado</Badge>
          ) : (
            <span className="flex items-center gap-1 text-fg-muted"><Calendar className="size-3" aria-hidden="true" />{fixture.match_date || 'Entre semana'}</span>
          )}
        </div>
        <ul className="space-y-2">
          {sides.map(([name, isMine, score]) => (
            <li key={name + isMine} className="flex items-center justify-between gap-3">
              <span className={cn('truncate text-sm font-semibold', isMine ? 'text-gold' : 'text-fg')}>{name}{isMine && ' (vos)'}</span>
              <span className="num min-w-9 rounded-md bg-surface-2 px-2 py-0.5 text-center font-display text-lg font-semibold">{fixture.played ? score : '-'}</span>
            </li>
          ))}
        </ul>
        {mine && !fixture.played && (
          <Button className="w-full" loading={playing === fixture.id} onClick={() => onPlay(fixture)}>
            {playing !== fixture.id && <Play />}Jugar partido continental
          </Button>
        )}
      </CardBody>
    </Card>
  )
}

function Stage({ icon: Icon, title, hint, fixtures, emptyText, children }) {
  return (
    <section className="space-y-3" aria-label={title}>
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-fg-muted" aria-hidden="true" />
        <h2 className="font-display text-xl font-semibold text-fg">{title}</h2>
        <span className="ml-auto text-xs text-fg-subtle">{hint}</span>
      </div>
      {fixtures.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line p-5 text-center text-sm text-fg-subtle">{emptyText}</p>
      ) : children}
    </section>
  )
}

export default function InternationalCupScreen() {
  const { club, manager, loading: contextLoading } = useGameContext()
  const [loading, setLoading] = useState(true)
  const [cupData, setCupData] = useState(null)
  const [playingMatchId, setPlayingMatchId] = useState(null)

  const loadCupData = async () => {
    try {
      if (!club?.id) return
      setCupData(await internationalCupApi.getActiveTournament(club.id))
    } catch (e) {
      console.error(e)
      toast.error('Error al cargar la Copa Continental')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (contextLoading || !club) return
    loadCupData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextLoading, club])

  const handlePlayUserMatch = async (fixture) => {
    try {
      setPlayingMatchId(fixture.id)
      const userIsHome = fixture.home_club_id === club.id
      const userGoals = Math.floor(Math.random() * 3) + 1
      let oppGoals = Math.floor(Math.random() * 2)
      // Sin empates en partidos de eliminación directa
      if (userGoals === oppGoals) oppGoals = Math.max(0, userGoals - 1)

      const homeScore = userIsHome ? userGoals : oppGoals
      const awayScore = userIsHome ? oppGoals : userGoals
      const res = await internationalCupApi.processUserMatchResult(fixture.id, club.id, manager?.id, homeScore, awayScore)

      if (res.userWon) toast.success(`¡Victoria continental! ${homeScore}-${awayScore}. Premio: +${formatMoney(res.matchBonus)}`)
      else toast.error(`Derrota en la copa: ${homeScore}-${awayScore}`)
      await loadCupData()
    } catch (e) {
      toast.error(e.message || 'Error al disputar el partido')
    } finally {
      setPlayingMatchId(null)
    }
  }

  if (loading || contextLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6" role="status" aria-label="Cargando certamen continental">
        <Skeleton className="h-12 w-72" />
        <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
      </div>
    )
  }

  const { tournament, fixtures } = cupData || {}
  const byStage = (stage) => fixtures?.filter(f => f.stage === stage) || []
  const quarters = byStage('quarter_finals')
  const semis = byStage('semi_finals')
  const finals = byStage('final')

  if (!tournament) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <PageHeader backTo="/standings" eyebrow="Torneo de clubes de América" title="Copa continental" />
        <Card as="div"><EmptyState icon={Globe} title="Sin torneo activo" description="Tu club todavía no clasificó a un certamen continental esta temporada." /></Card>
      </div>
    )
  }

  const renderGrid = (list, props = {}, className = 'md:grid-cols-2') => (
    <ul className={cn('grid grid-cols-1 gap-3', className)}>
      {list.map(f => <li key={f.id}><FixtureCard fixture={f} userClubId={club?.id} onPlay={handlePlayUserMatch} playing={playingMatchId} {...props} /></li>)}
    </ul>
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        backTo="/standings"
        eyebrow={`Temporada ${tournament.season_year || 2026} · Torneo de clubes de América`}
        title={tournament.name || 'Copa Gloria Continental'}
        actions={<Stat label="Bolsa de premios" value={formatMoney(tournament.prize_pool || 1500000)} valueClassName="text-2xl text-accent" className="text-right" />}
      />

      {tournament.status === 'finished' && (
        <div role="status" className="mb-6 flex items-center gap-4 rounded-lg border border-gold/40 bg-gold-soft p-4 sm:p-5">
          <span className="grid size-12 shrink-0 place-items-center rounded-md bg-gold text-accent-fg"><Trophy className="size-7" aria-hidden="true" /></span>
          <div>
            <p className="eyebrow text-gold">Campeón continental</p>
            <p className="font-display text-2xl font-semibold text-fg">{tournament.champion?.name || 'Campeón de América'}</p>
            <p className="text-xs text-fg-muted">Gloria eterna y clasificación asegurada a la próxima edición.</p>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <Stage icon={Shield} title="Cuartos de final" hint="Ida y vuelta / eliminación" fixtures={quarters} emptyText="Los cuartos de final todavía no están definidos.">
          {renderGrid(quarters)}
        </Stage>
        <Stage icon={Flame} title="Semifinales" hint="Los 4 mejores del continente" fixtures={semis} emptyText="Se definirán al concluir los cuartos de final.">
          {renderGrid(semis)}
        </Stage>
        <Stage icon={Trophy} title="Gran final continental" hint="Premio mayor: $1.000.000" fixtures={finals} emptyText="La final se disputará tras las semifinales.">
          <div className="mx-auto max-w-2xl">{renderGrid(finals, { highlight: true }, '')}</div>
        </Stage>
      </div>
    </div>
  )
}
