import { validateIdentity, isAutoStadiumName, defaultStadiumName, sameColors, COLOR_PRESETS } from '../../src/domain/clubIdentity'

describe('identidad del club', () => {
  it('valida el largo del nombre igual que clubApi.createClub (3 a 40)', () => {
    expect(validateIdentity({ name: 'ab' }).name).toMatch(/al menos 3/)
    expect(validateIdentity({ name: '  ' }).name).toBeDefined()
    expect(validateIdentity({ name: 'x'.repeat(41) }).name).toMatch(/40/)
    expect(validateIdentity({ name: 'Club Atlético Potrero' })).toEqual({})
  })
  it('el estadio acompaña al nombre sólo si no fue editado', () => {
    expect(isAutoStadiumName('', 'X')).toBe(true)
    expect(isAutoStadiumName(defaultStadiumName('Potrero'), 'Potrero')).toBe(true)
    expect(isAutoStadiumName('Mi Cancha', 'Potrero')).toBe(false)
  })
  it('compara colores', () => {
    expect(sameColors(COLOR_PRESETS[0], { primary: COLOR_PRESETS[0].primary, secondary: COLOR_PRESETS[0].secondary })).toBe(true)
    expect(sameColors(COLOR_PRESETS[0], COLOR_PRESETS[1])).toBe(false)
  })
})
