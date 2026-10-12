// Textos de los avisos push (puro: sin Deno ni red, así se prueba con Vitest). Cada aviso trae título, cuerpo, a dónde abre y una etiqueta
// para que un aviso nuevo del mismo tipo reemplace al anterior en vez de apilarse.
export type PushKind = 'round_played' | 'plan_missing' | 'club_idle' | 'injury' | 'contract_end' | 'news' | 'test'
export type PushData = Record<string, unknown>
export type PushMessage = { title: string; body: string; url: string; tag: string }

const text = (v: unknown, fallback: string, max = 60) => String(v ?? fallback).replace(/\s+/g, ' ').trim().slice(0, max) || fallback

const IDLE_LINES = [
  'La barra pregunta por vos y el dirigente ya se tomó tu café.',
  'Tu plantel entrenó solo. Dicen que mejoró, pero nadie lo cree.',
  'Hay decisiones esperando y el vestuario se está aburriendo.'
]

export function buildPush(kind: PushKind, data: PushData = {}): PushMessage | null {
  const room = text(data.room, 'tu sala')
  const round = Math.max(1, Number(data.round) || 1)
  switch (kind) {
    case 'round_played':
      return data.done
        ? { title: `Terminó "${room}"`, body: 'Se jugó la última fecha. Mirá quién salió campeón.', url: '/friends', tag: `room-${text(data.room_id, room)}` }
        : { title: `Se jugó la fecha ${round - 1} de "${room}"`, body: `Mirá cómo salió y elegí tu planteo para la fecha ${round}.`, url: '/friends', tag: `room-${text(data.room_id, room)}` }
    case 'plan_missing': {
      const hours = Math.max(1, Math.round(Number(data.hours) || 1))
      return { title: `Te falta el planteo en "${room}"`, body: `La fecha ${round} cierra en ${hours === 1 ? 'una hora' : `${hours} horas`}. Si no elegís, juega Equilibrado.`, url: '/friends', tag: `room-${text(data.room_id, room)}` }
    }
    case 'club_idle': {
      const n = Math.abs(Number(data.seed) || 0) % IDLE_LINES.length
      return { title: 'Tu club te espera', body: IDLE_LINES[n], url: '/dashboard', tag: 'club-idle' }
    }
    case 'injury': {
      const count = Math.max(1, Number(data.count) || 1)
      const days = Math.max(1, Math.round(Number(data.days) || 1))
      const who = text(data.player, 'Un jugador')
      return { title: `Se lesionó ${who}${count > 1 ? ` y ${count - 1} más` : ''}`, body: `Está afuera ${days === 1 ? '1 día' : `${days} días`}. Revisá el plantel antes del próximo partido.`, url: '/squad', tag: 'club-injury' }
    }
    case 'contract_end': {
      const count = Math.max(1, Number(data.count) || 1)
      return { title: `Te ${count === 1 ? 'vence 1 contrato' : `vencen ${count} contratos`}`, body: `${text(data.player, 'Un jugador')}${count > 1 ? ' y otros' : ''} termina${count > 1 ? 'n' : ''} el contrato pronto. Renová o buscá reemplazo.`, url: '/squad', tag: 'club-contracts' }
    }
    case 'news':
      return { title: text(data.title, 'Novedades de Vestuario', 50), body: text(data.body, 'Entrá a ver qué cambió.', 120), url: text(data.url, '/dashboard', 80).startsWith('/') ? text(data.url, '/dashboard', 80) : '/dashboard', tag: 'news' }
    case 'test':
      return { title: 'Los avisos funcionan', body: 'Así te vamos a avisar de tu sala de amigos. Podés apagarlos cuando quieras desde "Más".', url: '/more', tag: 'test' }
    default:
      return null
  }
}
