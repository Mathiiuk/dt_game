/**
 * Pretemporada: las semanas hasta la primera fecha de la liga no hay taquilla y los sueldos se pagan igual.
 * La dirigencia pone la mitad de los sueldos y aparecen amistosos con riesgo y recompensa. Funciones puras.
 */

export const PRESEASON_WAGE_COVER = 1.0 // la dirigencia cubre la mitad de los sueldos del plantel
export const PRESEASON_EVENT_WEEKS = [2, 4] // semanas de la temporada en las que llega un amistoso

const day = (d) => String(d || '').slice(0, 10)

/** ¿Falta para el primer partido de liga? (la fecha de juego es anterior a la del primer partido) */
export const isPreseason = (gameDate, firstFixtureDate) => Boolean(gameDate && firstFixtureDate && day(gameDate) < day(firstFixtureDate))

/** Aporte de la dirigencia a los sueldos de una semana de pretemporada */
export const preseasonAid = (playerWages) => Math.round(Math.max(0, Number(playerWages) || 0) * PRESEASON_WAGE_COVER)

const FRIENDLIES = {
  2: {
    template_code: 'EVT_PRESEASON_FRIENDLY_1',
    title: 'Amistoso de pretemporada',
    description: 'Un cuadro de la zona te propone un amistoso para probar el plantel. Hay gente en las gradas, un chorizo en cada mano y un presidente que quiere ver algo para el domingo. Vos decidís cómo lo jugás.',
    options: [
      {
        id: 'SAFE', label: 'Jugarlo en la canchita del barrio', cost: 0,
        description: 'Colecta de los vecinos y partido tranquilo: entran $500, la hinchada se acerca y el plantel se suelta.',
        effects: { budget: 500, fans: 2, locker: 1 }
      },
      {
        id: 'GAMBLE', label: 'Retar al campeón de la categoría', cost: 300,
        description: 'Viaje y cancha llena. Mitad y mitad: si les ganás, la prensa lo cuenta y el vestuario vuela; si te golean, duele.',
        effects: {
          action: 'GAMBLE_FRIENDLY',
          gamble: {
            chance: 0.5,
            win: { fans: 5, locker: 4, board: 2 }, winNote: '¡Les ganaron al campeón! La prensa lo cuenta y el vestuario está en las nubes.',
            lose: { fans: -2, locker: -3 }, loseNote: 'Los golearon en cancha ajena. El vestuario vuelve en silencio.'
          }
        }
      },
      {
        id: 'ASADO', label: 'Cancelarlo y hacer un asado de pretemporada', cost: 200,
        description: 'Sin partido, pero con parrilla: el grupo se une.',
        effects: { locker: 4 }
      }
    ]
  },
  4: {
    template_code: 'EVT_PRESEASON_FRIENDLY_2',
    title: 'Cuadrangular de verano',
    description: 'Los clubes de la zona arman un cuadrangular de verano para estrenar las camisetas. Premio: una copa de plástico, un jamón crudo y mucho orgullo. La semana que viene arranca el torneo de verdad.',
    options: [
      {
        id: 'SAFE', label: 'Ir con el plantel entero y a divertirse', cost: 0,
        description: 'Sin presión: ganás ritmo, la gente se entretiene y entra algo de plata por la entrada.',
        effects: { budget: 400, fans: 2, locker: 2 }
      },
      {
        id: 'GAMBLE', label: 'Meter a los pibes de la cantera de titulares', cost: 0,
        description: 'Apuesta de DT valiente. Si salen campeones, nace una leyenda; si no, el palco pregunta quién fue el de la idea.',
        effects: {
          action: 'GAMBLE_FRIENDLY',
          gamble: {
            chance: 0.4,
            win: { fans: 6, locker: 3, board: 3 }, winNote: '¡Los pibes se llevaron la copa! Ya hay cantito para el 9 de la cantera.',
            lose: { fans: -1, locker: -1, board: -2 }, loseNote: 'Los pibes quedaron afuera en la primera ronda y el palco no perdona.'
          }
        }
      },
      {
        id: 'SKIP', label: 'No ir: cuidar las piernas para el debut', cost: 0,
        description: 'Los jugadores descansan, pero algunos hinchas lo toman como falta de ganas.',
        effects: { locker: 1, fans: -1 }
      }
    ]
  }
}

/** Evento de pretemporada de la semana (o null); `category` y `severity` los pide la tabla de eventos */
export function preseasonEvent(week) {
  const base = FRIENDLIES[week]
  return base ? { ...base, category: 'COMMUNITY', severity: 'LOW' } : null
}

/** Resuelve la apuesta de un amistoso: `rng` devuelve de 0 a 1. */
export function resolveFriendlyGamble(gamble, rng = Math.random) {
  const won = rng() < gamble.chance
  return { won, effects: won ? gamble.win : gamble.lose, note: won ? gamble.winNote : gamble.loseNote }
}
