import React, { memo, useMemo } from 'react'
import { pitchState } from '../../domain/livePitch'

// La cancha es una tira (105 x 34, achatada a lo alto para que entre en el celular); la pelota se mueve en porcentajes de ese cuadro
const W = 105
const H = 34
const px = (x) => (x / 100) * W
const py = (y) => (y / 100) * H

function Bench({ side, color, cheer }) {
  const x = side === 'home' ? 24 : 70
  return (
    <g data-testid={`bench-${side}`} data-cheer={cheer ? 'true' : 'false'} className={cheer ? 'bench-cheer' : undefined}>
      <rect x={x} y={H - 3.6} width="11" height="1.6" rx="0.8" fill={color} opacity="0.35" />
      {[0, 1, 2].map(i => <circle key={i} cx={x + 2 + i * 3.6} cy={H - 4.9} r="1.2" fill={color} />)}
    </g>
  )
}

/**
 * Cancha en vivo: una tira con la pelota que sigue las jugadas del relato, el cartel de gol, las tarjetas y el banco que festeja.
 * Es decorativa (el relato ya cuenta todo): no se lee en voz alta y es muy liviana (un solo movimiento por jugada).
 */
function LivePitch({ events, minute, matchState, homeColor = '#1F4E9D', awayColor = '#BE2A35' }) {
  const state = useMemo(() => pitchState({ events, minute: matchState === 'finished' ? 90 : minute }), [events, minute, matchState])
  if (matchState !== 'playing' && matchState !== 'finished') return null

  const { goal, card } = state
  const ball = matchState === 'finished' ? { x: 50, y: 50 } : state.ball
  const goalColor = goal ? (goal.team === 'home' ? homeColor : awayColor) : null

  return (
    <div aria-hidden="true" className="shrink-0 overflow-hidden rounded-xl border border-line bg-surface-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block max-h-32 w-full" preserveAspectRatio="xMidYMid meet" focusable="false">
        <rect width={W} height={H} fill="var(--color-surface-2, #e8e0cb)" />
        <g fill="none" stroke="var(--color-line-strong, #B9AB86)" strokeWidth="0.5">
          <rect x="1" y="1" width={W - 2} height={H - 2} />
          <line x1={W / 2} y1="1" x2={W / 2} y2={H - 1} />
          <circle cx={W / 2} cy={H / 2} r="5.5" />
          <rect x="1" y="7" width="14" height="20" />
          <rect x={W - 15} y="7" width="14" height="20" />
          <rect x="1" y="12.5" width="5" height="9" />
          <rect x={W - 6} y="12.5" width="5" height="9" />
        </g>
        <rect x="0" y="13.5" width="1.4" height="7" fill={homeColor} />
        <rect x={W - 1.4} y="13.5" width="1.4" height="7" fill={awayColor} />
        <Bench side="home" color={homeColor} cheer={goal?.team === 'home'} />
        <Bench side="away" color={awayColor} cheer={goal?.team === 'away'} />

        {goal && (
          <g key={`goal-${goal.minute}`} data-testid="goal-flash" className="animate-pop-in" style={{ transformOrigin: `${W / 2}px ${H / 2}px` }}>
            <rect x={W / 2 - 17} y={H / 2 - 7} width="34" height="14" rx="2.5" fill={goalColor} opacity="0.92" />
            <text x={W / 2} y={H / 2 + 3.6} textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#fff" style={{ fontFamily: '"Roboto Slab", Georgia, serif' }}>¡GOL!</text>
          </g>
        )}

        {card && (
          <rect key={`card-${card.minute}`} data-testid="card-flash" data-kind={card.kind} className="animate-pop-in" x={card.team === 'home' ? W / 2 - 14 : W / 2 + 9} y="3" width="4" height="6" rx="0.7" fill={card.kind === 'red' ? '#d62828' : '#f2c230'} style={{ transformOrigin: 'center' }} />
        )}

        <g data-testid="live-ball" data-x={ball.x} data-y={ball.y} className="live-ball" style={{ transform: `translate(${px(ball.x)}px, ${py(ball.y)}px)` }}>
          <circle r="1.7" fill="#fff" stroke="#14213D" strokeWidth="0.5" />
          <circle r="0.55" fill="#14213D" />
        </g>
      </svg>
    </div>
  )
}

export default memo(LivePitch)
