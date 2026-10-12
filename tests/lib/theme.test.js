import { THEME_KEY, THEME_COLORS, DEFAULT_THEME, getStoredTheme, resolveTheme, applyTheme, setTheme } from '../../src/lib/theme'

const memory = (initial = {}) => {
  const data = { ...initial }
  return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v) } }
}
const fakeDoc = () => {
  const meta = { content: '' }
  return { documentElement: { dataset: {}, style: {} }, querySelector: (sel) => (sel === 'meta[name="theme-color"]' ? meta : null), meta }
}
const mq = (matches) => () => ({ matches, addEventListener() {}, removeEventListener() {} })

describe('tema claro / oscuro', () => {
  it('la clave es la acordada y los colores de la barra del navegador son los del papel y la noche', () => {
    expect(THEME_KEY).toBe('vestuario-theme')
    expect(THEME_COLORS).toEqual({ light: '#F5EFE0', dark: '#101521' })
  })

  it('lo guardado solo vale si es automático, claro u oscuro; todo lo demás es el tema por defecto', () => {
    expect(getStoredTheme(memory())).toBe(DEFAULT_THEME)
    expect(getStoredTheme(memory({ [THEME_KEY]: 'dark' }))).toBe('dark')
    expect(getStoredTheme(memory({ [THEME_KEY]: 'light' }))).toBe('light')
    expect(getStoredTheme(memory({ [THEME_KEY]: 'rosa' }))).toBe(DEFAULT_THEME)
    expect(getStoredTheme({ getItem() { throw new Error('bloqueado') } })).toBe(DEFAULT_THEME)
    expect(getStoredTheme(null)).toBe(DEFAULT_THEME)
    expect(['auto', 'light', 'dark']).toContain(DEFAULT_THEME)
  })

  it('automático sigue al sistema; claro y oscuro lo ignoran', () => {
    expect(resolveTheme('auto', true)).toBe('dark')
    expect(resolveTheme('auto', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('aplicar fija data-theme, el esquema de color y el theme-color según lo resuelto', () => {
    const doc = fakeDoc()
    expect(applyTheme('dark', { doc, matchMedia: mq(false) })).toBe('dark')
    expect(doc.documentElement.dataset.theme).toBe('dark')
    expect(doc.documentElement.style.colorScheme).toBe('dark')
    expect(doc.meta.content).toBe('#101521')
    expect(applyTheme('auto', { doc, matchMedia: mq(false) })).toBe('light')
    expect(doc.documentElement.dataset.theme).toBe('light')
    expect(doc.meta.content).toBe('#F5EFE0')
    expect(applyTheme('auto', { doc, matchMedia: mq(true) })).toBe('dark')
  })

  it('setTheme guarda la preferencia y la aplica; sin almacenamiento igual se aplica', () => {
    const s = memory()
    const doc = fakeDoc()
    setTheme('dark', { storage: s, doc, matchMedia: mq(false) })
    expect(s.data[THEME_KEY]).toBe('dark')
    expect(doc.documentElement.dataset.theme).toBe('dark')
    const doc2 = fakeDoc()
    setTheme('light', { storage: { setItem() { throw new Error('lleno') }, getItem: () => null }, doc: doc2, matchMedia: mq(true) })
    expect(doc2.documentElement.dataset.theme).toBe('light')
  })

  it('un valor inválido se trata como el tema por defecto', () => {
    const doc = fakeDoc()
    expect(applyTheme('violeta', { doc, matchMedia: mq(false) })).toBe(resolveTheme(DEFAULT_THEME, false))
  })

  it('por defecto es claro para todos, aunque el sistema esté en oscuro', () => {
    expect(DEFAULT_THEME).toBe('light')
    expect(getStoredTheme(memory())).toBe('light')
    expect(resolveTheme(getStoredTheme(memory()), true)).toBe('light')
  })

  it('quien ya eligió oscuro o automático conserva su elección', () => {
    expect(getStoredTheme(memory({ [THEME_KEY]: 'dark' }))).toBe('dark')
    expect(getStoredTheme(memory({ [THEME_KEY]: 'auto' }))).toBe('auto')
  })
})
