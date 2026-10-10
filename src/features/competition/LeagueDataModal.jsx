import React, { useEffect, useMemo, useState } from 'react'
import { Medal, Star, Swords, Target, Trophy } from 'lucide-react'
import { competitionApi } from '../../api/competition'
import { Badge, Button, EmptyState, ResponsiveOverlay, Select, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui'
import { withUserLeaders } from '../../domain/worldLeagues'
import { cn } from '../../lib/utils'

const formatRating = (n) => String(n).replace('.', ',')

function LeagueTable({ league, clubId }) {
  const { rows } = league
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full border-collapse text-left text-sm" aria-label={`Tabla de ${league.competition.name}`}>
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
  )
}

function Results({ list, loading, failed }) {
  if (loading) return <div className="space-y-2" aria-busy="true"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
  if (failed) return <EmptyState icon={Swords} title="No pudimos cargar los resultados" description="Probá de nuevo en un rato." />
  if (!list.length) return <EmptyState icon={Swords} title="Todavía no hay resultados" description="Cuando se jueguen las primeras fechas los vas a ver acá." />
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
      {list.map(f => (
        <li key={f.id} className="flex items-center gap-2 bg-surface px-3 py-2.5 text-sm">
          <span className="min-w-0 flex-1 truncate text-right font-semibold text-fg">{f.homeName}</span>
          <span className="num shrink-0 rounded-md bg-surface-3 px-2 py-0.5 font-display font-bold text-fg">{f.homeScore} - {f.awayScore}</span>
          <span className="min-w-0 flex-1 truncate font-semibold text-fg">{f.awayName}</span>
        </li>
      ))}
    </ul>
  )
}

function Leaders({ list, valueOf, unit, empty, icon: Icon, loading }) {
  if (loading) return <div className="space-y-2" aria-busy="true"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
  if (!list.length) return <EmptyState icon={Icon} title="Todavía no hay datos" description={empty} />
  return (
    <ol className="space-y-2">
      {list.map((p, i) => (
        <li key={p.key} className={cn('flex items-center gap-3 rounded-lg border bg-surface px-3 py-2.5', p.mine ? 'border-accent/60' : 'border-line')}>
          <span className="num grid size-7 shrink-0 place-items-center rounded-full bg-surface-3 text-sm font-semibold text-fg-muted">{i + 1}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-fg">{p.name}</span>
            <span className="block truncate text-xs text-fg-subtle">{p.clubName}{p.mine && ' · tu club'}</span>
          </span>
          <span className="num text-right"><span className="block font-display text-lg font-bold text-accent">{valueOf(p)}</span><span className="block text-[10px] uppercase tracking-wider text-fg-subtle">{unit}</span></span>
        </li>
      ))}
    </ol>
  )
}

/**
 * "Todas las ligas": las cinco divisiones, de la Primera al Torneo Regional (Potrero), con su tabla, resultados, goleadores,
 * asistencias y figura. El club juega una; el mundo arma y juega las otras cuatro (una vez por temporada).
 */
