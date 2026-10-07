import React from 'react'
import { BarChart3 } from 'lucide-react'

export default function MatchStats({ stats }) {
  if (!stats) return null
  return (
    <div className="p-4 rounded-xl bg-surface border border-line space-y-4 text-sm shadow-inner">
      <h3 className="font-bold flex items-center gap-2 text-fg-muted uppercase tracking-wider text-xs">
        <BarChart3 className="w-4 h-4" /> Estad�sticas
      </h3>
      <div>
        <div className="flex justify-between text-fg-muted mb-2 font-semibold">
          <span>Posesi�n</span>
          <span>{stats.possession.home}% - {stats.possession.away}%</span>
        </div>
        <div className="w-full h-2.5 bg-surface-3 rounded-full overflow-hidden flex">
          <div className="bg-accent h-full" style={{ width: `${stats.possession.home}%` }} />
          <div className="bg-slate-700 h-full" style={{ width: `${stats.possession.away}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-fg">
        <div className="p-3 rounded-lg bg-bg/50 border border-line">
          <span className="block text-fg-subtle text-xs mb-1">Tiros (al arco)</span>
          <span className="font-bold">{stats.shots.home} ({stats.shotsOnTarget.home}) - {stats.shots.away} ({stats.shotsOnTarget.away})</span>
        </div>
        <div className="p-3 rounded-lg bg-bg/50 border border-line">
          <span className="block text-fg-subtle text-xs mb-1">Faltas</span>
          <span className="font-bold">{stats.fouls.home} - {stats.fouls.away}</span>
        </div>
        <div className="p-3 rounded-lg bg-bg/50 border border-line">
          <span className="block text-fg-subtle text-xs mb-1">C�rners</span>
          <span className="font-bold">{stats.corners.home} - {stats.corners.away}</span>
        </div>
        <div className="p-3 rounded-lg bg-bg/50 border border-line">
          <span className="block text-fg-subtle text-xs mb-1">Amarillas / Rojas</span>
          <span className="font-bold">{stats.yellowCards?.home || 0}/{stats.redCards?.home || 0} - {stats.yellowCards?.away || 0}/{stats.redCards?.away || 0}</span>
        </div>
      </div>
    </div>
  )
}
