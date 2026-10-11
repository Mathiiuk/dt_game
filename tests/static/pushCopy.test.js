import { buildPush } from '../../supabase/functions/_shared/pushCopy.ts'

describe('textos de los avisos push', () => {
  it('se jugó una fecha: dice cuál y a qué fecha toca elegir el planteo; abre la sala de amigos', () => {
    const m = buildPush('round_played', { room: 'Los Pibes', round: 3, room_id: 'r1' })
    expect(m).toMatchObject({ title: 'Se jugó la fecha 2 de "Los Pibes"', url: '/friends', tag: 'room-r1' })
    expect(m.body).toContain('fecha 3')
  })

  it('si fue la última fecha, avisa que terminó', () => {
    expect(buildPush('round_played', { room: 'Los Pibes', round: 18, done: true }).title).toBe('Terminó "Los Pibes"')
  })

  it('falta el planteo: cuenta cuánto queda, con el singular bien', () => {
    expect(buildPush('plan_missing', { room: 'S', round: 4, hours: 2 }).body).toContain('en 2 horas')
    expect(buildPush('plan_missing', { room: 'S', round: 4, hours: 1 }).body).toContain('en una hora')
    expect(buildPush('plan_missing', { room: 'S', round: 4, hours: 0.2 }).body).toContain('en una hora')
  })

  it('el aviso del club rota entre frases del juego y abre el inicio', () => {
    const lines = new Set([0, 1, 2, 3].map(seed => buildPush('club_idle', { seed }).body))
    expect(lines.size).toBeGreaterThan(1)
    expect(buildPush('club_idle', {}).url).toBe('/dashboard')
  })

  it('las novedades usan lo que se cargó, recortado, y solo abren rutas internas', () => {
    expect(buildPush('news', { title: 'T'.repeat(200), body: 'B', url: 'https://malo.com' }).url).toBe('/dashboard')
    expect(buildPush('news', { title: 'T'.repeat(200) }).title.length).toBeLessThanOrEqual(50)
    expect(buildPush('news', { url: '/guias' }).url).toBe('/guias')
  })

  it('el aviso de prueba existe y un tipo desconocido no manda nada', () => {
    expect(buildPush('test').tag).toBe('test')
    expect(buildPush('otro')).toBeNull()
  })

  it('los nombres con saltos de línea o espacios de más quedan en una línea y no rompen el texto', () => {
    expect(buildPush('plan_missing', { room: '  Los\n\nPibes   ', round: 2, hours: 2 }).title).toBe('Te falta el planteo en "Los Pibes"')
  })
})
