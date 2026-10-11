import { createElement } from 'react'
import { MOBILE_TABS } from '../../components/layout/navigation'

const MOBILE_TAB_ROUTES = MOBILE_TABS.map(t => t.to)

/** Texto de un paso: un párrafo por cada elemento del cuerpo */
const contentOf = (body) => createElement('div', { className: 'space-y-2 text-sm leading-relaxed' }, body.map(text => createElement('p', { key: text }, text)))

/** Qué se resalta en cada paso: el ítem del menú lateral (escritorio), la pestaña inferior (celular) o la pantalla entera */
export function targetFor(step, isDesktop) {
  if (!step.nav) return { target: 'body', placement: 'center' }
  if (isDesktop) return { target: `[data-tour="nav-${step.nav}"]`, placement: 'right' }
  if (MOBILE_TAB_ROUTES.includes(step.nav)) return { target: `[data-tour="tab-${step.nav}"]`, placement: 'top' }
  return { target: 'body', placement: 'center' }
}

/**
 * Pasos de Joyride a partir del guion. Antes de mostrar cada paso se abre la pantalla que explica (`navigate`),
 * así el recorrido va moviéndose por las secciones del juego.
 */
export function buildJoyrideSteps(steps, { isDesktop, navigate, getPathname }) {
  return steps.map(step => ({
    id: step.id,
    title: step.title,
    content: contentOf(step.body),
    ...targetFor(step, isDesktop),
    skipBeacon: true,
    targetWaitTimeout: 4000,
    before: async () => {
      if (getPathname() !== step.route) {
        navigate(step.route)
        // Las pantallas se descargan al entrar: se les da un instante antes de mostrar el paso
        await new Promise(resolve => setTimeout(resolve, 450))
      }
    }
  }))
}

/** Textos de los botones del tutorial */
export const TOUR_LOCALE = {
  back: 'Atrás',
  close: 'Cerrar',
  last: 'Empezar a jugar',
  next: 'Siguiente',
  nextWithProgress: 'Siguiente ({current} de {total})',
  skip: 'Saltear tutorial'
}
