/**
 * Decisiones rápidas del DT durante el partido. Funciones puras.
 * Cada decisión es un efecto real sobre el motor: multiplica ataque, defensa y mediocampo de tu equipo durante unos minutos.
 * Los gritos se pueden dar cada 15 minutos; los momentos (entretiempo, ir perdiendo, una roja, una lesión) pausan el partido solos.
 */

import { positionLine } from './positions'

export const SHOUT_COOLDOWN_MINUTES = 15
export const SHOUT_DURATION = 15

/** Efecto de un grito del motor ({ attBuff, defBuff, posBuff }) en el formato del motor ({ att, def, mid }) */
export const shoutBuff = (effect = {}) => ({ att: effect.attBuff ?? 1, def: effect.defBuff ?? 1, mid: effect.posBuff ?? 1 })

/** Minutos que faltan para poder gritar de nuevo (0 si ya se puede) */
export const shoutWaitMinutes = (lastShoutMinute, minute) =>
  lastShoutMinute == null ? 0 : Math.max(0, lastShoutMinute + SHOUT_COOLDOWN_MINUTES - minute)

/** Marcador a un minuto dado, a partir de los goles del relato */
export function scoreAt(events = [], minute) {
  const score = { home: 0, away: 0 }
  for (const e of events) if (e.type === 'GOAL' && e.minute <= minute && (e.team === 'home' || e.team === 'away')) score[e.team]++
  return score
}

/** Charla del entretiempo: el humor del vestuario decide cuánto rinde elogiar o apretar */
export function halftimeTalk({ morale = 60 } = {}) {
  const upbeat = morale >= 60
  return {
    id: 'HALFTIME',
    title: 'Entretiempo',
    text: 'Entrás al vestuario. Hay un minuto de silencio y todos te miran. ¿Qué les decís?',
    options: [
      { id: 'HT_PRESS', label: 'Los reto y les exijo más', desc: '+10% ataque, -3% defensa en el segundo tiempo.', buff: { att: 1.10, def: 0.97 }, duration: 45 },
      { id: 'HT_ORDER', label: 'Orden y paciencia', desc: '+10% defensa y +5% mediocampo en el segundo tiempo.', buff: { def: 1.10, mid: 1.05 }, duration: 45 },
      upbeat
        ? { id: 'HT_PRAISE', label: 'Los felicito, vamos bien', desc: 'El vestuario está contento: +6% ataque y defensa en el segundo tiempo.', buff: { att: 1.06, def: 1.06 }, duration: 45 }
        : { id: 'HT_PRAISE', label: 'Los felicito, vamos bien', desc: 'El vestuario está caído y no te lo cree: apenas +1% en ataque y defensa.', buff: { att: 1.01, def: 1.01 }, duration: 45 }
    ]
  }
}

const skillOf = (p) => p.attr_finishing ?? p.attr_shooting ?? p.attr_overall ?? 50
/** Probabilidad de convertir un penal según la definición de quien patea (misma cuenta que el motor del partido) */
export const penaltyChance = (skill) => Math.max(0.55, Math.min(0.9, 0.5 + skill / 200))
const isKeeper = (p) => p && positionLine(p.slot_base || p.position) === 'ARQ'

const OPEN_SUBS = 'OPEN_SUBS'
export const MOMENT_ACTION_OPEN_SUBS = OPEN_SUBS

/**
 * ¿Hay un momento para decidir? Se mira solo lo ocurrido hasta `minute`. Cada momento sale una sola vez (`fired`).
 * @param {{ minute: number, events: Array, userSide: 'home'|'away', fired: Set<string>, morale?: number, isFinished?: boolean }} p
 * @returns {object|null} { id, key, title, text, options, playerId? }
 */