export default function LeagueDataModal({ club, onClose }) {
  const [phase, setPhase] = useState('building') // building → ready | failed
  const [worldFailed, setWorldFailed] = useState(false)
  const [leagues, setLeagues] = useState([])
  const [boards, setBoards] = useState({})
  const [mine, setMine] = useState(null)
  const [leadersFailed, setLeadersFailed] = useState(false)
  const [selected, setSelected] = useState(null)
  const [results, setResults] = useState({ id: null, list: [], loading: false, failed: false })
  const [tab, setTab] = useState('tabla')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        await competitionApi.ensureWorldLeagues({ clubId: club.id, userTier: club.league_tier, gameDate: club.game_date })
      } catch (e) {
        console.warn('No se pudo armar el mundo del fútbol:', e)
        if (alive) setWorldFailed(true)
      }
      try {
        const all = await competitionApi.getAllLeagues(club.id, club.game_date)
        if (!alive) return
        setLeagues(all || [])
        setSelected((all || []).find(l => l.current)?.competition.id || all?.[0]?.competition.id || null)
        setPhase('ready')
        const [b, m] = await Promise.allSettled([
          competitionApi.getLeagueLeaders((all || []).filter(l => !l.past).map(l => l.competition.id)),
          competitionApi.getClubLeaders(club.id, club.game_date)
        ])
        if (!alive) return
        if (b.status === 'fulfilled') setBoards(b.value || {}); else setLeadersFailed(true)
        if (m.status === 'fulfilled') setMine(m.value)
      } catch (e) {
        console.warn('No se pudieron cargar las ligas:', e)
        if (alive) setPhase('failed')
      }
    })()
    return () => { alive = false }
  }, [club.id, club.league_tier, club.game_date])

  const league = useMemo(() => leagues.find(l => l.competition.id === selected) || null, [leagues, selected])
  const leaders = useMemo(() => {
    const base = boards[selected] || { scorers: [], assisters: [], best: [] }
    return league?.current ? withUserLeaders(base, mine, club.name) : base
  }, [boards, selected, league, mine, club.name])

  // Los resultados se piden al abrir la pestaña, de la liga elegida
  useEffect(() => {
    if (tab !== 'resultados' || !selected) return undefined
    let alive = true
    setResults({ id: selected, list: [], loading: true, failed: false })
    competitionApi.getLeagueResults(selected, 14)
      .then(list => { if (alive) setResults({ id: selected, list, loading: false, failed: false }) })
      .catch(() => { if (alive) setResults({ id: selected, list: [], loading: false, failed: true }) })
    return () => { alive = false }
  }, [tab, selected])

  const present = leagues.filter(l => !l.past)
  const past = leagues.filter(l => l.past)
  const label = (l) => `${l.competition.name}${l.current ? ' · tu liga' : ''}`
  const leadersLoading = phase === 'ready' && !leadersFailed && !boards[selected] && !(league?.current && mine)
  const noGoals = 'Todavía no hay goles en esta liga esta temporada.'

  return (
    <ResponsiveOverlay
      title="Todas las ligas"
      description="De la Primera al Torneo Regional: tablas, resultados y goleadores"
      onClose={onClose}
      size="lg"
      footer={<Button variant="outline" onClick={onClose}>Cerrar</Button>}
    >
      {phase === 'building' ? (
        <div className="space-y-3" role="status" aria-busy="true">
          <p className="text-sm font-semibold text-fg">Armando el mundo del fútbol…</p>
          <p className="text-xs text-fg-subtle">La primera vez se arman las otras divisiones con sus clubes y partidos. Puede tardar unos segundos.</p>
          <Skeleton className="h-32" />
        </div>
      ) : phase === 'failed' ? (
        <EmptyState icon={Trophy} title="No pudimos cargar las ligas" description="Revisá tu conexión y probá de nuevo." />
      ) : (
        <div className="space-y-4">
          {worldFailed && <p className="rounded-lg border border-warning/40 bg-warning-soft px-3 py-2 text-xs text-warning">No pudimos armar las demás divisiones ahora. Se muestran las que ya existen.</p>}
          <div className="space-y-1.5">
            <label htmlFor="liga-elegida" className="block text-sm font-medium text-fg">Liga</label>
            <Select id="liga-elegida" value={selected || ''} onChange={(e) => setSelected(e.target.value)}>
              {present.map(l => <option key={l.competition.id} value={l.competition.id}>{label(l)}</option>)}
              {past.length > 0 && (
                <optgroup label="Temporadas anteriores">
                  {past.map(l => <option key={l.competition.id} value={l.competition.id}>{label(l)} · {l.competition.season_year}</option>)}
                </optgroup>
              )}
            </Select>
            {league?.current && <Badge tone="accent">Tu liga</Badge>}
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList aria-label="Datos de la liga" className="mb-4">
              <TabsTrigger value="tabla">Tabla</TabsTrigger>
              <TabsTrigger value="resultados">Resultados</TabsTrigger>
              <TabsTrigger value="goleadores">Goleadores</TabsTrigger>
              <TabsTrigger value="asistencias">Asistencias</TabsTrigger>
              <TabsTrigger value="figura">Figura</TabsTrigger>
            </TabsList>

            <TabsContent value="tabla">{league ? <LeagueTable league={league} clubId={club.id} /> : <EmptyState icon={Trophy} title="Sin ligas" description="Todavía no hay competiciones en esta carrera." />}</TabsContent>
            <TabsContent value="resultados"><Results list={results.id === selected ? results.list : []} loading={results.loading || results.id !== selected} failed={results.failed} /></TabsContent>
            <TabsContent value="goleadores">
              {league?.past ? <EmptyState icon={Target} title="Sin datos" description="Los goleadores se guardan solo de la temporada en curso." />
                : <Leaders list={leaders.scorers} valueOf={p => p.goals} unit="goles" icon={Target} loading={leadersLoading} empty={noGoals} />}
            </TabsContent>
            <TabsContent value="asistencias">
              {league?.past ? <EmptyState icon={Medal} title="Sin datos" description="Las asistencias se guardan solo de la temporada en curso." />
                : <Leaders list={leaders.assisters} valueOf={p => p.assists} unit="asist." icon={Medal} loading={leadersLoading} empty="Todavía no hay asistencias en esta liga esta temporada." />}
            </TabsContent>
            <TabsContent value="figura">
              {league?.past ? <EmptyState icon={Star} title="Sin datos" description="La figura se calcula solo de la temporada en curso." />
                : <Leaders list={leaders.best} valueOf={p => formatRating(p.points)} unit="goles + asist." icon={Star} loading={leadersLoading} empty="Todavía no hay datos para elegir una figura." />}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </ResponsiveOverlay>
  )
}
