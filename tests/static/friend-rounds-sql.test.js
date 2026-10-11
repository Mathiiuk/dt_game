import { readFileSync } from 'node:fs'

describe('migración de las fechas interactivas de la sala', () => {
  const sql = readFileSync('scripts/db/migration_friend_rounds.sql', 'utf8')
  const code = sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n')

  it('planteos y pronósticos: cada uno ve los suyos y los ajenos recién cuando la fecha se jugó', () => {
    for (const t of ['friend_round_plans', 'friend_predictions']) {
      expect(code).toContain(`alter table public.${t} enable row level security`)
      expect(code).toMatch(new RegExp(`create policy ${t}_select on public\\.${t} for select to authenticated\\s+using \\(public\\.friend_is_member\\(room_id\\) and \\(user_id = \\(select auth\\.uid\\(\\)\\) or round <= `))
    }
    expect(code).not.toMatch(/create policy \w+ on public\.friend_(round_plans|predictions) for (insert|update|delete|all)/)
  })

  it('el planteo y el pronóstico se validan en el servidor: miembro, fecha en curso, plazo y valores conocidos', () => {
    expect(code).toContain("check (stance in ('PRESION', 'EQUILIBRADO', 'CONTRA'))")
    expect(code).toContain("check (pick in ('L', 'E', 'V'))")
    expect(code).toMatch(/El plazo de la fecha ya venció\./)
    expect(code).toMatch(/Solo se pronostica la próxima fecha\./)
    expect(code).toMatch(/En las llaves siempre hay ganador/)
    expect(code).toMatch(/p_hours not in \(12, 24, 48\)/)
  })

  it('cualquier DT cierra la fecha solo si está lista; el creador cuando quiera', () => {
    expect(code.match(/rm\.created_by is distinct from uid and not public\.friend_round_ready\(p_room_id\)/g)).toHaveLength(2)
    expect(code).toMatch(/coalesce\(r\.round_deadline < now\(\), false\)/)
  })

  it('el planteo suma 3 de fuerza al que le pega al del rival y no toca el club ni la caja', () => {
    expect(code.match(/hs := hs \+ 3; elsif public\.friend_stance_beats\(ast, hst\) then aws := aws \+ 3/g)).toHaveLength(2)
    expect(code).not.toMatch(/update public\.(clubs|players|finances)/)
  })

  it('el prode da mangos (baja lo gastado) y las funciones internas no quedan expuestas', () => {
    expect(code).toMatch(/spent = m\.spent - 5 \* h\.n/)
    expect(code).toMatch(/revoke all on function public\.friend_stance_beats.*public\.friend_after_round\(uuid, integer\)/s)
    const grant = code.slice(code.indexOf('grant execute'))
    for (const internal of ['friend_after_round', 'friend_stance_of', 'friend_ensure_deadline', 'friend_round_ready']) expect(grant).not.toContain(internal)
    expect(grant).not.toMatch(/to anon/)
  })
})
