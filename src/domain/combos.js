/**
 * Combos y círculos viciosos: combinaciones de decisiones y resultados que se premian o se castigan de forma visible.
 * Se detectan una vez por racha (cuando la racha llega justo al valor que dispara el combo) para no repetirse cada semana.
 */
import { scaleEffect, DIFFICULTY } from './consequences'

export const COMBO_KIND = { COMBO: 'COMBO', VICIOUS: 'VICIOUS' }

/**
 * @param {object} ctx { price, recommended, streaks: { win, loss, winless }, trainingHighWeeks, injuredCount, cash }
 * @returns {Array<{ key, kind, label, note, effects: { fans, board, locker } }>}
 */
export function detectCombos({ price = 10, recommended = 10, streaks = {}, trainingHighWeeks = 0, injuredCount = 0, cash = null }, difficulty = DIFFICULTY.NORMAL) {
  const found = []
  const ratio = price / recommended

  // Entrada barata y el equipo ganando: la gente se vuelca a la cancha
  if (ratio <= 0.7 && streaks.win === 3) {
    found.push({
      key: 'VILLAGE_PARTY',
      kind: COMBO_KIND.COMBO,
      label: 'La fiesta del pueblo',
      note: 'Entradas accesibles y tres victorias seguidas: el barrio entero se vuelca a la cancha.',
      effects: { fans: scaleEffect(8, difficulty), board: scaleEffect(2, difficulty), locker: scaleEffect(3, difficulty) }
    })
  }

  // Entrada cara y el equipo sin ganar: la tribuna pierde la paciencia
  if (ratio >= 1.5 && streaks.winless === 3) {
    found.push({
      key: 'EXPENSIVE_LOSING',
      kind: COMBO_KIND.VICIOUS,
      label: 'Círculo vicioso: entradas caras y sin ganar',
      note: 'Cuesta caro ir a la cancha y el equipo no gana: cada vez va menos gente y cada vez hay más bronca.',
      effects: { fans: scaleEffect(-8, difficulty), board: scaleEffect(-2, difficulty), locker: 0 }
    })
  }

  // Entrenar al límite con el plantel ya golpeado
  if (trainingHighWeeks === 3 && injuredCount >= 3) {
    found.push({
      key: 'BURNED_SQUAD',
      kind: COMBO_KIND.VICIOUS,
      label: 'Círculo vicioso: plantel reventado',
      note: 'Tres semanas a máxima intensidad y ya hay varios lesionados: el cuerpo médico pide frenar.',
      effects: { fans: 0, board: scaleEffect(-2, difficulty), locker: scaleEffect(-8, difficulty) }
    })
  }

  // Racha larga sin perder con la dirigencia contenta
  if (streaks.unbeaten === 6 && streaks.loss === 0) {
    found.push({
      key: 'UNBEATEN_SPELL',
      kind: COMBO_KIND.COMBO,
      label: 'Racha de campeón',
      note: 'Seis partidos sin perder: en el club se respira otro aire.',
      effects: { fans: scaleEffect(4, difficulty), board: scaleEffect(4, difficulty), locker: scaleEffect(4, difficulty) }
    })
  }

  // Caja en rojo y dos derrotas seguidas: la dirigencia se pregunta quién firma los cheques
  if (cash !== null && cash < 0 && streaks.loss === 2) {
    found.push({
      key: 'EMPTY_COFFERS',
      kind: COMBO_KIND.VICIOUS,
      label: 'Círculo vicioso: caja vacía y derrotas',
      note: 'No hay plata y el equipo pierde: en el palco preguntan quién firma los cheques y en el vestuario, quién les paga.',
      effects: { fans: scaleEffect(-2, difficulty), board: scaleEffect(-4, difficulty), locker: scaleEffect(-4, difficulty) }
    })
  }

  // Ganar con la enfermería llena une al grupo
  if (streaks.win === 4 && injuredCount >= 3) {
    found.push({
      key: 'GRIT_WINS',
      kind: COMBO_KIND.COMBO,
      label: 'Ganan con la enfermería llena',
      note: 'Cuatro victorias seguidas con varios lesionados: los que quedan se hicieron fuertes y el barrio lo reconoce.',
      effects: { fans: scaleEffect(3, difficulty), board: scaleEffect(1, difficulty), locker: scaleEffect(6, difficulty) }
    })
  }

  // Plata en caja y buen momento: se habla de refuerzos
  if (cash !== null && cash >= 20000 && streaks.win === 3) {
    found.push({
      key: 'FUNDED_MOMENTUM',
      kind: COMBO_KIND.COMBO,
      label: 'Plata en caja y buen momento',
      note: 'Tres victorias seguidas y la caja holgada: el presidente se anima a hablar de refuerzos.',
      effects: { fans: scaleEffect(2, difficulty), board: scaleEffect(3, difficulty), locker: scaleEffect(2, difficulty) }
    })
  }

  return found
}
