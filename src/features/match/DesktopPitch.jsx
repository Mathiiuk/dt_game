import React, { memo, useMemo, useRef } from 'react'
import { pitchState, dotsFor } from '../../domain/livePitch'

// Cancha con la proporción real (105 x 68); el local ataca hacia la derecha
const W = 105
const H = 68
const px = (x) => (x / 100) * W
const py = (y) => (y / 100) * H

/**
 * Cancha grande de escritorio: los 22 jugadores se acomodan según su formación y suben o bajan con la pelota, que deja una estela corta.
 * Es decorativa (el relato ya cuenta todo) y muy liviana: solo se mueve con transiciones de CSS, un cambio por jugada.
 */
function DesktopPitch({ events, minute, matchState, homeColor = '#1F4E9D', awayColor = '#BE2A35', homeLayout, awayLayout }) {
  const state = useMemo(() => pitchState({ events, minute: matchState === 'finished' ? 90 : minute }), [events, minute, matchState])
  const trail = useRef([])
  const ball = matchState === 'finished' ? { x: 50, y: 50 } : state.ball
  const last = trail.current[trail.current.length - 1]
  if (!last || last.x !== ball.x || last.y !== ball.y) trail.current = [...trail.current, ball].slice(-4)

  const home = useMemo(() => dotsFor({ layout: homeLayout, side: 'home', ball }), [homeLayout, ball.x]) // eslint-disable-line react-hooks/exhaustive-deps -- solo importa el corrimiento horizontal
  const away = useMemo(() => dotsFor({ layout: awayLayout, side: 'away', ball }), [awayLayout, ball.x]) // eslint-disable-line react-hooks/exhaustive-deps

  if (matchState !== 'playing' && matchState !== 'finished') return null
  const { goal, card } = state
  const goalColor = goal ? (goal.team === 'home' ? homeColor : awayColor) : null
  const line = 'var(--color-pitch-line, #ffffffcc)'

  return (
    <div aria-hidden="true" className="shrink-0 overflow-hidden rounded-xl border border-line bg-[var(--color-pitch,#3f8f4f)] shadow-sm">
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto max-h-[calc(100dvh-24rem)] w-full" preserveAspectRatio="xMidYMid meet" focusable="false">
        <defs>
          <pattern id="mow-live" width="10.5" height={H} patternUnits="userSpaceOnUse">
            <rect width="5.25" height={H} fill="var(--color-pitch, #3f8f4f)" />
            <rect x="5.25" width="5.25" height={H} fill="var(--color-pitch-2, #489a58)" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#mow-live)" />
        <g fill="none" stroke={line} strokeWidth="0.35">
          <rect x="1.5" y="1.5" width={W - 3} height={H - 3} />
          <line x1={W / 2} y1="1.5" x2={W / 2} y2={H - 1.5} />
          <circle cx={W / 2} cy={H / 2} r="9" />
          <rect x="1.5" y="13.8" width="16.5" height="40.3" />
          <rect x={W - 18} y="13.8" width="16.5" height="40.3" />
          <rect x="1.5" y="24.8" width="5.5" height="18.3" />
          <rect x={W - 7} y="24.8" width="5.5" height="18.3" />
        </g>
        <rect x="0" y="29.5" width="1.5" height="9" fill={homeColor} />
        <rect x={W - 1.5} y="29.5" width="1.5" height="9" fill={awayColor} />

        {[['home', home, homeColor], ['away', away, awayColor]].map(([side, dots, color]) => dots.map(d => (
          <circle key={`${side}-${d.slot}`} data-testid={`pitch-dot-${side}`} r="1.35" cx="0" cy="0" fill={color} stroke="#fff" strokeWidth="0.35" className="pitch-dot" style={{ transform: `translate(${px(d.x)}px, ${py(d.y)}px)` }} />
        )))}

        {trail.current.slice(0, -1).map((t, i, arr) => (
          <circle key={`${t.x}-${t.y}-${i}`} r={0.5 + i * 0.12} cx={px(t.x)} cy={py(t.y)} fill="#fff" opacity={0.15 + (i / arr.length) * 0.35} />
        ))}

        {goal && (
          <g key={`goal-${goal.minute}`} data-testid="goal-flash" className="animate-pop-in" style={{ transformOrigin: `${W / 2}px ${H / 2}px` }}>
            <rect x={W / 2 - 20} y={H / 2 - 8} width="40" height="16" rx="3" fill={goalColor} opacity="0.94" />
            <text x={W / 2} y={H / 2 + 4.2} textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" style={{ fontFamily: '"Roboto Slab", Georgia, serif' }}>¡GOL!</text>
          </g>
        )}

        {card && (
          <rect key={`card-${card.minute}`} data-testid="card-flash" data-kind={card.kind} className="animate-pop-in" x={card.team === 'home' ? W / 2 - 16 : W / 2 + 11} y="4" width="4.5" height="6.5" rx="0.8" fill={card.kind === 'red' ? '#d62828' : '#f2c230'} />
        )}

        <g data-testid="live-ball" data-x={ball.x} data-y={ball.y} className="live-ball" style={{ transform: `translate(${px(ball.x)}px, ${py(ball.y)}px)` }}>
          <circle r="1.1" fill="#fff" stroke="#14213D" strokeWidth="0.3" />
          <circle r="0.35" fill="#14213D" />
        </g>
      </svg>
    </div>
  )
}

export default memo(DesktopPitch)
