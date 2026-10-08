// Partido en vivo: el entretiempo pausa solo, cada decisión rejuega el resto del partido y los gritos tienen enfriamiento
import React from 'react'
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

const mocks = vi.hoisted(() => ({
  replay: vi.fn((results) => results),
  start: vi.fn()
}))

const player = (i, extra = {}) => ({
  id: `p${i}`, first_name: 'Juan', last_name: `Nro${i}`, position: i === 0 ? 'PO' : 'MC', attr_overall: 60 + (i % 5),
  state_fitness: 90, attr_pace: 60, attr_shooting: 60, attr_finishing: 60, attr_passing: 60, attr_defending: 60, ...extra
})

vi.mock('../../src/api/auth', () => ({ authApi: { getSession: vi.fn(async () => ({ id: 'u1' })) } }))
vi.mock('../../src/api/manager', () => ({ managerApi: { getManager: vi.fn(async () => ({ id: 'm1' })) } }))
vi.mock('../../src/api/club', () => ({ clubApi: { getClubByManager: vi.fn(async () => ({ id: 'c1', name: 'Mi Club', manager_id: 'm1', squad_morale: 70 })) } }))
vi.mock('../../src/api/tactics', async (importActual) => ({
  ...(await importActual()),
  tacticsApi: { getTactic: vi.fn(async () => ({ formation: '4-4-2', lineup: Array.from({ length: 11 }, (_, i) => `p${i}`) })) }
}))
vi.mock('../../src/api/player', () => ({ playerApi: { getSquad: vi.fn(async () => Array.from({ length: 16 }, (_, i) => player(i))) } }))
vi.mock('../../src/api/chemistry', () => ({ chemistryApi: { getContext: vi.fn(async () => ({})), withArchetypes: (p) => p } }))
vi.mock('../../src/api/matchEngine', async (importActual) => ({
  ...(await importActual()),
  matchEngineApi: { startMatch: (...a) => mocks.start(...a), replayWithChanges: (...a) => mocks.replay(...a), finalizeMatch: vi.fn(async () => {}) }
}))
vi.mock('../../src/context/GameContext', () => ({ useGameContext: () => ({ confirmAction: vi.fn(async () => true) }) }))

import MatchScreen from '../../src/features/match/MatchScreen'

const results = (events = []) => ({ seed: 's', homeScore: 0, awayScore: 0, events, stats: { possession: { home: 50, away: 50 }, shots: { home: 0, away: 0 }, shotsOnTarget: { home: 0, away: 0 }, fouls: { home: 0, away: 0 }, corners: { home: 0, away: 0 } }, inputs: {} })

const minutes = (n) => { for (let i = 0; i < n; i++) act(() => { vi.advanceTimersByTime(700) }) }
const click = (el) => act(() => { fireEvent.click(el) })

