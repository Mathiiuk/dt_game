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
import { AsyncButton } from '../../../components/ui'
import { friendlyError } from '../../../lib/errors'

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
      toast.error(friendlyError(e, 'Error al iniciar la obra'))
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-fg-muted">
        <Building2 className="w-8 h-8 animate-pulse text-accent mb-2" />
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
      <div className="p-4 sm:p-6 rounded-lg bg-surface/60 border border-line">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-line/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-accent/10 border border-accent/20 text-accent">
                <Building2 className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-fg">{stadium?.stadium_name || 'Estadio Principal'}</h2>
                <p className="text-xs text-fg-muted">{standTierNames[stadium?.stands_tier || 1]}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <p className="text-[11px] text-fg-muted font-medium">Aforo habilitado</p>
              <p className="text-xl sm:text-2xl font-semibold text-fg font-mono">
                {Number(stadium?.capacity || 1500).toLocaleString()} <span className="text-xs font-normal text-fg-muted">espectadores</span>
              </p>
            </div>
            <div className="border-l border-line pl-6">
              <p className="text-[11px] text-fg-muted font-medium">Mantenimiento</p>
              <p className="text-xl sm:text-2xl font-semibold text-gold font-mono">
                ${Number(stadium?.weekly_maintenance_cost || 200).toLocaleString()}<span className="text-xs font-normal text-fg-muted">/sem</span>
              </p>
            </div>
          </div>
        </div>

        {/* MÉTRICAS DE TERRENO Y COMODIDADES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
          {/* Calidad del Césped */}
          <div className="p-4 rounded-xl bg-bg/80 border border-line/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-fg flex items-center gap-1.5">
                  <SunMedium className="w-4 h-4 text-accent" />
                  Estado del césped
                </span>
                <span className="text-xs font-mono font-bold text-fg">
                  {stadium?.pitch_quality || 60}/100
                </span>
              </div>
              <div className="w-full bg-surface-3 rounded-full h-2 mb-3 overflow-hidden">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    (stadium?.pitch_quality || 60) >= 80 
                      ? 'bg-accent' 
                      : (stadium?.pitch_quality || 60) >= 50 
                        ? 'bg-gold' 
                        : 'bg-danger'
                  }`}
                  style={{ width: `${stadium?.pitch_quality || 60}%` }}
                />
              </div>
            </div>
            <div>
              <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded border ${pitchFeedback.badgeColor}`}>
                {pitchFeedback.level}
              </span>
              <p className="text-[11px] text-fg-muted mt-1">{pitchFeedback.tacticalBonus} • {pitchFeedback.injuryRisk}</p>
            </div>
          </div>

          {/* Iluminación Artificial */}
          <div className="p-4 rounded-xl bg-bg/80 border border-line/80 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-fg flex items-center gap-1.5 mb-2">
                <Zap className="w-4 h-4 text-gold" />
                Torres de iluminación
              </span>
              <p className="text-sm font-bold text-fg mb-1">
                {stadium?.floodlights_installed ? 'Instalación Homologada' : 'Sin Iluminación Nocturna'}
              </p>
            </div>
            <p className="text-[11px] text-fg-muted">
              {stadium?.floodlights_installed 
                ? 'Permite transmisiones de TV nocturnas con bono de taquilla'
                : 'Sólo se pueden disputar partidos diurnos los fines de semana'}
            </p>
          </div>

          {/* Palcos VIP */}
          <div className="p-4 rounded-xl bg-bg/80 border border-line/80 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-fg flex items-center gap-1.5 mb-2">
                <Award className="w-4 h-4 text-purple-400" />
                Palcos corporativos
              </span>
              <p className="text-sm font-bold text-fg mb-1 font-mono">
                {stadium?.vip_boxes_count || 0} palcos VIP
              </p>
            </div>
            <p className="text-[11px] text-fg-muted">
              {stadium?.vip_boxes_count > 0 
                ? 'Genera ingresos de patrocinio premium semanales'
                : 'Sector sin desarrollar. Ampliable para clientes corporativos'}
            </p>
          </div>
        </div>
      </div>

      {/* PROYECTO ACTIVO EN CONSTRUCCIÓN */}
      {activeProject && (
        <div className="p-4 sm:p-5 rounded-lg bg-amber-950/20 border border-amber-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gold/20 text-gold shrink-0">
              <Hammer className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                  Obra en curso
                </span>
                <span className="text-xs text-fg-muted">Inversión: ${Number(activeProject.cost_paid).toLocaleString()}</span>
              </div>
              <h3 className="text-base font-bold text-fg mt-1">
                {activeProject.project_type === 'EXPAND_CAPACITY' && `Ampliación de Aforo (+${Number(activeProject.capacity_delta).toLocaleString()} localidades)`}
                {activeProject.project_type === 'RESURFACING_PITCH' && 'Reacondicionamiento Integral del Terreno de Juego'}
                {activeProject.project_type === 'INSTALL_FLOODLIGHTS' && 'Instalación de Torres de Iluminación Nocturna'}
                {activeProject.project_type === 'BUILD_VIP_BOXES' && 'Construcción de Palcos VIP y Zona Hospitality'}
              </h3>
              <p className="text-xs text-fg-muted">El estadio continúa operativo durante las obras.</p>
            </div>
          </div>

          <div className="w-full sm:w-auto text-right sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-amber-800/40">
            <span className="text-xs text-fg-muted">Tiempo restante</span>
            <span className="text-lg font-mono font-semibold text-gold flex items-center gap-1.5">
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
            <h3 className="text-base sm:text-lg font-bold text-fg flex items-center gap-2">
              <Hammer className="w-5 h-5 text-accent" />
              Proyectos de remodelación y infraestructura
            </h3>
            <p className="text-xs text-fg-muted">Inversiones de capital autorizadas para ampliar patrimonio y recaudación.</p>
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
                    ? 'bg-surface/30 border-line/40 opacity-60' 
                    : 'bg-surface/60 border-line hover:border-line'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h4 className="font-bold text-sm text-fg">{proj.name}</h4>
                    <span className="text-[11px] font-mono font-bold text-accent bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/50">
                      ${proj.cost.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-fg-muted mb-3">{proj.description}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-fg-muted py-2 border-t border-line/60 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-fg-subtle" />
                      Plazo: {proj.durationWeeks} sem
                    </span>
                    {proj.capacityDelta && (
                      <span className="font-mono text-accent font-bold">
                        +{proj.capacityDelta.toLocaleString()} aforo
                      </span>
                    )}
                    {proj.pitchQualityTarget && (
                      <span className="font-mono text-accent font-bold">
                        Césped {proj.pitchQualityTarget} pts
                      </span>
                    )}
                  </div>

                  <AsyncButton
                    disabled={Boolean(activeProject) || !isAffordable || isAlreadyMaxed || actionLoading}
                    onClick={() => handleStartProject(proj.key)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                      isAlreadyMaxed
                        ? 'bg-surface-3 text-fg-subtle cursor-not-allowed'
                        : activeProject
                          ? 'bg-surface-3 text-fg-subtle cursor-not-allowed'
                          : isAffordable
                            ? 'bg-accent hover:bg-accent-strong text-accent-fg shadow-sm'
                            : 'bg-surface-3 text-fg-subtle cursor-not-allowed'
                    }`}
                  >
                    {isAlreadyMaxed ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                        <span>Ya instalado</span>
                      </>
                    ) : activeProject ? (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        <span>Obra en curso</span>
                      </>
                    ) : !isAffordable ? (
                      <>
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Fondos insuficientes</span>
                      </>
                    ) : (
                      <>
                        <Hammer className="w-3.5 h-3.5" />
                        <span>Iniciar proyecto</span>
                      </>
                    )}
                  </AsyncButton>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* HISTORIAL DE AUDITORÍA EDILICIA */}
      {history.length > 0 && (
        <div className="p-4 sm:p-5 rounded-lg bg-surface/40 border border-line">
          <h3 className="text-sm font-bold text-fg flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-accent" />
            Libro de obras y mantenimiento edilicio
          </h3>
          <div className="space-y-2">
            {history.map((h) => (
              <div 
                key={h.id} 
                className="flex items-center justify-between p-2.5 rounded-lg bg-bg/70 border border-line/80 text-xs"
              >
                <div>
                  <span className="font-bold text-fg">
                    {h.action === 'CONSTRUCTION_STARTED' && 'Inicio de Remodelación'}
                    {h.action === 'CONSTRUCTION_COMPLETED' && 'Inauguración de Obras'}
                    {h.action === 'PITCH_DEGRADED' && 'Alerta de Deterioro de Terreno'}
                    {h.action === 'PITCH_RESURFACED' && 'Reacondicionamiento de Césped'}
                  </span>
                  <p className="text-[11px] text-fg-subtle">
                    {new Date(h.timestamp).toLocaleDateString()} • {h.action}
                  </p>
                </div>
                <div className="text-right">
                  {h.cost > 0 && (
                    <span className="font-mono text-danger font-bold block">
                      -${Number(h.cost).toLocaleString()}
                    </span>
                  )}
                  {h.capacity_after && h.capacity_after !== h.capacity_before && (
                    <span className="text-[11px] text-accent font-mono">
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
