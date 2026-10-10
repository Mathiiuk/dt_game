/**
 * Qué hace cada instrucción táctica en el partido. Una sola fuente: el motor (`applyTactics`) multiplica con esto y la
 * pantalla de táctica cuenta el mismo efecto, así lo que se lee es lo que pasa. Funciones puras.
 *
 * Cada efecto es un multiplicador de ataque, defensa y mediocampo; el ritmo fija el desgaste físico base y la presión lo mueve.
 */
const BASE_DRAIN = 0.35

// Nombres viejos en castellano que todavía puede haber guardados
const ALIAS = { Ofensiva: 'ATTACKING', Defensiva: 'DEFENSIVE', Alto: 'FAST', Lento: 'SLOW' }
const norm = (v) => ALIAS[v] || v

export const MENTALITY_EFFECTS = {
  VERY_DEFENSIVE: { attack: 0.7, defense: 1.3 },
  DEFENSIVE: { attack: 0.8, defense: 1.2 },
  BALANCED: {},
  ATTACKING: { attack: 1.2, defense: 0.85 },
  ALL_OUT_ATTACK: { attack: 1.35, defense: 0.7 }
}

export const TEMPO_EFFECTS = {
  SLOW: { defense: 1.08, drain: 0.22 },
  NORMAL: { drain: BASE_DRAIN },
  FAST: { attack: 1.12, drain: 0.55 }
}

export const PRESSING_EFFECTS = {
  STAND_OFF: { attack: 0.97, defense: 1.04, drainDelta: -0.04 },
  BALANCED: {},
  AGGRESSIVE: { midfield: 1.06, defense: 0.98, drainDelta: 0.08 }
}

export const PASSING_EFFECTS = {
  SHORT_TIKI: { midfield: 1.06, attack: 0.98 },
  MIXED: {},
  DIRECT: { attack: 1.04, midfield: 0.97 },
  LONG_BALL: { attack: 1.03, midfield: 0.94 }
}

const GROUPS = { mentality: MENTALITY_EFFECTS, tempo: TEMPO_EFFECTS, pressing: PRESSING_EFFECTS, passing: PASSING_EFFECTS }

/** Multiplicadores totales de una táctica: { attack, defense, midfield, fitnessDrain } (sin la ventaja de local) */
export function tacticMultipliers(tactic = {}) {
  const t = tactic || {}
  const parts = [
    MENTALITY_EFFECTS[norm(t.mentality)],
    TEMPO_EFFECTS[norm(t.tempo)],
    PRESSING_EFFECTS[t.pressing_intensity],
    PASSING_EFFECTS[t.passing_style]
  ].filter(Boolean)
  const out = { attack: 1, defense: 1, midfield: 1, fitnessDrain: TEMPO_EFFECTS[norm(t.tempo)]?.drain ?? BASE_DRAIN }
  for (const p of parts) {
    out.attack *= p.attack ?? 1
    out.defense *= p.defense ?? 1
    out.midfield *= p.midfield ?? 1
    out.fitnessDrain += p.drainDelta ?? 0
  }
  out.fitnessDrain = Math.round(out.fitnessDrain * 1000) / 1000
  return out
}

const pct = (x) => Math.round((x - 1) * 100)
const signed = (n) => `${n > 0 ? '+' : '−'}${Math.abs(n)} %`

/** Efecto en palabras: "+20 % ataque, −15 % defensa" */
export function describeEffect({ attack = 1, defense = 1, midfield = 1, fitnessDrain = BASE_DRAIN } = {}) {
  const parts = []
  if (pct(attack)) parts.push(`${signed(pct(attack))} ataque`)
  if (pct(defense)) parts.push(`${signed(pct(defense))} defensa`)
  if (pct(midfield)) parts.push(`${signed(pct(midfield))} mediocampo`)
  if (fitnessDrain > BASE_DRAIN + 0.001) parts.push('más desgaste físico')
  else if (fitnessDrain < BASE_DRAIN - 0.001) parts.push('menos desgaste físico')
  return parts.length ? parts.join(', ') : 'Sin cambios: el equipo juega como es'
}

/** Efecto en palabras de una opción de un grupo ('mentality' | 'tempo' | 'pressing' | 'passing') */
export function effectOf(group, id) {
  const e = GROUPS[group]?.[id] || {}
  return describeEffect({
    attack: e.attack ?? 1,
    defense: e.defense ?? 1,
    midfield: e.midfield ?? 1,
    fitnessDrain: e.drain !== undefined ? e.drain : BASE_DRAIN + (e.drainDelta ?? 0)
  })
}

/** Estilos listos para usar: fijan las cuatro instrucciones con un toque */
export const TACTIC_PRESETS = [
  { id: 'EQUILIBRADO', label: 'Equilibrado', description: 'Sin riesgos: el equipo juega como es.', values: { mentality: 'BALANCED', passing_style: 'MIXED', tempo: 'NORMAL', pressing_intensity: 'BALANCED' } },
  { id: 'POSESION', label: 'Posesión', description: 'Pases cortos para manejar el partido y ganar el medio.', values: { mentality: 'BALANCED', passing_style: 'SHORT_TIKI', tempo: 'NORMAL', pressing_intensity: 'BALANCED' } },
  { id: 'CONTRAATAQUE', label: 'Contraataque', description: 'Atrás ordenados y a matar rápido al salir.', values: { mentality: 'DEFENSIVE', passing_style: 'DIRECT', tempo: 'FAST', pressing_intensity: 'STAND_OFF' } },
  { id: 'TODO_ARRIBA', label: 'Todo arriba', description: 'Presión alta y ataque constante, a costa de cansarse.', values: { mentality: 'ATTACKING', passing_style: 'DIRECT', tempo: 'FAST', pressing_intensity: 'AGGRESSIVE' } },
  { id: 'CERRAR', label: 'Cerrar el partido', description: 'Para cuidar un resultado: todos atrás y sin apuro.', values: { mentality: 'VERY_DEFENSIVE', passing_style: 'LONG_BALL', tempo: 'SLOW', pressing_intensity: 'STAND_OFF' } }
]

/** Id del estilo que coincide exactamente con la táctica (o null si se tocó algo suelto) */
export function presetOf(tactic = {}) {
  const t = tactic || {}
  return TACTIC_PRESETS.find(p => Object.entries(p.values).every(([k, v]) => t[k] === v))?.id || null
}
