/**
 * Reparto de puntos de atributos al crear el DT: puntos libres, tope inicial y valor final por atributo.
 */

export const MANAGER_ATTRIBUTES = [
  { key: 'tactics', label: 'Táctica y pizarrón', description: 'Lectura de juego e impacto de los esquemas tácticos.' },
  { key: 'motivation', label: 'Motivación y discurso', description: 'Capacidad de levantar la moral del vestuario en la charla.' },
  { key: 'youth', label: 'Ojo para juveniles', description: 'Detección temprana y desarrollo acelerado de promesas.' },
  { key: 'management', label: 'Gestión de grupo', description: 'Manejo de egos, liderazgo y disciplina en el plantel.' },
  { key: 'negotiation', label: 'Negociación y fichajes', description: 'Eficacia económica en renovaciones y contratos.' }
]

export const spentPoints = (distributed) => Object.values(distributed).reduce((sum, v) => sum + (Number(v) || 0), 0)

export const remainingPoints = (distributed, pool) => pool - spentPoints(distributed)

export const finalValue = (baseAttributes, distributed, key) => (baseAttributes[key] || 5) + (distributed[key] || 0)

/**
 * Intenta sumar (+1) o restar (-1) un punto a un atributo.
 * @returns {{ok: true, distributed: object} | {ok: false, reason: 'NO_POINTS'|'CAP'|'MIN'}}
 */
export const changePoint = ({ distributed, baseAttributes, key, change, pool, cap }) => {
  const delta = (distributed[key] || 0) + change
  if (change > 0) {
    if (remainingPoints(distributed, pool) <= 0) return { ok: false, reason: 'NO_POINTS' }
    if ((baseAttributes[key] || 5) + delta > cap) return { ok: false, reason: 'CAP' }
  } else if (delta < 0) {
    return { ok: false, reason: 'MIN' }
  }
  return { ok: true, distributed: { ...distributed, [key]: delta } }
}

export const PHILOSOPHIES = [
  { value: 'Ofensivo', title: 'Ataque directo', description: 'Priorizar el arco rival y la verticalidad.' },
  { value: 'Posesión', title: 'Tiki-taka / posesión', description: 'Controlar el ritmo y desgastar al rival con el balón.' },
  { value: 'Contragolpe', title: 'Transición rápida', description: 'Bloque bajo reactivo y contragolpes letales.' },
  { value: 'Presión', title: 'Gegenpressing', description: 'Presión asfixiante alta para provocar pérdidas rivales.' },
  { value: 'Equilibrado', title: 'Equilibrio táctico', description: 'Adaptabilidad a las fases del partido según el contexto.' }
]

export const SPECIALIZATIONS = [
  { value: 'JUVENILES', title: 'Forjador de cantera', description: 'Tus juveniles progresan más rápido y con mayor techo de potencial.' },
  { value: 'TACTICO', title: 'Estratega del pizarrón', description: 'Mayor impacto y efectividad de las órdenes del DT durante los partidos.' },
  { value: 'MOTIVADOR', title: 'Líder anímico', description: 'La moral y cohesión del plantel se mantienen altas en rachas negativas.' },
  { value: 'MERCADO', title: 'Negociador implacable', description: 'Mejores cláusulas y menores pretensiones salariales en el mercado.' }
]
