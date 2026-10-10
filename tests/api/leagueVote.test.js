import { describe, it, expect, vi, beforeEach } from 'vitest'

const state = vi.hoisted(() => ({ rows: [], upserts: [], updates: [] }))

vi.mock('../../src/api/supabase', () => {
  const builder = (table) => {
    const q = { _eq: {} }
    q.select = () => q
    q.eq = (k, v) => { q._eq[k] = v; return q }
    q.maybeSingle = () => Promise.resolve({ data: state.rows.find(r => Object.entries(q._eq).every(([k, v]) => r[k] === v)) || null, error: null })
    q.upsert = (row) => { state.upserts.push({ table, row }); state.rows.push(row); return Promise.resolve({ error: null }) }
    q.update = (patch) => { state.updates.push({ table, patch, q }); return q }
    q.then = (res) => res({ error: null })
    return q
  }
  return { supabase: { from: builder } }
})

import { leagueVoteApi } from '../../src/api/leagueVote'
import { DEFAULT_RULES, rulesFor } from '../../src/domain/leagueRules'

const rivals = Array.from({ length: 19 }, (_, i) => ({ id: `r${i}`, name: `Club ${i}` }))

describe('votación del reglamento', () => {
  beforeEach(() => { state.rows.length = 0; state.upserts.length = 0; state.updates.length = 0 })

  it('la boleta tiene 3 reglamentos y es la misma si se pide de nuevo', async () => {
    const a = await leagueVoteApi.getBallot('club-1', 2027)
    expect(a.ballot).toHaveLength(3)
    expect(a.vote).toBeNull()
    expect((await leagueVoteApi.getBallot('club-1', 2027)).ballot).toEqual(a.ballot)
  })

  it('al votar se cuentan los 19 DT rivales, se guarda el ganador con sus reglas y se devuelve el escrutinio', async () => {
    const { ballot } = await leagueVoteApi.getBallot('club-1', 2027)
    const res = await leagueVoteApi.castVote({ clubId: 'club-1', seasonYear: 2027, choice: ballot[0], rivals })
    expect(Object.values(res.counts).reduce((a, b) => a + b, 0)).toBe(20)
    expect(ballot).toContain(res.winner)
    expect(res.botVotes).toHaveLength(19)
    const saved = state.upserts.at(-1).row
    expect(saved).toMatchObject({ club_id: 'club-1', season_year: 2027, user_vote: ballot[0], winner: res.winner })
    expect(saved.rules).toEqual(rulesFor(res.winner))
  })

  it('no acepta una opción que no está en la boleta', async () => {
    await expect(leagueVoteApi.castVote({ clubId: 'club-1', seasonYear: 2027, choice: 'NO_EXISTE', rivals })).rejects.toThrow(/boleta/i)
  })

  it('sin voto guardado, el reglamento del año es el clásico', async () => {
    expect(await leagueVoteApi.getRules('club-1', 2027)).toEqual(DEFAULT_RULES)
    const { ballot } = await leagueVoteApi.getBallot('club-1', 2027)
    const res = await leagueVoteApi.castVote({ clubId: 'club-1', seasonYear: 2027, choice: ballot[1], rivals })
    expect(await leagueVoteApi.getRules('club-1', 2027)).toEqual(rulesFor(res.winner))
  })
})
