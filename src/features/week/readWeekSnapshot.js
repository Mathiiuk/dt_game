import { supabase } from '../../api/supabase'
import { FIXTURE_OPEN_STATUSES } from '../../domain/fixtureStatus'

/** Caja del club y fecha del próximo partido pendiente (para contar qué cambió al avanzar la semana) */
export const readWeekSnapshot = (clubId) => async () => {
  const [club, fixtures] = await Promise.all([
    supabase.from('clubs').select('budget').eq('id', clubId).maybeSingle(),
    supabase.from('fixtures').select('match_date').or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`).in('status', FIXTURE_OPEN_STATUSES).order('match_date', { ascending: true }).limit(1)
  ])
  return {
    budget: club?.data ? Number(club.data.budget) : null,
    nextMatchDate: fixtures?.data?.[0]?.match_date ? String(fixtures.data[0].match_date).slice(0, 10) : null
  }
}