export function detectMoment({ minute, events = [], userSide, fired = new Set(), morale = 60, onField = [] }) {
  if (minute >= 90) return null
  const rivalSide = userSide === 'home' ? 'away' : 'home'

  if (minute === 45 && !fired.has('HALFTIME')) return { ...halftimeTalk({ morale }), key: 'HALFTIME' }

  const here = events.filter(e => e.minute === minute)

  // Una roja en este minuto
  const red = here.find(e => e.type === 'CARD_RED' && (e.team === userSide || e.team === rivalSide))
  if (red) {
    const key = `RED_${red.team}_${minute}`
    if (!fired.has(key)) {
      if (red.team === userSide) {
        return {
          key, id: 'RED_AGAINST', title: 'Te quedaste con diez',
          text: 'Expulsaron a uno de los tuyos. El banco te mira esperando qué hacés.',
          options: [
            { id: 'RED_CARE', label: 'Cerrarse y cuidar el resultado', desc: '+12% defensa y -8% ataque por 20 minutos.', buff: { def: 1.12, att: 0.92 }, duration: 20 },
            { id: 'RED_GO', label: 'Ir igual, con coraje', desc: '+8% ataque y -5% defensa por 20 minutos.', buff: { att: 1.08, def: 0.95 }, duration: 20 }
          ]
        }
      }
      return {
        key, id: 'RED_FOR', title: 'El rival se quedó con diez',
        text: 'Expulsaron a uno de ellos. Se abre el partido.',
        options: [
          { id: 'RED_PUNISH', label: 'Aprovechar y salir a ganarlo', desc: '+12% ataque por 20 minutos.', buff: { att: 1.12 }, duration: 20 },
          { id: 'RED_ADMIN', label: 'Administrar con la pelota', desc: '+8% defensa y +8% mediocampo por 20 minutos.', buff: { def: 1.08, mid: 1.08 }, duration: 20 }
        ]
      }
    }
  }

  // Penal en este minuto: a favor se elige quién patea; en contra, hacia dónde se tira el arquero
  const pen = here.find(e => e.type === 'PENALTY' && (e.team === userSide || e.team === rivalSide))
  if (pen) {
    const key = `PENALTY_${minute}`
    if (!fired.has(key)) {
      if (pen.team === userSide) {
        const takers = onField.filter(p => p.id && !isKeeper(p)).sort((a, b) => skillOf(b) - skillOf(a)).slice(0, 3)
        return {
          key, id: 'PENALTY_FOR', title: '¡Penal a favor!',
          text: 'El árbitro señala el punto penal. El estadio contiene la respiración: ¿quién se anima?',
          options: [
            ...takers.map(p => ({ id: `TAKER_${p.id}`, label: `Que patee ${`${p.first_name} ${p.last_name}`.trim()}`, desc: `Definición ${Math.round(skillOf(p))}: cerca de ${Math.round(penaltyChance(skillOf(p)) * 100)}% de gol.`, action: 'PENALTY_TAKER', playerId: p.id })),
            { id: 'TAKER_DEFAULT', label: 'Que patee quien corresponde', desc: 'Lo patea el mejor definidor del equipo.', action: 'PENALTY_TAKER', playerId: null }
          ]
        }
      }
      return {
        key, id: 'PENALTY_AGAINST', title: 'Penal en contra',
        text: 'Lo cobraron contra tu equipo. Tu arquero te mira: ¿para dónde se tira?',
        options: [
          { id: 'DIVE_L', label: 'Que se tire a la izquierda', desc: 'Si adivina la esquina, casi siempre la ataja.', action: 'PENALTY_DIVE', dive: 'L' },
          { id: 'DIVE_C', label: 'Que se quede en el medio', desc: 'Si adivina la esquina, casi siempre la ataja.', action: 'PENALTY_DIVE', dive: 'C' },
          { id: 'DIVE_R', label: 'Que se tire a la derecha', desc: 'Si adivina la esquina, casi siempre la ataja.', action: 'PENALTY_DIVE', dive: 'R' }
        ]
      }
    }
  }

  // Remate peligroso en contra: se reacciona con el arquero (minijuego de reflejos)
  const shot = here.find(e => e.type === 'SHOT' && e.team === rivalSide)
  if (shot) {
    const key = `SHOT_${minute}`
    if (!fired.has(key)) {
      return {
        key, id: 'SHOT_AGAINST', title: '¡Remate peligroso!',
        text: 'Te patean al arco. Tu arquero espera una señal tuya: tirate hacia donde va la pelota.',
        options: []
      }
    }
  }

  // Mano a mano: a favor decidís cómo definir; en contra, cómo sale tu arquero
  const keyPlay = here.find(e => e.type === 'KEYPLAY' && (e.team === userSide || e.team === rivalSide))
  if (keyPlay) {
    const key = `KEYPLAY_${minute}`
    if (!fired.has(key)) {
      if (keyPlay.team === userSide) {
        return {
          key, id: 'KEYPLAY_FOR', title: '¡Mano a mano!',
          text: 'Se te escapa uno solo contra el arquero. Elegí cómo la juega.',
          options: [
            { id: 'KP_SHOOT', icon: 'Target', label: 'Que la defina de primera', desc: 'Chance pareja: cerca de 1 de cada 3 es gol.', action: 'KEYPLAY', choice: 'SHOOT' },
            { id: 'KP_DRIBBLE', icon: 'Footprints', label: 'Que gambetee al arquero', desc: 'Arriesgado: si se lo saca, es gol casi seguro; si no, pierde la pelota.', action: 'KEYPLAY', choice: 'DRIBBLE' },
            { id: 'KP_PASS', icon: 'Handshake', label: 'Que se la ceda al compañero', desc: 'El más seguro: un poco más de chance y no hace falta ser héroe.', action: 'KEYPLAY', choice: 'PASS' }
          ]
        }
      }
      return {
        key, id: 'KEYPLAY_AGAINST', title: '¡Mano a mano en contra!',
        text: 'El delantero rival se escapa solo y tu arquero te mira. ¿Cómo sale?',
        options: [
          { id: 'KP_OUT', icon: 'Hand', label: 'Que achique y salga', desc: 'Le tapa el ángulo: es la mejor chance de pararlo.', action: 'KEYPLAY', choice: 'OUT' },
          { id: 'KP_STAY', icon: 'Shield', label: 'Que se quede en el arco', desc: 'Espera el remate. Ni bien ni mal.', action: 'KEYPLAY', choice: 'STAY' },
          { id: 'KP_SLIDE', icon: 'ChevronsDown', label: 'Que se tire a los pies', desc: 'Lo frena más veces, pero puede comerse una amarilla.', action: 'KEYPLAY', choice: 'SLIDE' }
        ]
      }
    }
  }

  // Una lesión de uno de los tuyos en este minuto (si es el arquero, es peor)
  const hurt = here.find(e => e.type === 'INJURY' && e.team === userSide && e.playerId)
  if (hurt) {
    const key = `INJURY_${hurt.playerId}`
    if (!fired.has(key)) {
      const p = onField.find(pl => pl.id === hurt.playerId) || {}
      const keeper = isKeeper(p)
      const pName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Un jugador'
      const pPos = p.slot_base || p.position || '?'
      return {
        key, id: keeper ? 'GK_INJURY' : 'INJURY', title: `Se lesionó ${pName} (${pPos})`, playerId: hurt.playerId,
        text: 'Elegí quién entra o pedile que aguante en la cancha.',
        options: [
          { id: 'INJ_OUT', label: 'Elegí quién entra', desc: 'Abre los suplentes para que elijas.', action: OPEN_SUBS },
          { id: 'INJ_STAY', label: 'Que siga', desc: keeper ? 'Sigue en el arco con molestias: el equipo rinde -12% hasta que lo cambies.' : 'Sigue jugando con molestias: el equipo rinde -4% hasta que lo cambies.', buff: {}, duration: 0 }
        ]
      }
    }
  }

  const score = scoreAt(events, minute)
  const diff = (score[userSide] || 0) - (score[rivalSide] || 0)

  if (minute >= 60 && diff <= -2 && !fired.has('TRAILING')) {
    return {
      key: 'TRAILING', id: 'TRAILING', title: 'Vas perdiendo por dos',
      text: 'La tribuna empieza a murmurar. Hay que hacer algo.',
      options: [
        { id: 'TR_ALL_IN', label: 'Adelantar las líneas', desc: '+18% ataque y -12% defensa por 20 minutos.', buff: { att: 1.18, def: 0.88 }, duration: 20 },
        { id: 'TR_SUBS', label: 'Mover el banco', desc: 'Abre los cambios para meter piernas frescas.', action: OPEN_SUBS },
        { id: 'TR_KEEP', label: 'Mantener el plan', desc: 'No cambia nada.', buff: {}, duration: 0 }
      ]
    }
  }

  if (minute >= 75 && diff >= 1 && !fired.has('PROTECT')) {
    return {
      key: 'PROTECT', id: 'PROTECT', title: 'Ganás y queda poco',
      text: diff === 1 ? 'Un gol de ventaja. Cualquier descuido es un empate.' : 'Estás arriba. ¿Cerrás el partido o buscás más?',
      options: [
        { id: 'PR_CLOSE', label: 'Cerrar atrás', desc: '+20% defensa y -15% ataque por 15 minutos.', buff: { def: 1.20, att: 0.85 }, duration: 15 },
        { id: 'PR_KEEP', label: 'Seguir igual', desc: 'No cambia nada.', buff: {}, duration: 0 }
      ]
    }
  }

  return null
}

/** Línea del relato cuando el DT decide */
export const decisionText = (option) => `[DT] ${option.label}`
