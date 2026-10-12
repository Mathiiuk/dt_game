import { describe, it, expect } from 'vitest'
import { normalizeCode, inviteUrl, inviteText, codeFromSearch } from '../../src/domain/roomInvite'
import { capturePendingInvite, getPendingInvite, clearPendingInvite } from '../../src/lib/inviteStore'

const memory = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) } }

describe('invitación a la sala', () => {
  it('normaliza el código: mayúsculas, sin símbolos, hasta 8 caracteres', () => {
    expect(normalizeCode(' ab-12 cd ')).toBe('AB12CD')
    expect(normalizeCode('abcdefghijk')).toBe('ABCDEFGH')
    expect(normalizeCode(null)).toBe('')
  })

  it('arma el enlace a /friends con el código y el origen', () => {
    const url = inviteUrl('ab12cd')
    expect(url).toContain('/friends?codigo=AB12CD')
    expect(url).toContain('utm_source=invite')
  })

  it('el texto trae el nombre de la sala, el código y el enlace', () => {
    const text = inviteText({ code: 'AB12CD', name: 'Los Pibes' })
    expect(text).toContain('Los Pibes')
    expect(text).toContain('AB12CD')
    expect(text).toContain('/friends?codigo=AB12CD')
  })

  it('lee el código de la búsqueda de la URL', () => {
    expect(codeFromSearch('?codigo=ab12cd&utm_source=invite')).toBe('AB12CD')
    expect(codeFromSearch('?otra=1')).toBe('')
    expect(codeFromSearch('')).toBe('')
  })
})

describe('invitación pendiente (sobrevive al registro)', () => {
  it('guarda el código al llegar y lo devuelve hasta que se limpia', () => {
    const s = memory()
    capturePendingInvite('?codigo=ab12cd', s)
    expect(getPendingInvite(s)).toBe('AB12CD')
    clearPendingInvite(s)
    expect(getPendingInvite(s)).toBe('')
  })

  it('sin código en la URL no pisa el que ya había', () => {
    const s = memory()
    capturePendingInvite('?codigo=AB12CD', s)
    capturePendingInvite('', s)
    expect(getPendingInvite(s)).toBe('AB12CD')
  })

  it('si el almacenamiento falla no rompe', () => {
    const roto = { getItem() { throw new Error('x') }, setItem() { throw new Error('x') }, removeItem() { throw new Error('x') } }
    expect(() => capturePendingInvite('?codigo=AB12CD', roto)).not.toThrow()
    expect(getPendingInvite(roto)).toBe('')
  })
})
