import { friendlyError } from '../../src/lib/errors'

describe('mensajes de error para el jugador', () => {
  it('quita el código de los errores de dominio', () => {
    expect(friendlyError(new Error('ERR_MATCH_MUST_BE_PLAYED_FIRST: Tenés un partido pendiente.'))).toBe('Tenés un partido pendiente.')
  })

  it('traduce los errores crudos de la base (los que se veían en inglés)', () => {
    expect(friendlyError(new Error("Could not find the 'last_scouted_at' column of 'scout_reports' in the schema cache"))).toMatch(/falta actualizar la base/)
    expect(friendlyError(new Error('null value in column "nationality" of relation "players" violates not-null constraint'))).toBe('Faltan datos obligatorios para completar la acción.')
    expect(friendlyError(new Error('duplicate key value violates unique constraint "x"'))).toMatch(/ya estaba registrad|choca/)
    expect(friendlyError(new Error('new row violates row-level security policy'))).toBe('No tenés permiso para hacer esto.')
    expect(friendlyError(new TypeError('Failed to fetch'))).toMatch(/conectarnos/)
  })

  it('deja pasar los mensajes que ya están escritos para el jugador', () => {
    expect(friendlyError(new Error('Fondos insuficientes: el informe cuesta $300.'))).toBe('Fondos insuficientes: el informe cuesta $300.')
    expect(friendlyError(new Error('No tenés presupuesto suficiente para esta oferta.'))).toContain('presupuesto')
  })

  it('usa un mensaje general si no hay nada entendible', () => {
    expect(friendlyError(new Error('TypeError: undefined is not a function'))).toBe('Algo salió mal. Probá de nuevo en un momento.')
    expect(friendlyError(undefined)).toBe('Algo salió mal. Probá de nuevo en un momento.')
    expect(friendlyError('', 'Otro texto')).toBe('Otro texto')
  })
})
