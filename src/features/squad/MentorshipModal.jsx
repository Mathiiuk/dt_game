import React, { useState, useEffect } from 'react'
import { 
  GraduationCap, 
  Award, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  UserCheck, 
  Users,
  ShieldAlert
} from 'lucide-react'
import { personalitiesApi, PERSONALITY_ARCHETYPES } from '../../api/personalities'
import { toast } from 'sonner'

export default function MentorshipModal({ club, players = [], onClose, onMentorshipStarted }) {
  const [mentorships, setMentorships] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVeteran, setSelectedVeteran] = useState('')
  const [selectedYouth, setSelectedYouth] = useState('')
  const [creating, setCreating] = useState(false)

  const loadData = async () => {
    if (!club?.id) return
    try {
      setLoading(true)
      const data = await personalitiesApi.getClubMentorships(club.id)
      setMentorships(data)
    } catch (e) {
      console.error(e)
      toast.error('Error cargando mentorías')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [club?.id])

  const eligibleVeterans = players.filter(p => (p.age || 20) >= 25)
  const eligibleYouth = players.filter(p => (p.age || 20) <= 21)

  const handleStartMentorship = async (e) => {
    e.preventDefault()
    if (!selectedVeteran || !selectedYouth) {
      toast.error('Selecciona tanto al tutor como al juvenil')
      return
    }

    try {
      setCreating(true)
      await personalitiesApi.assignMentorship(club.id, selectedVeteran, selectedYouth)
      toast.success('¡Programa de mentoría iniciado!')
      setSelectedVeteran('')
      setSelectedYouth('')
      if (onMentorshipStarted) onMentorshipStarted()
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Error al iniciar tutoría')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <GraduationCap className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Programa de Tutorías & Mentoría</h2>
              <p className="text-xs text-zinc-400">Transmisión de liderazgo y profesionalismo de veteranos a juveniles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Formulario de Nueva Tutoría */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Asignar Nueva Tutoría Personalizada
            </h3>

            <form onSubmit={handleStartMentorship} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                  Veterano Tutor (25+ años)
                </label>
                <select
                  value={selectedVeteran}
                  onChange={(e) => setSelectedVeteran(e.target.value)}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                >
                  <option value="">Seleccionar veterano...</option>
                  {eligibleVeterans.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.position}, {v.age}a, OVR {v.overall})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                  Juvenil Protegido (21 o menos)
                </label>
                <select
                  value={selectedYouth}
                  onChange={(e) => setSelectedYouth(e.target.value)}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                >
                  <option value="">Seleccionar juvenil...</option>
                  {eligibleYouth.map(y => (
                    <option key={y.id} value={y.id}>
                      {y.name} ({y.position}, {y.age}a, OVR {y.overall})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 pt-1">
                <button
                  type="submit"
                  disabled={creating || !selectedVeteran || !selectedYouth}
                  className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Iniciar Mentoría (20 semanas de duración)</span>
                </button>
              </div>
            </form>
          </div>

          {/* Tutorías Activas y Completadas */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Tutorías en Curso & Históricas
            </h3>

            {loading ? (
              <div className="py-8 text-center text-zinc-500 text-xs">Cargando tutorías...</div>
            ) : mentorships.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl text-xs text-zinc-500">
                Sin tutorías activas. Empareja a un veterano con un juvenil para acelerar su madurez competitiva.
              </div>
            ) : (
              <div className="space-y-3">
                {mentorships.map(m => (
                  <div key={m.id} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-bold text-white">
                        <span>{m.veteran?.name || 'Veterano'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-emerald-400">{m.youth?.name || 'Juvenil'}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        m.status === 'COMPLETED' 
                          ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20' 
                          : 'border-amber-500/40 text-amber-400 bg-amber-950/20'
                      }`}>
                        {m.status === 'COMPLETED' ? 'Completada' : `${m.progress_percentage}% Progreso`}
                      </span>
                    </div>

                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          m.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-400'
                        }`}
                        style={{ width: `${m.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Catálogo de Arquetipos de Personalidad */}
          <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/80 space-y-3">
            <h4 className="text-xs font-bold text-zinc-300">Guía de Arquetipos Psicológicos</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {Object.values(PERSONALITY_ARCHETYPES).map(arch => (
                <div key={arch.key} className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block mb-1 ${arch.badgeColor}`}>
                    {arch.name}
                  </span>
                  <p className="text-[11px] text-zinc-400 leading-snug">{arch.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