describe('partido en vivo con decisiones', () => {
  beforeEach(() => {
    sessionStorage.clear()
    mocks.replay.mockClear()
    mocks.start.mockReset()
    mocks.start.mockResolvedValue(results())
  })
  afterEach(() => vi.useRealTimers())

  const startMatch = async () => {
    render(<MemoryRouter><MatchScreen /></MemoryRouter>)
    click(await screen.findByRole('button', { name: /Comenzar partido/ }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pausa' })).toBeInTheDocument())
    // El reloj ya programó su primer minuto con el temporizador real: se pausa y reanuda para que lo reprograme con el falso
    vi.useFakeTimers()
    click(screen.getByRole('button', { name: 'Pausa' }))
    click(screen.getByRole('button', { name: 'Reanudar' }))
  }

  it('en el minuto 45 el partido se pausa solo y la charla rejuega el segundo tiempo con el efecto elegido', async () => {
    await startMatch()
    minutes(45)
    expect(screen.getByRole('region', { name: 'Entretiempo' })).toBeInTheDocument()

    click(screen.getByRole('button', { name: /Orden y paciencia/ }))
    expect(mocks.replay).toHaveBeenCalledTimes(1)
    const changes = mocks.replay.mock.calls[0][1]
    expect(changes).toEqual([expect.objectContaining({ minute: 45, team: 'home', duration: 45, buff: expect.objectContaining({ def: 1.10 }) })])
    expect(screen.queryByRole('region', { name: 'Entretiempo' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Pausa' })).toBeInTheDocument() // reanuda solo
  })

  it('un grito rejuega el partido y no se puede repetir hasta pasados 15 minutos', async () => {
    await startMatch()
    minutes(10)
    click(screen.getByRole('button', { name: /¡Todos al ataque!/ }))
    expect(mocks.replay).toHaveBeenCalledTimes(1)
    expect(mocks.replay.mock.calls[0][1][0]).toMatchObject({ minute: 10, team: 'home', buff: { att: 1.2, def: 0.85 }, duration: 15 })
    expect(screen.getByRole('button', { name: /¡Aseguren el resultado!/ })).toBeDisabled()
    minutes(15)
    expect(screen.getByRole('button', { name: /¡Aseguren el resultado!/ })).not.toBeDisabled()
  })

  it('una lesión propia pausa el partido y "Elegí quién entra" abre los cambios con el lesionado marcado', async () => {
    mocks.start.mockResolvedValue(results([{ minute: 5, type: 'INJURY', team: 'home', playerId: 'p3', text: 'Atención médica para Juan Nro3.' }]))
    await startMatch()
    minutes(5)
    expect(screen.getByRole('region', { name: /Se lesionó/ })).toBeInTheDocument()
    click(screen.getByRole('button', { name: /Elegí quién entra/ }))
    // En pantallas chicas se abre sola la hoja del banco con el lesionado marcado para salir
    expect(screen.getByRole('dialog', { name: /Cambios y Pizarra/ })).toBeInTheDocument()
    expect(screen.getAllByText(/Sale/)[0]).toHaveTextContent('Nro3')
    expect(screen.getByText(/Banco de Suplentes/)).toBeInTheDocument()
  })

  it('un penal a favor pausa el partido, deja elegir quién patea y rejuega el resto con esa decisión', async () => {
    mocks.start.mockResolvedValue(results([{ minute: 5, type: 'PENALTY', team: 'home', text: '¡PENAL para el local!' }]))
    await startMatch()
    minutes(5)
    expect(screen.getByRole('region', { name: '¡Penal a favor!' })).toBeInTheDocument()

    const taker = screen.getAllByRole('button').find(b => /Que patee Juan/.test(b.textContent))
    click(taker)
    // Minijuego: apuntar al arco y frenar la barra
    expect(screen.getByRole('region', { name: 'Patear el penal' })).toBeInTheDocument()
    click(screen.getByRole('button', { name: /Apuntar a la izquierda/ }))
    click(screen.getByRole('button', { name: /Patear/ }))
    act(() => { vi.advanceTimersByTime(800) })
    expect(mocks.replay).toHaveBeenCalledTimes(2)
    const change = mocks.replay.mock.calls[0][1][0]
    expect(change).toMatchObject({ minute: 5, team: 'home', kind: 'PENALTY_TAKER' })
    expect(change.playerId).toMatch(/^p\d+$/)
    const aim = mocks.replay.mock.calls[1][1][1]
    expect(aim).toMatchObject({ minute: 5, team: 'home', kind: 'PENALTY_AIM', aim: 'L' })
    expect(aim.quality).toBeGreaterThanOrEqual(0)
    expect(aim.quality).toBeLessThanOrEqual(1)
    expect(screen.queryByRole('region', { name: '¡Penal a favor!' })).toBeNull()
  })

  it('un mano a mano a favor deja elegir cómo definir y lo manda al motor', async () => {
    mocks.start.mockResolvedValue(results([{ minute: 5, type: 'KEYPLAY', team: 'home', text: '¡Mano a mano!' }]))
    await startMatch()
    minutes(5)
    expect(screen.getByRole('region', { name: '¡Mano a mano!' })).toBeInTheDocument()
    click(screen.getByRole('button', { name: /gambetee al arquero/ }))
    expect(mocks.replay.mock.calls[0][1][0]).toMatchObject({ minute: 5, team: 'home', kind: 'KEYPLAY_CHOICE', choice: 'DRIBBLE' })
  })

  it('un mano a mano en contra deja elegir cómo sale el arquero', async () => {
    mocks.start.mockResolvedValue(results([{ minute: 5, type: 'KEYPLAY', team: 'away', text: '¡Mano a mano!' }]))
    await startMatch()
    minutes(5)
    click(screen.getByRole('button', { name: /achique y salga/ }))
    expect(mocks.replay.mock.calls[0][1][0]).toMatchObject({ kind: 'KEYPLAY_CHOICE', choice: 'OUT' })
  })

  it('un penal en contra deja elegir hacia dónde se tira el arquero', async () => {
    mocks.start.mockResolvedValue(results([{ minute: 5, type: 'PENALTY', team: 'away', text: '¡PENAL para la visita!' }]))
    await startMatch()
    minutes(5)
    expect(screen.getByRole('region', { name: 'Penal en contra' })).toBeInTheDocument()
    click(screen.getByRole('button', { name: /Que se tire a la derecha/ }))
    // El arquero se tira en el arco y recién después se aplica la decisión
    act(() => { vi.advanceTimersByTime(700) })
    expect(mocks.replay.mock.calls[0][1][0]).toMatchObject({ minute: 5, team: 'home', kind: 'PENALTY_DIVE', dive: 'R' })
  })

  it('dejarlo a quien corresponde no cambia nada del partido', async () => {
    mocks.start.mockResolvedValue(results([{ minute: 5, type: 'PENALTY', team: 'home', text: '¡PENAL!' }]))
    await startMatch()
    minutes(5)
    click(screen.getByRole('button', { name: /Que patee quien corresponde/ }))
    expect(mocks.replay).not.toHaveBeenCalled()
    expect(screen.queryByRole('region', { name: '¡Penal a favor!' })).toBeNull()
  })
})


