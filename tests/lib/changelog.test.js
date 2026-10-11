import { CHANGELOG, unseenEntries, newestId } from '../../src/data/changelog'

describe('novedades por versión', () => {
  it('cada novedad tiene id único, fecha, título y frases cortas, de la más nueva a la más vieja', () => {
    expect(CHANGELOG.length).toBeGreaterThan(0)
    expect(new Set(CHANGELOG.map(e => e.id)).size).toBe(CHANGELOG.length)
    for (const e of CHANGELOG) {
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(e.title.length).toBeGreaterThan(5)
      expect(e.items.length).toBeGreaterThanOrEqual(1)
      for (const i of e.items) expect(i.length).toBeLessThanOrEqual(140)
    }
    const dates = CHANGELOG.map(e => e.date)
    expect([...dates].sort().reverse()).toEqual(dates)
    expect(newestId()).toBe(CHANGELOG[0].id)
  })

  it('muestra solo lo que la persona todavía no vio', () => {
    const list = [{ id: 'c' }, { id: 'b' }, { id: 'a' }]
    expect(unseenEntries(list, 'b').map(e => e.id)).toEqual(['c'])
    expect(unseenEntries(list, 'c')).toEqual([])
    expect(unseenEntries(list, 'zzz').map(e => e.id)).toEqual(['c', 'b', 'a'])
    expect(unseenEntries(list, null).map(e => e.id)).toEqual(['c', 'b', 'a'])
    expect(unseenEntries([], 'a')).toEqual([])
  })
})
