import React from 'react'
import { ArrowLeft, Clock, Timer } from 'lucide-react'
import { ClubBadge } from '../../components/ui'

export default function MatchHeader({ 
  isHome, 
  clubName, 
  opponentName, 
  homeClub,
  awayClub,
  score, 
  minute, 
  matchState,
  onBack
}) {
  const homeName = isHome ? clubName : opponentName
  const awayName = !isHome ? clubName : opponentName
  const homeData = isHome ? homeClub : awayClub
  const awayData = !isHome ? homeClub : awayClub

  return (
    <header className="shrink-0 border-b border-line bg-surface pb-3 pt-3 px-4 sm:px-6 mb-3 lg:mb-4 rounded-b-2xl">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-fg-muted hover:text-fg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-semibold uppercase tracking-wider hidden sm:inline">Atrás</span>
        </button>
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-2 border border-line">
            {matchState === 'pre-match' ? <Clock className="w-4 h-4 text-fg-subtle" /> : <Timer className="w-4 h-4 text-accent" />}
            <span className="text-sm font-mono font-bold text-fg-muted">
              {matchState === 'pre-match' ? 'Vestuarios' : matchState === 'finished' ? 'Final' : `${minute}'`}
            </span>
          </div>
        </div>
        <div className="w-8 sm:w-16" /> {/* Spacer */}
      </div>

      <div className="flex items-center justify-center gap-3 sm:gap-6 mt-2">
        {/* Local */}
        <div className="flex items-center justify-end gap-3 flex-1 min-w-0">
          <h2 className="text-sm sm:text-xl font-black truncate text-fg text-right">
            {homeName}
          </h2>
          <ClubBadge club={homeData} name={homeName} size="sm" />
        </div>
        
        {/* Marcador */}
        <div className="flex items-center justify-center bg-surface-3 border border-line rounded-2xl px-3 sm:px-4 py-1.5 shadow-inner shrink-0">
          <span className="text-2xl sm:text-4xl font-mono font-black text-fg tracking-tighter">
            {score.home}
          </span>
          <span className="mx-2 sm:mx-3 text-fg-subtle font-black text-lg sm:text-xl">-</span>
          <span className="text-2xl sm:text-4xl font-mono font-black text-fg tracking-tighter">
            {score.away}
          </span>
        </div>

        {/* Visita */}
        <div className="flex items-center justify-start gap-3 flex-1 min-w-0">
          <ClubBadge club={awayData} name={awayName} size="sm" />
          <h2 className="text-sm sm:text-xl font-black truncate text-fg text-left">
            {awayName}
          </h2>
        </div>
      </div>
    </header>
  )
}
