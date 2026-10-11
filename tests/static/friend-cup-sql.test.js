import { readFileSync } from 'node:fs'

describe('migración de la Copa Mundial de la sala', () => {
  const sql = readFileSync('scripts/db/migration_friend_cup.sql', 'utf8')
  const code = sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n')

  it('empezar y jugar son solo del creador y solo para salas con formato COPA', () => {
    expect(code.match(/created_by is distinct from uid/g).length).toBe(3)
    expect(code).toMatch(/rm\.status <> 'LOBBY'/)
    expect(code).toMatch(/rm\.status <> 'PLAYING'/)
    expect(code.match(/settings->>'format' is distinct from 'COPA'/g)).toHaveLength(2)
    expect(code).toMatch(/humans < 2/)
  })

  it('la copa se acota a 8 o 16 equipos, siempre con bots y solo ida', () => {
    expect(code).toMatch(/<= 8 then 8 else 16/)
    expect(code).toMatch(/legs := 1; fill := true/)
  })

  it('las llaves usan la fuerza real, definen por penales sin empates y encadenan los ganadores', () => {
    expect(code).toMatch(/public\.cup_goals\(f\.id, hs, aws\)/)
    expect(code).toMatch(/public\.club_strength\(t\.club_id\)/)
    expect(code).toMatch(/winner_slot/)
    expect(code).toMatch(/pens_home/)
    expect(code).toMatch(/nxt > 3 and nxt < rm\.total_rounds/)
  })

  it('nada se lee de afuera de la sala ni se ejecuta sin sesión', () => {
    expect(code).toMatch(/public\.friend_is_member\(p_room_id\)/)
    expect(code).toMatch(/revoke all on function .*friend_play_cup_round\(uuid\) from public, anon/)
    expect(code).toMatch(/grant execute on function .*friend_start_cup\(uuid, text\[\]\).* to authenticated/)
    expect(code).not.toMatch(/to anon/)
  })
})
