import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  managerApi, 
  MANAGER_BACKGROUND_PRESETS, 
  FREE_POINTS_POOL, 
  ATTRIBUTE_MAX_INITIAL_CAP 
} from '../../api/manager'
import { authApi } from '../../api/auth'
import { toast } from 'sonner'
import { 
  Loader2, 
  User, 
  Award, 
  Sliders, 
  Brain, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Shield,
  Sparkles,
  Check,
  AlertCircle
} from 'lucide-react'

export default function CreateManagerWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Identity, 2: Background, 3: Attributes, 4: Philosophy, 5: Confirmation
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  // Step 1: Identity
  const [identity, setIdentity] = useState({
    firstName: '',
    lastName: '',
    age: 38,
    nationality: 'Argentina',
    city: 'Buenos Aires',
    dominantFoot: 'Derecho'
  })

  // Step 2: Background Preset
  const [selectedBackground, setSelectedBackground] = useState('STREET_COACH')

  // Step 3: Distributed Points (Delta: 0 to 15 total)
  const [distributedPoints, setDistributedPoints] = useState({
    tactics: 3,
    motivation: 4,
    youth: 3,
    management: 3,
    negotiation: 2
  })

  // Step 4: Philosophy & Specialization
  const [philosophy, setPhilosophy] = useState('Ofensivo')
  const [specialization, setSpecialization] = useState('TACTICO')

  const philosophies = [
    { id: 'Ofensivo', title: 'Ataque Directo', desc: 'Priorizar el arco rival y la verticalidad.' },
    { id: 'Posesión', title: 'Tiki-Taka / Posesión', desc: 'Controlar el ritmo y desgastar al rival con el balón.' },
    { id: 'Contragolpe', title: 'Transición Rápida', desc: 'Bloque bajo reactivo y contragolpes letales.' },
    { id: 'Presión', title: 'Gegenpressing', desc: 'Presión asfixiante alta para provocar pérdidas rivales.' },
    { id: 'Equilibrado', title: 'Equilibrio Táctico', desc: 'Adaptabilidad a las fases del partido según el contexto.' }
  ]

  const specializations = [
    { id: 'JUVENILES', title: 'Forjador de Cantera', desc: 'Tus juveniles progresan más rápido y con mayor techo de potencial.' },
    { id: 'TACTICO', title: 'Estratega del Pizarrón', desc: 'Mayor impacto y efectividad de las órdenes del DT durante los partidos.' },
    { id: 'MOTIVADOR', title: 'Líder Anímico', desc: 'La moral y cohesión del plantel se mantienen altas en rachas negativas.' },
    { id: 'MERCADO', title: 'Negociador Implacable', desc: 'Mejores cláusulas y menores pretensiones salariales en el mercado.' }
  ]

  // Calculated values
  const currentPreset = MANAGER_BACKGROUND_PRESETS[selectedBackground] || MANAGER_BACKGROUND_PRESETS.STREET_COACH

  const totalPointsSpent = Object.values(distributedPoints).reduce((acc, curr) => acc + (Number(curr) || 0), 0)
  const pointsRemaining = FREE_POINTS_POOL - totalPointsSpent

  const getFinalAttributeValue = (attrKey) => {
    const base = currentPreset.baseAttributes[attrKey] || 5
    const delta = distributedPoints[attrKey] || 0
    return base + delta
  }

  const handlePointChange = (attrKey, change) => {
    const currentDelta = distributedPoints[attrKey] || 0
    const newDelta = currentDelta + change
    const base = currentPreset.baseAttributes[attrKey] || 5
    const finalVal = base + newDelta

    if (change > 0) {
      if (pointsRemaining <= 0) return
      if (finalVal > ATTRIBUTE_MAX_INITIAL_CAP) {
        toast.warning(`Tope inicial alcanzado (${ATTRIBUTE_MAX_INITIAL_CAP} pts). Se desbloquean más subiendo de nivel.`)
        return
      }
    } else {
      if (newDelta < 0) return
    }

    setDistributedPoints(prev => ({
      ...prev,
      [attrKey]: newDelta
    }))
  }

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await authApi.getSession()
      if (!currentUser) {
        navigate('/auth')
      } else {
        setUser(currentUser)
        if (currentUser.name) {
          const parts = currentUser.name.trim().split(' ')
          setIdentity(prev => ({
            ...prev,
            firstName: parts[0] || 'Marcelo',
            lastName: parts.slice(1).join(' ') || 'Gallardo'
          }))
        }
      }
    }
    checkAuth()
  }, [navigate])

  const handleCreate = async () => {
    if (pointsRemaining !== 0) {
      toast.error(`Debes distribuir los ${FREE_POINTS_POOL} puntos disponibles antes de confirmar.`)
      return
    }

    setLoading(true)
    try {
      await managerApi.createManager(user.id, {
        identity,
        background: selectedBackground,
        distributedPoints,
        philosophy,
        specialization
      })
      toast.success('¡Credencial oficial de Director Técnico emitida con éxito!')
      navigate('/create-club')
    } catch (err) {
      toast.error(err.message || 'Error al crear el perfil de DT.')
    } finally {
      setLoading(false)
    }
  }

  const StepIndicator = () => {
    const stepLabels = ['Identidad', 'Trasfondo', 'Atributos', 'Filosofía', 'Firma']
    return (
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center">
              <div 
                className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs transition-all ${
                  step === s 
                    ? 'bg-accent text-accent-fg ring-4 ring-accent/20 shadow-md' 
                    : step > s 
                    ? 'bg-accent-soft text-accent border border-accent/40' 
                    : 'bg-surface text-fg-subtle border border-line'
                }`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              <span className={`text-[10px] mt-1 font-medium hidden sm:block ${step >= s ? 'text-fg' : 'text-fg-subtle'}`}>
                {stepLabels[s - 1]}
              </span>
            </div>
            {s < 5 && (
              <div className={`w-6 sm:w-10 h-0.5 mx-1.5 sm:mx-2 transition-all ${step > s ? 'bg-accent' : 'bg-surface-3'}`} />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-4 py-8 bg-bg">
      <div className="w-full max-w-2xl p-6 sm:p-8 border border-line/80 rounded-lg bg-surface/60 backdrop-blur-md shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-fg">Ficha de Director Técnico</h1>
            <p className="text-xs sm:text-sm text-fg-muted">Paso {step} de 5 • Configuración de la carrera</p>
          </div>
          <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent">
            <Shield className="w-6 h-6" />
          </div>
        </div>

        <div className="my-6">
          <StepIndicator />
        </div>

        {/* STEP 1: IDENTITY */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 text-accent font-bold text-base">
              <User className="w-5 h-5" />
              <span>Datos Personales</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="f-nombre-1" className="block mb-1 text-xs font-medium text-fg">Nombre</label>
                <input id="f-nombre-1" 
                  type="text" 
                  value={identity.firstName} 
                  onChange={e => setIdentity({...identity, firstName: e.target.value})} 
                  placeholder="Ej: Marcelo"
                  className="w-full px-4 py-2.5 text-sm text-fg border rounded-xl bg-bg/80 border-line/80 focus:border-accent focus:outline-none placeholder:text-fg-subtle" 
                />
              </div>

              <div>
                <label htmlFor="f-apellido-2" className="block mb-1 text-xs font-medium text-fg">Apellido</label>
                <input id="f-apellido-2" 
                  type="text" 
                  value={identity.lastName} 
                  onChange={e => setIdentity({...identity, lastName: e.target.value})} 
                  placeholder="Ej: Gallardo"
                  className="w-full px-4 py-2.5 text-sm text-fg border rounded-xl bg-bg/80 border-line/80 focus:border-accent focus:outline-none placeholder:text-fg-subtle" 
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label htmlFor="f-edad" className="text-xs font-medium text-fg">Edad</label>
                  <span className="text-xs font-mono font-bold text-accent">{identity.age} años</span>
                </div>
                <input 
                  id="f-edad"
                  type="range" 
                  min="25" 
                  max="70" 
                  value={identity.age} 
                  onChange={e => setIdentity({...identity, age: parseInt(e.target.value)})} 
                  className="w-full accent-accent bg-surface-3 rounded-lg cursor-pointer" 
                />
              </div>

              <div>
                <label htmlFor="f-pie-dominante-3" className="block mb-1 text-xs font-medium text-fg">Pie Dominante</label>
                <select id="f-pie-dominante-3" 
                  value={identity.dominantFoot} 
                  onChange={e => setIdentity({...identity, dominantFoot: e.target.value})} 
                  className="w-full px-4 py-2.5 text-sm text-fg border rounded-xl bg-bg/80 border-line/80 focus:border-accent focus:outline-none"
                >
                  <option>Derecho</option>
                  <option>Izquierdo</option>
                  <option>Ambidiestro</option>
                </select>
              </div>

              <div>
                <label htmlFor="f-nacionalidad-4" className="block mb-1 text-xs font-medium text-fg">Nacionalidad</label>
                <input id="f-nacionalidad-4" 
                  type="text" 
                  value={identity.nationality} 
                  onChange={e => setIdentity({...identity, nationality: e.target.value})} 
                  className="w-full px-4 py-2.5 text-sm text-fg border rounded-xl bg-bg/80 border-line/80 focus:border-accent focus:outline-none" 
                />
              </div>

              <div>
                <label htmlFor="f-ciudad-de-origen-5" className="block mb-1 text-xs font-medium text-fg">Ciudad de Origen</label>
                <input id="f-ciudad-de-origen-5" 
                  type="text" 
                  value={identity.city} 
                  onChange={e => setIdentity({...identity, city: e.target.value})} 
                  className="w-full px-4 py-2.5 text-sm text-fg border rounded-xl bg-bg/80 border-line/80 focus:border-accent focus:outline-none" 
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: BACKGROUND PRESETS */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 text-accent font-bold text-base">
              <Award className="w-5 h-5" />
              <span>Trasfondo y Trayectoria Previa</span>
            </div>
            <p className="text-xs text-fg-muted">
              Tu historia previa define la reputación con la que comienzas y los atributos base de tu perfil.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {Object.values(MANAGER_BACKGROUND_PRESETS).map((preset) => {
                const isSelected = selectedBackground === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedBackground(preset.id)}
                    className={`p-4 text-left border rounded-xl transition-all ${
                      isSelected 
                        ? 'border-accent bg-accent/10 shadow-raised' 
                        : 'border-line bg-bg/70 hover:border-line'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className={`font-bold text-sm ${isSelected ? 'text-accent' : 'text-fg'}`}>
                        {preset.title}
                      </h3>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-3 text-fg">
                        Reputación: {preset.reputation}
                      </span>
                    </div>
                    <p className="text-xs text-fg-muted mb-3">{preset.description}</p>
                    <div className="flex flex-wrap gap-1.5 text-[10px] text-fg-muted">
                      <span className="px-1.5 py-0.5 bg-surface rounded">Tác: {preset.baseAttributes.tactics}</span>
                      <span className="px-1.5 py-0.5 bg-surface rounded">Mot: {preset.baseAttributes.motivation}</span>
                      <span className="px-1.5 py-0.5 bg-surface rounded">Juv: {preset.baseAttributes.youth}</span>
                      <span className="px-1.5 py-0.5 bg-surface rounded">Ges: {preset.baseAttributes.management}</span>
                      <span className="px-1.5 py-0.5 bg-surface rounded">Neg: {preset.baseAttributes.negotiation}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 3: ATTRIBUTES BUDGET */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-accent font-bold text-base">
                <Sliders className="w-5 h-5" />
                <span>Distribución de Habilidades</span>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold font-mono ${
                pointsRemaining === 0 
                  ? 'bg-accent-soft text-accent border border-accent/40' 
                  : 'bg-gold-soft text-gold border border-gold/40'
              }`}>
                {pointsRemaining === 0 ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>Puntos Libres: {pointsRemaining}</span>
              </div>
            </div>

            <p className="text-xs text-fg-muted">
              Distribuye los 15 puntos libres sobre los valores base de tu trasfondo (<strong className="text-fg">{currentPreset.title}</strong>). Límite inicial de 14 por atributo.
            </p>

            <div className="space-y-2.5 mt-4">
              {[
                { key: 'tactics', label: 'Táctica y Pizarrón', desc: 'Lectura de juego e impacto de esquemas tácticos' },
                { key: 'motivation', label: 'Motivación y Discurso', desc: 'Capacidad de levantar la moral del vestuario en la charla' },
                { key: 'youth', label: 'Ojo para Juveniles', desc: 'Detección temprana y desarrollo acelerado de promesas' },
                { key: 'management', label: 'Gestión de Grupo', desc: 'Manejo de egos, liderazgo y disciplina en el plantel' },
                { key: 'negotiation', label: 'Negociación y Fichajes', desc: 'Eficacia económica en renovaciones y contratos' }
              ].map(({ key, label, desc }) => {
                const baseVal = currentPreset.baseAttributes[key] || 5
                const delta = distributedPoints[key] || 0
                const finalVal = baseVal + delta
                const isMax = finalVal >= ATTRIBUTE_MAX_INITIAL_CAP

                return (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-xl bg-bg/80 border-line gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-fg">{label}</span>
                        <span className="text-[10px] text-fg-subtle font-mono">
                          (Base: {baseVal} + {delta})
                        </span>
                      </div>
                      <p className="text-[11px] text-fg-muted">{desc}</p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handlePointChange(key, -1)}
                        disabled={delta <= 0}
                        className="w-8 h-8 flex items-center justify-center font-bold text-sm rounded-lg bg-surface-3 text-fg disabled:opacity-40 hover:bg-surface-3 transition-colors"
                      >
                        -
                      </button>

                      <div className="w-8 text-center">
                        <span className={`text-base font-mono font-semibold ${isMax ? 'text-gold' : 'text-accent'}`}>
                          {finalVal}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePointChange(key, 1)}
                        disabled={pointsRemaining <= 0 || isMax}
                        className="w-8 h-8 flex items-center justify-center font-bold text-sm rounded-lg bg-surface-3 text-fg disabled:opacity-40 hover:bg-surface-3 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 4: PHILOSOPHY & SPECIALIZATION */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2 text-accent font-bold text-base">
                <Brain className="w-5 h-5" />
                <span>Filosofía de Juego</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {philosophies.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPhilosophy(p.id)}
                    className={`p-3 text-left border rounded-xl transition-all ${
                      philosophy === p.id 
                        ? 'border-accent bg-accent/10' 
                        : 'border-line bg-bg/70 hover:border-line'
                    }`}
                  >
                    <h4 className={`text-xs font-bold ${philosophy === p.id ? 'text-accent' : 'text-fg'}`}>
                      {p.title}
                    </h4>
                    <p className="text-[11px] text-fg-muted mt-0.5">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2 text-blue-400 font-bold text-base">
                <Sparkles className="w-5 h-5" />
                <span>Especialización del Entrenador</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {specializations.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSpecialization(s.id)}
                    className={`p-3 text-left border rounded-xl transition-all ${
                      specialization === s.id 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-line bg-bg/70 hover:border-line'
                    }`}
                  >
                    <h4 className={`text-xs font-bold ${specialization === s.id ? 'text-blue-400' : 'text-fg'}`}>
                      {s.title}
                    </h4>
                    <p className="text-[11px] text-fg-muted mt-0.5">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: OFFICIAL CREDENTIAL & CONFIRMATION */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 text-accent font-bold text-base">
              <CheckCircle2 className="w-5 h-5" />
              <span>Credencial Oficial de Director Técnico</span>
            </div>

            <div className="p-5 border border-accent/30 rounded-lg bg-gradient-to-br from-accent/30 via-bg to-surface/80 shadow-lg">
              <div className="flex items-start justify-between border-b border-line pb-4 mb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-accent font-bold">
                    Licencia Pro Conmebol / UEFA
                  </span>
                  <h3 className="text-xl font-semibold text-fg mt-0.5">
                    {identity.firstName} {identity.lastName}
                  </h3>
                  <p className="text-xs text-fg-muted">
                    {identity.age} años • {identity.nationality} • {identity.city} • Pie {identity.dominantFoot}
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-surface border border-line text-right">
                  <span className="text-[10px] text-fg-subtle block uppercase">Reputación</span>
                  <span className="text-sm font-mono font-bold text-accent">{currentPreset.reputation} pts</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                <div className="p-2.5 rounded-lg bg-surface/80 border border-line">
                  <span className="text-fg-subtle text-[10px] block">Trasfondo</span>
                  <span className="font-bold text-fg">{currentPreset.title}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface/80 border border-line">
                  <span className="text-fg-subtle text-[10px] block">Filosofía</span>
                  <span className="font-bold text-fg">{philosophy}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-fg-muted uppercase tracking-wider font-semibold block mb-2">
                  Atributos Oficiales Verificados:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="flex justify-between p-2 rounded-lg bg-surface border border-line">
                    <span className="text-fg-muted">Táctica:</span>
                    <span className="font-mono font-bold text-accent">{getFinalAttributeValue('tactics')}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-surface border border-line">
                    <span className="text-fg-muted">Motivación:</span>
                    <span className="font-mono font-bold text-accent">{getFinalAttributeValue('motivation')}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-surface border border-line">
                    <span className="text-fg-muted">Cantera:</span>
                    <span className="font-mono font-bold text-accent">{getFinalAttributeValue('youth')}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-surface border border-line">
                    <span className="text-fg-muted">Gestión:</span>
                    <span className="font-mono font-bold text-accent">{getFinalAttributeValue('management')}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-surface border border-line">
                    <span className="text-fg-muted">Negociación:</span>
                    <span className="font-mono font-bold text-accent">{getFinalAttributeValue('negotiation')}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-surface border border-line">
                    <span className="text-fg-muted">Nivel Inicial:</span>
                    <span className="font-mono font-bold text-fg">Nivel 1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NAVIGATION BUTTONS */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-line/80">
          {step > 1 ? (
            <button 
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-colors border text-fg border-line rounded-xl hover:bg-surface-3"
            >
              <ChevronLeft className="w-4 h-4" /> Atrás
            </button>
          ) : <div />}

          {step < 5 ? (
            <button 
              type="button"
              onClick={() => {
                if (step === 1) {
                  if (!identity.firstName.trim() || !identity.lastName.trim()) {
                    toast.error('Por favor completa tu nombre y apellido.')
                    return
                  }
                }
                if (step === 3 && pointsRemaining !== 0) {
                  toast.error(`Debes distribuir los ${pointsRemaining} punto(s) libres restantes.`)
                  return
                }
                setStep(step + 1)
              }}
              className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-accent-fg transition-transform bg-accent rounded-xl hover:bg-accent-strong  shadow-raised active:scale-95"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              type="button"
              onClick={handleCreate}
              disabled={loading || pointsRemaining !== 0}
              className="flex items-center gap-2 px-8 py-3 text-xs font-bold text-accent-fg transition-transform bg-accent rounded-xl hover:bg-accent-strong  shadow-raised disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Firmar Credencial y Continuar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
