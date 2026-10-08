/**
 * Personalidad de juego del rival: cada club tiene una forma de jugar (fija, sale de su identidad) que cambia el partido
 * y que se ve en el scouting antes del pitazo. Funciones puras.
 *
 * `mods` son multiplicadores que usa el motor:
 *  - att: cuántas ocasiones genera · goal: qué tan certeras son · corner: cuántos córners provoca
 *  - foul / card: cuántas faltas y amarillas comete · mid: peso en el mediocampo (posesión)
 */

export const NEUTRAL_STYLE = { att: 1, goal: 1, corner: 1, foul: 1, card: 1, mid: 1 }

export const RIVAL_STYLES = [
  {
    id: 'CROSSERS', label: 'Centradores', icon: 'Flag',
    desc: 'Tiran centros todo el partido y provocan muchos córners.',
    tip: 'Prepará bien la defensa de los córners y tené cerca a tu mejor cabeceador.',
    mods: { att: 1, goal: 1, corner: 1.8, foul: 1, card: 1, mid: 1 }
  },
  {
    id: 'LONG_SHOTS', label: 'Pegadores de media distancia', icon: 'Crosshair',
    desc: 'Patean de lejos apenas pueden: muchas ocasiones, pero poco certeras.',
    tip: 'Tu arquero va a tener trabajo: los remates peligrosos van a ser más seguidos.',
    mods: { att: 1.12, goal: 0.88, corner: 0.9, foul: 1, card: 1, mid: 1 }
  },
  {
    id: 'COUNTER', label: 'Contragolpeadores', icon: 'Footprints',
    desc: 'Esperan atrás y salen rápido: pocas ocasiones, pero muy peligrosas.',
    tip: 'No te desordenes al atacar: cada pelota perdida puede costarte un gol.',
    mods: { att: 0.9, goal: 1.22, corner: 0.9, foul: 1, card: 1, mid: 0.95 }
  },
  {
    id: 'POSSESSION', label: 'Toque y posesión', icon: 'CircleDot',
    desc: 'Quieren la pelota siempre y casi no hacen faltas.',
    tip: 'Reforzá el mediocampo y esperá tu momento: te van a hacer correr.',
    mods: { att: 1, goal: 1, corner: 1, foul: 0.75, card: 0.8, mid: 1.1 }
  },
  {
    id: 'ROUGH', label: 'Duros', icon: 'Shield',
    desc: 'Juegan fuerte: muchas faltas y amarillas.',
    tip: 'Vas a tener varios tiros libres a favor: llevá a un buen pateador y cuidá a tus figuras.',
    mods: { att: 0.97, goal: 1, corner: 1, foul: 1.7, card: 1.5, mid: 1 }
  }
]

const hash = (str) => {
  let h = 0
  for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) >>> 0
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return (h ^ (h >>> 16)) >>> 0
}

/** Estilo del club rival: siempre el mismo para el mismo club */
export const rivalStyleFor = (seed) => RIVAL_STYLES[hash(`${seed}:estilo`) % RIVAL_STYLES.length]

/** Multiplicadores completos (con valores neutros donde falten) */
export const stylesToMods = (style) => ({ ...NEUTRAL_STYLE, ...(style?.mods || style || {}) })
