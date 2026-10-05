import { askRisk } from '../../src/lib/risk'

describe('askRisk', () => {
  it('sigue de largo si no hay aviso', async () => {
    const confirm = vi.fn(async () => false)
    expect(await askRisk(confirm, async () => null)).toBe(true)
    expect(confirm).not.toHaveBeenCalled()
  })

  it('pide confirmación del aviso y respeta la respuesta', async () => {
    const warning = { key: 'TICKET_PRICE', title: 'Entrada cara' }
    expect(await askRisk(vi.fn(async () => true), async () => warning)).toBe(true)
    const no = vi.fn(async () => false)
    expect(await askRisk(no, async () => warning)).toBe(false)
    expect(no).toHaveBeenCalledWith(warning)
  })

  it('un aviso que falla al calcularse nunca bloquea la acción', async () => {
    const confirm = vi.fn()
    expect(await askRisk(confirm, async () => { throw new Error('sin datos') })).toBe(true)
    expect(confirm).not.toHaveBeenCalled()
  })

  it('si la pantalla no puede mostrar avisos, la acción sigue', async () => {
    expect(await askRisk(undefined, async () => ({ key: 'X' }))).toBe(true)
  })
})
