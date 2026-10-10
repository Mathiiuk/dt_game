import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const mig = readFileSync('scripts/db/migration_real_squads.sql', 'utf8')
const data = readFileSync('scripts/db/data_real_squads.sql', 'utf8')

describe('plantillas con nombres cambiados', () => {
  it('la migración crea la tabla con RLS de solo lectura y busca por nombre del club con respaldo derivado', () => {
    expect(mig).toContain('create table if not exists public.real_squads')
    expect(mig).toContain('enable row level security')
    expect(mig).toMatch(/for select to authenticated/)
    expect(mig).not.toMatch(/for (insert|update|delete)/)
    expect(mig).toContain('coalesce(')
    expect(mig).toContain('hashtextextended(p_club_id::text')
  })

  it('los datos son upserts sin comillas sueltas ni marcas de wiki', () => {
    expect(data).toContain('on conflict (club_name, slot) do update')
    expect(data).not.toMatch(/'{3}|\[\[|\{\{|\|/)
  })
})
