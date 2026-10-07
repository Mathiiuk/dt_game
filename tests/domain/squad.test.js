import {
  positionGroup, filterPlayers, sortPlayers, meterTone, summarizeSquad, isListedForSale
} from '../../src/domain/squad'

const P = (id, first, last, position, extra = {}) => ({ id, first_name: first, last_name: last, position, age: 25, attr_overall: 55, contract_salary: 500, ...extra })
const squad = [
  P('1', 'Hugo', 'Ríos', 'GK', { age: 31, attr_overall: 60 }),
  P('2', 'Cristian', 'García', 'LB', { age: 22, attr_overall: 52, contract_salary: 450 }),
  P('3', 'Álvaro', 'Medina', 'CM', { age: 28, attr_overall: 58, contract_salary: 700, morale: 40 }),
  P('4', 'Pablo', 'Delantero', 'ST', { age: 19, attr_overall: 49, contract_salary: 300, is_injured: true }),
  P('5', 'Luis', 'Díaz', 'DEL', { age: 34, attr_overall: 57, contract_salary: 900, transfer_status: 'TRANSFER_LISTED' })
]

describe('grupos de posición', () => {
  it('agrupa posiciones específicas y genéricas', () => {
    expect(positionGroup('GK')).toBe('GK')
    expect(positionGroup('lcb')).toBe('DEF')
    expect(positionGroup('LB')).toBe('DEF')
    expect(positionGroup('CAM')).toBe('MED')
    expect(positionGroup('ST')).toBe('DEL')
    expect(positionGroup('DEL')).toBe('DEL')
    expect(positionGroup(undefined)).toBe('MED')
  })
})

describe('filtros y orden', () => {
  it('filtra por grupo', () => {
    expect(filterPlayers(squad, { group: 'DEF' }).map(p => p.id)).toEqual(['2'])
    expect(filterPlayers(squad, { group: 'DEL' }).map(p => p.id)).toEqual(['4', '5'])
    expect(filterPlayers(squad, { group: 'ALL' })).toHaveLength(5)
  })

  it('busca sin distinguir tildes ni mayúsculas', () => {
    expect(filterPlayers(squad, { query: 'garcia' }).map(p => p.id)).toEqual(['2'])
    expect(filterPlayers(squad, { query: 'ALVARO' }).map(p => p.id)).toEqual(['3'])
    expect(filterPlayers(squad, { query: 'rios', group: 'GK' }).map(p => p.id)).toEqual(['1'])
    expect(filterPlayers(squad, { query: 'rios', group: 'DEF' })).toEqual([])
  })

  it('ordena por cada criterio sin mutar el original', () => {
    const before = squad.map(p => p.id)
    expect(sortPlayers(squad, 'overall').map(p => p.id)).toEqual(['1', '3', '5', '2', '4'])
    expect(sortPlayers(squad, 'age').map(p => p.id)).toEqual(['4', '2', '3', '1', '5'])
    expect(sortPlayers(squad, 'salary').map(p => p.id)).toEqual(['5', '3', '1', '2', '4'])
    expect(sortPlayers(squad, 'morale')[4].id).toBe('3')
    expect(sortPlayers(squad, 'name').map(p => p.first_name)).toEqual(['Álvaro', 'Cristian', 'Hugo', 'Luis', 'Pablo'])
    expect(squad.map(p => p.id)).toEqual(before)
  })

  it('ordena por contrato: primero el que vence antes, sin fecha al final', () => {
    const list = [{ id: 'a', first_name: 'A', contract_end: '2028-06-30' }, { id: 'b', first_name: 'B' }, { id: 'c', first_name: 'C', contract_end: '2027-06-30' }]
    expect(sortPlayers(list, 'contract').map(p => p.id)).toEqual(['c', 'a', 'b'])
  })
})

describe('resumen y tonos', () => {
  it('resume el plantel', () => {
    const s = summarizeSquad(squad)
    expect(s).toMatchObject({ total: 5, injured: 1, listed: 1, weeklyWages: 2850 })
    expect(s.avgLevel).toBe(55)
    expect(summarizeSquad([])).toMatchObject({ total: 0, avgLevel: 0, weeklyWages: 0 })
  })

  it('asigna tono según el valor', () => {
    expect(meterTone(90)).toBe('accent')
    expect(meterTone(60)).toBe('warning')
    expect(meterTone(30)).toBe('danger')
  })

  it('detecta transferibles por cualquiera de los dos campos', () => {
    expect(isListedForSale({ is_transfer_listed: true })).toBe(true)
    expect(isListedForSale({ transfer_status: 'TRANSFER_LISTED' })).toBe(true)
    expect(isListedForSale({ transfer_status: 'NOT_FOR_SALE' })).toBe(false)
  })
})
