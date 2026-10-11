import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../src/features/home/useVisitorState', () => ({ useVisitorState: () => 'visitor' }))

import DemoScreen from '../../src/features/demo/DemoScreen'
import { DEMO_DECISIONS } from '../../src/domain/demo'

beforeEach(() => {
  window.dataLayer = []
  window.scrollTo = () => {}
  // Con "menos movimiento" el relato aparece completo y el penal no espera
  window.matchMedia = (query) => ({ matches: query.includes('reduce'), media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
})

const renderIt = () => render(<MemoryRouter initialEntries={['/demo']}><DemoScreen /></MemoryRouter>)
const events = () => window.dataLayer.map(d => d.event)

describe('demo bizarra', () => {
  it('arranca con una portada que dice que no pide cuenta', () => {
    renderIt()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByText(/no hace falta cuenta/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /empezar la demo/i })).toBeInTheDocument()
    expect(document.head.querySelector('link[rel="canonical"]').getAttribute('href')).toMatch(/\/demo$/)
  })

  it('se juega de punta a punta: 3 decisiones, partido, penal y titulares, con CTA a crear la carrera', async () => {
    renderIt()
    await userEvent.click(screen.getByRole('button', { name: /empezar la demo/i }))
    for (let i = 0; i < DEMO_DECISIONS.length; i++) {
      expect(screen.getByText(DEMO_DECISIONS[i].title)).toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: DEMO_DECISIONS[i].options[0].label }))
      expect(screen.getByRole('status').textContent).toContain(DEMO_DECISIONS[i].options[0].reaction)
      await userEvent.click(screen.getByRole('button', { name: i < 2 ? /siguiente/i : /ir al partido/i }))
    }
    expect(screen.getByRole('list', { name: /medidores/i })).toBeInTheDocument()
    expect(await screen.findByText(/arranca el partido/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /llega el penal/i }))
    await userEvent.click(screen.getByRole('button', { name: /patear/i }))
    expect(await screen.findByText(/los diarios de mañana/i)).toBeInTheDocument()
    const cta = within(screen.getByRole('main')).getByRole('link', { name: /crear mi carrera/i })
    expect(cta).toHaveAttribute('href', '/registro')
    await userEvent.click(cta)
    expect(events()).toEqual(expect.arrayContaining(['demo_start', 'demo_decision', 'demo_complete', 'demo_cta_click']))
    expect(events().filter(e => e === 'demo_decision')).toHaveLength(3)
    expect(within(screen.getByRole('main')).getAllByRole('listitem').length).toBeGreaterThan(3)
  })

  it('se puede volver a jugar desde cero', async () => {
    renderIt()
    await userEvent.click(screen.getByRole('button', { name: /empezar la demo/i }))
    await userEvent.click(screen.getByRole('button', { name: DEMO_DECISIONS[0].options[0].label }))
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    await userEvent.click(screen.getByRole('button', { name: DEMO_DECISIONS[1].options[0].label }))
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    await userEvent.click(screen.getByRole('button', { name: DEMO_DECISIONS[2].options[0].label }))
    await userEvent.click(screen.getByRole('button', { name: /ir al partido/i }))
    await userEvent.click(await screen.findByRole('button', { name: /llega el penal/i }))
    await userEvent.click(screen.getByRole('button', { name: /patear/i }))
    await userEvent.click(await screen.findByRole('button', { name: /jugar otra vez/i }))
    expect(screen.getByRole('button', { name: /empezar la demo/i })).toBeInTheDocument()
  })
})
