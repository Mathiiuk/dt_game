import { supabase } from './supabase'
import { queryCache } from '../utils/cache'

export const HIERARCHY_TIERS = {
  TEAM_LEADER: { key: 'TEAM_LEADER', label: 'Líder de Equipo', color: 'text-amber-400 bg-amber-950/40 border-amber-800/60' },
  HIGHLY_INFLUENTIAL: { key: 'HIGHLY_INFLUENTIAL', label: 'Muy Influyente', color: 'text-purple-400 bg-purple-950/40 border-purple-800/60' },
  INFLUENTIAL: { key: 'INFLUENTIAL', label: 'Influyente', color: 'text-blue-400 bg-blue-950/40 border-blue-800/60' },
  FRINGE_PLAYER: { key: 'FRINGE_PLAYER', label: 'Relegado / Juvenil', color: 'text-zinc-400 bg-zinc-800/40 border-zinc-700/60' }
}

export const SOCIAL_GROUPS = {
  HOMEGROWN_CORE: { key: 'HOMEGROWN_CORE', label: 'Núcleo Canterano del Potrero', description: 'Jugadores formados en la casa con fuerte sentido de pertenencia.' },
  EXPERIENCED_VETS: { key: 'EXPERIENCED_VETS', label: 'Veteranos de Batalla', description: 'Futbolistas experimentados que marcan el pulso de la disciplina.' },
  FOREIGN_NEWCOMERS: { key: 'FOREIGN_NEWCOMERS', label: 'Nuevas Incorporaciones', description: 'Fichajes recientes en proceso de adaptación al club.' },
  NEUTRAL: { key: 'NEUTRAL', label: 'Grupo Neutral', description: 'Jugadores independientes que no integran ningún clan específico.' }
}

