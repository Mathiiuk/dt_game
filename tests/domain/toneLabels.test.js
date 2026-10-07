// B16: los tonos de la prensa se muestran con su nombre, nunca con el código interno
import { TONE_LABELS, toneLabel } from '../../src/domain/press'

describe('nombres de los tonos de prensa', () => {
  it('cada tono tiene un nombre en castellano', () => {
    expect(TONE_LABELS).toEqual({ PRAISING: 'Elogioso', COMBATIVE: 'Combativo', SELF_CRITICAL: 'Autocrítico', PRAGMATIC: 'Cauteloso' })
  })

  it('un tono desconocido o vacío nunca muestra el código', () => {
    expect(toneLabel('PRAISING')).toBe('Elogioso')
    expect(toneLabel(null)).toBe('Respondida')
    expect(toneLabel('OTRO_CODIGO', 'Declaración')).toBe('Declaración')
  })
})
