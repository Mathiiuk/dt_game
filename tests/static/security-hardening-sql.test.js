import { readFileSync } from 'node:fs'

describe('endurecimiento de la base', () => {
  const sql = readFileSync('scripts/db/migration_security_hardening.sql', 'utf8')
  const code = sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n')

  it('friend_post no la puede llamar nadie desde el navegador (escribiría en el muro de cualquier sala)', () => {
    expect(code).toMatch(/revoke execute on function public\.friend_post\(uuid, text, text, uuid\) from public, anon, authenticated/)
  })

  it('friend_is_member queda solo para usuarios con sesión', () => {
    expect(code).toMatch(/revoke execute on function public\.friend_is_member\(uuid\) from public, anon/)
    expect(code).toMatch(/grant execute on function public\.friend_is_member\(uuid\) to authenticated/)
  })

  it('las funciones nuevas de la liga y los goleadores fijan su search_path', () => {
    for (const fn of ['league_scorer_name', 'record_league_goals', 'apply_league_match', 'friend_mangos', 'friend_league_points']) {
      expect(code).toMatch(new RegExp(`alter function public\\.${fn}\\([^)]*\\) set search_path = public`))
    }
  })

  it('las migraciones de la liga de amigos siguen cerrando las funciones que escriben a los anónimos', () => {
    const rooms = readFileSync('scripts/db/migration_friend_rooms.sql', 'utf8')
    expect(rooms).toMatch(/revoke all on function[\s\S]*from public, anon/)
  })
})
