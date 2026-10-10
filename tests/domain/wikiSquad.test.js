import { describe, it, expect } from 'vitest'
import { parseWikiSquad } from '../../src/domain/wikiSquad'

const wikitext = `
== Plantel 2026 ===
{{Equipo de fútbol inicio
 | procedencia   = sí
}}
 |-
 ! colspan=11 style="text-align:center; background:#E9E9E9;" | Arqueros
 {{Jugador de fútbol | nombre=[[Ezequiel Centurión]]
 | num=33 | pos=ARQ | nac=Argentina | edad={{edad|20|05|1997}}
 | procedencia={{bandera|ARG}} [[Club Sportivo Independiente Rivadavia|Independiente Rivadavia]]
 }}
 {{Jugador de fútbol | nombre=[[Santiago Beltrán]]
 | num=41 | pos=ARQ | nac=Argentina
 }}
{{Jugador de fútbol | nombre=[[Francisco Gabriel Ortega|Francisco Ortega]]
 | num=3 | pos=DEF | nac=Argentina
 }}
 {{Jugador de fútbol | nombre = Juan Pérez (jugador) | num = 10 | pos = MED }}
 {{Jugador de fútbol | nombre=[[Lionel Messi]] | num=—  | pos=DEL | nac=Argentina }}
 {{Jugador de fútbol | nombre=[[Sin Puesto]] | num=9 | pos= }}
{{Jugador de fútbol | nombre=[[Prestado Uno]] | num=7 | pos=DEL | nac=Argentina | procedencia=cedido }}
== Cuerpo técnico ==
{{Jugador de fútbol | nombre=[[No Es Plantel]] | num=1 | pos=DEL }}
`

describe('lector del plantel de una página', () => {
  const squad = parseWikiSquad(wikitext)

  it('lee nombre, número y puesto de cada jugador', () => {
    expect(squad.find(p => p.name === 'Ezequiel Centurión')).toEqual({ name: 'Ezequiel Centurión', num: 33, pos: 'ARQ' })
  })

  it('con un enlace con barra toma el texto que se ve', () => {
    expect(squad.map(p => p.name)).toContain('Francisco Ortega')
  })

  it('saca el aclaratorio entre paréntesis y tolera espacios alrededor del igual', () => {
    expect(squad.find(p => p.pos === 'MED')).toEqual({ name: 'Juan Pérez', num: 10, pos: 'MED' })
  })

  it('un número raro queda en null y igual se lee', () => {
    expect(squad.find(p => p.name === 'Lionel Messi')).toMatchObject({ num: null, pos: 'DEL' })
  })

  it('sin puesto se descarta', () => {
    expect(squad.map(p => p.name)).not.toContain('Sin Puesto')
  })

  it('no lee plantillas de después de la sección del plantel', () => {
    expect(squad.map(p => p.name)).not.toContain('No Es Plantel')
  })

  it('un texto sin plantel da lista vacía', () => {
    expect(parseWikiSquad('nada')).toEqual([])
    expect(parseWikiSquad(undefined)).toEqual([])
  })
})
