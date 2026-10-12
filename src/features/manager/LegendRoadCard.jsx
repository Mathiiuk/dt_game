import React, { useEffect, useState } from 'react'
import { Trophy, Check } from 'lucide-react'
import { legendRoadApi } from '../../api/legendRoad'
import { buildRoad } from '../../domain/legendRoad'
import { Card, CardBody, Kicker } from '../../components/ui'
import ShareMomentButton from '../../components/ShareMomentButton'
import { useGameContext } from '../../context/GameContext'
import { cn } from '../../lib/utils'

const fmt = (n) => new Intl.NumberFormat('es-AR').format(n)

/**
 * Camino a la leyenda: tus puntos de legado frente a los DT argentinos más ganadores de la historia (los de la tabla pública).
 * Si no se puede cargar, no se muestra nada: la pantalla de la carrera no depende de esto.
 */
export default function LegendRoadCard() {
  const [road, setRoad] = useState(null)
  const club = useGameContext()?.club

  useEffect(() => {
    let alive = true
    legendRoadApi.get()
      .then(data => { if (alive) setRoad(buildRoad(data || {})) })
      .catch(() => { if (alive) setRoad(null) })
    return () => { alive = false }
  }, [])

  if (!road) return null
  return (
    <Card masthead as="section" aria-label="Camino a la leyenda">
      <CardBody className="space-y-3 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Kicker>Camino a la leyenda</Kicker>
            <p className="font-slab text-base font-bold leading-snug text-fg">
              {road.next
                ? `Te faltan ${fmt(road.next.remaining)} puntos para alcanzar a ${road.next.name}`
                : '¡Superaste a todas las leyendas!'}
            </p>
          </div>
          <div className="text-right">
            <p className="num font-display text-3xl font-bold leading-none text-fg">{fmt(road.points)}</p>
            <p className="eyebrow">Tus puntos</p>
          </div>
        </div>
        <ul aria-label="Leyendas" className="divide-y divide-line border-y border-line">
          {road.rows.map(r => (
            <li key={r.name} className="space-y-1 py-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-fg">
                  {r.beaten ? <Check className="size-4 text-accent" aria-hidden="true" /> : <Trophy className="size-4 text-gold" aria-hidden="true" />}
                  {r.name}
                </span>
                <span className="num text-xs text-fg-muted">{fmt(r.points)} pts · {r.titles} títulos{r.beaten ? ' · superada' : ''}</span>
              </div>
              <div
                role="progressbar"
                aria-label={`Avance hacia ${r.name}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(r.progress * 100)}
                className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
              >
                <div className={cn('h-full rounded-full', r.beaten ? 'bg-accent' : 'bg-gold')} style={{ width: `${Math.round(r.progress * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
        {road.passed > 0 && (() => {
          const top = road.rows.find(r => r.beaten)
          return <ShareMomentButton label="Compartir que superé a una leyenda" moment={{ kind: 'legend', club: club?.name, legend: top.name, points: road.points }} />
        })()}
        <p className="text-xs text-fg-muted">Son los DT argentinos más ganadores de la historia: 600 puntos por título. Sumá títulos, victorias y reputación para pasarlos.</p>
      </CardBody>
    </Card>
  )
}
