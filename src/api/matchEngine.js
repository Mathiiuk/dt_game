// Motor de simulación simple para Phase 10

export const simulateMatch = (homeTactic, homePlayers, awayTactic, awayPlayers, seed = Math.random()) => {
  // Inicializar RNG simple con seed
  const rng = () => {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  const calcTeamPower = (tactic, players) => {
    // Calcular un "poder" global del equipo
    const baseFitness = players.reduce((acc, p) => acc + p.state_fitness, 0) / (players.length || 1)
    const basePace = players.reduce((acc, p) => acc + p.attr_pace, 0) / (players.length || 1)
    const baseFinishing = players.reduce((acc, p) => acc + p.attr_finishing, 0) / (players.length || 1)
    
    // Tactic multipliers
    let attackMultiplier = tactic.mentality === 'Ofensiva' ? 1.2 : tactic.mentality === 'Defensiva' ? 0.8 : 1.0
    let defenseMultiplier = tactic.mentality === 'Defensiva' ? 1.2 : tactic.mentality === 'Ofensiva' ? 0.8 : 1.0
    
    return {
      attack: (basePace * 0.4 + baseFinishing * 0.6) * attackMultiplier * (baseFitness / 100),
      defense: (basePace * 0.5 + 50) * defenseMultiplier * (baseFitness / 100)
    }
  }

  const homePower = calcTeamPower(homeTactic, homePlayers)
  const awayPower = calcTeamPower(awayTactic, awayPlayers)
  
  // Ventaja de localía
  homePower.attack *= 1.1
  homePower.defense *= 1.1

  const events = []
  let homeScore = 0
  let awayScore = 0

  // Simular 90 minutos
  for (let min = 1; min <= 90; min++) {
    const chance = rng()
    
    // Probabilidad de ocasión: ~10% por minuto
    if (chance < 0.10) {
      // Determinar quién tiene la ocasión
      const totalPower = homePower.attack + awayPower.attack
      const homeAttackChance = homePower.attack / totalPower
      
      const isHomeEvent = rng() < homeAttackChance
      const attackerPower = isHomeEvent ? homePower.attack : awayPower.attack
      const defenderPower = isHomeEvent ? awayPower.defense : homePower.defense
      
      // Probabilidad de gol basada en la diferencia ataque/defensa
      const goalProbability = Math.max(0.05, Math.min(0.3, (attackerPower / defenderPower) * 0.15))
      
      if (rng() < goalProbability) {
        if (isHomeEvent) {
          homeScore++
          events.push({ minute: min, type: 'GOAL', team: 'home', text: '¡GOL del equipo local!' })
        } else {
          awayScore++
          events.push({ minute: min, type: 'GOAL', team: 'away', text: '¡GOL del equipo visitante!' })
        }
      } else {
        if (rng() < 0.3) {
          events.push({ minute: min, type: 'SAVE', team: isHomeEvent ? 'home' : 'away', text: 'Gran atajada del arquero.' })
        }
      }
    }
    
    // Tarjetas aleatorias
    if (rng() < 0.02) {
       const isHomeEvent = rng() < 0.5
       events.push({ minute: min, type: 'CARD_YELLOW', team: isHomeEvent ? 'home' : 'away', text: 'Tarjeta amarilla por falta táctica.' })
    }
  }

  return {
    homeScore,
    awayScore,
    events
  }
}
