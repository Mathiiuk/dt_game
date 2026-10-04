import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Flame, 
  Heart, 
  Megaphone, 
  TrendingUp, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  Music, 
  Ticket,
  Plus,
  History,
  Award
} from 'lucide-react'
import { fanbaseApi } from '../../../api/fanbase'
import { toast } from 'sonner'

export default function FanbaseManagementTab({ club }) {
  const [fanbase, setFanbase] = useState(null)
  const [attendanceHistory, setAttendanceHistory] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [newChant, setNewChant] = useState('')
  const [addingChant, setAddingChant] = useState(false)

  const loadFanbaseData = async () => {
    if (!club?.id) return
    try {
      setLoading(true)
      const [fanRes, historyRes, eventsRes] = await Promise.all([
        fanbaseApi.getClubFanbase(club.id),
        fanbaseApi.getRecentAttendance(club.id),
        fanbaseApi.getFanbaseEvents(club.id)
      ])
      setFanbase(fanRes)
      setAttendanceHistory(historyRes)
      setEvents(eventsRes)
    } catch (e) {
      console.error(e)
      toast.error('Error al cargar datos de la afición')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFanbaseData()
  }, [club?.id])

  const handleAddChant = async (e) => {
    e.preventDefault()
    if (!newChant.trim()) return

    try {
      setAddingChant(true)
      const updated = await fanbaseApi.addCustomChant(club.id, newChant.trim())
      setFanbase(prev => ({ ...prev, chants: updated }))
      setNewChant('')
      toast.success('¡Nuevo cántico entonado en la tribuna!')
    } catch (err) {
      toast.error('Error al guardar cántico')
    } finally {
      setAddingChant(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-400">
        <Users className="w-8 h-8 animate-pulse text-emerald-400 mb-2" />
        <p className="text-sm font-medium">Consultando clima social de la hinchada...</p>
      </div>
    )
  }

  const atmosphere = fanbaseApi.getAtmosphereMetadata(fanbase?.stadium_atmosphere_status)
  const score = fanbase?.fan_support_score || 65

  return (
    <div className="space-y-6">
      {/* TARJETA PRINCIPAL: HUMOR POPULAR Y FACTOR CALDERA */}
      <div className="p-4 sm:p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Flame className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white">Humor Social & Hinchada</h2>
                <p className="text-xs text-zinc-400">Paciencia con el DT y fervor ambiental en las tribunas</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[11px] text-zinc-400 font-medium">Índice de Apoyo</span>
              <p className="text-2xl font-black text-white font-mono flex items-center justify-end gap-1.5">
                <Heart className={`w-5 h-5 ${score >= 70 ? 'text-rose-500 fill-rose-500' : 'text-zinc-500'}`} />
                {score}<span className="text-xs font-normal text-zinc-400">/100</span>
              </p>
            </div>
            <div className="border-l border-zinc-800 pl-4 text-left">
              <span className="text-[11px] text-zinc-400 font-medium">Clima Tribuna</span>
              <div className="mt-0.5">
                <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg border ${atmosphere.badgeColor}`}>
                  {atmosphere.title}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MÉTRICAS DE MASA SOCIAL Y EFECTO CANCHA */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          {/* Socios Fieles */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                Socios Fieles al Día
              </span>
              <span className="text-xs font-mono font-bold text-white">
                {Number(fanbase?.loyal_members_count || 350).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              Asistencia incondicional garantizada en todos los partidos de local sin importar el clima.
            </p>
          </div>

          {/* Simpatizantes de Barrio */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-blue-400" />
                Potencial de Hinchas
              </span>
              <span className="text-xs font-mono font-bold text-white">
                ~{Number(fanbase?.casual_fanbase_potential || 2500).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              Simpatizantes locales que llenan la cancha ante rachas victoriosas o clásicos barriales.
            </p>
          </div>

          {/* Factor Caldera */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                Factor Caldera (Local)
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">
                {score >= 80 ? '+8% duelos' : score >= 60 ? '+4% duelos' : 'Neutro (0%)'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              {atmosphere.description}
            </p>
          </div>
        </div>
      </div>

      {/* CANCIONERO POPULAR & CÁNTICOS DE LA HINCHADA */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Music className="w-5 h-5 text-emerald-400" />
              Cancionero Popular & Cánticos
            </h3>
            <p className="text-xs text-zinc-400">Las canciones que retumban desde la tribuna popular en cada fecha.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {(fanbase?.chants || []).map((chant, i) => (
            <div 
              key={i} 
              className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center gap-3"
            >
              <span className="p-2 rounded-lg bg-zinc-900 text-emerald-400 shrink-0">
                <Megaphone className="w-4 h-4" />
              </span>
              <p className="text-xs font-semibold text-zinc-200 italic leading-snug">
                "{chant}"
              </p>
            </div>
          ))}
        </div>

        {/* Formulario para agregar nuevo cántico */}
        <form onSubmit={handleAddChant} className="flex gap-2">
          <input
            type="text"
            placeholder="Escribe un nuevo cántico para la hinchada..."
            value={newChant}
            onChange={(e) => setNewChant(e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={addingChant || !newChant.trim()}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Cántico</span>
          </button>
        </form>
      </div>

      {/* REGISTRO DE CONCURRENCIA RECIENTE EN EL ESTADIO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2 mb-3">
            <Ticket className="w-4 h-4 text-emerald-400" />
            Historial de Concurrencia de Local
          </h3>
          {attendanceHistory.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center border border-dashed border-zinc-800 rounded-xl">
              Sin registros de taquilla recientes. Aún no se han disputado partidos en casa en esta temporada.
            </p>
          ) : (
            <div className="space-y-2">
              {attendanceHistory.map((rec) => (
                <div 
                  key={rec.id} 
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs"
                >
                  <div>
                    <span className="font-bold text-zinc-200">
                      {Number(rec.attendance).toLocaleString()} espectadores
                    </span>
                    <p className="text-[11px] text-zinc-500">
                      {new Date(rec.created_at).toLocaleDateString()} • Entrada: ${Number(rec.ticket_price_applied).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-emerald-400 font-bold block">
                      {rec.capacity_fill_percentage}% ocupación
                    </span>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Bono: x{Number(rec.home_advantage_bonus).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* EVENTOS Y MANIFESTACIONES POPULARES */}
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-amber-400" />
            Manifestaciones & Eventos de Afición
          </h3>
          {events.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center border border-dashed border-zinc-800 rounded-xl">
              Sin eventos extraordinarios de hinchada registrados hasta el momento.
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((ev) => (
                <div 
                  key={ev.id} 
                  className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs"
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <span className="font-bold text-zinc-200">
                      {ev.event_type === 'DERBY_BANDERAZO' && 'Banderazo Previo al Clásico'}
                      {ev.event_type === 'FAN_PROTEST' && 'Banderazo de Protesta'}
                      {ev.event_type === 'STANDING_OVATION' && 'Ovación Histórica'}
                      {ev.event_type === 'MEMBERSHIP_BOOM' && 'Campaña Récord de Nuevos Socios'}
                    </span>
                    <span className={`font-mono text-[11px] font-bold ${ev.impact_on_morale >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {ev.impact_on_morale >= 0 ? `+${ev.impact_on_morale}` : ev.impact_on_morale} moral
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">{ev.details}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
