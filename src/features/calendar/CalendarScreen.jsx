import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Calendar as CalendarIcon, 
  ArrowLeft, 
  ChevronRight, 
  Clock, 
  Trophy, 
  ArrowRightLeft, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Shield, 
  Loader2,
  FastForward
} from 'lucide-react'
import { useGameContext } from '../../context/GameContext'
import { calendarApi, SEASON_PHASES } from '../../api/calendar'
import { gameLoopApi } from '../../api/gameLoop'
import { queryCache } from '../../utils/cache'
import { toast } from 'sonner'
import { isFixturePlayed } from '../../domain/fixtureStatus'

export default function CalendarScreen() {
  const navigate = useNavigate()
  const { club, manager, loading: contextLoading, refreshContext } = useGameContext()
  const [calendarData, setCalendarData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [advancing, setAdvancing] = useState(false)
  const [filterPhase, setFilterPhase] = useState('ALL')

  useEffect(() => {
    if (contextLoading || !club) return
    loadCalendar()
  }, [contextLoading, club?.id, club?.game_date])

  const loadCalendar = async () => {
    try {
      setLoading(true)
      const careerId = await calendarApi.resolveCareerId(manager?.id)
      const data = await calendarApi.getSeasonCalendar(careerId, club?.id, 2026)
      setCalendarData(data)
    } catch (e) {
      console.error('Error cargando calendario:', e)
      toast.error('No se pudo cargar el calendario de la temporada.')
    } finally {
      setLoading(false)
    }
  }

  const handleAdvance = async () => {
    if (!calendarData?.currentState) return
    setAdvancing(true)
    try {
      // Mismo motor que el Inicio: avance autoritativo, evaluación de la dirigencia y auditoría
      const res = await gameLoopApi.advanceWeek(club.id, manager?.id, {
        careerId: calendarData.currentState.career_id,
        expectedCurrentWeek: calendarData.currentState.current_week
      })

      queryCache.clear()
      await refreshContext()
      await loadCalendar()
      if (res.fired) {
        toast.error('La dirigencia te destituyó por los resultados deportivos.')
        navigate('/manager')
        return
      }
      toast.success(`Semana ${res.week} completada. El plantel recuperó condición física.`)
    } catch (e) {
      toast.error(e.code === 'ERR_MATCH_MUST_BE_PLAYED_FIRST' ? 'Debes disputar tu partido pendiente antes de avanzar de semana.' : (e.message || 'Error al avanzar de semana.'))
    } finally {
      setAdvancing(false)
    }
  }

  if (loading || contextLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white gap-3 p-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-zinc-400 font-medium text-sm">Cargando calendario oficial...</p>
      </div>
    )
  }

  const currentState = calendarData?.currentState || { current_week: 1, current_season_year: 2026, season_phase: 'PRE_SEASON' }
  const weeks = calendarData?.weeks || []

  const filteredWeeks = weeks.filter(w => {
    if (filterPhase === 'ALL') return true
    if (filterPhase === 'APERTURA') return w.phase === 'REGULAR_SEASON_APERTURA'
    if (filterPhase === 'CLAUSURA') return w.phase === 'REGULAR_SEASON_CLAUSURA'
    if (filterPhase === 'TRANSFERS') return w.transferWindowOpen
    return true
  })

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 -ml-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-emerald-400" />
                <h1 className="text-base font-bold text-white">Calendario Oficial</h1>
              </div>
              <p className="text-xs text-zinc-400">Temporada {currentState.current_season_year} • 52 Semanas</p>
            </div>
          </div>

          <button
            onClick={handleAdvance}
            disabled={advancing}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-950/50"
          >
            {advancing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FastForward className="w-3.5 h-3.5" />
            )}
            <span>Avanzar Semana</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Status Hero Card */}
        <section className="p-4 rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900/80 to-zinc-950 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Cronología de Competición
            </span>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">
                Semana {currentState.current_week} de 52
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {SEASON_PHASES[currentState.season_phase]?.label || currentState.season_phase}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {currentState.transfer_window_open ? 'Mercado de traspasos abierto: fichajes y cesiones habilitados.' : 'Mercado de traspasos cerrado.'}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-center min-w-[80px]">
              <span className="block text-[10px] text-zinc-400 uppercase font-semibold">Semana</span>
              <span className="text-lg font-black text-emerald-400">{currentState.current_week}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-center min-w-[80px]">
              <span className="block text-[10px] text-zinc-400 uppercase font-semibold">Año</span>
              <span className="text-lg font-black text-white">{currentState.current_season_year}</span>
            </div>
          </div>
        </section>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: 'Todas las semanas' },
            { id: 'APERTURA', label: 'Torneo Apertura' },
            { id: 'CLAUSURA', label: 'Torneo Clausura' },
            { id: 'TRANSFERS', label: 'Ventana de Fichajes' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterPhase(f.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filterPhase === f.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Weeks List */}
        <div className="space-y-2.5">
          {filteredWeeks.map((w) => {
            const isCurrent = w.isCurrent
            const isPast = w.isPast

            return (
              <div
                key={w.weekNumber}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-emerald-500/80 bg-emerald-950/20 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                    : isPast
                    ? 'border-zinc-800/60 bg-zinc-900/40 opacity-75'
                    : 'border-zinc-800/80 bg-zinc-900/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Week badge and phase */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center font-bold shrink-0 ${
                      isCurrent
                        ? 'bg-emerald-500 text-zinc-950 font-black'
                        : isPast
                        ? 'bg-zinc-800 text-zinc-400'
                        : 'bg-zinc-800/80 text-zinc-300'
                    }`}>
                      <span className="text-[10px] uppercase tracking-tighter leading-none">SEM</span>
                      <span className="text-sm leading-none">{w.weekNumber}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(new Date(w.date + 'T00:00:00'))}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          • {w.phaseLabel}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-emerald-500 text-zinc-950">
                            En curso
                          </span>
                        )}
                      </div>

                      {/* Events chips */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {w.transferWindowOpen && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            <ArrowRightLeft className="w-2.5 h-2.5" />
                            Mercado
                          </span>
                        )}
                        {w.events.map((ev, idx) => (
                          <span 
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            {ev.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Match or Status */}
                  <div className="text-right shrink-0">
                    {w.match ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-white">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          <span>Partido Oficial</span>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isFixturePlayed(w.match.status)
                            ? 'bg-zinc-800 text-zinc-300'
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {isFixturePlayed(w.match.status) ? `${w.match.home_score} - ${w.match.away_score}` : 'Por Jugar'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-zinc-500 font-medium">
                        Sin partido
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
