import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  Hammer, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  DollarSign, 
  Layers, 
  ShieldAlert, 
  SunMedium, 
  History,
  TrendingUp,
  Award
} from 'lucide-react'
import { stadiumApi, STADIUM_CATALOG } from '../../../api/stadium'
import { toast } from 'sonner'

export default function StadiumManagementTab({ club, confirmAction, onUpdateClub }) {
  const [stadium, setStadium] = useState(null)
  const [activeProject, setActiveProject] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const loadStadiumData = async () => {
    if (!club?.id) return
    try {
      setLoading(true)
      const [stadiumRes, projectRes, auditRes] = await Promise.all([
        stadiumApi.getStadiumDetails(club.id),
        stadiumApi.getActiveProject(club.id),
        stadiumApi.getAuditHistory(club.id)
      ])
      setStadium(stadiumRes)
      setActiveProject(projectRes)
      setHistory(auditRes)
    } catch (e) {
      console.error(e)
      toast.error('Error al cargar datos del estadio')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStadiumData()
  }, [club?.id])

  const handleStartProject = async (projectKey) => {
    const project = STADIUM_CATALOG[projectKey]
    if (!project) return

    if (activeProject) {
      toast.error('Ya existe una obra en construcción. Debe finalizar antes de iniciar otra.')
      return
    }

    if ((club?.budget || 0) < project.cost) {
      toast.error(`Fondos insuficientes. Se requieren $${project.cost.toLocaleString()}`)
      return
    }

    const confirmed = await confirmAction({
      title: `Iniciar Obra: ${project.name}`,
      description: `¿Confirmas una inversión de $${project.cost.toLocaleString()} con una duración estimada de ${project.durationWeeks} semanas de obras?`,
      confirmText: 'Contratar Obra',
      cancelText: 'Cancelar'
    })

    if (!confirmed) return

    try {
      setActionLoading(true)
      const res = await stadiumApi.startProject(club.id, projectKey)
      toast.success(res.message || 'Obra iniciada con éxito')
      if (onUpdateClub) onUpdateClub()
      await loadStadiumData()
    } catch (e) {
      toast.error(e.message || 'Error al iniciar la obra')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-400">
        <Building2 className="w-8 h-8 animate-pulse text-emerald-400 mb-2" />
        <p className="text-sm font-medium">Cargando instalaciones del estadio...</p>
      </div>
    )
  }

  const pitchFeedback = stadiumApi.getPitchConditionFeedback(stadium?.pitch_quality || 60)
  const standTierNames = {
    1: 'Gradas populares de tablones',
    2: 'Tribunas laterales de cemento',
    3: 'Plateas con butacas numeradas',
    4: 'Palcos VIP y hospitality techado'
  }

  return (
    <div className="space-y-6">
      {/* TARJETA RESUMEN DEL ESTADIO */}
      <div className="p-4 sm:p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Building2 className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white">{stadium?.stadium_name || 'Estadio Principal'}</h2>
                <p className="text-xs text-zinc-400">{standTierNames[stadium?.stands_tier || 1]}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <p className="text-[11px] text-zinc-400 font-medium">Aforo Habilitado</p>
              <p className="text-xl sm:text-2xl font-black text-white font-mono">
                {Number(stadium?.capacity || 1500).toLocaleString()} <span className="text-xs font-normal text-zinc-400">espectadores</span>
              </p>
            </div>
            <div className="border-l border-zinc-800 pl-6">
              <p className="text-[11px] text-zinc-400 font-medium">Mantenimiento</p>
              <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                ${Number(stadium?.weekly_maintenance_cost || 200).toLocaleString()}<span className="text-xs font-normal text-zinc-400">/sem</span>
              </p>
            </div>
          </div>
        </div>

        {/* MÉTRICAS DE TERRENO Y COMODIDADES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
          {/* Calidad del Césped */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <SunMedium className="w-4 h-4 text-emerald-400" />
                  Estado del Césped
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  {stadium?.pitch_quality || 60}/100
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 mb-3 overflow-hidden">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    (stadium?.pitch_quality || 60) >= 80 
                      ? 'bg-emerald-500' 
                      : (stadium?.pitch_quality || 60) >= 50 
                        ? 'bg-amber-500' 
                        : 'bg-rose-500'
                  }`}
                  style={{ width: `${stadium?.pitch_quality || 60}%` }}
                />
              </div>
            </div>
            <div>
              <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded border ${pitchFeedback.badgeColor}`}>
                {pitchFeedback.level}
              </span>
              <p className="text-[11px] text-zinc-400 mt-1">{pitchFeedback.tacticalBonus} • {pitchFeedback.injuryRisk}</p>
            </div>
          </div>

          {/* Iluminación Artificial */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 mb-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Torres de Iluminación
              </span>
              <p className="text-sm font-bold text-white mb-1">
                {stadium?.floodlights_installed ? 'Instalación Homologada' : 'Sin Iluminación Nocturna'}
              </p>
            </div>
            <p className="text-[11px] text-zinc-400">
              {stadium?.floodlights_installed 
                ? 'Permite transmisiones de TV nocturnas con bono de taquilla'
                : 'Sólo se pueden disputar partidos diurnos los fines de semana'}
            </p>
          </div>

          {/* Palcos VIP */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 mb-2">
                <Award className="w-4 h-4 text-purple-400" />
                Palcos Corporativos
              </span>
              <p className="text-sm font-bold text-white mb-1 font-mono">
                {stadium?.vip_boxes_count || 0} palcos VIP
              </p>
            </div>
            <p className="text-[11px] text-zinc-400">
              {stadium?.vip_boxes_count > 0 
                ? 'Genera ingresos de patrocinio premium semanales'
                : 'Sector sin desarrollar. Ampliable para clientes corporativos'}
            </p>
          </div>
        </div>
      </div>

      {/* PROYECTO ACTIVO EN CONSTRUCCIÓN */}
      {activeProject && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/20 border border-amber-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <Hammer className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                  Obra en curso
                </span>
                <span className="text-xs text-zinc-400">Inversión: ${Number(activeProject.cost_paid).toLocaleString()}</span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                {activeProject.project_type === 'EXPAND_CAPACITY' && `Ampliación de Aforo (+${Number(activeProject.capacity_delta).toLocaleString()} localidades)`}
                {activeProject.project_type === 'RESURFACING_PITCH' && 'Reacondicionamiento Integral del Terreno de Juego'}
                {activeProject.project_type === 'INSTALL_FLOODLIGHTS' && 'Instalación de Torres de Iluminación Nocturna'}
                {activeProject.project_type === 'BUILD_VIP_BOXES' && 'Construcción de Palcos VIP y Zona Hospitality'}
              </h3>
              <p className="text-xs text-zinc-400">El estadio continúa operativo durante las obras.</p>
            </div>
          </div>

          <div className="w-full sm:w-auto text-right sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-amber-800/40">
            <span className="text-xs text-zinc-400">Tiempo restante</span>
            <span className="text-lg font-mono font-black text-amber-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {activeProject.weeks_remaining} {activeProject.weeks_remaining === 1 ? 'semana' : 'semanas'}
            </span>
          </div>
        </div>
      )}

      {/* CATÁLOGO DE MEJORAS Y PROYECTOS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Hammer className="w-5 h-5 text-emerald-400" />
              Proyectos de Remodelación & Infraestructura
            </h3>
            <p className="text-xs text-zinc-400">Inversiones de capital autorizadas para ampliar patrimonio y recaudación.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(STADIUM_CATALOG).map((proj) => {
            const isAffordable = (club?.budget || 0) >= proj.cost
            const isAlreadyMaxed = 
              (proj.key === 'INSTALL_FLOODLIGHTS' && stadium?.floodlights_installed) ||
              (proj.key === 'HYBRID_PITCH' && (stadium?.pitch_quality || 0) >= 95)

            return (
              <div 
                key={proj.key}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isAlreadyMaxed 
                    ? 'bg-zinc-900/30 border-zinc-800/40 opacity-60' 
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h4 className="font-bold text-sm text-white">{proj.name}</h4>
                    <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/50">
                      ${proj.cost.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3">{proj.description}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 py-2 border-t border-zinc-800/60 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      Plazo: {proj.durationWeeks} sem
                    </span>
                    {proj.capacityDelta && (
                      <span className="font-mono text-emerald-400 font-bold">
                        +{proj.capacityDelta.toLocaleString()} aforo
                      </span>
                    )}
                    {proj.pitchQualityTarget && (
                      <span className="font-mono text-emerald-400 font-bold">
                        Césped {proj.pitchQualityTarget} pts
                      </span>
                    )}
                  </div>

                  <button
                    disabled={Boolean(activeProject) || !isAffordable || isAlreadyMaxed || actionLoading}
                    onClick={() => handleStartProject(proj.key)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                      isAlreadyMaxed
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : activeProject
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                          : isAffordable
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-sm'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    {isAlreadyMaxed ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Ya Instalado</span>
                      </>
                    ) : activeProject ? (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        <span>Obra en Curso</span>
                      </>
                    ) : !isAffordable ? (
                      <>
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Fondos Insuficientes</span>
                      </>
                    ) : (
                      <>
                        <Hammer className="w-3.5 h-3.5" />
                        <span>Iniciar Proyecto</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* HISTORIAL DE AUDITORÍA EDILICIA */}
      {history.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-emerald-400" />
            Libro de Obras y Mantenimiento Edilicio
          </h3>
          <div className="space-y-2">
            {history.map((h) => (
              <div 
                key={h.id} 
                className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80 text-xs"
              >
                <div>
                  <span className="font-bold text-zinc-200">
                    {h.action === 'CONSTRUCTION_STARTED' && 'Inicio de Remodelación'}
                    {h.action === 'CONSTRUCTION_COMPLETED' && 'Inauguración de Obras'}
                    {h.action === 'PITCH_DEGRADED' && 'Alerta de Deterioro de Terreno'}
                    {h.action === 'PITCH_RESURFACED' && 'Reacondicionamiento de Césped'}
                  </span>
                  <p className="text-[11px] text-zinc-500">
                    {new Date(h.timestamp).toLocaleDateString()} • {h.action}
                  </p>
                </div>
                <div className="text-right">
                  {h.cost > 0 && (
                    <span className="font-mono text-rose-400 font-bold block">
                      -${Number(h.cost).toLocaleString()}
                    </span>
                  )}
                  {h.capacity_after && h.capacity_after !== h.capacity_before && (
                    <span className="text-[11px] text-emerald-400 font-mono">
                      Aforo: {h.capacity_after.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
