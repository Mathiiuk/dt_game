/**
 * Planteles de los clubes de la IA (nombres cambiados) listos para cargar en la tabla `real_squads`.
 * Función pura: el archivo `scripts/data/squads.generated.json` lo arma scripts/data/fetch-squads.mjs.
 */
const SLOTS = 12

/** Filas { club, slot, name, pos, page } de los clubes con plantel completo (12 plazas) */
export function squadRows(data) {
  const rows = []
  for (const [club, squad] of Object.entries(data?.clubs || {})) {
    if (!squad || !Array.isArray(squad.players) || squad.players.length < SLOTS) continue
    squad.players.slice(0, SLOTS).forEach((p, slot) => rows.push({ club, slot, name: p.name, pos: p.pos, page: squad.page || null }))
  }
  return rows
}

const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`)

/** Sentencias `insert ... on conflict` en tandas de `size` filas */
export function squadsInsertSql(rows, size = 120) {
  const out = []
  for (let i = 0; i < rows.length; i += size) {
    const values = rows.slice(i, i + size).map(r => `(${q(r.club)}, ${r.slot}, ${q(r.name)}, ${q(r.pos)}, ${q(r.page)})`).join(',\n')
    out.push(`insert into public.real_squads (club_name, slot, player_name, position, source_page) values\n${values}\non conflict (club_name, slot) do update set player_name = excluded.player_name, position = excluded.position, source_page = excluded.source_page;`)
  }
  return out
}
