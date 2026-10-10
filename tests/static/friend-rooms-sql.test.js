import { readFileSync } from 'node:fs'
import { PRANKS, MOTES, MAX_MEMBERS } from '../../src/domain/friendRoom'

describe('migración de la liga de amigos', () => {
  const sql = readFileSync('scripts/db/migration_friend_rooms.sql', 'utf8')
  const code = sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n')

  it('las tres tablas tienen RLS y solo se pueden leer si estás en la sala (nada se escribe desde el navegador)', () => {
    for (const t of ['friend_rooms', 'friend_members', 'friend_wall']) {
      expect(code).toContain(`alter table public.${t} enable row level security`)
      expect(code).toMatch(new RegExp(`create policy ${t}_select on public\\.${t} for select to authenticated using \\(public\\.friend_is_member`))
    }
    expect(code).not.toMatch(/create policy \w+ on public\.friend_\w+ for (insert|update|delete|all)/)
  })

  it('las funciones que escriben son security definer, validan que el club sea tuyo y no se abren a anónimos', () => {
    expect(code.match(/security definer set search_path = public/g).length).toBeGreaterThanOrEqual(7)
    expect(code).toMatch(/owner_user_id = uid/)
    expect(code).toMatch(/revoke all on function[\s\S]*from public, anon/)
    expect(code).toMatch(/grant execute on function[\s\S]*to authenticated/)
  })

  it('el tope de la sala y el costo de las travesuras coinciden con la app', () => {
    expect(code).toContain(`total >= ${MAX_MEMBERS}`)
    for (const p of PRANKS) expect(code).toMatch(new RegExp(`when '${p.id}' then ${p.cost}`))
    for (const m of MOTES) expect(code).toContain(`'${m}'`)
  })
})
