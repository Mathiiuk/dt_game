import React from 'react'

/** Un partido de la sala: toca para abrir el relato cuando ya se jugó */
export default function FixtureRow({ fixture: f, names, onOpen }) {
  const played = f.home_goals != null
  const pens = f.pens_home != null ? ` (${f.pens_home}-${f.pens_away})` : ''
  const mid = played ? `${f.home_goals} - ${f.away_goals}${pens}` : 'vs'
  const side = (slot) => (f.winner_slot === slot ? 'font-semibold text-fg' : 'text-fg-muted')
  const content = (
    <>
      <span className={`min-w-0 flex-1 truncate text-right ${side(f.home_slot)}`}>{names[f.home_slot]}</span>
      <span className="num w-16 shrink-0 text-center font-semibold text-fg">{mid}</span>
      <span className={`min-w-0 flex-1 truncate ${side(f.away_slot)}`}>{names[f.away_slot]}</span>
    </>
  )
  if (!played || !onOpen) return <li className="flex items-center justify-between gap-2 py-0.5 text-sm">{content}</li>
  return (
    <li>
      <button type="button" onClick={() => onOpen(f)} aria-label={`Ver el relato: ${names[f.home_slot]} ${mid} ${names[f.away_slot]}`}
        className="flex w-full items-center justify-between gap-2 rounded-md py-1 text-sm transition-colors hover:bg-surface-2 active:bg-surface-3">
        {content}
      </button>
    </li>
  )
}
