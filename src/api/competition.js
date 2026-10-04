import { supabase } from './supabase'
import { queryCache } from '../utils/cache'

export const competitionApi = {
  async getStandings(clubId) {
    if (!clubId) return []

    return queryCache.fetch(`standings:${clubId}`, async () => {
      const { data: myStanding, error } = await supabase
        .from('standings')
        .select('*, competitions(*)')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        
      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching myStanding:', error)
      }
      
      if (myStanding && myStanding.competition_id) {
         const { data: allStandings, error: allErr } = await supabase
           .from('standings')
           .select('*, clubs(name, short_name)')
           .eq('competition_id', myStanding.competition_id)
           .order('points', { ascending: false })
           .order('goals_for', { ascending: false })
           
         if (allErr) {
           console.error('Error fetching allStandings:', allErr)
           return []
         }
         return allStandings || []
      }
      return null
    }, 60000)
  },

  async initializeLeague(playerClubId, country) {
    if (!playerClubId) return null

    // 0. Verificar si ya existe liga para este club (idempotencia estricta)
    const { data: existing } = await supabase
      .from('standings')
      .select('competition_id')
      .eq('club_id', playerClubId)
      .limit(1)
      .maybeSingle()

    if (existing?.competition_id) {
      return existing.competition_id
    }

    // 1. Crear competición
    const { data: comp, error: compErr } = await supabase
      .from('competitions')
      .insert([{ name: `Liga Amateur de ${country || 'Argentina'}`, level: 4, teams_count: 20 }])
      .select().single()
      
    if (compErr) throw new Error(compErr.message)

    // 2. Crear 19 clubes IA
    const aiClubsData = Array.from({ length: 19 }).map((_, i) => ({
      name: `Club Bot ${i + 1} FC`,
      short_name: `BOT${i+1}`,
      city: 'Ciudad IA',
      country: country,
      founded_year: 1900 + i,
      colors: '#000000',
      history_type: 'bot',
      budget: 50000,
      wage_budget: 2000,
      reputation: 10,
      stadium_name: 'Estadio Bot',
      stadium_capacity: 1000
    }))

    const { data: aiClubs, error: clubsErr } = await supabase
      .from('clubs')
      .insert(aiClubsData)
      .select('id')

    if (clubsErr) throw new Error(clubsErr.message)

    // 2.5 Generar jugadores para la IA
    const { playerApi } = await import('./player')
    let aiPlayersToInsert = []
    for (const ai of aiClubs) {
      const players = playerApi.generatePlayersArray(ai.id, 10)
      aiPlayersToInsert = [...aiPlayersToInsert, ...players]
    }
    
    const { error: pErr } = await supabase.from('players').insert(aiPlayersToInsert)
    if (pErr) throw new Error(pErr.message)

    const allClubIds = [playerClubId, ...aiClubs.map(c => c.id)]

    // 3. Insertar en Standings
    const standingsData = allClubIds.map(id => ({
      competition_id: comp.id,
      club_id: id
    }))
    await supabase.from('standings').insert(standingsData)

    // 4. Algoritmo de Berger para Fixtures (19 fechas ida, 19 fechas vuelta)
    // Número par de equipos (20)
    const n = allClubIds.length
    const rounds = n - 1
    const halfSize = n / 2
    let teams = [...allClubIds]
    
    const fixturesData = []
    let startDate = new Date('2026-08-01')

    for (let round = 0; round < rounds; round++) {
      // Avanzamos 7 días por cada fecha
      const matchDate = new Date(startDate)
      matchDate.setDate(startDate.getDate() + (round * 7))

      for (let i = 0; i < halfSize; i++) {
        let home = teams[i]
        let away = teams[n - 1 - i]

        // Alternar localía en la primera rueda
        if (i === 0 && round % 2 === 1) {
          const temp = home
          home = away
          away = temp
        }

        // Ida
        fixturesData.push({
          competition_id: comp.id,
          match_week: round + 1,
          home_team_id: home,
          away_team_id: away,
          match_date: matchDate.toISOString()
        })

        // Vuelta (+19 semanas)
        const returnDate = new Date(matchDate)
        returnDate.setDate(returnDate.getDate() + (rounds * 7))
        fixturesData.push({
          competition_id: comp.id,
          match_week: round + 1 + rounds,
          home_team_id: away,
          away_team_id: home,
          match_date: returnDate.toISOString()
        })
      }

      // Rotación Berger: mantenemos el índice 0 fijo y rotamos el resto
      teams.splice(1, 0, teams.pop())
    }

    // Insert en batches para no ahogar a Supabase (380 registros)
    for (let i = 0; i < fixturesData.length; i += 100) {
      const batch = fixturesData.slice(i, i + 100)
      const { error: fixErr } = await supabase.from('fixtures').insert(batch)
      if (fixErr) throw new Error(fixErr.message)
    }

    return true
  },

  async simulateMatchDay(currentDate) {
    // Buscar todos los partidos pendientes hasta la fecha actual
    const { data: fixtures, error } = await supabase
      .from('fixtures')
      .select('*, home:clubs!home_team_id(*), away:clubs!away_team_id(*)')
      .eq('status', 'PENDING')
      .lte('match_date', currentDate)

    if (error) throw new Error(error.message)
    if (!fixtures || fixtures.length === 0) return 0

    // Para el MVP, asumimos que si hay un partido del usuario pendiente y llegó hasta acá, lo simulamos automáticamente.
    // (Idealmente el frontend lo bloquea).
    const { simulateMatch } = await import('./matchEngine')

    for (const match of fixtures) {
      // Simular con tácticas base (Equilibrado para IA)
      const aiTactic = { mentality: 'Equilibrada', build_up: 'Posesión', pressure: 'Media', tempo: 'Normal' }
      
      // Equipos IA no tienen jugadores creados en DB aún para optimizar, 
      // así que usamos atributos por defecto basados en reputación
      const getAiPlayers = (rep) => Array.from({ length: 11 }).map(() => ({
        state_fitness: 90, 
        attr_pace: 40 + (rep * 0.5), 
        attr_finishing: 40 + (rep * 0.5), 
        attr_defending: 40 + (rep * 0.5)
      }))

      // Si es el usuario real, podríamos buscar sus tácticas reales, pero por simplicidad
      // del sim background, usamos la reputación
      const homePlayers = getAiPlayers(match.home.reputation)
      const awayPlayers = getAiPlayers(match.away.reputation)

      const result = simulateMatch(aiTactic, homePlayers, aiTactic, awayPlayers)

      // Guardar fixture
      await supabase.from('fixtures')
        .update({ status: 'PLAYED', home_score: result.homeScore, away_score: result.awayScore })
        .eq('id', match.id)

      // Actualizar Standings
      await this._updateStandings(match.competition_id, match.home_team_id, match.away_team_id, result.homeScore, result.awayScore)
    }

    return fixtures.length
  },

  async _updateStandings(compId, homeId, awayId, homeScore, awayScore) {
    // Fetch both standings
    const { data: standings } = await supabase
      .from('standings')
      .select('*')
      .eq('competition_id', compId)
      .in('club_id', [homeId, awayId])

    const homeSt = standings.find(s => s.club_id === homeId)
    const awaySt = standings.find(s => s.club_id === awayId)

    if (!homeSt || !awaySt) return

    const updateSt = (st, gf, gc) => {
      st.played += 1
      st.goals_for += gf
      st.goals_against += gc
      if (gf > gc) { st.won += 1; st.points += 3 }
      else if (gf === gc) { st.drawn += 1; st.points += 1 }
      else { st.lost += 1 }
      return st
    }

    await supabase.from('standings').update(updateSt(homeSt, homeScore, awayScore)).eq('id', homeSt.id)
    await supabase.from('standings').update(updateSt(awaySt, awayScore, homeScore)).eq('id', awaySt.id)
  }
}
