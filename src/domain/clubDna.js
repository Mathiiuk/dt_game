/**
 * Dominio de ADN, Clima de Tribuna y Dinámicas de Vestuario para /club.
 * Traduce números en instituciones vivas, historias y lenguaje humano.
 */

/**
 * Calcula el ADN institucional del club basado en su historia, cantera y categoría
 */
export function calculateClubDNA(club = {}, history = [], trophies = []) {
  const founded = Number(club.founded_year || 2026)
  const currentYear = new Date().getFullYear()
  const yearsOfHistory = Math.max(1, currentYear - founded)

  const academyLevel = Number(club.academy_level || 1)
  const tier = Number(club.league_tier || 5)
  const titlesCount = trophies.length + history.filter(h => h.champions || h.title_won).length

  // Métricas de ADN (0 a 100)
  const cantera = Math.min(99, Math.round(academyLevel * 22 + (tier <= 3 ? 15 : 20)))
  const identidadLocal = Math.min(99, Math.round(50 + (yearsOfHistory > 50 ? 30 : yearsOfHistory * 0.5) + (club.city ? 10 : 0)))
  const tradicion = Math.min(99, Math.round(Math.min(50, yearsOfHistory * 0.7) + titlesCount * 15 + (tier <= 2 ? 20 : 5)))
  const potrero = Math.min(99, Math.round(Math.max(20, 100 - tier * 12 + (cantera > 60 ? 15 : 0))))

  // Determinar rasgo principal (arquetipo del club)
  let primaryTrait = 'Orgullo de barrio'
  let subtitle = 'Un club forjado en la identidad local y el sentido de pertenencia.'

  if (cantera >= 75) {
    primaryTrait = 'Cantera inagotable'
    subtitle = 'El semillero nutre al primer equipo y es el orgullo de la institución.'
  } else if (tradicion >= 70 || titlesCount >= 3) {
    primaryTrait = 'Mística copera'
    subtitle = 'La gloria pasada y los trofeos imponen respeto en cualquier cancha.'
  } else if (potrero >= 75 || tier >= 4) {
    primaryTrait = 'Puro potrero y garra'
    subtitle = 'Cancha brava, dientes apretados y fútbol de barrio que nunca se rinde.'
  }

  return {
    primaryTrait,
    subtitle,
    summary: `${yearsOfHistory} años de historia en ${club.city || 'la ciudad'}.`,
    attributes: {
      cantera,
      identidadLocal,
      tradicion,
      potrero
    }
  }
}

/**
 * Devuelve el clima social y de la hinchada en lenguaje vivo
 */
export function getClubAtmosphere(fanbase = {}) {
  const popularity = Number(fanbase.popularity || 60)
  const satisfaction = Number(fanbase.satisfaction || fanbase.confidence || 75)
  const members = Number(fanbase.members_count || fanbase.socios || 5000)
  const capacity = Number(fanbase.stadium_capacity || 8000)
  const attendance = Number(fanbase.last_attendance || Math.round(capacity * 0.78))

  const attendancePercent = capacity > 0 ? Math.min(100, Math.round((attendance / capacity) * 100)) : 75

  let headline = 'La gente te banca'
  let summary = 'Hay ilusión en las tribunas y apoyo masivo al proyecto deportivo.'

  if (satisfaction >= 85) {
    headline = 'La gente te banca y sueña despierta'
    summary = 'Clima de fiesta en la tribuna: la comunión entre el equipo y la gente es total.'
  } else if (satisfaction <= 45) {
    headline = 'Murmullos e impaciencia en la platea'
    summary = 'La hinchada exige juego y resultados inmediatos; el crédito del DT se acorta.'
  } else if (popularity >= 80) {
    headline = 'El club es furor en la ciudad'
    summary = 'Crece la masa de socios y las banderas colman cada fin de semana el estadio.'
  }

  const events = [
    'Banderazo masivo antes del próximo partido',
    'Reconocimiento a las glorias históricas en la previa',
    'La tribuna popular agotó las localidades temprano',
    'Caravana de socios acompañando la salida del plantel'
  ]
  const latestEvent = fanbase.latest_event || events[Math.abs(popularity + satisfaction) % events.length]

  return {
    headline,
    summary,
    popularity,
    satisfaction,
    sociosCount: members,
    attendanceRate: `${attendancePercent}%`,
    latestEvent
  }
}

/**
 * Evalúa las relaciones humanas del vestuario
 */
export function getLockerRoomDynamics(squad = []) {
  if (!squad || squad.length === 0) {
    return {
      headline: 'Vestuario en formación',
      summary: 'El plantel aún está armando sus lazos de afinidad.',
      cohesionStatus: 'En proceso',
      moraleStatus: 'Estable',
      leaders: [],
      prospects: [],
      conflictsCount: 0
    }
  }

  const avgMorale = Math.round(squad.reduce((sum, p) => sum + (p.state_morale || 70), 0) / squad.length)
  const leaders = squad.filter(p => (p.age || 25) >= 29).slice(0, 3)
  const prospects = squad.filter(p => (p.age || 25) <= 21).slice(0, 3)

  let headline = 'El grupo está unido'
  let summary = 'Los referentes marcan el camino y los más jóvenes responden con entrega.'
  let cohesionStatus = 'Alta'

  if (avgMorale >= 80) {
    headline = 'Vestuario blindado y comprometido'
    summary = 'Convivencia ideal: todos tiran para el mismo lado bajo el liderazgo del cuerpo técnico.'
    cohesionStatus = 'Muy alta'
  } else if (avgMorale <= 50) {
    headline = 'Tensión y caras largas tras los entrenamientos'
    summary = 'La falta de victorias empieza a generar discusiones tácticas internas.'
    cohesionStatus = 'Frágil'
  }

  const moraleStatus = avgMorale >= 75 ? 'Excelente' : avgMorale >= 60 ? 'Buena' : 'Preocupante'

  return {
    headline,
    summary,
    cohesionStatus,
    moraleStatus,
    leaders,
    prospects,
    conflictsCount: avgMorale < 55 ? 1 : 0
  }
}

/**
 * Consecuencias en lenguaje humano al cambiar de capitán
 */
export function evaluateCaptainChange(currentCaptain, newCaptain) {
  const oldName = currentCaptain?.last_name || currentCaptain?.first_name || 'el capitán actual'
  const newName = newCaptain?.last_name || newCaptain?.first_name || 'el nuevo capitán'

  return {
    riskNotice: `Sacarle la cinta a ${oldName} puede generar descontento en los referentes históricos.`,
    summary: `Entregarle el liderazgo a ${newName} renueva la voz de mando en el campo de juego.`,
    impact: {
      moraleDelta: -6,
      leadershipGain: Math.min(10, Math.round((newCaptain?.attr_overall || 60) * 0.1))
    }
  }
}
