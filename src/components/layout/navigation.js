import {
  Home, Users, ClipboardList, Calendar, Trophy, Dumbbell, ArrowLeftRight, Building2, Wallet,
  Briefcase, Flag, Globe, Menu
} from 'lucide-react'

/**
 * Mapa único de navegación. Lo consumen el menú lateral (escritorio), la barra inferior (móvil)
 * y la página "Más" (móvil), para que las tres vistas nunca se desincronicen.
 */
export const NAV_GROUPS = [
  {
    id: 'game',
    label: 'Juego',
    items: [
      { to: '/dashboard', label: 'Inicio', icon: Home, description: 'Resumen del club y próximo partido' },
      { to: '/calendar', label: 'Calendario', icon: Calendar, description: 'Semanas, fechas y avance del tiempo' },
      { to: '/tactics', label: 'Táctica', icon: ClipboardList, description: 'Formación, once titular e instrucciones' },
      { to: '/squad', label: 'Plantel', icon: Users, description: 'Jugadores, contratos y transferibles' },
      { to: '/training', label: 'Entrenamiento', icon: Dumbbell, description: 'Plan semanal y desarrollo individual' }
    ]
  },
  {
    id: 'competition',
    label: 'Competición',
    items: [
      { to: '/standings', label: 'Tabla', icon: Trophy, description: 'Posiciones, ascensos y descensos' },
      { to: '/international-cup', label: 'Copa continental', icon: Globe, description: 'Torneo internacional de clubes' },
      { to: '/national-team', label: 'Selección', icon: Flag, description: 'Doble carrera con una selección nacional' }
    ]
  },
  {
    id: 'club',
    label: 'Club',
    items: [
      { to: '/club', label: 'Club', icon: Building2, description: 'Staff, cantera, historia y vestuario' },
      { to: '/market', label: 'Mercado', icon: ArrowLeftRight, description: 'Fichajes, ofertas y agentes libres' },
      { to: '/finances', label: 'Finanzas', icon: Wallet, description: 'Balance, entradas y estadio' }
    ]
  },
  {
    id: 'career',
    label: 'Carrera',
    items: [
      { to: '/manager', label: 'Carrera del DT', icon: Briefcase, description: 'Trayectoria, logros y Salón de la Fama' }
    ]
  }
]

/** Pestañas de la barra inferior en móvil (las demás viven en la página "Más") */
export const MOBILE_TABS = [
  { to: '/dashboard', label: 'Inicio', icon: Home },
  { to: '/squad', label: 'Plantel', icon: Users },
  { to: '/tactics', label: 'Táctica', icon: ClipboardList },
  { to: '/standings', label: 'Tabla', icon: Trophy },
  { to: '/more', label: 'Más', icon: Menu }
]

/** Rutas cuyo ítem de menú debe quedar activo (incluye páginas hijas) */
export const isActivePath = (pathname, to) => pathname === to || pathname.startsWith(`${to}/`)

/** Pantallas que no están en el menú (se llega desde Carrera del DT) pero necesitan su título en la barra superior móvil */
const EXTRA_TITLES = [
  { to: '/achievements', label: 'Logros' },
  { to: '/hall-of-fame', label: 'Salón de la Fama' },
  { to: '/events', label: 'Eventos' },
  { to: '/post-match', label: 'Resumen del partido' }
]

/** Título de la sección actual (para la barra superior móvil) */
export const titleForPath = (pathname) => {
  const extra = EXTRA_TITLES.find(i => isActivePath(pathname, i.to))
  if (extra) return extra.label
  for (const group of NAV_GROUPS) {
    const hit = group.items.find(i => isActivePath(pathname, i.to))
    if (hit) return hit.label
  }
  return pathname.startsWith('/more') ? 'Más' : 'Vestuario'
}
