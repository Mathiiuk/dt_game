// Arnés de navegador para la cancha en vivo: monta LivePitch con un partido simulado y deja avanzar el minuto desde afuera.
import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import LivePitch from '../../src/features/match/LivePitch'

const EVENTS = [
  { minute: 6, type: 'SHOT', team: 'home' },
  { minute: 9, type: 'CORNER', team: 'home' },
  { minute: 12, type: 'GOAL', team: 'home' },
  { minute: 31, type: 'COUNTER', team: 'away' },
  { minute: 33, type: 'GOAL', team: 'away' },
  { minute: 52, type: 'CARD_YELLOW', team: 'home' },
  { minute: 61, type: 'PENALTY', team: 'away' },
  { minute: 62, type: 'GOAL', team: 'away' },
  { minute: 75, type: 'CARD_RED', team: 'away' },
  { minute: 88, type: 'GOAL', team: 'home' },
  { minute: 90, type: 'END', team: 'home' }
]

function Harness() {
  const [minute, setMinute] = useState(0)
  const [state, setState] = useState('playing')
  window.__setMatch = (m, s = 'playing') => { setMinute(m); setState(s) }
  return <div style={{ width: 390, padding: 12 }}><LivePitch events={EVENTS.filter(e => e.minute <= minute)} minute={minute} matchState={state} homeColor="#1F4E9D" awayColor="#BE2A35" /></div>
}

createRoot(document.getElementById('root')).render(<Harness />)
