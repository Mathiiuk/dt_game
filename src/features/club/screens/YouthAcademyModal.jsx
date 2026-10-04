import React, { useState, useEffect } from 'react'
import { 
  X, 
  Sparkles, 
  GraduationCap, 
  Star, 
  UserPlus, 
  Trash2, 
  TrendingUp, 
  ShieldAlert, 
  Check, 
  ChevronRight,
  Award
} from 'lucide-react'
import { academyApi } from '../../../api/academy'
import { toast } from 'sonner'
import { useGameContext } from '../../../context/GameContext'

export default function YouthAcademyModal({ club, manager, onClose, onCandidatePromoted }) {
  const { confirmAction, refreshContext } = useGameContext()
  const [academy, setAcademy] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [generating, setGenerating] = useState(false)

  const loadData = async () => {
    try {
      if (!club?.id) return
      const [acad, cands] = await Promise.all([
        academyApi.getAcademy(club.id),
        academyApi.getYouthCandidates(club.id)
      ])
      setAcademy(acad)
      setCandidates(cands)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [club])

  const handleGenerateIntake = async () => {
    try {
      setGenerating(true)
      const newCandidates = await academyApi.generateYouthIntake(
        club.id, 
        club.career_id, 
        club.season_year || 1
      )
      toast.success(`¡Ha llegado la nueva camada de juveniles del potrero! (${newCandidates.length} aspirantes)`)
      setCandidates(newCandidates)
      loadData()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const handlePromote = async (candidate) => {
    const confirmed = await confirmAction({
      title: `Ascender a ${candidate.first_name} ${candidate.last_name}`,
      description: `¿Firmar contrato profesional de 3 temporadas por $60/sem para incorporarlo al primer equipo? Ganarás +100 XP como DT.`,
      confirmText: 'Firmar y Ascender',
      cancelText: 'Cancelar',
      variant: 'primary'
    })
    if (!confirmed) return

    try {
      setProcessingId(candidate.id)
      const res = await academyApi.promoteCandidate(club.id, candidate.id, null, manager?.id)
      toast.success(`¡${candidate.last_name} ascendido al primer equipo con el dorsal #${res.jerseyNumber}! (+100 XP)`)
      if (typeof onCandidatePromoted === 'function') onCandidatePromoted()
      if (typeof refreshContext === 'function') await refreshContext()
      loadData()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleRelease = async (candidate) => {
    try {
      setProcessingId(candidate.id)
      await academyApi.releaseCandidate(candidate.id)
      toast.info(`${candidate.last_name} ha sido desvinculado de la cantera.`)
      loadData()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleUpgrade = async () => {
    const nextLevel = (academy?.academy_level || 1) + 1
    const cost = academyApi.BALANCE.upgrade_costs[nextLevel] || 30000

    const confirmed = await confirmAction({
      title: `Mejorar Cantera a Nivel ${nextLevel}`,
      description: `Invertir $${cost.toLocaleString()} para mejorar la infraestructura y atraer mejores talentos en cada camada anual. ¿Confirmar inversión?`,
      confirmText: `Invertir $${cost.toLocaleString()}`,
      cancelText: 'Cancelar',
      variant: 'primary'
    })
    if (!confirmed) return

    try {
      await academyApi.upgradeAcademy(club.id)
      toast.success(`¡Instalaciones de cantera mejoradas a Nivel ${nextLevel}!`)
      if (typeof refreshContext === 'function') await refreshContext()
      loadData()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const getLevelName = (lvl) => {
    switch (lvl) {
      case 1: return 'Potrero Barrial (Tierra y Cal)'
      case 2: return 'Cancha de Césped Natural y Vestuarios Básicos'
      case 3: return 'Predio Deportivo Municipal'
      case 4: return 'Complejo de Formación Juvenil Avanzado'
      case 5: return 'Centro de Alto Rendimiento de Élite'
      default: return 'Cantera Regional'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-2xl bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto pb-28 sm:pb-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                Divisiones Inferiores & Cantera
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                La Fábrica del Potrero
              </h3>
              <p className="text-xs text-zinc-400">
                Captación barrial, camadas anuales y promoción al plantel profesional
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nivel de Infraestructura */}
        <div className="p-4 bg-zinc-950 border border-zinc-800/90 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-bold block">
              Infraestructura Actual (Nivel {academy?.academy_level || 1}/5)
            </span>
            <h4 className="text-sm font-bold text-white mt-0.5">
              {getLevelName(academy?.academy_level || 1)}
            </h4>
            <p className="text-[11px] text-zinc-400 mt-1">
              Probabilidad de Joya del Potrero: {academy?.academy_level === 1 ? '3%' : academy?.academy_level === 2 ? '6%' : academy?.academy_level === 3 ? '10%' : academy?.academy_level === 4 ? '18%' : '25%'}
            </p>
          </div>
          {(academy?.academy_level || 1) < 5 && (
            <button
              onClick={handleUpgrade}
              className="py-2 px-3 text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors flex items-center justify-center gap-1.5 shrink-0"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Mejorar Cantera</span>
            </button>
          )}
        </div>

        {/* Sección de Camada de Juveniles */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Aspirantes en Prueba ({candidates.length})</span>
              </h4>
              <p className="text-[11px] text-zinc-400">
                Jóvenes de 15 a 17 años listos para ser evaluados
              </p>
            </div>
            {candidates.length === 0 && (
              <button
                disabled={generating}
                onClick={handleGenerateIntake}
                className="py-1.5 px-3 text-xs font-bold text-black bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-colors flex items-center gap-1.5"
              >
                {generating ? (
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Captar Camada</span>
                  </>
                )}
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-zinc-400">Explorando potreros del barrio...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="p-6 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-center space-y-2">
              <GraduationCap className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400">No hay candidatos en prueba en este momento.</p>
              <p className="text-[11px] text-zinc-600">
                La camada anual arriba automáticamente en la Semana 35 de cada temporada.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {candidates.map(c => {
                const starsCount = Math.round(c.potential_stars_perceived || 3)
                const isGem = (c.potential_stars_perceived || 0) >= 4.5

                return (
                  <div 
                    key={c.id} 
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                      isGem 
                        ? 'bg-amber-950/20 border-amber-500/40' 
                        : 'bg-zinc-950 border-zinc-800/90'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-sm">{c.first_name} {c.last_name}</span>
                            {isGem && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold text-amber-400 bg-amber-500/20 border border-amber-500/30 rounded flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" /> Joya
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {c.position} • {c.age} años
                          </p>
                        </div>
                        <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                          {c.overall_rating} OVR
                        </span>
                      </div>

                      {/* Estrellas de Potencial Percibido */}
                      <div className="flex items-center gap-1 my-2">
                        <span className="text-[10px] text-zinc-500 mr-1">Potencial:</span>
                        {[1, 2, 3, 4, 5].map(st => (
                          <Star 
                            key={st} 
                            className={`w-3.5 h-3.5 ${st <= starsCount ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}`} 
                          />
                        ))}
                        <span className="text-[10px] text-amber-400 font-bold ml-1">
                          {c.potential_stars_perceived}★
                        </span>
                      </div>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-2 pt-2 border-t border-zinc-900 mt-2">
                      <button
                        disabled={processingId === c.id}
                        onClick={() => handleRelease(c)}
                        className="py-1.5 px-2 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 rounded-xl transition-colors flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Descartar
                      </button>
                      <button
                        disabled={processingId === c.id}
                        onClick={() => handlePromote(c)}
                        className="flex-1 py-1.5 px-3 text-xs font-bold text-black bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-colors flex items-center justify-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Ascender
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
