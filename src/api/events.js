import { supabase } from './supabase'
import { queryCache } from '../utils/cache'
import { auditApi } from './audit'
import { CLIMATE_EVENTS } from '../domain/climateEvents'
import { renderTemplate, ensureCharacters } from '../domain/characters'
import { eventProbability, pickEvent } from '../domain/barra'

export const DYNAMIC_EVENTS_CATALOG = [
  {
    template_code: 'EVT_NIGHTCLUB_OUTING',
    title: 'Escándalo Nocturno: Goleador Visto en un Boliche',
    description: 'A menos de 48 horas del próximo partido, vecinos del barrio fotografiaron a tu delantero estrella en una fiesta bailable a las 4 AM. El vestuario está conmocionado y los hinchas exigen una sanción ejemplar.',
    category: 'LOCKER_ROOM',
    severity: 'CRITICAL',
    options: [
      {
        id: 'HARSH_PUNISHMENT',
        label: 'Mano Dura: Separar del 11 titular y aplicar multa salarial',
        description: 'Se prioriza la disciplina institucional. El jugador no disputará el próximo encuentro.',
        cost: 0,
        effects: {
          morale: -5,
          locker_room: 10,
          board: 5,
          fans: 10,
          reputation: 1.0
        }
      },
      {
        id: 'OVERLOOK',
        label: 'Mirar hacia otro lado: Mantenerlo de titular de todos modos',
        description: 'El rendimiento deportivo está por encima de todo. Los referentes veteranos lo considerarán un privilegio injusto.',
        cost: 0,
        effects: {
          morale: -15,
          locker_room: -10,
          board: -5,
          fans: -5,
          reputation: -1.0
        }
      },
      {
        id: 'INTERNAL_WARNING',
        label: 'Advertencia Privada: Multa interna económica sin separarlo',
        description: 'Se le exige disculparse ante el plantel y se le aplica una sanción económica privada.',
        cost: 0,
        effects: {
          morale: 0,
          locker_room: 2,
          board: 2,
          fans: 0,
          reputation: 0
        }
      }
    ]
  },
  {
    template_code: 'EVT_BOILER_BROKEN',
    title: 'Avería Crítica: Caldera Rota en Pleno Invierno',
    description: 'La caldera central de los vestuarios de la cancha colapsó. El plantel no tiene agua caliente tras los entrenamientos matutinos y el médico del club advierte sobre riesgo de resfríos masivos.',
    category: 'FINANCIAL_CRISIS',
    severity: 'MEDIUM',
    options: [
      {
        id: 'REPAIR_URGENT',
        label: 'Reparación de Emergencia con Fondos del Club ($1,500)',
        description: 'Contratar una cuadrilla de plomeros de urgencia para restaurar el agua caliente hoy mismo.',
        cost: 1500,
        effects: {
          budget: -1500,
          morale: 8,
          board: -2,
          fans: 0
        }
      },
      {
        id: 'COLD_SHOWERS',
        label: 'Duchas con Agua Fría y Esperar Repuestos Baratos',
        description: 'Ahorrar presupuesto y esperar una semana a que llegue un repuesto más económico.',
        cost: 0,
        effects: {
          budget: 0,
          morale: -12,
          board: 0,
          fans: -2
        }
      }
    ]
  },
  {
    template_code: 'EVT_PRESIDENT_NEPOTISM',
    title: 'Presión Dirigencial: El Pedido del Presidente',
    description: 'El presidente del club te cita a su oficina para pedirte "como favor personal" que le des minutos de titular a su sobrino en el próximo partido. Asegura que le dará tranquilidad política a la comisión directiva.',
    category: 'BOARD_PRESS',
    severity: 'HIGH',
    options: [
      {
        id: 'REJECT_NEPOTISM',
        label: 'Rechazar la Intromisión: "Aquí juegan los mejores"',
        description: 'Defender con firmeza la autonomía táctica del cuerpo técnico frente a las presiones políticas.',
        cost: 0,
        effects: {
          board: -12,
          locker_room: 15,
          fans: 10,
          reputation: 2.0
        }
      },
      {
        id: 'ACCEPT_NEPOTISM',
        label: 'Ceder al Pedido: Incluirlo en el once inicial',
        description: 'Asegurar el respaldo incondicional del presidente, a costa de la credibilidad ante el vestuario.',
        cost: 0,
        effects: {
          board: 15,
          locker_room: -18,
          fans: -8,
          reputation: -2.0
        }
      },
      {
        id: 'BENCH_COMPROMISE',
        label: 'Compromiso: Convocarlo al banco de suplentes',
        description: 'Una solución intermedia para apaciguar al presidente sin comprometer el planteo inicial.',
        cost: 0,
        effects: {
          board: 5,
          locker_room: -3,
          fans: 0,
          reputation: 0
        }
      }
    ]
  },
  {
    template_code: 'EVT_POTRERO_DONATION',
    title: 'Lazo Barrial: Auxilio a la Canchita Comunitaria',
    description: 'Vecinos y delegados del potrero "Los Amigos" de la esquina del club solicitan donación de pelotas y pecheras para que los chicos del barrio no dejen de jugar.',
    category: 'COMMUNITY',
    severity: 'LOW',
    options: [
      {
        id: 'DONATE_FULL',
        label: 'Donar Kit Oficial Completo ($800)',
        description: 'Entregar balones oficiales y pecheras con el escudo del club. Refuerza la identidad popular.',
        cost: 800,
        effects: {
          budget: -800,
          fans: 12,
          reputation: 1.0,
          board: 0
        }
      },
      {
        id: 'DONATE_USED',
        label: 'Donar Material Usado del Plantel ($200)',
        description: 'Aportar balones de temporadas anteriores reacondicionados.',
        cost: 200,
        effects: {
          budget: -200,
          fans: 5,
          reputation: 0.5
        }
      },
      {
        id: 'DECLINE_DONATION',
        label: 'Priorizar Recursos Internos del Club',
        description: 'Agradecer la carta pero reservar cada centavo para el plantel profesional.',
        cost: 0,
        effects: {
          fans: -5,
          reputation: 0
        }
      }
    ]
  },
  {
    template_code: 'EVT_BRIBERY_ATTEMPT',
    title: 'Amenaza Ética: Oferta de Red Clandestina de Apuestas',
    description: 'Un desconocido con actitud sospechosa se acerca tras el entrenamiento ofreciéndote una valija con $35,000 en efectivo si el equipo empata el próximo partido. Afirma que "nadie saldrá lastimado".',
    category: 'FINANCIAL_CRISIS',
    severity: 'CRITICAL',
    options: [
      {
        id: 'DENOUNCE_POLICE',
        label: 'Rechazar Inmediatamente y Radicar Denuncia Judicial',
        description: 'Demostrar una ética intachable y acudir a la fiscalía para erradicar las mafias del fútbol.',
        cost: 0,
        effects: {
          reputation: 5.0,
          fans: 15,
          board: 10,
          morale: 5
        }
      },
      {
        id: 'KICK_OUT_SILENT',
        label: 'Echar al Emisario a los Gritos sin Denunciar',
        description: 'Expulsar al sujeto del estadio protegiendo al club del revuelo mediático.',
        cost: 0,
        effects: {
          reputation: 1.0,
          fans: 2,
          board: 2
        }
      }
    ]
  },
  {
    template_code: 'EVT_LOCKER_ROOM_FIGHT',
    title: 'Tensión Máxima: Pelea a Golpes en el Entrenamiento',
    description: 'Durante una práctica de fútbol reducido, una fuerte entrada terminó en intercambio de golpes de puño entre dos referentes del plantel. El entrenamiento debió ser suspendido.',
    category: 'LOCKER_ROOM',
    severity: 'HIGH',
    options: [
      {
        id: 'FINE_BOTH',
        label: 'Multar Salarialmente a Ambos Jugadores',
        description: 'La institución está por encima de cualquier nombre. Multa económica del 50% de la semana.',
        cost: 0,
        effects: {
          locker_room: 8,
          board: 5,
          morale: -4
        }
      },
      {
        id: 'BBQ_MEDIATION',
        label: 'Asado de Reconciliación Pago por el DT ($600)',
        description: 'Reunir al plantel en un almuerzo distendido para limar asperezas y recuperar la hermandad.',
        cost: 600,
        effects: {
          budget: -600,
          locker_room: 15,
          morale: 12,
          board: 0
        }
      }
    ]
  }
]

