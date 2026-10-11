import { TOUR_STEPS, TOUR_VERSION } from '../../src/features/tutorial/tourSteps'
import { buildJoyrideSteps, targetFor, TOUR_LOCALE } from '../../src/features/tutorial/tour'
import { TOUR_SINCE, tourKey, isNewAccount, tourDone, shouldAutoStart, markTourDone } from '../../src/features/tutorial/tourState'
import { NAV_GROUPS, MOBILE_TABS } from '../../src/components/layout/navigation'
import { GAME_PATHS } from '../../src/data/gameRoutes'

const navItems = NAV_GROUPS.flatMap(g => g.items).map(i => i.to)

describe('guion del tutorial', () => {
  it('explica todas las secciones del menú, cada una con su ruta y al menos dos párrafos', () => {
    const covered = TOUR_STEPS.map(s => s.nav).filter(Boolean)
    for (const to of navItems) expect(covered, to).toContain(to)
    for (const s of TOUR_STEPS) {
      expect(GAME_PATHS, s.id).toContain(s.route)
      expect(s.title.length, s.id).toBeGreaterThan(5)
      expect(s.body.length, s.id).toBeGreaterThanOrEqual(2)
    }
    expect(new Set(TOUR_STEPS.map(s => s.id)).size).toBe(TOUR_STEPS.length)
  })

  it('empieza dando la bienvenida y termina diciendo dónde volver a verlo', () => {
    expect(TOUR_STEPS[0].id).toBe('bienvenida')
    expect(TOUR_STEPS.at(-1).body.join(' ')).toMatch(/Más/)
  })
})

describe('pasos de Joyride', () => {
  const nav = vi.fn()
  const build = (isDesktop, path = '/dashboard') => buildJoyrideSteps(TOUR_STEPS, { isDesktop, navigate: nav, getPathname: () => path })

  it('en escritorio resalta el ítem del menú lateral de cada sección', () => {
    const steps = build(true)
    expect(steps).toHaveLength(TOUR_STEPS.length)
    const tactica = steps.find(s => s.id === 'tactica')
    expect(tactica.target).toBe('[data-tour="nav-/tactics"]')
    expect(tactica.placement).toBe('right')
    expect(steps[0].target).toBe('body')
    expect(steps[0].placement).toBe('center')
  })

  it('en el celular resalta la pestaña inferior si existe, o muestra el aviso centrado', () => {
    expect(targetFor({ nav: '/squad' }, false)).toEqual({ target: '[data-tour="tab-/squad"]', placement: 'top' })
    expect(MOBILE_TABS.map(t => t.to)).toContain('/squad')
    expect(targetFor({ nav: '/finances' }, false)).toEqual({ target: 'body', placement: 'center' })
  })

  it('antes de cada paso abre su pantalla, solo si no está ya ahí', async () => {
    nav.mockClear()
    const steps = build(true, '/dashboard')
    await steps.find(s => s.id === 'inicio').before()
    expect(nav).not.toHaveBeenCalled()
    await steps.find(s => s.id === 'finanzas').before()
    expect(nav).toHaveBeenCalledWith('/finances')
  })

  it('los botones están en español y se puede saltear', () => {
    expect(TOUR_LOCALE.skip).toMatch(/Saltear/)
    expect(TOUR_LOCALE.next).toBe('Siguiente')
    expect(TOUR_LOCALE.last).toBeTruthy()
  })
})

describe('cuándo se muestra el tutorial', () => {
  const fresh = { id: 'u1', created_at: '2026-10-12T10:00:00Z', user_metadata: {} }
  beforeEach(() => window.localStorage.clear())

  it('solo para cuentas nuevas, la primera vez y en el inicio', () => {
    expect(shouldAutoStart(fresh, '/dashboard')).toBe(true)
    expect(shouldAutoStart(fresh, '/squad')).toBe(false)
    expect(shouldAutoStart(null, '/dashboard')).toBe(false)
  })

  it('las cuentas anteriores a la fecha de lanzamiento no lo ven solas', () => {
    expect(isNewAccount('2026-09-01T00:00:00Z')).toBe(false)
    expect(isNewAccount(TOUR_SINCE)).toBe(true)
    expect(shouldAutoStart({ ...fresh, created_at: '2026-09-01T00:00:00Z' }, '/dashboard')).toBe(false)
  })

  it('si ya lo vio (en la cuenta o en este navegador) no vuelve a salir', () => {
    expect(tourDone({ ...fresh, user_metadata: { tour_version: TOUR_VERSION } })).toBe(true)
    window.localStorage.setItem(tourKey('u1'), 'done')
    expect(tourDone(fresh)).toBe(true)
    expect(shouldAutoStart(fresh, '/dashboard')).toBe(false)
  })

  it('al terminar o saltearlo queda anotado en el navegador y en la cuenta, aunque la cuenta falle', async () => {
    const updateUser = vi.fn().mockResolvedValue({})
    await markTourDone(fresh, updateUser)
    expect(window.localStorage.getItem(tourKey('u1'))).toBe('done')
    expect(updateUser).toHaveBeenCalledWith({ data: { tour_version: TOUR_VERSION } })
    window.localStorage.clear()
    await markTourDone(fresh, vi.fn().mockRejectedValue(new Error('sin red')))
    expect(tourDone(fresh)).toBe(true)
  })
})
