import React from 'react'
import { ArrowLeft, Clock, Activity, Timer } from 'lucide-react'

export default function MatchHeader({ 
  isHome, 
  clubName, 
  opponentName, 
  score, 
  minute, 
  matchState,
  onBack
}) {
  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-line shadow-sm pb-4 pt-4 px-4 sm:px-6 mb-4 lg:mb-6 rounded-b-2xl">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-fg-muted hover:text-fg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-semibold uppercase tracking-wider hidden sm:inline">Atr�s</span>
        </button>
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-2 border border-line">
            {matchState === 'pre-match' ? <Clock className="w-4 h-4 text-fg-subtle" /> : <Timer className="w-4 h-4 text-accent" />}
            <span className="text-sm font-mono font-bold text-fg-muted">
              {matchState === 'pre-match' ? 'Vestuarios' : matchState === 'ended' ? 'Final' : `${minute}'`}
            </span>
          </div>
        </div>
        <div className="w-8 sm:w-16"></div> {/* Spacer */}
      </div>

      <div className="flex items-center justify-center gap-4 sm:gap-8 mt-2">
        <div className="text-right flex-1 min-w-0">
          <h2 className="text-base sm:text-2xl font-black truncate text-fg">
            {isHome ? clubName : opponentName}
          </h2>
        </div>
        
        <div className="flex items-center justify-center bg-surface-3 border border-line rounded-2xl px-4 py-2 shadow-inner">
          <span className="text-3xl sm:text-5xl font-mono font-black text-fg tracking-tighter">
            {isHome ? score.home : score.away}
          </span>
          <span className="mx-2 sm:mx-3 text-fg-subtle font-black text-xl">-</span>
          <span className="text-3xl sm:text-5xl font-mono font-black text-fg tracking-tighter">
            {isHome ? score.away : score.home}
          </span>
        </div>

        <div className="text-left flex-1 min-w-0">
          <h2 className="text-base sm:text-2xl font-black truncate text-fg">
            {!isHome ? clubName : opponentName}
          </h2>
        </div>
      </div>
    </header>
  )
}
