import { supabase } from './supabase'
import { queryCache } from '../utils/cache'
import { levelsApi } from './levels'
import { eventsApi } from './events'
import { isContractExpiringSoon, CONTRACT_ALERT_WINDOW_WEEKS } from '../domain/contracts'
import { FIXTURE_OPEN_STATUSES } from '../domain/fixtureStatus'

export const dashboardApi = {
  /**
   * Obtiene la proyección agregada oficial del Dashboard con caché SWR
   */
  async getOverview(club, manager) {
    if (!club?.id || !manager?.id) return null

    return queryCache.fetch(`dashboard:overview:${club.id}`, async () => {
      // 1. Consultas concurrentes optimizadas
      const [
        levelInfo,
        { data: fixtureData },
        { data: squadData },
        { data: standingsData },
        pendingEvents
      ] = await Promise.all([
        levelsApi.getLevelInfo(manager.xp || 0),
        supabase
          .from('fixtures')
          .select('*, home:clubs!home_team_id(*), away:clubs!away_team_id(*)')
          .or(`home_team_id.eq.${club.id},away_team_id.eq.${club.id}`)
          .in('status', FIXTURE_OPEN_STATUSES)
          .order('match_date', { ascending: true })
          .order('match_week', { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('players')
          .select('id, first_name, last_name, position, is_injured, is_suspended, state_fitness, state_morale, contract_wage, contract_years, contract_end')
          .eq('club_id', club.id),
        supabase
          .from('standings')
          .select('*')
          .eq('club_id', club.id)
          .maybeSingle(),
        eventsApi.getPendingEvents(club.id).catch(() => [])
      ])

      const squad = squadData || []

      // 2. Cálculo de métricas de plantel
      const totalPlayers = squad.length
      const injuredPlayers = squad.filter(p => p.is_injured)
      const suspendedPlayers = squad.filter(p => p.is_suspended)
      const availableCount = totalPlayers - injuredPlayers.length - suspendedPlayers.length

      const totalFitness = squad.reduce((acc, p) => acc + (Number(p.state_fitness) || 100), 0)
      const totalMorale = squad.reduce((acc, p) => acc + (Number(p.state_morale) || 75), 0)
      const totalWageBill = squad.reduce((acc, p) => acc + (Number(p.contract_wage) || 0), 0)

      const averageFitness = totalPlayers > 0 ? Math.round(totalFitness / totalPlayers) : 100
      const averageMorale = totalPlayers > 0 ? Math.round(totalMorale / totalPlayers) : 75

      // Por vencer = vence dentro de la ventana de alerta (6 meses) según la fecha del juego
      const alertGameDate = club.game_date || '2026-07-01'
      const expiringContracts = squad.filter(p => isContractExpiringSoon(p.contract_end, alertGameDate, CONTRACT_ALERT_WINDOW_WEEKS))

      // 3. Sistema de Alertas Críticas
      const urgentAlerts = []

      // Alerta Bloqueante: Menos de 11 disponibles
      if (availableCount < 11 && totalPlayers > 0) {
        urgentAlerts.push({
          id: 'ALERT_MIN_PLAYERS',
          priority: 'HIGH',
          title: 'Plantel Insuficiente',
          message: `Solo tienes ${availableCount} jugadores aptos. Puedes jugar igual: el once se completa con juveniles de la cantera y, si hace falta, con lesionados (rinden un 20% menos y pueden agravar la lesión).`,
          actionUrl: '/squad'
        })
      }

      // Alerta de Lesiones
      if (injuredPlayers.length > 0) {
        urgentAlerts.push({
          id: 'ALERT_INJURIES',
          priority: 'MEDIUM',
          title: 'Bajas Médicas',
          message: `${injuredPlayers.length} jugador(es) en enfermería no disponibles para jugar.`,
          actionUrl: '/squad'
        })
      }

      // Alerta de Contratos por vencer
      if (expiringContracts.length > 0) {
        urgentAlerts.push({
          id: 'ALERT_CONTRACTS',
          priority: 'LOW',
          title: 'Contratos por Vencer',
          message: `${expiringContracts.length} futbolista(s) con contrato que vence en los próximos 6 meses.`,
          actionUrl: '/squad'
        })
      }

      // Alerta de Déficit Financiero
      const currentBalance = Number(club.budget) || 0
      const weeklyBudget = Number(club.wage_budget) || 3500
      const financialHealth = currentBalance < 0 
        ? 'DEFICIT' 
        : currentBalance < weeklyBudget * 2 
        ? 'TIGHT' 
        : 'HEALTHY'

      if (financialHealth === 'DEFICIT') {
        urgentAlerts.push({
          id: 'ALERT_FINANCES',
          priority: 'HIGH',
          title: 'Déficit Financiero',
          message: 'La caja del club se encuentra en saldo negativo. Ajusta salarios para evitar sanciones.',
          actionUrl: '/finances'
        })
      }

      return {
        managerSummary: {
          id: manager.id,
          name: `${manager.first_name} ${manager.last_name}`,
          level: levelInfo.currentLevel,
          title: levelInfo.title,
          currentXp: manager.xp || 0,
          xpRequiredForNext: levelInfo.xpRequiredForNext,
          progressPercent: levelInfo.progressPercent,
          reputation: manager.reputation || 15
        },
        clubSummary: {
          id: club.id,
          name: club.name,
          shortName: club.short_name,
          city: club.city,
          country: club.country,
          gameDate: club.game_date || '2026-07-01',
          colors: club.colors,
          stadiumName: club.stadium_name || 'Estadio Municipal'
        },
        financesSummary: {
          balance: currentBalance,
          weeklyWageBill: totalWageBill,
          wageBudget: weeklyBudget,
          financialHealth
        },
        squadHealth: {
          totalPlayers,
          availableCount,
          averageFitness,
          averageMorale,
          injuredCount: injuredPlayers.length,
          suspendedCount: suspendedPlayers.length
        },
        standingsSnippet: standingsData || null,
        nextFixture: fixtureData || null,
        urgentAlerts,
        pendingEvents: pendingEvents || []
      }
    }, 45000)
  }
}
