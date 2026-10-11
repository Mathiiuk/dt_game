import React from 'react'
import { ResponsiveOverlay } from '../../components/ui'
import { matchStory } from '../../domain/friendStory'

/** Relato del partido: planteos, goles con su minuto y un titular del día siguiente */
export default function MatchStory({ fixture, names, onClose }) {
  if (!fixture) return null
  const story = matchStory(fixture, { home: names[fixture.home_slot], away: names[fixture.away_slot] })
  return (
    <ResponsiveOverlay title={story.headline || 'Partido'} description="El relato del partido" onClose={onClose} size="sm">
      <ol className="space-y-2 text-sm text-fg-muted">
        {story.lines.map((line, i) => <li key={i} className={i === story.lines.length - 1 ? 'font-semibold text-fg' : ''}>{line}</li>)}
      </ol>
    </ResponsiveOverlay>
  )
}
