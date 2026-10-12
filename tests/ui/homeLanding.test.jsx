import React from 'react'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

let visitor = 'visitor'
vi.mock('../../src/features/home/useVisitorState', () => ({ useVisitorState: () => visitor }))

import HomeLanding from '../../src/features/home/HomeLanding'
import InfoPage from '../../src/features/home/InfoPage'
import ManagerQuoteFlash from '../../src/features/home/ManagerQuoteFlash'
import { PUBLIC_PAGES, FOOTER_GROUPS } from '../../src/data/publicPages'
import { HOME_COPY, HOME_SEO } from '../../src/seo/homeSeo'
import { QUOTE_TIMING } from '../../src/features/home/quoteCycle'

const renderHome = () => render(<MemoryRouter><HomeLanding /></MemoryRouter>)
const href = (name, scope = screen) => scope.getByRole('link', { name }).getAttribute('href')

const quote = (id, text, extra = {}) => ({ id, text, verified: true, approvedForProduction: true, type: 'original', ...extra })
const setReducedMotion = (matches) => {
  window.matchMedia = (query) => ({ matches: matches && query.includes('reduce'), media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
}

beforeEach(() => { visitor = 'visitor'; window.dataLayer = []; window.scrollTo = () => {}; setReducedMotion(false) })

const BADGE_HREF = 'https://argentino.dev/proyecto/vestuario?utm_source=argentino.dev&utm_medium=badge&utm_campaign=insignia'

describe('portada pública', () => {
  it('"Vos sos el DT." es el único H1 y el contexto de fútbol está a la vista', () => {
    renderHome()
    const h1 = screen.getAllByRole('heading', { level: 1 })
    expect(h1).toHaveLength(1)
    expect(h1[0]).toHaveTextContent('Vos sos el DT.')
    expect(screen.getByText(HOME_COPY.subheadline)).toBeVisible()
    expect(screen.getByText(HOME_COPY.context)).toBeVisible()
  })

  it('encabezado: la marca lleva al inicio, y hay acceso para entrar y para crear la carrera', () => {
    renderHome()
    const header = within(screen.getByRole('banner'))
    expect(href(/Vestuario, ir al inicio/, header)).toBe('/')
    expect(href('Iniciar sesión', header)).toBe('/login')
    expect(href('Crear mi carrera', header)).toBe('/registro')
  })

  it('llamados a la acción: crear la carrera va al registro y conocer el juego a su página', () => {
    renderHome()
    const main = within(screen.getByRole('main'))
    expect(href('Crear mi carrera', main)).toBe('/registro')
    expect(href('Conocer el juego', main)).toBe('/juego')
  })

  it('un solo botón principal: la demo sin registro; crear la carrera queda como secundario', () => {
    renderHome()
    const main = within(screen.getByRole('main'))
    expect(href('Probar la demo gratis', main)).toBe('/demo')
    const demo = main.getByRole('link', { name: 'Probar la demo gratis' })
    const create = main.getByRole('link', { name: 'Crear mi carrera' })
    expect(demo.className).toMatch(/bg-primary/)
    expect(create.className).not.toMatch(/(^|\s)bg-primary(\s|$)/)
    expect(main.getAllByRole('link').filter(a => /bg-primary(\s|$)/.test(a.className))).toHaveLength(1)
  })

  it('es una primera plana: mástil con la marca, "El diario del DT" y la fecha solo del lado del cliente', () => {
    renderHome()
    const header = within(screen.getByRole('banner'))
    expect(header.getByText(/El diario del DT/)).toBeInTheDocument()
    expect(header.getByRole('link', { name: /Vestuario, ir al inicio/ }).className).toMatch(/font-slab/)
  })

  it('"El pensamiento del día" es la frase rotativa del DT, dentro de un recuadro con nombre', () => {
    renderHome()
    const box = screen.getByRole('complementary', { name: 'El pensamiento del día' })
    expect(within(box).getByRole('figure')).toBeInTheDocument()
  })

  it('"En esta edición" lleva a tres páginas públicas y solo aparece en pantallas anchas', () => {
    renderHome()
    const column = screen.getByRole('complementary', { name: 'En esta edición' })
    expect(column.className).toMatch(/hidden/)
    expect(column.className).toMatch(/lg:block/)
    const links = within(column).getAllByRole('link')
    expect(links.map(a => a.getAttribute('href'))).toEqual(['/tacticas', '/mercado-de-pases', '/guias/liga-con-amigos'])
    for (const a of links) expect(PUBLIC_PAGES.map(p => p.path)).toContain(a.getAttribute('href'))
    expect(links.some(a => /(^|\s)bg-primary(\s|$)/.test(a.className))).toBe(false)
  })

  it('el pie enlaza a las páginas esenciales con anclas descriptivas, sin enlaces rotos', () => {
    renderHome()
    const footer = within(screen.getByRole('contentinfo'))
    // Único enlace externo del pie: la insignia "Hecho en Argentina" (argentino.dev); el resto, páginas propias
    const links = footer.getAllByRole('link').filter(a => a.getAttribute('href') !== BADGE_HREF)
    expect(footer.getAllByRole('link').filter(a => a.getAttribute('href') === BADGE_HREF)).toHaveLength(1)
    expect(links.map(a => a.getAttribute('href')).sort()).toEqual(FOOTER_GROUPS.flatMap(g => g.links.map(l => l.path)).sort())
    for (const a of links) expect(PUBLIC_PAGES.map(p => p.path)).toContain(a.getAttribute('href'))
    for (const a of links) expect(a.textContent).not.toMatch(/click|clic|acá|aquí/i)
    expect(FOOTER_GROUPS.map(g => g.label)).toEqual(['Juego', 'Guías', 'Soporte', 'Legal'])
    expect(href('Privacidad', footer)).toBe('/privacidad')
    expect(href('Términos', footer)).toBe('/terminos')
    expect(footer.getByText('© 2026 Vestuario')).toBeInTheDocument()
  })

  it('no hay elementos clickeables que no sean enlaces o botones reales', () => {
    const { container } = renderHome()
    expect(container.querySelectorAll('div[onclick], span[onclick], [role="button"]:not(button)')).toHaveLength(0)
  })

  it('con sesión y sin carrera, el llamado sigue siendo crear la carrera pero va al asistente', () => {
    visitor = 'no-career'
    renderHome()
    expect(href('Crear mi carrera', within(screen.getByRole('main')))).toBe('/create-manager')
    expect(screen.queryByRole('link', { name: 'Iniciar sesión' })).not.toBeInTheDocument()
  })

  it('con carrera activa, el llamado principal es continuar la carrera', () => {
    visitor = 'career'
    renderHome()
    expect(href('Continuar carrera', within(screen.getByRole('main')))).toBe('/dashboard')
    expect(href('Continuar', within(screen.getByRole('banner')))).toBe('/dashboard')
  })

  it('pone el título y los metadatos de la portada y registra la visita sin datos personales', () => {
    renderHome()
    expect(document.title).toBe(HOME_SEO.title)
    expect(document.head.querySelector('link[rel="canonical"]').getAttribute('href')).toBe('https://www.vestuario.com.ar/')
    expect(document.head.querySelector('meta[name="robots"]').getAttribute('content')).toBe('index,follow')
    expect(window.dataLayer).toEqual([{ event: 'landing_view', path: '/' }])
  })

  it('los clics de la portada se registran como eventos', async () => {
    renderHome()
    await userEvent.click(screen.getByRole('link', { name: 'Conocer el juego' }))
    await userEvent.click(screen.getByRole('link', { name: 'Iniciar sesión' }))
    expect(window.dataLayer.map(e => e.event)).toEqual(['landing_view', 'game_info_click', 'login_click'])
  })
})

describe('flash de frases', () => {
  afterEach(() => { vi.useRealTimers() })

  const quotes = [quote('a', 'Primera frase.', { type: 'historical', manager: 'DT Uno', sourceUrl: 'https://medio.com/a', sourceName: 'Medio' }), quote('b', 'Segunda frase.')]

  it('aparece, se va y entra otra distinta', () => {
    vi.useFakeTimers()
    render(<ManagerQuoteFlash quotes={quotes} />)
    const figure = () => screen.getByRole('figure')
    expect(figure()).toHaveAttribute('data-phase', 'idle')
    act(() => { vi.advanceTimersByTime(100) })
    expect(figure()).toHaveAttribute('data-phase', 'enter')
    expect(screen.getByText('“Primera frase.”')).toBeInTheDocument()
    expect(screen.getByText('— DT Uno')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(QUOTE_TIMING.enter) })
    expect(figure()).toHaveAttribute('data-phase', 'visible')
    act(() => { vi.advanceTimersByTime(QUOTE_TIMING.visibleMax) })
    expect(figure()).toHaveAttribute('data-phase', 'exit')
    act(() => { vi.advanceTimersByTime(QUOTE_TIMING.exit) })
    act(() => { vi.advanceTimersByTime(QUOTE_TIMING.wait) })
    expect(figure()).toHaveAttribute('data-phase', 'enter')
    expect(screen.getByText('“Segunda frase.”')).toBeInTheDocument()
    // La frase propia no lleva autor
    expect(screen.queryByText(/^—/)).not.toBeInTheDocument()
  })

  it('no muestra frases sin verificar ni sin aprobar', () => {
    vi.useFakeTimers()
    render(<ManagerQuoteFlash quotes={[quote('x', 'Dudosa.', { verified: false }), quote('y', 'Confirmada.')]} />)
    act(() => { vi.advanceTimersByTime(20000) })
    expect(screen.getByText('“Confirmada.”')).toBeInTheDocument()
    expect(screen.queryByText('“Dudosa.”')).not.toBeInTheDocument()
  })

  it('si el dataset queda vacío usa la frase de respaldo', () => {
    render(<ManagerQuoteFlash quotes={[]} />)
    expect(screen.getByText('“Las decisiones también juegan.”')).toBeInTheDocument()
  })

  it('con movimiento reducido la frase queda fija y no rota', () => {
    setReducedMotion(true)
    vi.useFakeTimers()
    render(<ManagerQuoteFlash quotes={quotes} />)
    expect(screen.getByRole('figure')).toHaveAttribute('data-phase', 'visible')
    act(() => { vi.advanceTimersByTime(30000) })
    expect(screen.getByRole('figure')).toHaveAttribute('data-phase', 'visible')
    expect(screen.getByText('“Primera frase.”')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /frases/ })).not.toBeInTheDocument()
  })

  it('se puede pausar con el teclado', () => {
    vi.useFakeTimers()
    render(<ManagerQuoteFlash quotes={quotes} />)
    act(() => { vi.advanceTimersByTime(100 + QUOTE_TIMING.enter) })
    act(() => { screen.getByRole('button', { name: 'Pausar frases' }).click() })
    act(() => { vi.advanceTimersByTime(30000) })
    expect(screen.getByRole('figure')).toHaveAttribute('data-phase', 'visible')
    expect(screen.getByRole('button', { name: 'Reanudar frases' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('páginas públicas secundarias', () => {
  it.each(PUBLIC_PAGES.map(p => [p.path, p]))('%s tiene un único H1, texto, metadatos propios y enlaces válidos', (path, page) => {
    render(<MemoryRouter initialEntries={[path]}><InfoPage path={path} /></MemoryRouter>)
    const h1 = screen.getAllByRole('heading', { level: 1 })
    expect(h1).toHaveLength(1)
    expect(h1[0]).toHaveTextContent(page.h1)
    expect(document.title).toBe(page.title)
    expect(document.head.querySelector('link[rel="canonical"]').getAttribute('href')).toBe(`https://www.vestuario.com.ar${path}`)
    expect(page.description.length).toBeGreaterThan(50)
    expect(page.description.length).toBeLessThanOrEqual(165)
    const known = ['/', '/login', '/registro', ...PUBLIC_PAGES.map(p => p.path)]
    for (const a of screen.getAllByRole('link')) expect([...known, BADGE_HREF]).toContain(a.getAttribute('href'))
  })

  it('los títulos y descripciones no se repiten entre páginas', () => {
    expect(new Set(PUBLIC_PAGES.map(p => p.title)).size).toBe(PUBLIC_PAGES.length)
    expect(new Set(PUBLIC_PAGES.map(p => p.description)).size).toBe(PUBLIC_PAGES.length)
  })

  it('las preguntas frecuentes publican sus datos estructurados', () => {
    render(<MemoryRouter><InfoPage path="/faq" /></MemoryRouter>)
    const data = JSON.parse(document.head.querySelector('script#ld-page').textContent)
    const faq = data['@graph'].find(n => n['@type'] === 'FAQPage')
    expect(faq.mainEntity[0].name).toBe('¿Qué es Vestuario?')
    expect(data['@graph'].some(n => n['@type'] === 'BreadcrumbList')).toBe(true)
  })
})

describe('privacidad: medición y cookies', () => {
  it('explica Google Tag Manager, las cookies y cómo se rechazan', () => {
    const page = PUBLIC_PAGES.find(p => p.path === '/privacidad')
    const text = JSON.stringify(page.sections)
    expect(text).toMatch(/Google Tag Manager/)
    expect(text).toMatch(/Microsoft Clarity/)
    expect(text).toMatch(/Clarity no se carga/)
    expect(text).toMatch(/Solo necesarias/)
    expect(text).toMatch(/no incluyen tu nombre ni tu correo/i)
  })
})

describe('privacidad: tabla pública de los mejores DT', () => {
  const page = PUBLIC_PAGES.find(p => p.path === '/privacidad')
  const section = page.sections.find(s => /Tabla pública/.test(s.heading))
  const text = section.body.join(' ')

  it('es un consentimiento: dice que es opcional, que arranca sin tildar y que se retira cuando se quiera', () => {
    expect(section.heading).toMatch(/solo si lo aceptás/)
    expect(text).toMatch(/sin tildar/)
    expect(text).toMatch(/cuando quieras/)
    expect(text).toMatch(/retirar tu consentimiento/)
  })

  it('explica qué se publica y qué nunca se publica', () => {
    expect(text).toMatch(/nombre y apellido/)
    expect(text).toMatch(/Nunca se publican tu correo/)
    expect(text).toMatch(/10 partidos/)
  })

  it('aclara qué pasa al eliminar la cuenta y cómo pedir ayuda', () => {
    expect(text).toMatch(/eliminás tu cuenta/)
    expect(text).toMatch(/contacto@vestuario\.com\.ar|Escribinos|escribinos/)
  })

  it('"Qué datos guardamos" menciona esa elección', () => {
    expect(page.sections[0].body.join(' ')).toMatch(/tabla pública/)
  })
})
