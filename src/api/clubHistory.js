import { supabase } from './supabase'

/**
 * Servicio de Historia del Club, Récords, Hemeroteca e Ídolos
 * Cumple con las especificaciones de Fase 36 (Historia del Club y Récords) y Fase 37 (Ídolos).
 */
export const clubHistoryApi = {
  /**
   * Obtiene la línea de tiempo completa del club (hitos históricos)
   */
  async getClubMilestones(clubId, category = 'all') {
    if (!clubId) return []

    let query = supabase
      .from('club_milestones')
      .select('*')
      .eq('club_id', clubId)
      .order('year', { ascending: false })
      .order('created_at', { ascending: false })

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data: milestones, error } = await query

    if (error) {
      console.error('Error fetching club milestones:', error)
      return []
    }

    // Si no tiene hitos aún, inicializamos con el de fundación
    if (!milestones || milestones.length === 0) {
      const { data: club } = await supabase.from('clubs').select('name, founded_year, city, created_at').eq('id', clubId).single()
      if (club) {
        const year = club.founded_year || new Date(club.created_at || Date.now()).getFullYear()
        const defaultMilestone = {
          club_id: clubId,
          year,
          game_date: `${year}-08-01`,
          title: 'Fundación Oficial del Club',
          description: `Nace el Club ${club.name} en ${club.city || 'su localidad'}, dando inicio al sueño institucional con trabajo, potrero y pasión comunitaria.`,
          category: 'foundation',
          importance: 5
        }
        const { data: created } = await supabase.from('club_milestones').insert(defaultMilestone).select().single()
        return created ? [created] : [defaultMilestone]
      }
    }

    return milestones
  },

  /**
   * Registra un hito en la historia del club
   */
  async addMilestone(clubId, { year, game_date, title, description, category = 'milestone', importance = 1 }) {
    if (!clubId || !title) return null
    const { data, error } = await supabase.from('club_milestones').insert({
      club_id: clubId,
      year: year || 2026,
      game_date: game_date || new Date().toISOString().split('T')[0],
      title,
      description,
      category,
      importance
    }).select().single()

    if (error) {
      console.error('Error adding club milestone:', error)
      return null
    }
    return data
  },

  /**
   * Obtiene los artículos y crónicas periodísticas históricas (Hemeroteca)
   */
  async getHemeroteca(clubId) {
    if (!clubId) return []

    const { data, error } = await supabase
      .from('club_hemeroteca')
      .select('*')
      .eq('club_id', clubId)
      .order('season_year', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching hemeroteca:', error)
      return []
    }

    if (!data || data.length === 0) {
      // Sembrar nota fundacional inaugural
      const { data: club } = await supabase.from('clubs').select('name, city, founded_year').eq('id', clubId).single()
      const initialArticle = {
        club_id: clubId,
        season_year: club?.founded_year || 2026,
        headline: `Comienza la odisea de ${club?.name || 'nuestro club'} hacia el profesionalismo`,
        snippet: `Con tribunas colmadas de sueños y un vestuario comprometido, el club abre una nueva página en el fútbol argentino. La ilusión de la hinchada está intacta para forjar un legado eterno.`,
        media_source: 'El Gráfico del Potrero',
        tag: 'INSTITUCIONAL'
      }
      const { data: created } = await supabase.from('club_hemeroteca').insert(initialArticle).select().single()
      return created ? [created] : [initialArticle]
    }

    return data
  },

  /**
   * Agrega un nuevo recorte de prensa a la hemeroteca
   */
  async addHemerotecaArticle(clubId, { season_year = 2026, headline, snippet, media_source = 'El Clarín Deportivo', tag = 'CRONICA' }) {
    if (!clubId || !headline) return null
    const { data, error } = await supabase.from('club_hemeroteca').insert({
      club_id: clubId,
      season_year,
      headline,
      snippet,
      media_source,
      tag
    }).select().single()

    if (error) {
      console.error('Error adding hemeroteca article:', error)
      return null
    }
    return data
  },

  /**
   * Obtiene o calcula los récords históricos institucionales
   */
  async getClubRecords(clubId) {
    if (!clubId) return []

    // 1. Consultar registros manuales o persistidos en club_records
    const { data: existingRecords } = await supabase
      .from('club_records')
      .select('*')
      .eq('club_id', clubId)

    const recordsMap = {}
    if (existingRecords) {
      for (const r of existingRecords) {
        recordsMap[r.record_type] = r
      }
    }

    // 2. Consultar stats dinámicas de jugadores actuales del club para récords
    const { data: players } = await supabase
      .from('players')
      .select('id, first_name, last_name, matches_played, goals_scored, market_value')
      .eq('club_id', clubId)

    let topScorer = null
    let mostAppearances = null

    if (players && players.length > 0) {
      // Máximo goleador
      const sortedByGoals = [...players].sort((a, b) => (b.goals_scored || 0) - (a.goals_scored || 0))
      if (sortedByGoals[0]?.goals_scored > 0) {
        topScorer = sortedByGoals[0]
      }

      // Más presencias
      const sortedByMatches = [...players].sort((a, b) => (b.matches_played || 0) - (a.matches_played || 0))
      if (sortedByMatches[0]?.matches_played > 0) {
        mostAppearances = sortedByMatches[0]
      }
    }

    const { data: club } = await supabase.from('clubs').select('stadium_name, stadium_capacity').eq('id', clubId).single()

    const defaultRecords = [
      {
        record_type: 'biggest_win',
        title: 'Mayor Goleada Histórica',
        record_value: recordsMap['biggest_win']?.record_value || '4 - 0',
        holder_name: recordsMap['biggest_win']?.holder_name || 'En Torneo Oficial',
        record_date: recordsMap['biggest_win']?.record_date || '2026'
      },
      {
        record_type: 'top_scorer_history',
        title: 'Máximo Goleador',
        record_value: topScorer ? `${topScorer.goals_scored} Goles` : (recordsMap['top_scorer_history']?.record_value || '18 Goles'),
        holder_name: topScorer ? `${topScorer.first_name} ${topScorer.last_name}` : (recordsMap['top_scorer_history']?.holder_name || 'Goleador del Plantel'),
        record_date: 'Vigente'
      },
      {
        record_type: 'most_appearances',
        title: 'Más Presencias con el Club',
        record_value: mostAppearances ? `${mostAppearances.matches_played} PJ` : (recordsMap['most_appearances']?.record_value || '45 Partidos'),
        holder_name: mostAppearances ? `${mostAppearances.first_name} ${mostAppearances.last_name}` : (recordsMap['most_appearances']?.holder_name || 'Capitán del Club'),
        record_date: 'Vigente'
      },
      {
        record_type: 'highest_attendance',
        title: 'Récord de Asistencia en Estadio',
        record_value: `${Number(club?.stadium_capacity || 4500).toLocaleString()} espectadores`,
        holder_name: club?.stadium_name || 'Estadio Principal',
        record_date: 'Capacidad Máxima'
      },
      {
        record_type: 'longest_win_streak',
        title: 'Mayor Racha de Victorias',
        record_value: recordsMap['longest_win_streak']?.record_value || '5 Triunfos Seguidos',
        holder_name: recordsMap['longest_win_streak']?.holder_name || 'Campaña Regular',
        record_date: recordsMap['longest_win_streak']?.record_date || '2026'
      },
      {
        record_type: 'record_sale',
        title: 'Venta Histórica Más Alta',
        record_value: recordsMap['record_sale']?.record_value || '$150,000',
        holder_name: recordsMap['record_sale']?.holder_name || 'Mercado de Pases',
        record_date: recordsMap['record_sale']?.record_date || '2026'
      }
    ]

    return defaultRecords
  },

  /**
   * Actualiza o crea un récord en la base de datos
   */
  async updateRecord(clubId, { record_type, title, record_value, holder_name, record_date }) {
    if (!clubId || !record_type) return null

    const { data, error } = await supabase.from('club_records').upsert({
      club_id: clubId,
      record_type,
      title,
      record_value,
      holder_name,
      record_date: record_date || 'Temporada Actual'
    }, { onConflict: 'club_id, record_type' }).select().single()

    if (error) {
      console.error('Error updating club record:', error)
      return null
    }
    return data
  },

  /**
   * Obtiene la nómina de Ídolos, Referentes y Leyendas del club
   */
  async getIdolsAndLegends(clubId) {
    if (!clubId) return []

    const { data: players, error } = await supabase
      .from('players')
      .select('*')
      .eq('club_id', clubId)
      .order('matches_played', { ascending: false })

    if (error || !players) return []

    // Evaluar y categorizar a todos los jugadores del club
    const figures = []
    for (const p of players) {
      const evaluation = this.evaluatePlayerStatus(p)
      if (evaluation.status !== 'regular' || p.is_idol) {
        figures.push({
          ...p,
          club_status: evaluation.status,
          status_label: evaluation.label,
          legend_reason: p.legend_reason || evaluation.reason,
          badge_color: evaluation.badge_color
        })
      }
    }

    // Ordenar: Leyenda (1) > Ídolo (2) > Referente (3)
    const priority = { legend: 1, idol: 2, referent: 3, regular: 4 }
    return figures.sort((a, b) => (priority[a.club_status] || 4) - (priority[b.club_status] || 4))
  },

  /**
   * Evalúa la categoría de un jugador según sus estadísticas en el club
   */
  evaluatePlayerStatus(player) {
    const matches = player.matches_played || 0
    const goals = player.goals_scored || 0

    // Leyenda: +80 partidos o +25 goles
    if (matches >= 80 || goals >= 25) {
      return {
        status: 'legend',
        label: 'Leyenda',
        reason: goals >= 25 
          ? `Goleador histórico con ${goals} goles convertidos` 
          : `Monumento vivo del club con ${matches} partidos disputados`,
        badge_color: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      }
    }

    // Ídolo: +40 partidos o +12 goles
    if (matches >= 40 || goals >= 12 || player.is_idol) {
      return {
        status: 'idol',
        label: 'Ídolo',
        reason: goals >= 12 
          ? `Ídolo del gol con ${goals} anotaciones decisivas` 
          : `Aclamado por los hinchas con ${matches} batallas oficiales`,
        badge_color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      }
    }

    // Referente: +20 partidos o +6 goles
    if (matches >= 20 || goals >= 6) {
      return {
        status: 'referent',
        label: 'Referente',
        reason: `Líder dentro del vestuario con ${matches} partidos jugados`,
        badge_color: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
      }
    }

    return {
      status: 'regular',
      label: 'Jugador',
      reason: 'Integrante del plantel profesional',
      badge_color: 'bg-zinc-800 text-zinc-400 border-zinc-700'
    }
  },

  /**
   * Actualiza estadísticas de jugadores post-partido y evalúa ascensos a Ídolo/Leyenda
   */
  async processPostMatchPlayerStats(clubId, { playedPlayerIds = [], scorers = [], homeScore = 0, awayScore = 0, opponentName = '', isHome = true }) {
    if (!clubId) return

    // 1. Incrementar matches_played para los jugadores convocados (lectura y escritura en lote)
    const { data: playedPlayers } = playedPlayerIds.length > 0
      ? await supabase.from('players').select('id, first_name, last_name, matches_played, goals_scored, is_idol, club_status').in('id', playedPlayerIds)
      : { data: [] }

    const statusChanges = []
    const updateRows = (playedPlayers || []).map(p => {
      const newMatches = (p.matches_played || 0) + 1
      const goalsInMatch = scorers.filter(id => id === p.id).length
      const newGoals = (p.goals_scored || 0) + goalsInMatch

      const evalBefore = this.evaluatePlayerStatus(p)
      const evalAfter = this.evaluatePlayerStatus({ ...p, matches_played: newMatches, goals_scored: newGoals })

      const row = {
        id: p.id,
        matches_played: newMatches,
        goals_scored: newGoals,
        club_status: evalAfter.status,
        legend_reason: evalAfter.reason
      }
      if (evalAfter.status === 'idol' || evalAfter.status === 'legend') row.is_idol = true

      // Si subió de estatus a Ídolo o Leyenda, se crea el hito institucional (caso poco frecuente)
      if (evalBefore.status !== evalAfter.status && (evalAfter.status === 'idol' || evalAfter.status === 'legend')) {
        statusChanges.push({ player: p, evalAfter })
      }
      return row
    })

    if (updateRows.length > 0) {
      await supabase.rpc('batch_update_players', { rows: updateRows })
    }

    for (const { player, evalAfter } of statusChanges) {
      const playerName = `${player.first_name} ${player.last_name}`
      await this.addMilestone(clubId, {
        year: 2026,
        title: `Nuevo ${evalAfter.label}: ${playerName}`,
        description: `${playerName} alcanza el rango sagrado de ${evalAfter.label} del club. (${evalAfter.reason})`,
        category: 'legend',
        importance: evalAfter.status === 'legend' ? 5 : 4
      })

      await this.addHemerotecaArticle(clubId, {
        season_year: 2026,
        headline: `Nace un Ídolo: ${playerName} consagra su nombre en la memoria del club`,
        snippet: `La afición ovacionó de pie a ${playerName} tras alcanzar un nuevo escalón en la galería inmortal de la institución. Su entrega conmueve a la tribuna.`,
        media_source: 'Diario Olé Barrial',
        tag: 'IDOLO'
      })
    }

    // 2. Verificar récord de goleada
    const myScore = isHome ? homeScore : awayScore
    const oppScore = isHome ? awayScore : homeScore
    const margin = myScore - oppScore

    if (margin >= 4) {
      await this.updateRecord(clubId, {
        record_type: 'biggest_win',
        title: 'Mayor Goleada Histórica',
        record_value: `${myScore} - ${oppScore}`,
        holder_name: `vs ${opponentName}`,
        record_date: 'Temporada Actual'
      })

      await this.addMilestone(clubId, {
        year: 2026,
        title: `Goleada Histórica: ${myScore}-${oppScore}`,
        description: `Victoria aplastante frente a ${opponentName} marcando un nuevo récord en los libros del club.`,
        category: 'record',
        importance: 4
      })

      await this.addHemerotecaArticle(clubId, {
        season_year: 2026,
        headline: `Baile de antología: Imponente ${myScore}-${oppScore} ante ${opponentName}`,
        snippet: `Una exhibición futbolística que quedará en la retina de todos los presentes. El equipo arrolló de principio a fin batiendo la marca de goleo del club.`,
        media_source: 'El Gráfico del Potrero',
        tag: 'GOLEADA'
      })
    }
  }
}
