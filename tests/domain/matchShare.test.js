import { shareText, shareUrl, outcomeOf } from '../../src/domain/matchShare'
import { SITE } from '../../src/data/site'

describe('compartir el resultado de un partido', () => {
  it('el resultado se cuenta siempre desde el club propio', () => {
    expect(outcomeOf(2, 1)).toBe('win')
    expect(outcomeOf(1, 1)).toBe('draw')
    expect(outcomeOf(0, 3)).toBe('loss')
  })

  it('el texto trae el marcador con el club primero, una frase según el resultado y el enlace a la demo', () => {
    const win = shareText({ club: 'Club Atlético Potrero', rival: 'Los Pibes FC', mine: 3, theirs: 1 })
    expect(win).toContain('Club Atlético Potrero 3 - 1 Los Pibes FC')
    expect(win).toMatch(/Ganamos/)
    expect(win).toContain(shareUrl())
    expect(shareText({ club: 'A', rival: 'B', mine: 1, theirs: 1 })).toMatch(/Empate/)
    expect(shareText({ club: 'A', rival: 'B', mine: 0, theirs: 2 })).toMatch(/Perdimos/)
  })

  it('el enlace va a la demo del sitio con la marca de origen y sin datos personales', () => {
    expect(shareUrl()).toBe(`${SITE.url}/demo?utm_source=share&utm_medium=match`)
    const text = shareText({ club: 'A', rival: 'B', mine: 1, theirs: 0 })
    expect(text).not.toMatch(/@|email|mail/i)
  })

  it('tolera nombres vacíos', () => {
    expect(shareText({ club: '', rival: undefined, mine: 0, theirs: 0 })).toContain('Mi club 0 - 0 El rival')
  })
})
