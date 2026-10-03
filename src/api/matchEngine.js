// Motor de simulación mejorado (Fase 10)
export const simulateMatch = (homeTactic, homePlayers, awayTactic, awayPlayers, seed = Math.random()) => {
  const rng = () => {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  // 1. Calcular Poder Base
  const calcBasePower = (players) => {
    const baseFitness = players.reduce((acc, p) => acc + p.state_fitness, 0) / (players.length || 1)
    const basePace = players.reduce((acc, p) => acc + p.attr_pace, 0) / (players.length || 1)
    const baseFinishing = players.reduce((acc, p) => acc + p.attr_finishing, 0) / (players.length || 1)
    const baseDefending = players.reduce((acc, p) => acc + (p.attr_defending || 50), 0) / (players.length || 1)
    
    return {
      fitness: baseFitness,
      attack: basePace * 0.4 + baseFinishing * 0.6,
      defense: basePace * 0.3 + baseDefending * 0.7
    }
  }

  const homeBase = calcBasePower(homePlayers)
  const awayBase = calcBasePower(awayPlayers)

  // 2. Modificadores Tácticos (Piedra-Papel-Tijera)
  const applyTactics = (base, myTactic, oppTactic) => {
    let attack = base.attack
    let defense = base.defense
    
    // Mentalidad
    if (myTactic.mentality === 'Ofensiva') { attack *= 1.2; defense *= 0.8 }
    if (myTactic.mentality === 'Defensiva') { attack *= 0.8; defense *= 1.2 }

    // Duelos tácticos (Build Up vs Pressure)
    if (myTactic.build_up === 'Posesión' && oppTactic.pressure === 'Alta') {
      // Presión alta asfixia la posesión si el fitness del rival es bueno
      attack *= 0.85
    } else if (myTactic.build_up === 'Contragolpe' && oppTactic.pressure === 'Alta') {
      // Contragolpe rompe presión alta
      attack *= 1.25
    } else if (myTactic.build_up === 'Posesión' && oppTactic.pressure === 'Baja') {
      // Posesión cómoda contra presión baja
      attack *= 1.15
    }

    // Efecto del Ritmo (Tempo)
    let fitnessDrain = 0.5 // base por minuto
    if (myTactic.tempo === 'Alto') {
      attack *= 1.15
      fitnessDrain = 0.8 // Drena más rápido
    } else if (myTactic.tempo === 'Lento') {
      defense *= 1.1
      fitnessDrain = 0.3 // Drena menos
    }

    return { attack, defense, fitnessDrain, fitness: base.fitness }
  }

  const homeStats = applyTactics(homeBase, homeTactic, awayTactic)
  const awayStats = applyTactics(awayBase, awayTactic, homeTactic)

  // Localía
  homeStats.attack *= 1.1
  homeStats.defense *= 1.1

  const events = []
  let homeScore = 0
  let awayScore = 0

  // 3. Simular 90 minutos
  for (let min = 1; min <= 90; min++) {
    // Reducir fitness
    homeStats.fitness = Math.max(0, homeStats.fitness - homeStats.fitnessDrain)
    awayStats.fitness = Math.max(0, awayStats.fitness - awayStats.fitnessDrain)

    // El poder actual cae con el fitness
    const curHomeAtt = homeStats.attack * (0.5 + (homeStats.fitness / 200))
    const curHomeDef = homeStats.defense * (0.5 + (homeStats.fitness / 200))
    const curAwayAtt = awayStats.attack * (0.5 + (awayStats.fitness / 200))
    const curAwayDef = awayStats.defense * (0.5 + (awayStats.fitness / 200))

    const chance = rng()
    
    // Ocasión de gol
    if (chance < 0.12) {
      const totalPower = curHomeAtt + curAwayAtt
      const homeAttackChance = curHomeAtt / totalPower
      
      const isHomeEvent = rng() < homeAttackChance
      const attackerPower = isHomeEvent ? curHomeAtt : curAwayAtt
      const defenderPower = isHomeEvent ? curAwayDef : curHomeDef
      const teamId = isHomeEvent ? 'home' : 'away'
      
      const goalProbability = Math.max(0.05, Math.min(0.4, (attackerPower / defenderPower) * 0.15))
      
      if (rng() < goalProbability) {
        if (isHomeEvent) homeScore++
        else awayScore++
        events.push({ minute: min, type: 'GOAL', team: teamId, text: `¡GOL! Excelente definición tras una gran jugada de ${teamId === 'home' ? 'los locales' : 'la visita'}.` })
      } else {
        if (rng() < 0.4) {
          events.push({ minute: min, type: 'SAVE', team: isHomeEvent ? 'away' : 'home', text: '¡Ufff! El arquero salva lo que era un gol cantado.' })
        } else if (rng() < 0.3) {
          events.push({ minute: min, type: 'MISS', team: teamId, text: 'Disparo desviado por muy poco. Se salva la defensa.' })
        }
      }
    }
    
    // Tarjetas y lesiones en el partido
    if (rng() < 0.03) {
       const isHomeEvent = rng() < 0.5
       const isRed = rng() < 0.05
       events.push({ 
         minute: min, 
         type: isRed ? 'CARD_RED' : 'CARD_YELLOW', 
         team: isHomeEvent ? 'home' : 'away', 
         text: isRed ? '¡Tarjeta ROJA directa por una entrada temeraria!' : 'Tarjeta amarilla por llegar tarde al cruce.' 
       })
    }

    if (rng() < 0.01) {
       const isHomeEvent = rng() < 0.5
       events.push({ 
         minute: min, 
         type: 'INJURY', 
         team: isHomeEvent ? 'home' : 'away', 
         text: 'Jugador caído con gestos de dolor, parece muscular.' 
       })
    }
  }

  // Evento final
  events.push({ minute: 90, type: 'END', team: 'none', text: 'El árbitro marca el final del partido.' })

  return {
    homeScore,
    awayScore,
    events
  }
}
