import { divisionName, seasonOutlook } from '../../src/domain/divisions'
import { getPrizeForPosition } from '../../src/api/seasonClose'

describe('nombre de la división', () => {
  it('cada categoría tiene su nombre', () => {
    expect(divisionName(1)).toBe('Primera División')
    expect(divisionName(3)).toBe('Primera B Metropolitana')
    expect(divisionName(5)).toBe('Torneo Regional Amateur')
  })
  it('una categoría desconocida no rompe la pantalla', () => {
    expect(divisionName(undefined)).toBe('Torneo Regional Amateur')
    expect(divisionName(9)).toBe('División 9')
  })
})

describe('qué te espera según el puesto', () => {
  it('el premio coincide con la escala que liquida la base', () => {
    for (const pos of [1, 2, 3, 6, 7, 17, 18, 20]) expect(seasonOutlook(pos).prize).toBe(getPrizeForPosition(pos))
  })
  it('los dos primeros ascienden (+80% de masa salarial), los tres últimos descienden (-15%) y el resto +10%', () => {
    expect(seasonOutlook(1, 5)).toMatchObject({ promoted: true, wageChangePct: 80 })
    expect(seasonOutlook(2, 3)).toMatchObject({ promoted: true, wageChangePct: 80 })
    expect(seasonOutlook(10, 4)).toMatchObject({ promoted: false, relegated: false, wageChangePct: 10 })
    expect(seasonOutlook(19, 4)).toMatchObject({ relegated: true, wageChangePct: -15 })
  })
  it('en Primera no se asciende y en la última categoría no se desciende', () => {
    expect(seasonOutlook(1, 1)).toMatchObject({ promoted: false, wageChangePct: 10 })
    expect(seasonOutlook(20, 5)).toMatchObject({ relegated: false, wageChangePct: 10 })
  })
  it('sin puesto conocido no se promete nada', () => {
    expect(seasonOutlook(null)).toBeNull()
  })
})
