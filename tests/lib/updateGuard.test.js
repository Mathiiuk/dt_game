import { isSafeToUpdate, UNSAFE_ROUTES } from '../../src/lib/updateGuard'
import { markBusy, clearBusy, isBusy, resetBusy } from '../../src/lib/busy'

describe('cuándo se puede actualizar la app', () => {
  beforeEach(() => resetBusy())

  it('nunca en medio de un partido ni de su resumen', () => {
    expect(UNSAFE_ROUTES).toEqual(expect.arrayContaining(['/match', '/post-match']))
    expect(isSafeToUpdate({ pathname: '/match' })).toBe(false)
    expect(isSafeToUpdate({ pathname: '/post-match' })).toBe(false)
    expect(isSafeToUpdate({ pathname: '/dashboard' })).toBe(true)
    expect(isSafeToUpdate({ pathname: '/tactics' })).toBe(true)
  })

  it('tampoco con algo a medias: cambios sin guardar o una historia abierta', () => {
    markBusy('tactics-unsaved')
    expect(isBusy()).toBe(true)
    expect(isSafeToUpdate({ pathname: '/dashboard' })).toBe(false)
    clearBusy('tactics-unsaved')
    expect(isSafeToUpdate({ pathname: '/dashboard' })).toBe(true)
  })

  it('varias razones a la vez: se libera recién cuando terminan todas', () => {
    markBusy('a'); markBusy('b')
    clearBusy('a')
    expect(isBusy()).toBe(true)
    clearBusy('b')
    expect(isBusy()).toBe(false)
    clearBusy('inexistente')
    expect(isBusy()).toBe(false)
  })

  it('las pantallas públicas no tienen nada que proteger', () => {
    expect(isSafeToUpdate({ pathname: '/' })).toBe(true)
    expect(isSafeToUpdate({ pathname: '/guias' })).toBe(true)
  })
})
