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
      <div className="flex flex-col items-center justify-center p-12 text-fg-muted">
        <Users className="w-8 h-8 animate-pulse text-accent mb-2" />
        <p className="text-sm font-medium">Consultando clima social de la hinchada...</p>
      </div>
    )
  }

  const atmosphere = fanbaseApi.getAtmosphereMetadata(fanbase?.stadium_atmosphere_status)
  const score = fanbase?.fan_support_score || 65

  return (
    <div className="space-y-6">
      {/* TARJETA PRINCIPAL: HUMOR POPULAR Y FACTOR CALDERA */}
      <div className="p-4 sm:p-6 rounded-lg bg-surface/60 border border-line">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-line/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-accent/10 border border-accent/20 text-accent">
                <Flame className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-fg">Humor Social & Hinchada</h2>
                <p className="text-xs text-fg-muted">Paciencia con el DT y fervor ambiental en las tribunas</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[11px] text-fg-muted font-medium">Índice de Apoyo</span>
              <p className="text-2xl font-semibold text-fg font-mono flex items-center justify-end gap-1.5">
                <Heart className={`w-5 h-5 ${score >= 70 ? 'text-danger fill-rose-500' : 'text-fg-subtle'}`} />
                {score}<span className="text-xs font-normal text-fg-muted">/100</span>
              </p>
            </div>
            <div className="border-l border-line pl-4 text-left">
              <span className="text-[11px] text-fg-muted font-medium">Clima Tribuna</span>
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
          <div className="p-4 rounded-xl bg-bg/80 border border-line/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-fg-muted flex items-center gap-1.5">
                <Users className="w-4 h-4 text-accent" />
                Socios Fieles al Día
              </span>
              <span className="text-xs font-mono font-bold text-fg">
                {Number(fanbase?.loyal_members_count || 350).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-fg-muted mt-2">
              Asistencia incondicional garantizada en todos los partidos de local sin importar el clima.
            </p>
          </div>

          {/* Simpatizantes de Barrio */}
          <div className="p-4 rounded-xl bg-bg/80 border border-line/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-fg-muted flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-blue-400" />
                Potencial de Hinchas
              </span>
              <span className="text-xs font-mono font-bold text-fg">
                ~{Number(fanbase?.casual_fanbase_potential || 2500).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-fg-muted mt-2">
              Simpatizantes locales que llenan la cancha ante rachas victoriosas o clásicos barriales.
            </p>
          </div>

          {/* Factor Caldera */}
          <div className="p-4 rounded-xl bg-bg/80 border border-line/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-fg-muted flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-gold" />
                Factor Caldera (Local)
              </span>
              <span className="text-xs font-mono font-bold text-gold">
                {score >= 80 ? '+8% duelos' : score >= 60 ? '+4% duelos' : 'Neutro (0%)'}
              </span>
            </div>
            <p className="text-xs text-fg-muted mt-2">
              {atmosphere.description}
            </p>
          </div>
        </div>
      </div>

      {/* CANCIONERO POPULAR & CÁNTICOS DE LA HINCHADA */}
      <div className="p-4 sm:p-5 rounded-lg bg-surface/60 border border-line">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-fg flex items-center gap-2">
              <Music className="w-5 h-5 text-accent" />
              Cancionero Popular & Cánticos
            </h3>
            <p className="text-xs text-fg-muted">Las canciones que retumban desde la tribuna popular en cada fecha.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {(fanbase?.chants || []).map((chant, i) => (
            <div 
              key={i} 
              className="p-3.5 rounded-xl bg-bg/70 border border-line/80 flex items-center gap-3"
            >
              <span className="p-2 rounded-lg bg-surface text-accent shrink-0">
                <Megaphone className="w-4 h-4" />
              </span>
              <p className="text-xs font-semibold text-fg italic leading-snug">
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
            className="flex-1 px-3 py-2 text-xs bg-bg border border-line rounded-xl text-fg placeholder-fg-subtle focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={addingChant || !newChant.trim()}
            className="px-4 py-2 bg-accent hover:bg-accent-strong disabled:opacity-50 text-accent-fg font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Cántico</span>
          </button>
        </form>
      </div>

      {/* REGISTRO DE CONCURRENCIA RECIENTE EN EL ESTADIO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 sm:p-5 rounded-lg bg-surface/40 border border-line">
          <h3 className="text-sm font-bold text-fg flex items-center gap-2 mb-3">
            <Ticket className="w-4 h-4 text-accent" />
            Historial de Concurrencia de Local
          </h3>
          {attendanceHistory.length === 0 ? (
            <p className="text-xs text-fg-subtle py-6 text-center border border-dashed border-line rounded-xl">
              Sin registros de taquilla recientes. Aún no se han disputado partidos en casa en esta temporada.
            </p>
          ) : (
            <div className="space-y-2">
              {attendanceHistory.map((rec) => (
                <div 
                  key={rec.id} 
                  className="flex items-center justify-between p-3 rounded-xl bg-bg/70 border border-line/80 text-xs"
                >
                  <div>
                    <span className="font-bold text-fg">
                      {Number(rec.attendance).toLocaleString()} espectadores
                    </span>
                    <p className="text-[11px] text-fg-subtle">
                      {new Date(rec.created_at).toLocaleDateString()} • Entrada: ${Number(rec.ticket_price_applied).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-accent font-bold block">
                      {rec.capacity_fill_percentage}% ocupación
                    </span>
                    <span className="text-[11px] text-fg-muted font-mono">
                      Bono: x{Number(rec.home_advantage_bonus).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* EVENTOS Y MANIFESTACIONES POPULARES */}
        <div className="p-4 sm:p-5 rounded-lg bg-surface/40 border border-line">
          <h3 className="text-sm font-bold text-fg flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-gold" />
            Manifestaciones & Eventos de Afición
          </h3>
          {events.length === 0 ? (
            <p className="text-xs text-fg-subtle py-6 text-center border border-dashed border-line rounded-xl">
              Sin eventos extraordinarios de hinchada registrados hasta el momento.
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((ev) => (
                <div 
                  key={ev.id} 
                  className="p-3 rounded-xl bg-bg/70 border border-line/80 text-xs"
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <span className="font-bold text-fg">
                      {ev.event_type === 'DERBY_BANDERAZO' && 'Banderazo Previo al Clásico'}
                      {ev.event_type === 'FAN_PROTEST' && 'Banderazo de Protesta'}
                      {ev.event_type === 'STANDING_OVATION' && 'Ovación Histórica'}
                      {ev.event_type === 'MEMBERSHIP_BOOM' && 'Campaña Récord de Nuevos Socios'}
                    </span>
                    <span className={`font-mono text-[11px] font-bold ${ev.impact_on_morale >= 0 ? 'text-accent' : 'text-danger'}`}>
                      {ev.impact_on_morale >= 0 ? `+${ev.impact_on_morale}` : ev.impact_on_morale} moral
                    </span>
                  </div>
                  <p className="text-[11px] text-fg-muted">{ev.details}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
