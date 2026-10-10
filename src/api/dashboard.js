import { supabase } from './supabase'
import { queryCache } from '../utils/cache'
import { levelsApi } from './levels'
import { eventsApi } from './events'
import { competitionApi } from './competition'
import { seasonCloseApi } from './seasonClose'
import { contractsAlert } from '../domain/contracts'
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
        leagueTable,
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
        // La misma tabla ordenada que usa la pantalla Tabla (con caché): de ahí sale el puesto, que no se guarda en la base
        competitionApi.getStandings(club.id).catch(() => []),
        eventsApi.getPendingEvents(club.id).catch(() => [])
      ])

      const squad = squadData || []
      const myRow = (leagueTable || []).find(r => r.club_id === club.id) || null

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
          actionUrl: '/club?tab=enfermeria'
        })
      }

      // Alerta de contratos por vencer (suave a mitad de temporada, urgente en las últimas 12 semanas)
      const contractsWarning = contractsAlert(squad, alertGameDate)
      if (contractsWarning) urgentAlerts.push(contractsWarning)

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

      // Si el cierre de la temporada anterior quedó a medias, el inicio lo avisa y deja terminarlo
      const pendingClose = await seasonCloseApi.getPendingClose(club.id)

      return {
        pendingClose,
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
        standingsSnippet: myRow ? { rank: myRow.position, points: myRow.points || 0, played: myRow.played || 0 } : null,
        nextFixture: fixtureData || null,
        urgentAlerts,
        pendingEvents: pendingEvents || []
      }
    }, 45000)
  }
}
