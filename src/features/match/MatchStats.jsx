import React from 'react'
import { BarChart3 } from 'lucide-react'

export default function MatchStats({ stats, homeName = 'Local', awayName = 'Visita' }) {
  if (!stats) return null

  const homePoss = stats.possession?.home ?? 50
  const awayPoss = stats.possession?.away ?? 50

  return (
    <div className="p-4 rounded-xl bg-surface border border-line space-y-4 text-sm shadow-inner">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2 text-fg-muted uppercase tracking-wider text-xs">
          <BarChart3 className="w-4 h-4 text-accent" /> Estadísticas del Partido
        </h3>
        <span className="text-[11px] text-fg-subtle truncate max-w-[150px]">
          {homeName} vs {awayName}
        </span>
      </div>

      {/* Posesión */}
      <div>
        <div className="flex justify-between text-xs text-fg-muted mb-1.5 font-semibold">
          <span>Posesión: {homePoss}%</span>
          <span>{awayPoss}%</span>
        </div>
        <div className="w-full h-2.5 bg-surface-3 rounded-full overflow-hidden flex border border-line/40">
          <div className="bg-accent h-full transition-all duration-300" style={{ width: `${homePoss}%` }} />
          <div className="bg-zinc-700 h-full transition-all duration-300" style={{ width: `${awayPoss}%` }} />
        </div>
      </div>

      {/* Rejilla de métricas clave */}
      <div className="grid grid-cols-2 gap-2.5 text-fg text-xs">
        <div className="p-2.5 rounded-lg bg-bg/60 border border-line flex flex-col justify-between">
          <span className="text-fg-subtle block mb-1">Tiros (al arco)</span>
          <span className="font-mono font-bold text-sm">
            {stats.shots?.home ?? 0} ({stats.shotsOnTarget?.home ?? 0}) - {stats.shots?.away ?? 0} ({stats.shotsOnTarget?.away ?? 0})
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-bg/60 border border-line flex flex-col justify-between">
          <span className="text-fg-subtle block mb-1">Faltas cometidas</span>
          <span className="font-mono font-bold text-sm">
            {stats.fouls?.home ?? 0} - {stats.fouls?.away ?? 0}
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-bg/60 border border-line flex flex-col justify-between">
          <span className="text-fg-subtle block mb-1">Córners</span>
          <span className="font-mono font-bold text-sm">
            {stats.corners?.home ?? 0} - {stats.corners?.away ?? 0}
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-bg/60 border border-line flex flex-col justify-between">
          <span className="text-fg-subtle block mb-1">Amarillas / Rojas</span>
          <span className="font-mono font-bold text-sm">
            {stats.yellowCards?.home ?? 0}/{stats.redCards?.home ?? 0} - {stats.yellowCards?.away ?? 0}/{stats.redCards?.away ?? 0}
          </span>
        </div>
      </div>
    </div>
  )
}
