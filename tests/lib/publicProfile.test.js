import { fetchPublicProfile, isValidSlug, profilePath } from '../../src/lib/publicProfile'

const ok = (body) => ({ ok: true, json: async () => body })
const row = { manager_name: 'Ana Gómez', points: 1301, titles_national: 2, titles_continental: 1, matches_played: 40, matches_won: 25, rank: 7, primary_color: '#112233', secondary_color: '#ffeedd', jersey_pattern: 'SASH', id: 'secreto', club_name: 'Secreto FC' }

describe('perfil público del DT', () => {
  it('valida la dirección: minúsculas, números y guiones', () => {
    expect(isValidSlug('ana-gomez-a1b2')).toBe(true)
    for (const bad of ['', 'A-b', '../x', 'a b', 'x'.repeat(60), null, undefined, 'ab']) expect(isValidSlug(bad)).toBe(false)
    expect(profilePath('ana-gomez-a1b2')).toBe('/dt/ana-gomez-a1b2')
  })

  it('pide la función pública con la dirección y la clave pública, sin credenciales', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok([row]))
    await fetchPublicProfile('ana-gomez-a1b2', { fetchImpl })
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toMatch(/\/rest\/v1\/rpc\/public_manager_profile$/)
    expect(JSON.parse(init.body)).toEqual({ p_slug: 'ana-gomez-a1b2' })
    expect(init.headers.apikey).toBeTruthy()
    expect(init.headers.Authorization).toBeUndefined()
    expect(init.credentials).toBe('omit')
  })

  it('devuelve solo los datos que se muestran', async () => {
    const out = await fetchPublicProfile('ana-gomez-a1b2', { fetchImpl: vi.fn().mockResolvedValue(ok([row])) })
    expect(out).toEqual({
      name: 'Ana Gómez', points: 1301, titlesNational: 2, titlesContinental: 1, played: 40, won: 25, rank: 7,
      kit: { primary: '#112233', secondary: '#ffeedd', pattern: 'SASH' }
    })
  })

  it('sin puesto todavía (menos de 10 partidos) el puesto es nulo', async () => {
    const out = await fetchPublicProfile('ana-gomez-a1b2', { fetchImpl: vi.fn().mockResolvedValue(ok([{ ...row, rank: null }])) })
    expect(out.rank).toBeNull()
  })

  it('si no existe o no aceptó aparecer, devuelve null; con una dirección inválida ni consulta', async () => {
    expect(await fetchPublicProfile('nadie-0000', { fetchImpl: vi.fn().mockResolvedValue(ok([])) })).toBeNull()
    const fetchImpl = vi.fn()
    expect(await fetchPublicProfile('../raro', { fetchImpl })).toBeNull()
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('un colorido inválido cae a los colores por defecto', async () => {
    const out = await fetchPublicProfile('ana-gomez-a1b2', { fetchImpl: vi.fn().mockResolvedValue(ok([{ ...row, primary_color: 'url(javascript:1)', secondary_color: null, jersey_pattern: 'RARO' }])) })
    expect(out.kit).toEqual({ primary: '#047857', secondary: '#FFFFFF', pattern: 'CENTER_STRIPE' })
  })

  it('si el servidor falla, avisa con un error', async () => {
    await expect(fetchPublicProfile('ana-gomez-a1b2', { fetchImpl: vi.fn().mockResolvedValue({ ok: false, status: 500 }) })).rejects.toThrow()
  })
})
