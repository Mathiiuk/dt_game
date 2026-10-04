import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Dumbbell, 
  Activity, 
  HeartPulse, 
  Sparkles, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  UserCheck, 
  Target, 
  Clock, 
  ChevronRight,
  Loader2 
} from 'lucide-react'
import { toast } from 'sonner'
import { useGameContext } from '../../context/GameContext'
import { trainingApi, FOCUS_OPTIONS, INTENSITY_CONFIG, INDIVIDUAL_ATTRIBUTES } from '../../api/training'
import { supabase } from '../../api/supabase'

export default function TrainingScreen() {
  const navigate = useNavigate()
  const { club, manager, refreshContext } = useGameContext()

  const [activeTab, setActiveTab] = useState('GENERAL') // 'GENERAL' | 'INDIVIDUAL'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Plan general
  const [focus, setFocus] = useState('BALANCED')
  const [intensity, setIntensity] = useState('MEDIUM')

  // Plantel y asignaciones individuales
  const [players, setPlayers] = useState([])
  const [assignments, setAssignments] = useState({})
  const [savingPlayerId, setSavingPlayerId] = useState(null)

  useEffect(() => {
    if (!club?.id) return
    loadTrainingData()
  }, [club?.id])

  const loadTrainingData = async () => {
    try {
      setLoading(true)
      const plan = await trainingApi.getClubTrainingPlan(club.id)
      if (plan) {
        setFocus(plan.general_focus || 'BALANCED')
        setIntensity(plan.intensity_level || 'MEDIUM')
      }

      // Cargar jugadores
      const { data: squad } = await supabase
        .from('players')
        .select('*')
        .eq('club_id', club.id)
        .eq('is_retired', false)
        .order('position', { ascending: true })

      if (squad) setPlayers(squad)

      // Cargar asignaciones individuales
      const assigned = await trainingApi.getPlayerAssignments(club.id)
      const map = {}
      assigned.forEach(a => {
        map[a.player_id] = a.focus_attribute
      })
      setAssignments(map)
    } catch (e) {
      console.error('Error cargando plan de entrenamiento:', e)
      toast.error('Error al sincronizar datos de entrenamiento.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveGeneralPlan = async () => {
    setSaving(true)
    try {
      await trainingApi.updateClubTrainingPlan(club.id, focus, intensity)
      await refreshContext()
      toast.success('Plan general de entrenamiento actualizado y en vigor.')
    } catch (e) {
      toast.error(e.message || 'Error al guardar el plan de entrenamiento.')
    } finally {
      setSaving(false)
    }
  }

  const handleAssignIndividual = async (playerId, attrId) => {
    setSavingPlayerId(playerId)
    try {
      await trainingApi.setPlayerAssignment(club.id, playerId, attrId)
      setAssignments(prev => ({ ...prev, [playerId]: attrId }))
      toast.success('Foco individual asignado al futbolista.')
    } catch (e) {
      toast.error('No se pudo guardar la asignación individual.')
    } finally {
      setSavingPlayerId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white gap-3 p-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-zinc-400 font-medium text-sm">Cargando centro de alto rendimiento...</p>
      </div>
    )
  }

  const selectedIntensity = INTENSITY_CONFIG[intensity] || INTENSITY_CONFIG.MEDIUM
  const isRecovery = focus === 'RECOVERY_REST'

  // Calcular condición física promedio del plantel
  const avgFitness = players.length > 0 
    ? Math.round(players.reduce((acc, p) => acc + (p.state_fitness || 0), 0) / players.length)
    : 75
  const isCriticalFitness = avgFitness < 60

  return (
    <div className="min-h-screen p-4 md:p-8 text-zinc-100 bg-zinc-950 pb-24 lg:pb-8">
      {/* Top Header */}
      <header className="max-w-5xl mx-auto flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="p-2 transition-colors border rounded-xl border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <Dumbbell className="w-6 h-6 text-emerald-400" />
              Centro de Alto Rendimiento
            </h1>
            <p className="text-xs text-zinc-400">Preparación física, táctica y desarrollo individual</p>
          </div>
        </div>

        {/* Fitness medio del plantel */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-zinc-400">Fitness Promedio:</span>
          <span className={`text-xs font-bold ${isCriticalFitness ? 'text-red-400 font-black' : 'text-emerald-400'}`}>
            {avgFitness}%
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto flex items-center gap-2 mb-6 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('GENERAL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'GENERAL'
              ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-950/30'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Target className="w-4 h-4" />
          Plan Semanal Colectivo
        </button>

        <button
          onClick={() => setActiveTab('INDIVIDUAL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'INDIVIDUAL'
              ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-950/30'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Tutoría Individual ({players.length})
        </button>
      </div>

      <main className="max-w-5xl mx-auto">
        {/* Alerta de fatiga extrema si aplica */}
        {isCriticalFitness && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/40 bg-red-950/20 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-red-300 uppercase tracking-wide">Alerta de Sanidad del Club</span>
              <p className="text-zinc-300">
                La condición física media del plantel es crítica ({avgFitness}%). Si mantienes una intensidad alta, el riesgo de lesiones musculares graves se disparará en los próximos entrenamientos. Te recomendamos asignar una semana de enfoque <strong>Regenerativo y Descanso</strong>.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'GENERAL' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna Izquierda: Foco Semanal */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    Enfoque Principal de la Semana
                  </h2>
                  <span className="text-[11px] text-zinc-400 font-medium">1 sesión semanal</span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {FOCUS_OPTIONS.map(opt => {
                    const isSelected = focus === opt.id
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setFocus(opt.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500/50 shadow-sm'
                            : 'border-zinc-800/80 bg-zinc-950/50 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isSelected ? 'text-emerald-400' : 'text-zinc-200'}`}>
                            {opt.label}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{opt.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Botón de Guardado */}
              <button
                onClick={handleSaveGeneralPlan}
                disabled={saving}
                className="w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando Planificación...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Plan de Trabajo Semanal</span>
                  </>
                )}
              </button>
            </div>

            {/* Columna Derecha: Intensidad y Balance Médico */}
            <div className="space-y-4">
              {/* Intensidad Card */}
              <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Nivel de Intensidad
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  {['LOW', 'MEDIUM', 'HIGH'].map(lvl => {
                    const cfg = INTENSITY_CONFIG[lvl]
                    const isSelected = intensity === lvl
                    return (
                      <button
                        key={lvl}
                        disabled={isRecovery}
                        onClick={() => setIntensity(lvl)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isRecovery
                            ? 'opacity-40 cursor-not-allowed border-zinc-800 bg-zinc-950'
                            : isSelected
                            ? 'border-emerald-500 bg-emerald-950/40 text-emerald-400 font-bold ring-1 ring-emerald-500'
                            : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <span className="block text-xs">{cfg.label}</span>
                        <span className="text-[10px] text-zinc-500 font-medium">-{cfg.fitnessCost} fit</span>
                      </button>
                    )
                  })}
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-zinc-400">
                    <span>Desgaste de Fitness:</span>
                    <span className="font-bold text-zinc-200">
                      {isRecovery ? '+15 (Regenerativo)' : `-${selectedIntensity.fitnessCost} pts`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-400">
                    <span>Riesgo Base de Lesión:</span>
                    <span className={`font-bold ${isRecovery ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isRecovery ? '0.0%' : `${(selectedIntensity.injuryBaseProb * 100).toFixed(1)}%`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-400">
                    <span>Multiplicador de Mejora:</span>
                    <span className="font-bold text-emerald-400">
                      {isRecovery ? '0x' : `${selectedIntensity.devMultiplier}x`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sanidad Card */}
              <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-red-400" />
                  Reglas de Rendimiento
                </h3>
                <ul className="space-y-2 text-[11px] text-zinc-400 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span><strong>Veteranos (&gt; 29 años):</strong> No desarrollan atributos físicos; el entrenamiento físico mitiga su declive natural.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span><strong>Juveniles (&lt; 22 años):</strong> Reciben un bono de +50% en velocidad de aprendizaje semanal.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span><strong>Tope de Potencial:</strong> Ningún jugador puede progresar por encima de su potencial techo.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          /* Tab: Entrenamiento Individual */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Especialización Individual de Futbolistas
              </h2>
              <p className="text-xs text-zinc-400">
                Asigna un foco técnico específico para acelerar el desarrollo de las promesas del club o corregir falencias de los titulares.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {players.map(p => {
                const currentAttr = assignments[p.id] || 'balanced'
                const isYouth = (p.age || 20) < 22
                const isVeteran = (p.age || 20) > 29

                return (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/70 hover:border-zinc-700 transition-colors space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-300">
                          {p.shirt_number || '•'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">{p.first_name} {p.last_name}</span>
                            {isYouth && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Promesa
                              </span>
                            )}
                            {isVeteran && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium uppercase bg-zinc-800 text-zinc-400">
                                Veterano
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400">
                            {p.position} • {p.age} años • Media: {p.attr_overall || 50} / Pot: {p.attr_potential || 65}
                          </span>
                        </div>
                      </div>

                      {/* Fitness */}
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        (p.state_fitness || 75) < 60 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {p.state_fitness || 75}% fit
                      </span>
                    </div>

                    {/* Selector de foco individual */}
                    <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/80">
                      <span className="text-[11px] text-zinc-400 shrink-0">Foco:</span>
                      <select
                        value={currentAttr}
                        disabled={savingPlayerId === p.id}
                        onChange={(e) => handleAssignIndividual(p.id, e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="balanced">Sin especialización (Sigue plan colectivo)</option>
                        {INDIVIDUAL_ATTRIBUTES.map(attr => (
                          <option 
                            key={attr.id} 
                            value={attr.id}
                            disabled={isVeteran && (attr.id === 'pace' || attr.id === 'stamina')}
                          >
                            {attr.label} {isVeteran && (attr.id === 'pace' || attr.id === 'stamina') ? '(Bloqueado por edad)' : ''}
                          </option>
                        ))}
                      </select>
                      {savingPlayerId === p.id && (
                        <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
