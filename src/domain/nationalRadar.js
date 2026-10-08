/**
 * Dominio de Selección Nacional: Radar de Convocatorias, Termómetro de Carrera y Mística Deportiva
 */

const COUNTRY_PROFILES = {
  AR: {
    code: 'AR',
    name: 'Argentina',
    nickname: 'Albiceleste',
    flag: '🇦🇷',
    federation: 'AFA',
    colors: { primary: '#75AADB', secondary: '#FFFFFF', accent: '#F6B40E' },
    headlineStyle: 'argentino'
  },
  BR: {
    code: 'BR',
    name: 'Brasil',
    nickname: 'Canarinha',
    flag: '🇧🇷',
    federation: 'CBF',
    colors: { primary: '#FEE101', secondary: '#009739', accent: '#002776' },
    headlineStyle: 'brasileno'
  },
  UY: {
    code: 'UY',
    name: 'Uruguay',
    nickname: 'Celeste',
    flag: '🇺🇾',
    federation: 'AUF',
    colors: { primary: '#0038A8', secondary: '#FFFFFF', accent: '#F6B40E' },
    headlineStyle: 'uruguayo'
  },
  CL: {
    code: 'CL',
    name: 'Chile',
    nickname: 'La Roja',
    flag: '🇨🇱',
    federation: 'FFCh',
    colors: { primary: '#D52B1E', secondary: '#0039A6', accent: '#FFFFFF' },
    headlineStyle: 'chileno'
  },
  CO: {
    code: 'CO',
    name: 'Colombia',
    nickname: 'Tricolor',
    flag: '🇨🇴',
    federation: 'FCF',
    colors: { primary: '#FCD116', secondary: '#003893', accent: '#CE1126' },
    headlineStyle: 'colombiano'
  }
}

/**
 * Obtiene la identidad de un país configurado o Argentina por defecto
 */
export function getCountryIdentity(code = 'AR') {
  return COUNTRY_PROFILES[code?.toUpperCase()] || COUNTRY_PROFILES.AR
}

/**
 * Calcula el termómetro de progreso hacia la selección nacional
 */
export function calculateNationalGauge(manager = {}) {
  const rep = Number(manager?.reputation || 15)
  // Escala de 0 a 100 de reputación mapeada a porcentaje
  const percentage = Math.min(100, Math.max(5, Math.round((rep / 90) * 100)))

  let tierName = 'DT en Formación'
  let nextMilestone = 'Llegar a 35 de reputación para la Sub-20'
  let description = 'Tus campañas en el ascenso empiezan a llamar la atención en el periodismo barrial.'

  if (rep >= 75) {
    tierName = 'Candidato Selección Mayor'
    nextMilestone = 'Asumir el buzo de la Selección Mayor'
    description = 'Estás en la terna principal de los candidatos elegidos por la federación.'
  } else if (rep >= 50) {
    tierName = 'En el Radar Olímpico (Sub-23)'
    nextMilestone = 'Consolidar títulos para la Selección Mayor'
    description = 'Tu estilo ofensivo y manejo de grupo te colocan como favorito para dirigir el Preolímpico.'
  } else if (rep >= 30) {
    tierName = 'Mencionado en la Prensa'
    nextMilestone = 'Lograr un ascenso o título para la Sub-23'
    description = 'Los programas deportivos debaten tus tácticas y destacan el crecimiento de tus figuras.'
  }

  return {
    percentage,
    reputation: rep,
    tierName,
    nextMilestone,
    description,
    rules: [
      { action: 'Ascenso de categoría', impact: '+15%' },
      { action: 'Título de liga', impact: '+25%' },
      { action: 'Título de copa', impact: '+15%' },
      { action: 'Ganar un clásico', impact: '+5%' },
      { action: 'Formar un jugador convocado', impact: '+3%' },
      { action: 'Dirigir un interinato con victoria', impact: '+10%' },
      { action: 'Descenso de división', impact: '-30%' },
      { action: 'Temporada sin logros ni clasificación', impact: '-5%' }
    ]
  }
}

/**
 * Evalúa el radar de convocatorias de la selección para el plantel del club
 */
export function evaluateNationalRadar(players = [], _managerRep = 20, countryCode = 'AR') {
  const country = getCountryIdentity(countryCode)
  const results = []

  for (const p of players) {
    const age = Number(p.age || 22)
    const ovr = Number(p.attr_overall || p.overall || 50)

    let category = null
    let threshold = 999

    if (age <= 17 && ovr >= 48) {
      category = 'Sub-17'
      threshold = 50
    } else if (age <= 20 && ovr >= 54) {
      category = 'Sub-20'
      threshold = 56
    } else if (age <= 23 && ovr >= 60) {
      category = 'Sub-23'
      threshold = 63
    } else if (ovr >= 66) {
      category = 'Mayor'
      threshold = 68
    }

    if (category) {
      const isCalledUp = ovr >= threshold
      const chance = isCalledUp ? 100 : Math.min(95, Math.max(30, Math.round(((ovr - threshold + 5) / 5) * 100)))

      results.push({
        player: p,
        category,
        stars: category === 'Mayor' ? 4 : category === 'Sub-23' ? 3 : category === 'Sub-20' ? 2 : 1,
        status: isCalledUp ? 'called_up' : 'in_radar',
        probability: chance,
        headline: isCalledUp
          ? `¡Convocado a la ${category}!`
          : `En el radar de la ${category} (${chance}% prob.)`,
        benefits: {
          moralBoost: 100,
          valueBoost: 25,
          fanPride: category === 'Mayor' ? 15 : 10,
          allowance: category === 'Mayor' ? 3500 : 1500
        },
        costs: {
          fatigue: 20,
          injuryRisk: 10,
          wageDemandBump: 15
        }
      })
    }
  }

  // Ordenar por estrellas y probabilidad
  results.sort((a, b) => b.stars - a.stars || b.probability - a.probability)

  return {
    country,
    players: results,
    calledUpCount: results.filter(r => r.status === 'called_up').length,
    inRadarCount: results.filter(r => r.status === 'in_radar').length
  }
}

/**
 * Genera titulares de prensa vivos sobre la selección y las figuras del club
 */
export function generateNationalHeadlines(radarEntries = [], _manager = {}, nickname = 'Albiceleste') {
  if (!radarEntries || radarEntries.length === 0) {
    return [
      `El cuerpo técnico de la ${nickname} recorre las canchas del ascenso buscando sangre nueva.`,
      `"Buscamos hambre y talento": la consigna del seleccionador nacional para la próxima convocatoria.`
    ]
  }

  const headlines = []
  for (const entry of radarEntries.slice(0, 3)) {
    const name = `${entry.player.first_name} ${entry.player.last_name}`
    if (entry.status === 'called_up') {
      headlines.push(`¡${name} al combinado nacional! Convocado a la ${entry.category} de la ${nickname}.`)
      headlines.push(`"Un sueño hecho realidad": la emoción de ${entry.player.last_name} tras recibir la citación.`)
    } else {
      headlines.push(`El seleccionador nacional sigue de cerca a ${name} (${entry.player.position}).`)
    }
  }

  return headlines
}
