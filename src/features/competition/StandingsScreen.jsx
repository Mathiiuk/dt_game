import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Globe2, Layers, RefreshCw, Shield, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { competitionApi } from '../../api/competition'
import { useGameContext } from '../../context/GameContext'
import { isSeasonEnded } from '../../domain/gameWeek'
import { divisionName } from '../../domain/divisions'
import { queryCache } from '../../utils/cache'
import { FORM_LABELS, formatDiff, goalDiff, parseForm, zoneLegend, zoneOf } from '../../domain/standings'
import { RULESETS, rulesetIdFor } from '../../domain/leagueRules'
import { cn } from '../../lib/utils'
import { Badge, Button, Card, EmptyState, PageHeader, QuickActions, QUICK_ACTION, Skeleton } from '../../components/ui'
import LeaguePyramidModal from './LeaguePyramidModal'
import LeagueDataModal from './LeagueDataModal'

const FORM_STYLE = {
  V: 'bg-accent-soft text-accent',
  E: 'bg-warning-soft text-warning',
  D: 'bg-danger-soft text-danger'
}

export default function StandingsScreen() {
  const navigate = useNavigate()
  const { club, loading: contextLoading } = useGameContext()

  const [loading, setLoading] = useState(true)
  const [standings, setStandings] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [showPyramid, setShowPyramid] = useState(false)
  const [showAllLeagues, setShowAllLeagues] = useState(false)
  const [rules, setRules] = useState(null)

  const loadData = async (force = false) => {
    if (!club?.id) return
    try {
      if (force) {
        setRefreshing(true)
        queryCache.invalidate(`standings:${club.id}`)
      }
      setStandings((await competitionApi.getStandings(club.id)) || [])
      // El reglamento que votó la Asamblea (si falla, rige el clásico)
      try { setRules((await competitionApi.getLeagueRules?.(club.id)) || null) } catch { setRules(null) }
      setLoadError(false)
    } catch (e) {
      console.error('Error cargando tabla de posiciones:', e)
      // Sin datos reales no se muestra ninguna tabla: queda el aviso con "Reintentar"
      setStandings([])
      setLoadError(true)
      if (force) toast.error('No se pudo cargar la tabla de posiciones.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (contextLoading) return
    if (!club) { setLoading(false); return }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextLoading, club?.id])

  // El cierre anual se hace desde la gala del inicio (premio, ascenso, evolución y calendario nuevo)
  const seasonEnded = !!club?.game_date && isSeasonEnded(club.game_date)

  if (loading || contextLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6" role="status" aria-label="Cargando clasificación">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-10" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!club) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Card as="div"><EmptyState icon={Shield} title="Sin club activo" description="No se encontró un club activo en esta sesión." action={<Button onClick={() => navigate('/dashboard')}>Volver al inicio</Button>} /></Card>
      </div>
    )
  }

  const total = standings.length
  const tier = club?.league_tier || 5
  const legend = zoneLegend(tier, total, rules)
  const rulesetId = rulesetIdFor(rules)
  const ruleset = RULESETS.find(r => r.id === rulesetId)

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        eyebrow={divisionName(club?.league_tier)}
        title="Tabla de posiciones"
        actionsFill
        description={`${total} clubes`}
        actions={
          <QuickActions>
            <Button variant="outline" size="sm" className={QUICK_ACTION} onClick={() => navigate('/calendar')}><Calendar className="text-blue-400" />Calendario</Button>
            <Button variant="outline" size="sm" className={QUICK_ACTION} onClick={() => setShowAllLeagues(true)}><Globe2 className="text-accent" />Todas las ligas</Button>
            <Button variant="outline" size="sm" className={QUICK_ACTION} onClick={() => setShowPyramid(true)}><Layers className="text-gold" />Pirámide</Button>
            {seasonEnded && <Button size="sm" className={QUICK_ACTION} onClick={() => navigate('/dashboard')}><Trophy />Cierre anual</Button>}
          </QuickActions>
        }
      />

      {ruleset && ruleset.id !== 'CLASICO' && !loadError && (
        <p className="mb-3 rounded-lg border border-gold/40 bg-surface-2 px-3 py-2 text-sm text-fg-muted">
          <strong className="font-semibold text-fg">Reglamento de la Asamblea: {ruleset.name}.</strong> {ruleset.blurb}
        </p>
      )}

      {legend.length > 0 && !loadError && (
        <ul className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-fg-muted" aria-label="Referencias de zonas">
          {legend.map(([zone, range]) => (
            <li key={zone.id} className="flex items-center gap-1.5">
              <span className={cn('size-2.5 rounded-full', zone.dot)} aria-hidden="true" />
              {zone.label} ({range})
            </li>
          ))}
          {tier >= 5 && <li>En esta división no hay descensos</li>}
        </ul>
      )}

      {loadError ? (
        <Card as="div"><EmptyState icon={RefreshCw} title="No pudimos cargar la tabla" description="Revisá tu conexión y probá de nuevo." action={<Button onClick={() => loadData(true)} loading={refreshing}>Reintentar</Button>} /></Card>
      ) : total === 0 ? (
        <Card as="div"><EmptyState icon={Trophy} title="Sin clasificación" description="Todavía no hay partidos jugados en esta competencia." /></Card>
      ) : (
        <Card as="div" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm" aria-label="Tabla de posiciones">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-fg-subtle">
                <th scope="col" className="eyebrow w-10 py-3 pl-3 text-center sm:w-12">Pos</th>
                <th scope="col" className="eyebrow px-2 py-3">Club</th>
                <th scope="col" className="eyebrow w-9 px-1 py-3 text-center"><abbr title="Partidos jugados" className="no-underline">PJ</abbr></th>
                <th scope="col" className="eyebrow hidden w-9 px-1 py-3 text-center sm:table-cell"><abbr title="Partidos ganados" className="no-underline">PG</abbr></th>
                <th scope="col" className="eyebrow hidden w-9 px-1 py-3 text-center sm:table-cell"><abbr title="Partidos empatados" className="no-underline">PE</abbr></th>
                <th scope="col" className="eyebrow hidden w-9 px-1 py-3 text-center sm:table-cell"><abbr title="Partidos perdidos" className="no-underline">PP</abbr></th>
                <th scope="col" className="eyebrow hidden w-16 px-1 py-3 text-center md:table-cell"><abbr title="Goles a favor y en contra" className="no-underline">GF:GC</abbr></th>
                <th scope="col" className="eyebrow w-11 px-1 py-3 text-center"><abbr title="Diferencia de gol" className="no-underline">DIF</abbr></th>
                <th scope="col" className="eyebrow hidden w-28 px-1 py-3 text-center md:table-cell">Racha</th>
                <th scope="col" className="eyebrow w-11 py-3 pr-3 text-center text-accent"><abbr title="Puntos" className="no-underline">PTS</abbr></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {standings.map((s, idx) => {
                const mine = s.club_id === club.id
                const pos = idx + 1
                const zone = zoneOf(pos, total, tier, rules)
                const diff = goalDiff(s)
                return (
                  <tr key={s.id || idx} aria-current={mine ? 'true' : undefined} className={cn('border-l-4', zone.border, mine && 'bg-accent-soft')}>
                    <td className="num py-2.5 pl-2 text-center font-semibold text-fg-muted">
                      {pos}
                      {zone.label && <span className="sr-only"> · {zone.label}</span>}
                    </td>
                    <td className="max-w-0 px-2 py-2.5">
                      <span className="flex items-center gap-2">
                        <span className={cn('truncate font-medium', mine ? 'font-semibold text-accent' : 'text-fg')}>{s.clubs?.name || s.club_name || 'Club de liga'}</span>
                        {mine && <Badge tone="accent">Vos</Badge>}
                      </span>
                    </td>
                    <td className="num px-1 py-2.5 text-center text-fg-muted">{s.played || 0}</td>
                    <td className="num hidden px-1 py-2.5 text-center text-fg sm:table-cell">{s.won || 0}</td>
                    <td className="num hidden px-1 py-2.5 text-center text-fg-muted sm:table-cell">{s.drawn || 0}</td>
                    <td className="num hidden px-1 py-2.5 text-center text-fg-muted sm:table-cell">{s.lost || 0}</td>
                    <td className="num hidden px-1 py-2.5 text-center text-fg-muted md:table-cell">{s.goals_for || 0}:{s.goals_against || 0}</td>
                    <td className={cn('num px-1 py-2.5 text-center font-semibold', diff > 0 ? 'text-accent' : diff < 0 ? 'text-danger' : 'text-fg-muted')}>{formatDiff(diff)}</td>
                    <td className="hidden px-1 py-2.5 md:table-cell">
                      <span className="flex items-center justify-center gap-1">
                        {parseForm(s.form).map((f, i) => (
                          <span key={i} title={FORM_LABELS[f] || f} className={cn('grid size-5 place-items-center rounded-full text-[10px] font-semibold', FORM_STYLE[f] || FORM_STYLE.D)}>
                            {f}<span className="sr-only"> ({FORM_LABELS[f] || f})</span>
                          </span>
                        ))}
                      </span>
                    </td>
                    <td className="num py-2.5 pr-3 text-center font-display text-lg font-semibold text-accent">{s.points || 0}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </Card>
      )}

      {showAllLeagues && <LeagueDataModal club={club} onClose={() => setShowAllLeagues(false)} />}

      {showPyramid && (
        <LeaguePyramidModal
          club={club}
          currentTier={club?.league_tier || 5}
          onClose={() => setShowPyramid(false)}
        />
      )}
    </div>
  )
}
