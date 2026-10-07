// Cesiones a préstamo: las reglas y el sorteo del club receptor las pone la base; el cliente pide y muestra
const state = { rpc: [], rpcResult: null, rows: [] }

vi.mock('../../src/api/supabase', () => {
  const chain = () => {
    const q = {}
    for (const m of ['select', 'eq', 'not', 'order']) q[m] = () => q
    q.then = (resolve) => resolve({ data: state.rows, error: null })
    return q
  }
  return { supabase: { from: chain, rpc: async (fn, args) => { state.rpc.push({ fn, args }); return state.rpcResult(fn, args) } } }
})

import { loansApi } from '../../src/api/loans'

describe('cesiones a préstamo', () => {
  beforeEach(() => {
    state.rpc = []
    state.rows = []
    state.rpcResult = () => ({ data: { borrower_id: 'b1', borrower_name: 'Juventud Unida', wage_saved: 450 }, error: null })
  })

  it('ceder manda el club y el jugador a la base y devuelve a quién y cuánto se ahorra', async () => {
    const res = await loansApi.loanOut('c1', 'p1')
    expect(state.rpc[0]).toEqual({ fn: 'loan_out_player', args: { p_club_id: 'c1', p_player_id: 'p1' } })
    expect(res).toEqual({ borrowerName: 'Juventud Unida', wageSaved: 450 })
  })

  it('un rechazo de la base (plantel corto, máximo de cedidos) corta con su mensaje', async () => {
    state.rpcResult = () => ({ data: null, error: { message: 'Ya tenés 3 jugadores cedidos: es el máximo.' } })
    await expect(loansApi.loanOut('c1', 'p1')).rejects.toThrow('Ya tenés 3 jugadores cedidos: es el máximo.')
  })

  it('devolver los cedidos llama a la base con el club y trae la cantidad', async () => {
    state.rpcResult = () => ({ data: 2, error: null })
    expect(await loansApi.returnLoans('c1')).toBe(2)
    expect(state.rpc[0]).toEqual({ fn: 'return_loans', args: { p_club_id: 'c1' } })
  })

  it('la lista de cedidos suma lo que se ahorra por semana', async () => {
    state.rows = [
      { id: 'p1', first_name: 'A', last_name: 'Uno', contract_salary: 450, clubs: { name: 'Juventud Unida' } },
      { id: 'p2', first_name: 'B', last_name: 'Dos', contract_salary: 300, clubs: { name: 'Almagro Regional' } }
    ]
    const loans = await loansApi.getLoans('c1')
    expect(loans.players.map(p => p.id)).toEqual(['p1', 'p2'])
    expect(loans.weeklySaving).toBe(750)
  })
})
