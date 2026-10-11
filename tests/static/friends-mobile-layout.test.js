import { readFileSync, readdirSync } from 'node:fs'

// En el celular (390 px) las pantallas de la sala no pueden obligar a hacer scroll horizontal:
// nada de anchos mínimos grandes y las grillas de una columna usan minmax(0, 1fr) para que los textos largos se corten con "…".
describe('sala de amigos en el celular', () => {
  const dir = 'src/features/friends'
  const files = readdirSync(dir).filter(f => f.endsWith('.jsx'))

  it('ningún componente fija un ancho mínimo mayor a 18rem', () => {
    for (const f of files) {
      const src = readFileSync(`${dir}/${f}`, 'utf8')
      for (const m of src.matchAll(/min-w-\[(\d+(?:\.\d+)?)rem\]/g)) expect(Number(m[1]), `${f}: ${m[0]}`).toBeLessThanOrEqual(18)
    }
  })

  it('las grillas que pasan a dos columnas parten de una columna con minmax(0,1fr)', () => {
    for (const f of files) {
      const src = readFileSync(`${dir}/${f}`, 'utf8')
      for (const m of src.matchAll(/className="([^"]*\bgrid\b[^"]*(?:sm|md):grid-cols-2[^"]*)"/g)) expect(m[1], `${f}`).toContain('grid-cols-[minmax(0,1fr)]')
    }
  })
})