export const lockerRoomApi = {
  /**
   * Obtiene o inicializa el estado del vestuario y sincroniza los perfiles sociales de los jugadores
   */
  async getLockerRoomState(clubId) {
    if (!clubId) return null

    // 1. Obtener estado de club_locker_room
    let { data: lockerRoom, error } = await supabase
      .from('club_locker_room')
      .select('*')
      .eq('club_id', clubId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.warn('Error consultando club_locker_room:', error)
    }

    // 2. Obtener jugadores del club
    const { data: players } = await supabase
      .from('players')
      .select('id, name, position, overall, age, morale, contract_salary')
      .eq('club_id', clubId)

    const squad = players || []

    if (!lockerRoom) {
      // Determinar capitán por defecto (jugador de mayor OVR o mayor edad)
      const sortedLeaders = [...squad].sort((a, b) => (b.age + b.overall) - (a.age + a.overall))
      const defCaptain = sortedLeaders[0]?.id || null
      const defViceCaptain = sortedLeaders[1]?.id || null

      const initialLocker = {
        club_id: clubId,
        team_cohesion_score: 65,
        captain_player_id: defCaptain,
        vice_captain_player_id: defViceCaptain,
        manager_support_level: 'FAVORABLE',
        last_team_meeting_week: 0
      }

      const { data: created, error: insertErr } = await supabase
        .from('club_locker_room')
        .insert(initialLocker)
        .select()
        .single()

      if (insertErr) {
        console.warn('Error creando club_locker_room:', insertErr)
        lockerRoom = { id: 'temp', ...initialLocker }
      } else {
        lockerRoom = created
      }
    }

    // 3. Asegurar que cada jugador tenga su perfil social en player_social_status
    if (squad.length > 0) {
      const { data: existingSocials } = await supabase
        .from('player_social_status')
        .select('player_id')
        .eq('club_id', clubId)

      const existingIds = new Set((existingSocials || []).map(s => s.player_id))
      const missingPlayers = squad.filter(p => !existingIds.has(p.id))

      if (missingPlayers.length > 0) {
        const toInsert = missingPlayers.map(p => {
          let tier = 'INFLUENTIAL'
          if (p.id === lockerRoom.captain_player_id || p.overall >= 74) {
            tier = 'TEAM_LEADER'
          } else if (p.overall >= 68 || p.age >= 28) {
            tier = 'HIGHLY_INFLUENTIAL'
          } else if (p.age <= 19) {
            tier = 'FRINGE_PLAYER'
          }

          let group = 'NEUTRAL'
          if (p.age <= 20) {
            group = 'HOMEGROWN_CORE'
          } else if (p.age >= 27) {
            group = 'EXPERIENCED_VETS'
          } else {
            group = 'FOREIGN_NEWCOMERS'
          }

          return {
            player_id: p.id,
            club_id: clubId,
            hierarchy_tier: tier,
            social_group: group,
            satisfaction_with_manager: 70,
            satisfaction_playing_time: p.morale > 70 ? 80 : 60,
            satisfaction_wage: 70,
            is_demanding_talk: p.morale < 40
          }
        })

        await supabase.from('player_social_status').insert(toInsert)
      }
    }

    return lockerRoom
  },

  /**
   * Obtiene la jerarquía y desglose social de los jugadores del plantel
   */
  async getSquadSocialProfiles(clubId) {
    if (!clubId) return []

    const { data: profiles, error } = await supabase
      .from('player_social_status')
      .select('*, players(name, position, overall, age, morale, contract_salary)')
      .eq('club_id', clubId)

    if (error) {
      console.warn('Error consultando player_social_status:', error)
      return []
    }

    return (profiles || []).map(p => ({
      ...p,
      name: p.players?.name || 'Jugador',
      position: p.players?.position || 'MED',
      overall: p.players?.overall || 60,
      age: p.players?.age || 20,
      morale: p.players?.morale || 70,
      contract_salary: p.players?.contract_salary || 500
    }))
  },

  /**
   * Designa Capitán y Subcapitán con impacto anímico si hay despojo de cinta (Regla 25.1)
   */
  async appointCaptains(clubId, newCaptainId, newViceCaptainId) {
    if (!clubId || !newCaptainId) throw new Error('Capitán requerido')

    const currentLocker = await this.getLockerRoomState(clubId)
    const oldCaptainId = currentLocker?.captain_player_id

    // Verificar si el capitán saliente era TEAM_LEADER
    if (oldCaptainId && oldCaptainId !== newCaptainId) {
      const { data: oldSocial } = await supabase
        .from('player_social_status')
        .select('*')
        .eq('player_id', oldCaptainId)
        .maybeSingle()

      if (oldSocial && (oldSocial.hierarchy_tier === 'TEAM_LEADER' || oldSocial.hierarchy_tier === 'HIGHLY_INFLUENTIAL')) {
        // Regla 25.1: Terremoto en el vestuario (-30 al capitán cesado, -15 a su clan)
        const { data: oldPlayer } = await supabase.from('players').select('morale, name').eq('id', oldCaptainId).single()
        const newMorale = Math.max(10, (oldPlayer?.morale || 70) - 30)
        await supabase.from('players').update({ morale: newMorale }).eq('id', oldCaptainId)

        // Bajar moral a su clan social
        const { data: clanMembers } = await supabase
          .from('player_social_status')
          .select('player_id')
          .eq('club_id', clubId)
          .eq('social_group', oldSocial.social_group)
          .neq('player_id', oldCaptainId)

        if (clanMembers && clanMembers.length > 0) {
          for (const m of clanMembers) {
            const { data: p } = await supabase.from('players').select('morale').eq('id', m.player_id).single()
            if (p) {
              await supabase.from('players').update({ morale: Math.max(15, (p.morale || 70) - 15) }).eq('id', m.player_id)
            }
          }
        }

        // Bajar cohesión general
        const newCohesion = Math.max(15, (currentLocker.team_cohesion_score || 65) - 10)
        await supabase
          .from('club_locker_room')
          .update({ team_cohesion_score: newCohesion })
          .eq('club_id', clubId)

        await supabase.from('locker_room_events_log').insert({
          club_id: clubId,
          event_type: 'CAPTAIN_APPOINTED',
          cohesion_delta: -10,
          details: `Cambio polémico de capitanía: ${oldPlayer?.name || 'El anterior capitán'} fue despojado del brazalete. Su clan social reaccionó con malestar (-15 moral).`
        })
      }
    }

    // Actualizar club_locker_room
    await supabase
      .from('club_locker_room')
      .update({
        captain_player_id: newCaptainId,
        vice_captain_player_id: newViceCaptainId || null,
        updated_at: new Date().toISOString()
      })
      .eq('club_id', clubId)

    // Asegurar que el nuevo capitán sea TEAM_LEADER
    await supabase
      .from('player_social_status')
      .update({ hierarchy_tier: 'TEAM_LEADER' })
      .eq('player_id', newCaptainId)

    queryCache.invalidate(`locker:${clubId}`)
    return { success: true }
  },

  /**
   * Convoca una reunión de equipo (Team Meeting) con cooldown de 4 semanas
   */
  async holdTeamMeeting(clubId, meetingTone, currentWeek = 1) {
    if (!clubId) throw new Error('Club requerido')

    const currentLocker = await this.getLockerRoomState(clubId)
    const lastWeek = currentLocker?.last_team_meeting_week || 0

    // Validar ventana de enfriamiento (4 semanas)
    if (lastWeek > 0 && (currentWeek - lastWeek) < 4) {
      const remainingWeeks = 4 - (currentWeek - lastWeek)
      throw new Error(`ERR_TEAM_MEETING_COOLDOWN_ACTIVE: Debes esperar ${remainingWeeks} ${remainingWeeks === 1 ? 'semana' : 'semanas'} para convocar otra reunión general de plantel.`)
    }

    let moraleDelta = 0
    let cohesionDelta = 0
    let details = ''

    if (meetingTone === 'PRAISE') {
      moraleDelta = 8
      cohesionDelta = 5
      details = 'Charla motivacional: El DT felicitó al grupo por la entrega y el compromiso colectivo. (+8 moral, +5 cohesión)'
    } else if (meetingTone === 'CALM') {
      moraleDelta = 5
      cohesionDelta = 3
      details = 'Llamado a la calma: El DT transmitió serenidad y templanza para encarar los próximos compromisos sin histeria. (+5 moral, +3 cohesión)'
    } else if (meetingTone === 'DEMAND_EXCELLENCE') {
      if ((currentLocker.team_cohesion_score || 65) >= 55) {
        moraleDelta = 6
        cohesionDelta = 6
        details = 'Exigencia máxima: El DT elevó la vara competitiva. El plantel asimiló el reto con determinación. (+6 moral, +6 cohesión)'
      } else {
        moraleDelta = -5
        cohesionDelta = 2
        details = 'Tensión interna: La alta exigencia del DT generó reproches silenciosos en un vestuario que aún no está consolidado. (-5 moral)'
      }
    }

    // Aplicar a jugadores
    const { data: players } = await supabase.from('players').select('id, morale').eq('club_id', clubId)
    if (players) {
      for (const p of players) {
        const updatedMorale = Math.min(100, Math.max(15, (p.morale || 70) + moraleDelta))
        await supabase.from('players').update({ morale: updatedMorale }).eq('id', p.id)
      }
    }

    // Actualizar cohesión y fecha de reunión
    const newCohesion = Math.min(100, Math.max(10, (currentLocker.team_cohesion_score || 65) + cohesionDelta))
    await supabase
      .from('club_locker_room')
      .update({
        team_cohesion_score: newCohesion,
        last_team_meeting_week: currentWeek,
        updated_at: new Date().toISOString()
      })
      .eq('club_id', clubId)

    // Auditoría
    await supabase.from('locker_room_events_log').insert({
      club_id: clubId,
      event_type: 'TEAM_MEETING_HELD',
      cohesion_delta: cohesionDelta,
      details
    })

    queryCache.invalidate(`locker:${clubId}`)
    return {
      success: true,
      moraleDelta,
      cohesionDelta,
      details,
      newCohesion
    }
  },

  /**
   * Resuelve el reclamo privado de un jugador que exige hablar con el DT
   */
  async resolvePlayerDemand(playerId, choiceKey, clubId) {
    if (!playerId) return

    let moraleDelta = 0
    let satisfactionDelta = 0
    let details = ''

    if (choiceKey === 'PROMISE_MINUTES') {
      moraleDelta = 12
      satisfactionDelta = 25
      details = 'Promesa de minutos: El DT aseguró que tendrá oportunidades como titular en el próximo encuentro.'
    } else if (choiceKey === 'HONEST_CRITIQUE') {
      moraleDelta = 2
      satisfactionDelta = 10
      details = 'Diálogo franco: El DT fundamentó tácticamente sus decisiones y exigió superación en las prácticas.'
    } else {
      moraleDelta = -15
      satisfactionDelta = -20
      details = 'Reprimenda por indisciplina: El DT no toleró exigencias individuales por encima del equipo.'
    }

    const { data: player } = await supabase.from('players').select('morale, name').eq('id', playerId).single()
    const newMorale = Math.min(100, Math.max(10, (player?.morale || 70) + moraleDelta))
    await supabase.from('players').update({ morale: newMorale }).eq('id', playerId)

    await supabase
      .from('player_social_status')
      .update({
        is_demanding_talk: false,
        satisfaction_playing_time: Math.min(100, Math.max(10, 60 + satisfactionDelta)),
        updated_at: new Date().toISOString()
      })
      .eq('player_id', playerId)

    await supabase.from('locker_room_events_log').insert({
      club_id: clubId,
      event_type: 'PLAYER_REVOLT_DEFUSED',
      cohesion_delta: moraleDelta > 0 ? 2 : -2,
      details: `Reunión privada con ${player?.name || 'jugador'}: ${details}`
    })

    queryCache.invalidate(`locker:${clubId}`)
    return { success: true, message: `Reunión concluida con ${player?.name || 'el jugador'}` }
  },

  /**
   * Historial de eventos sociales y reuniones del vestuario
   */
  async getLockerRoomEvents(clubId) {
    if (!clubId) return []
    const { data, error } = await supabase
      .from('locker_room_events_log')
      .select('*')
      .eq('club_id', clubId)
      .order('timestamp', { ascending: false })
      .limit(10)

    if (error) {
      console.warn('Error consultando locker_room_events_log:', error)
      return []
    }
    return data || []
  },

  /**
   * Metadatos visuales y efectos tácticos del estado de cohesión
   */
  getCohesionMetadata(score = 65) {
    if (score >= 85) {
      return {
        title: 'Familia Blindada (Unión Extrema)',
        badgeColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
        tacticalBonus: '+8% acierto de pases • Respaldo unánime al DT'
      }
    }
    if (score >= 65) {
      return {
        title: 'Cohesión Estable (Buen Ambiente)',
        badgeColor: 'text-blue-400 bg-blue-950/40 border-blue-800/60',
        tacticalBonus: '+3% acierto de pases • Vestuario disciplinado'
      }
    }
    if (score >= 45) {
      return {
        title: 'Clima Neutro (Distante)',
        badgeColor: 'text-zinc-300 bg-zinc-800/50 border-zinc-700/60',
        tacticalBonus: 'Sin bonificaciones tácticas'
      }
    }
    if (score >= 25) {
      return {
        title: 'Discrepancias Internas (Tensión)',
        badgeColor: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
        tacticalBonus: '-5% precisión en salida • Aumento de amonestaciones'
      }
    }
    return {
      title: 'Motín en el Vestuario (Quiebre Total)',
      badgeColor: 'text-rose-400 bg-rose-950/40 border-rose-800/60',
      tacticalBonus: 'Huelga de brazos caídos • La directiva intervendrá'
    }
  }
}