// Los dilemas de siempre también dependen del clima: no tiene sentido un soborno cuando todo va bien
const LEGACY_CLIMATES = {
  EVT_NIGHTCLUB_OUTING: ['TENSION', 'CRISIS', 'CHAOS'],
  EVT_BOILER_BROKEN: ['FLOWS', 'TENSION', 'CRISIS', 'CHAOS'],
  EVT_PRESIDENT_NEPOTISM: ['TENSION', 'CRISIS'],
  EVT_POTRERO_DONATION: ['FLOWS', 'TENSION'],
  EVT_BRIBERY_ATTEMPT: ['CRISIS', 'CHAOS'],
  EVT_LOCKER_ROOM_FIGHT: ['TENSION', 'CRISIS', 'CHAOS']
}

export const FULL_EVENTS_CATALOG = [
  ...DYNAMIC_EVENTS_CATALOG.map(t => ({ ...t, climates: LEGACY_CLIMATES[t.template_code] })),
  ...CLIMATE_EVENTS
]

export const eventsApi = {
  /**
   * Obtiene eventos pendientes para un club
   */
  async getPendingEvents(clubId) {
    if (!clubId) return []

    return queryCache.fetch(`events:pending:${clubId}`, async () => {
      const { data, error } = await supabase
        .from('dynamic_events')
        .select('*')
        .eq('club_id', clubId)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })
        
      if (error) {
        console.warn('Aviso consultando dynamic_events:', error)
        return []
      }
      return data || []
    }, 15000)
  },

  /**
   * Comprueba si el club tiene algún evento pendiente de severidad CRITICAL (Regla 35.1)
   */
  async hasCriticalPendingEvent(clubId) {
    if (!clubId) return false

    const pending = await this.getPendingEvents(clubId)
    return pending.some(ev => ev.severity === 'CRITICAL')
  },

  /**
   * Resuelve formal y autoritativamente un evento dinámico
   */
  async resolveEvent(eventId, chosenOption, managerId = null) {
    if (!eventId || !chosenOption) throw new Error('Datos de resolución incompletos')

    // 1. Obtener el evento
    const { data: event, error: evErr } = await supabase
      .from('dynamic_events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (evErr || !event) throw new Error('Evento no encontrado o ya eliminado')

    // Idempotencia
    if (event.status === 'RESOLVED') {
      return { alreadyResolved: true }
    }

    const optionId = chosenOption.id || chosenOption
    const optionsList = Array.isArray(event.options) ? event.options : []
    const optionDef = optionsList.find(o => o.id === optionId) || chosenOption

    const cost = Number(optionDef.cost || 0)
    const effects = optionDef.effects || {}

    // Algunas opciones piden una confianza mínima de la dirigencia (por ejemplo, denunciar a la barra)
    if (optionDef.requires?.board) {
      const { data: gate } = await supabase.from('clubs').select('board_confidence').eq('id', event.club_id).single()
      if ((gate?.board_confidence ?? 0) < optionDef.requires.board) {
        throw new Error('La dirigencia no te respalda lo suficiente para hacer eso todavía.')
      }
    }

    // 2. Verificar fondos en tesorería si la opción tiene costo monetario
    const { data: club, error: clubErr } = await supabase
      .from('clubs')
      .select('id, budget, board_confidence, fans_confidence')
      .eq('id', event.club_id)
      .single()

    // Sin poder leer el club no se puede comprobar que haya fondos: se corta en vez de saltear el chequeo
    if (clubErr || !club) throw new Error('No pudimos verificar los fondos del club. Probá de nuevo.')
    if (cost > 0 && Number(club.budget || 0) < cost) {
      const err = new Error(`ERR_INSUFFICIENT_FUNDS_FOR_OPTION: Fondos insuficientes en tesorería ($${Number(club.budget || 0).toLocaleString()}) para costear esta opción ($${cost.toLocaleString()}).`)
      err.code = 'ERR_INSUFFICIENT_FUNDS_FOR_OPTION'
      throw err
    }

    // 3. Aplicar consecuencias financieras y de confianza al club
    let moneyDelta = 0
    if (club) {
      const budgetDelta = (effects.budget || 0) - cost
      moneyDelta = budgetDelta
      const newBudget = Number(club.budget || 0) + budgetDelta

      await supabase.from('clubs').update({ budget: newBudget }).eq('id', event.club_id)
    }

    // Hinchada, dirigencia, vestuario, barra, favores y acciones especiales pasan por el clima del club,
    // para que las consecuencias de un dilema no se pisen con el recálculo semanal de la dirigencia
    let outcomeNote = null
    try {
      const { climateApi } = await import('./climate')
      outcomeNote = await climateApi.applyEventEffects({
        clubId: event.club_id,
        managerId: managerId || event.manager_id,
        effects,
        title: event.title
      })
    } catch (climateErr) {
      console.warn('Aviso aplicando consecuencias del evento al clima:', climateErr)
    }

    // 4. Aplicar impacto en moral de jugadores si aplica
    if (effects.morale && event.club_id) {
      try {
        const { data: squad } = await supabase
          .from('players')
          .select('id, state_morale')
          .eq('club_id', event.club_id)
          .limit(16)

        if (squad) {
          for (const p of squad) {
            const newMorale = Math.min(100, Math.max(10, (p.state_morale || 70) + effects.morale))
            await supabase.from('players').update({ state_morale: newMorale }).eq('id', p.id)
          }
        }
      } catch (morErr) {
        console.warn('Aviso actualizando moral de plantel por evento:', morErr)
      }
    }

    // 5. Aplicar impacto en reputación del DT si aplica (Fase 32)
    const effectiveManagerId = managerId || event.manager_id
    if (effects.reputation && effectiveManagerId) {
      try {
        const { reputationApi } = await import('./reputation')
        await reputationApi.applyReputationDelta({
          managerId: effectiveManagerId,
          eventType: 'MATCH_RESULT',
          sourceEntityId: `event_${event.id}`,
          delta: effects.reputation,
          description: `Resolución ética: ${event.title}`
        })
      } catch (repErr) {
        console.warn('Aviso reputación evento:', repErr)
      }
    }

    // 6. Marcar evento como RESOLVED
    await supabase.from('dynamic_events').update({
      status: 'RESOLVED',
      resolved_option_id: optionId,
      resolved_at: new Date().toISOString()
    }).eq('id', eventId)

    // 7. Insertar auditoría en event_consequences_log
    try {
      await supabase.from('event_consequences_log').insert({
        event_id: eventId,
        career_id: event.career_id,
        club_id: event.club_id,
        money_delta: moneyDelta,
        morale_delta: effects.morale || 0,
        reputation_delta: effects.reputation || 0,
        board_confidence_delta: effects.board || 0,
        fans_confidence_delta: effects.fans || 0,
        description: `Opción: ${optionDef.label || optionId}`
      })
    } catch (logErr) {
      console.warn('Aviso consequences log:', logErr)
    }

    // Si era un capítulo de una historia, la historia avanza según lo que elegiste
    if (String(event.template_code || '').startsWith('ARC_')) {
      try {
        const { climateApi } = await import('./climate')
        await climateApi.onArcChapterResolved({ clubId: event.club_id, code: event.template_code, optionId })
      } catch (arcErr) {
        console.warn('Aviso: no se pudo avanzar la historia:', arcErr)
      }
    }

    // Invalidar cachés
    queryCache.invalidate('events:')
    queryCache.invalidate('dashboard:')
    queryCache.invalidate('club:')

    return {
      success: true,
      resolvedOptionId: optionId,
      effects,
      outcomeNote
    }
  },

  /**
   * Inserta un evento a partir de una plantilla, salvo que ya haya uno igual pendiente.
   * Devuelve true si lo creó.
   */
  async createFromTemplate(rawTemplate, { clubId, managerId = null, careerId = null, week = 1, characters = null, memory = '' }) {
    // Los textos nombran a los personajes del club (la barra, el presidente, el periodista) y recuerdan lo que pasó
    const rendered = renderTemplate(rawTemplate, characters)
    const template = memory ? { ...rendered, description: `${rendered.description} ${memory}` } : rendered
    const pending = await this.getPendingEvents(clubId)
    if (pending.some(p => p.template_code === template.template_code)) return false

    try {
      const { error } = await supabase.from('dynamic_events').insert({
        career_id: careerId,
        club_id: clubId,
        manager_id: managerId,
        template_code: template.template_code,
        title: template.title,
        description: template.description,
        category: template.category,
        severity: template.severity,
        options: template.options,
        status: 'PENDING',
        created_at_week: week
      })
      if (error) throw new Error(error.message)

      queryCache.invalidate('events:')
      queryCache.invalidate('dashboard:')

      // La auditoría no condiciona nada: se registra sin hacer esperar al avance
      Promise.resolve(auditApi.logAction({
        whoId: managerId || clubId,
        action: 'DYNAMIC_EVENT_TRIGGERED',
        entityType: 'dynamic_events',
        stateAfter: { template: template.template_code, title: template.title, severity: template.severity }
      })).catch((auditErr) => console.warn('Aviso: no se pudo auditar el evento:', auditErr))
      return true
    } catch (e) {
      console.warn('Aviso insertando dynamic_event:', e)
      return false
    }
  },

  /**
   * Generación contextual de eventos: la probabilidad y el tipo dependen del clima del club
   * (con todo bien pasan cosas buenas; con presión llegan los aprietes y las ofertas turbias).
   */
  async generateWeeklyEvents(clubId, managerId, currentWeek = 1, careerId = null) {
    if (!clubId) return

    const { climateApi } = await import('./climate')
    // El estado del clima y los eventos pendientes se leen juntos
    const [state, pending] = await Promise.all([climateApi.getState(clubId), this.getPendingEvents(clubId)])

    if (Math.random() > eventProbability(state.climate, climateApi.difficulty)) return

    // Máximo 3 eventos pendientes simultáneos (Regla 35)
    if (pending.length >= 3) return

    const selected = pickEvent(FULL_EVENTS_CATALOG, {
      climate: state.climate,
      state: { favors: state.favors, scandals: state.scandals, barra: state.barra_stage },
      pendingCodes: new Set(pending.map(p => p.template_code))
    })
    if (!selected) return

    await this.createFromTemplate(selected, { clubId, managerId, careerId, week: currentWeek, characters: ensureCharacters(state.characters, clubId) })
  }
}
