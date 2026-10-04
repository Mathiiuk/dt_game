import { supabase } from './supabase'
import { queryCache } from '../utils/cache'
import { levelsApi } from './levels'
import { eventsApi } from './events'

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
          .eq('status', 'PENDING')
          .order('match_week', { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('players')
          .select('id, first_name, last_name, position, is_injured, is_suspended, state_fitness, state_morale, contract_wage, contract_years')
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

      const expiringContracts = squad.filter(p => (Number(p.contract_years) || 1) <= 1)

      // 3. Sistema de Alertas Críticas
      const urgentAlerts = []

      // Alerta Bloqueante: Menos de 11 disponibles
      if (availableCount < 11 && totalPlayers > 0) {
        urgentAlerts.push({
          id: 'ALERT_MIN_PLAYERS',
          priority: 'HIGH',
          title: 'Plantel Insuficiente',
          message: `Solo tienes ${availableCount} jugadores aptos. Necesitas al menos 11 habilitados para el partido.`,
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
          message: `${expiringContracts.length} futbolista(s) en su último año de contrato.`,
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
