import React, { useEffect, useState } from 'react'
import { Calendar, CheckCircle2, Flame, Globe, Play, Shield, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { internationalCupApi } from '../../api/internationalCup'
import { useGameContext } from '../../context/GameContext'
import { formatMoney, formatLongDate } from '../../lib/format'
import { friendlyError } from '../../lib/errors'
import { isDue } from '../../domain/cupTournament'
import { cn } from '../../lib/utils'
import { Badge, Button, Card, CardBody, EmptyState, PageHeader, Skeleton, Stat } from '../../components/ui'

const STAGE_LABEL = { quarter_finals: 'Cuartos', semi_finals: 'Semifinal', final: 'Gran final' }

function FixtureCard({ fixture, userClubId, gameDate, onPlay, playing, highlight = false }) {
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
            <span className="flex items-center gap-1 text-fg-muted"><Calendar className="size-3" aria-hidden="true" />{fixture.match_date ? formatLongDate(fixture.match_date) : 'Fecha a confirmar'}</span>
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
          isDue(fixture, gameDate) ? (
            <Button className="w-full" loading={playing === fixture.id} onClick={() => onPlay(fixture)}>
              {playing !== fixture.id && <Play />}Jugar partido continental
            </Button>
          ) : (
            <p className="rounded-md bg-surface-2 py-2 text-center text-xs font-medium text-fg-muted">Se juega el {formatLongDate(fixture.match_date)}. Avanzá las semanas hasta esa fecha.</p>
          )
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
      const res = await internationalCupApi.playUserMatch(fixture.id, club.id, manager?.id)
      const { homeScore, awayScore } = res

      if (res.userWon) toast.success(`¡Victoria continental! ${homeScore}-${awayScore}. Premio: +${formatMoney(res.matchBonus)}`)
      else toast.error(`Derrota en la copa: ${homeScore}-${awayScore}`)
      await loadCupData()
    } catch (e) {
      toast.error(friendlyError(e, 'No pudimos disputar el partido. Probá de nuevo.'))
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
    const schedule = cupData?.schedule
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <PageHeader backTo="/standings" eyebrow="Torneo de clubes de América" title="Copa continental" />
        <Card as="div">
          <EmptyState
            icon={Globe}
            title={cupData?.notStarted ? 'La copa todavía no arrancó' : 'Sin torneo activo'}
            description={cupData?.notStarted && schedule
              ? `Clasifican los 8 mejores de la liga al ${formatLongDate(schedule.seedDate)}. Los cuartos de final se juegan el ${formatLongDate(schedule.quarter_finals)}, las semifinales el ${formatLongDate(schedule.semi_finals)} y la final el ${formatLongDate(schedule.final)}.`
              : 'No hay un certamen continental en juego para tu liga.'}
          />
        </Card>
      </div>
    )
  }

  const renderGrid = (list, props = {}, className = 'md:grid-cols-2') => (
    <ul className={cn('grid grid-cols-1 gap-3', className)}>
      {list.map(f => <li key={f.id}><FixtureCard fixture={f} userClubId={club?.id} gameDate={cupData?.gameDate} onPlay={handlePlayUserMatch} playing={playingMatchId} {...props} /></li>)}
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

      {!cupData?.qualified && (
        <p role="status" className="mb-6 rounded-lg border border-line bg-surface-2 p-3 text-sm text-fg-muted">
          Tu club no clasificó: pasan los 8 mejores de la liga al {formatLongDate(cupData?.schedule?.seedDate)}. Seguís la copa desde afuera.
        </p>
      )}

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
        <Stage icon={Shield} title="Cuartos de final" hint={cupData?.schedule ? formatLongDate(cupData.schedule.quarter_finals) : 'Eliminación directa'} fixtures={quarters} emptyText="Los cuartos de final todavía no están definidos.">
          {renderGrid(quarters)}
        </Stage>
        <Stage icon={Flame} title="Semifinales" hint={cupData?.schedule ? formatLongDate(cupData.schedule.semi_finals) : 'Los 4 mejores'} fixtures={semis} emptyText="Se definirán al concluir los cuartos de final.">
          {renderGrid(semis)}
        </Stage>
        <Stage icon={Trophy} title="Gran final continental" hint={cupData?.schedule ? formatLongDate(cupData.schedule.final) : 'Premio mayor'} fixtures={finals} emptyText="La final se disputará tras las semifinales.">
          <div className="mx-auto max-w-2xl">{renderGrid(finals, { highlight: true }, '')}</div>
        </Stage>
      </div>
    </div>
  )
}
