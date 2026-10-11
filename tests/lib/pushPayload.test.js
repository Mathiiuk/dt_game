import { parsePushPayload, targetUrl } from '../../src/lib/pushPayload'

const asEvent = (obj) => ({ json: () => obj })

describe('aviso push que llega al service worker', () => {
  it('lee título, cuerpo, destino y etiqueta', () => {
    expect(parsePushPayload(asEvent({ title: 'Hola', body: 'Cuerpo', url: '/friends', tag: 'room-1' }))).toEqual({ title: 'Hola', body: 'Cuerpo', url: '/friends', tag: 'room-1' })
  })

  it('completa lo que falta y limpia espacios y largos', () => {
    const m = parsePushPayload(asEvent({ title: '  Un   título  ', body: 'x'.repeat(500) }))
    expect(m.title).toBe('Un título')
    expect(m.body).toHaveLength(200)
    expect(m.url).toBe('/dashboard')
    expect(m.tag).toBe('vestuario')
  })

  it('sin título o con datos rotos no muestra nada', () => {
    expect(parsePushPayload(asEvent({ body: 'sin título' }))).toBeNull()
    expect(parsePushPayload(asEvent(null))).toBeNull()
    expect(parsePushPayload(null)).toBeNull()
    expect(parsePushPayload({ json: () => { throw new Error('no es JSON') } })).toBeNull()
  })

  it('al tocar el aviso solo se abre una ruta del propio sitio', () => {
    expect(targetUrl({ url: '/friends' }, 'https://www.vestuario.com.ar')).toBe('https://www.vestuario.com.ar/friends')
    expect(targetUrl({ url: 'https://malo.com' }, 'https://www.vestuario.com.ar')).toBe('https://www.vestuario.com.ar/dashboard')
    expect(targetUrl({ url: '//malo.com' }, 'https://www.vestuario.com.ar')).toBe('https://www.vestuario.com.ar/dashboard')
    expect(targetUrl(null, 'https://www.vestuario.com.ar')).toBe('https://www.vestuario.com.ar/dashboard')
  })
})
