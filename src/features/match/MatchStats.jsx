import React, { useState } from 'react'
import { BarChart3, ChevronUp, Crosshair, Flag, Goal, Hand } from 'lucide-react'
import { cn } from '../../lib/utils'

/** Una métrica comparada: valor local a la izquierda, visita a la derecha y una barra partida */
function Row({ icon: Icon, label, home = 0, away = 0, shown }) {
  const total = Number(home) + Number(away)
  const homePct = total > 0 ? (Number(home) / total) * 100 : 50
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="num w-12 text-left font-mono text-sm font-bold text-fg">{shown ? shown[0] : home}</span>
        <span className="flex items-center gap-1.5 text-fg-subtle">{Icon && <Icon className="size-3.5" aria-hidden="true" />}{label}</span>
        <span className="num w-12 text-right font-mono text-sm font-bold text-fg">{shown ? shown[1] : away}</span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
        <div className="bg-accent transition-all duration-300" style={{ width: `${homePct}%` }} />
        <div className="bg-fg-subtle/60 transition-all duration-300" style={{ width: `${100 - homePct}%` }} />
      </div>
    </div>
  )
}

/**
 * Estadísticas del partido pegadas abajo: cerradas sólo muestran la posesión; al tocar se despliegan hacia arriba
 * con el resto de los datos (y el relato se achica); al cerrar todo vuelve a como estaba.
 */
export default function MatchStats({ stats, homeName = 'Local', awayName = 'Visita' }) {
  const [open, setOpen] = useState(false)
  if (!stats) return null

  const homePoss = stats.possession?.home ?? 50
  const awayPoss = stats.possession?.away ?? 50
  const cards = (side) => `${stats.yellowCards?.[side] ?? 0} / ${stats.redCards?.[side] ?? 0}`

  return (
    <section aria-label="Estadísticas del partido" className="shrink-0 overflow-hidden rounded-xl border border-line bg-surface">
      {/* Los datos extra se abren hacia arriba: el bloque está anclado abajo, así que crece sobre la barra de posesión */}
      <div className={cn('grid transition-[grid-template-rows] duration-300 ease-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="min-h-0 overflow-hidden">
          <div id="stats-detail" className="space-y-3 border-b border-line p-3" aria-hidden={!open}>
            <p className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider">
              <span className="max-w-[40%] truncate text-fg-muted">{homeName}</span>
              <span className="max-w-[40%] truncate text-fg-muted">{awayName}</span>
            </p>
            <Row icon={Crosshair} label="Tiros" home={stats.shots?.home ?? 0} away={stats.shots?.away ?? 0} />
            <Row icon={Goal} label="Al arco" home={stats.shotsOnTarget?.home ?? 0} away={stats.shotsOnTarget?.away ?? 0} />
            <Row icon={Flag} label="Córners" home={stats.corners?.home ?? 0} away={stats.corners?.away ?? 0} />
            <Row icon={Hand} label="Faltas" home={stats.fouls?.home ?? 0} away={stats.fouls?.away ?? 0} />
            <Row
              label="Amarillas / rojas"
              home={(stats.yellowCards?.home ?? 0) + (stats.redCards?.home ?? 0)}
              away={(stats.yellowCards?.away ?? 0) + (stats.redCards?.away ?? 0)}
              shown={[cards('home'), cards('away')]}
            />
          </div>
        </div>
      </div>

      {/* Barra de posesión: siempre a la vista; tocarla abre o cierra el detalle */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls="stats-detail"
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
      >
        <BarChart3 className="size-4 shrink-0 text-accent" aria-hidden="true" />
        <span className="num w-10 shrink-0 font-mono text-sm font-bold text-fg">{homePoss}%</span>
        <span className="flex h-2.5 min-w-0 flex-1 overflow-hidden rounded-full border border-line/40 bg-surface-3" role="img" aria-label={`Posesión: ${homePoss}% a ${awayPoss}%`}>
          <span className="bg-accent transition-all duration-300" style={{ width: `${homePoss}%` }} />
          <span className="bg-fg-subtle/60 transition-all duration-300" style={{ width: `${awayPoss}%` }} />
        </span>
        <span className="num w-10 shrink-0 text-right font-mono text-sm font-bold text-fg">{awayPoss}%</span>
        <ChevronUp className={cn('size-4 shrink-0 text-fg-subtle transition-transform duration-300', !open && 'rotate-180')} aria-hidden="true" />
        <span className="sr-only">{open ? 'Ocultar estadísticas' : 'Ver más estadísticas'}</span>
      </button>
    </section>
  )
}
