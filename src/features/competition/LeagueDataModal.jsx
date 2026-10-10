import React, { useEffect, useState } from 'react'
import { Medal, Star, Target, Trophy } from 'lucide-react'
import { competitionApi } from '../../api/competition'
import { Badge, Button, EmptyState, ResponsiveOverlay, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui'
import { cn } from '../../lib/utils'

const formatRating = (n) => String(n).replace('.', ',')

function LeagueTable({ league, clubId }) {
  const { competition, rows, current } = league
  return (
    <section aria-label={competition.name} className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-display text-base font-semibold text-fg">{competition.name}</h3>
        {current && <Badge tone="accent">Liga actual</Badge>}
        {competition.season_year && <span className="text-xs text-fg-subtle">Temporada {competition.season_year}</span>}
      </div>
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2 text-fg-subtle">
              <th scope="col" className="eyebrow w-9 py-2 pl-3 text-center">Pos</th>
              <th scope="col" className="eyebrow px-2 py-2">Club</th>
              <th scope="col" className="eyebrow w-9 px-1 py-2 text-center">PJ</th>
              <th scope="col" className="eyebrow w-10 px-1 py-2 text-center">DIF</th>
              <th scope="col" className="eyebrow w-10 py-2 pr-3 text-center text-accent">PTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(r => {
              const mine = r.club_id === clubId
              const diff = (r.goals_for || 0) - (r.goals_against || 0)
              return (
                <tr key={r.club_id} aria-current={mine ? 'true' : undefined} className={cn(mine && 'bg-accent-soft/40')}>
                  <td className="num py-2 pl-3 text-center text-fg-muted">{r.position}</td>
                  <td className="min-w-0 px-2 py-2 font-semibold text-fg">{r.clubs?.name || 'Club'}{mine && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-accent">Vos</span>}</td>
                  <td className="num px-1 py-2 text-center text-fg-muted">{r.played || 0}</td>
                  <td className="num px-1 py-2 text-center text-fg-muted">{diff > 0 ? `+${diff}` : diff}</td>
                  <td className="num py-2 pr-3 text-center font-bold text-fg">{r.points || 0}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Leaders({ list, valueOf, unit, empty, icon: Icon, loading, failed }) {
  if (loading) return <div className="space-y-2" aria-busy="true"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
  if (failed) return <EmptyState icon={Icon} title="No pudimos cargar los datos" description="Probá de nuevo en un rato." />
  if (!list.length) return <EmptyState icon={Icon} title="Todavía no hay datos" description={empty} />
  return (
    <ol className="space-y-2">
      {list.map((p, i) => (
        <li key={p.player_id} className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5">
          <span className="num grid size-7 shrink-0 place-items-center rounded-full bg-surface-3 text-sm font-semibold text-fg-muted">{i + 1}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-fg">{p.name}</span>
            <span className="block text-xs text-fg-subtle">{p.position ? `${p.position} · ` : ''}{p.matches} {p.matches === 1 ? 'partido' : 'partidos'}</span>
          </span>
          <span className="num text-right"><span className="block font-display text-lg font-bold text-accent">{valueOf(p)}</span><span className="block text-[10px] uppercase tracking-wider text-fg-subtle">{unit}</span></span>
        </li>
      ))}
    </ol>
  )
}

/**
 * "Todas las ligas": las tablas de todas las competiciones de la carrera y los líderes del club (goleadores, asistencias, mejor jugador).
 * Los rivales de la IA no tienen plantel, así que los líderes son solo de tu club.
 */
export default function LeagueDataModal({ club, onClose }) {
  const [leagues, setLeagues] = useState([])
  const [leaders, setLeaders] = useState({ scorers: [], assisters: [], best: [] })
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [leadersFailed, setLeadersFailed] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const [l, s] = await Promise.allSettled([
        competitionApi.getAllLeagues(club.id),
        competitionApi.getClubLeaders(club.id, club.game_date)
      ])
      if (!alive) return
      if (l.status === 'fulfilled') setLeagues(l.value || []); else setFailed(true)
      if (s.status === 'fulfilled') setLeaders(s.value); else setLeadersFailed(true)
      setLoading(false)
    })()
    return () => { alive = false }
  }, [club.id, club.game_date])

  const onlyYours = <p className="mb-3 text-xs text-fg-subtle">Solo de tu club: los rivales de la IA no tienen plantel propio.</p>

  return (
    <ResponsiveOverlay
      title="Todas las ligas"
      description="Las tablas de todas tus ligas y los líderes de tu plantel"
      onClose={onClose}
      size="lg"
      footer={<Button variant="outline" onClick={onClose}>Cerrar</Button>}
    >
      <Tabs defaultValue="ligas">
        <TabsList aria-label="Datos de las ligas" className="mb-4">
          <TabsTrigger value="ligas">Ligas</TabsTrigger>
          <TabsTrigger value="goleadores">Goleadores</TabsTrigger>
          <TabsTrigger value="asistencias">Asistencias</TabsTrigger>
          <TabsTrigger value="mejor">Mejor jugador</TabsTrigger>
        </TabsList>

        <TabsContent value="ligas" className="space-y-5">
          {loading ? <div className="space-y-3" aria-busy="true"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
            : failed ? <EmptyState icon={Trophy} title="No pudimos cargar las ligas" description="Revisá tu conexión y probá de nuevo." />
              : leagues.length === 0 ? <EmptyState icon={Trophy} title="Sin ligas" description="Todavía no hay competiciones en esta carrera." />
                : leagues.map(l => <LeagueTable key={l.competition.id} league={l} clubId={club.id} />)}
        </TabsContent>

        <TabsContent value="goleadores">
          {onlyYours}
          <Leaders list={leaders.scorers} valueOf={p => p.goals} unit="goles" icon={Target} loading={loading} failed={leadersFailed} empty="Todavía no hay goles de tu plantel esta temporada." />
        </TabsContent>

        <TabsContent value="asistencias">
          {onlyYours}
          <Leaders list={leaders.assisters} valueOf={p => p.assists} unit="asist." icon={Medal} loading={loading} failed={leadersFailed} empty="Todavía no hay asistencias de tu plantel esta temporada." />
        </TabsContent>

        <TabsContent value="mejor">
          {onlyYours}
          <Leaders list={leaders.best} valueOf={p => formatRating(p.rating)} unit="nota media" icon={Star} loading={loading} failed={leadersFailed} empty="Todavía no hay notas de partidos esta temporada." />
        </TabsContent>
      </Tabs>
    </ResponsiveOverlay>
  )
}
