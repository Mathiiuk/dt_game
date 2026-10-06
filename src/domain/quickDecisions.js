/**
 * Decisiones rápidas del DT durante el partido. Funciones puras.
 * Cada decisión es un efecto real sobre el motor: multiplica ataque, defensa y mediocampo de tu equipo durante unos minutos.
 * Los gritos se pueden dar cada 15 minutos; los momentos (entretiempo, ir perdiendo, una roja, una lesión) pausan el partido solos.
 */

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

const OPEN_SUBS = 'OPEN_SUBS'
export const MOMENT_ACTION_OPEN_SUBS = OPEN_SUBS

/**
 * ¿Hay un momento para decidir? Se mira solo lo ocurrido hasta `minute`. Cada momento sale una sola vez (`fired`).
 * @param {{ minute: number, events: Array, userSide: 'home'|'away', fired: Set<string>, morale?: number, isFinished?: boolean }} p
 * @returns {object|null} { id, key, title, text, options, playerId? }
 */
export function detectMoment({ minute, events = [], userSide, fired = new Set(), morale = 60 }) {
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

  // Una lesión de uno de los tuyos en este minuto
  const hurt = here.find(e => e.type === 'INJURY' && e.team === userSide && e.playerId)
  if (hurt) {
    const key = `INJURY_${hurt.playerId}`
    if (!fired.has(key)) {
      return {
        key, id: 'INJURY', title: 'Un lesionado en tu equipo', playerId: hurt.playerId,
        text: hurt.text,
        options: [
          { id: 'INJ_OUT', label: 'Sacarlo ahora', desc: 'Abre los cambios con él marcado para salir.', action: OPEN_SUBS },
          { id: 'INJ_STAY', label: 'Que siga', desc: 'Sigue jugando con molestias: el equipo rinde -4% hasta que lo cambies.', buff: {}, duration: 0 }
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
