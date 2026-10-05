import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { managerApi } from '../../api/manager'
import { clubApi, TIER_5_STARTING_CONFIG } from '../../api/club'
import { toast } from 'sonner'
import { useGameContext } from '../../context/GameContext'
import { 
  Loader2, 
  Shield, 
  MapPin, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft,
  Palette,
  Building2,
  Coins,
  Check,
  Award
} from 'lucide-react'

const COLOR_PRESETS = [
  { name: 'Verde y Blanco', primary: '#047857', secondary: '#FFFFFF', desc: 'Esperanza y pureza barrial' },
  { name: 'Azul y Oro', primary: '#1E3A8A', secondary: '#F59E0B', desc: 'Fuerza popular y gloria' },
  { name: 'Rojo y Blanco', primary: '#DC2626', secondary: '#FFFFFF', desc: 'Pasión y tradición' },
  { name: 'Negro y Blanco', primary: '#18181B', secondary: '#FFFFFF', desc: 'Elegancia y combate' },
  { name: 'Celeste y Blanco', primary: '#0284C7', secondary: '#FFFFFF', desc: 'Identidad nacional' },
  { name: 'Granate y Blanco', primary: '#831843', secondary: '#F4F4F5', desc: 'Orgullo obrero del sur' }
]

const BADGES = [
  { id: 'SHIELD', label: 'Escudo Clásico', icon: Shield },
  { id: 'CREST', label: 'Blasón Real', icon: Award },
  { id: 'CIRCLE', label: 'Emblema Circular', icon: Shield },
  { id: 'DIAMOND', label: 'Rombo Moderno', icon: Shield }
]

export default function CreateClubWizard() {
  const navigate = useNavigate()
  const { refreshContext } = useGameContext()
  const [step, setStep] = useState(1) // 1: Identity, 2: Visual/Colors, 3: Stadium, 4: Confirmation
  const [loading, setLoading] = useState(false)
  const [manager, setManager] = useState(null)

  // Step 1: Identity
  const [identity, setIdentity] = useState({
    name: 'Club Atlético Potrero',
    shortName: 'CAP',
    city: 'Buenos Aires',
    country: 'Argentina',
    foundedYear: 2026,
    nickname: 'El Expreso del Barrio'
  })

  // Step 2: Visual Identity & Colors
  const [colors, setColors] = useState({
    primary: '#047857',
    secondary: '#FFFFFF'
  })
  const [badgeId, setBadgeId] = useState('SHIELD')

  // Step 3: Stadium
  const [stadium, setStadium] = useState({
    name: 'Estadio El Fortín del Potrero',
    capacity: TIER_5_STARTING_CONFIG.stadiumCapacity,
    pitchCondition: TIER_5_STARTING_CONFIG.pitchCondition
  })

  // Auto-sync stadium name when club name changes
  useEffect(() => {
    if (step === 3 && identity.name) {
      if (stadium.name === 'Estadio El Fortín del Potrero' || !stadium.name) {
        setStadium(prev => ({ ...prev, name: `Estadio ${identity.name}` }))
      }
    }
  }, [step, identity.name])

  useEffect(() => {
    const checkAuthAndManager = async () => {
      const currentUser = await authApi.getSession()
      if (!currentUser) return navigate('/auth')

      const currentManager = await managerApi.getManager(currentUser.id)
      if (!currentManager) return navigate('/create-manager')

      setManager(currentManager)

      const existingClub = await clubApi.getClubByManager(currentManager.id)
      if (existingClub) return navigate('/game')
    }
    checkAuthAndManager()
  }, [navigate])

  const handleCreate = async () => {
    setLoading(true)
    try {
      await clubApi.createClub(manager.id, {
        identity,
        colors,
        badgeId,
        stadium
      })
      toast.success('¡Institución fundada e inscripta en la liga!')
      // Recargar manager y club en el contexto global antes de entrar al juego (evita estado obsoleto tras una sucesión)
      await refreshContext()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Error al fundar el club.')
    } finally {
      setLoading(false)
    }
  }

  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
      {[1, 2, 3, 4].map(s => {
        const labels = ['Identidad', 'Colores y Escudo', 'Estadio', 'Acta Fundacional']
        return (
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
                {labels[s - 1]}
              </span>
            </div>
            {s < 4 && (
              <div className={`w-8 sm:w-16 h-0.5 mx-2 transition-all ${step > s ? 'bg-accent' : 'bg-surface-3'}`} />
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-4 py-8 bg-bg">
      <div className="w-full max-w-2xl p-6 sm:p-8 border border-line/80 rounded-lg bg-surface/60 backdrop-blur-md shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-fg">Fundación de la Institución</h1>
            <p className="text-xs sm:text-sm text-fg-muted">Paso {step} de 4 • Origen en el Torneo Regional</p>
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
              <MapPin className="w-5 h-5" />
              <span>Identidad Institucional</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="f-nombre-oficial-del-club-1" className="block mb-1 text-xs font-medium text-fg">Nombre Oficial del Club</label>
                <input id="f-nombre-oficial-del-club-1" 
                  type="text" 
                  value={identity.name} 
                  onChange={e => setIdentity({...identity, name: e.target.value})} 
                  placeholder="Ej: Club Atlético Potrero"
                  className="w-full px-4 py-2.5 text-sm text-fg border rounded-xl bg-bg/80 border-line/80 focus:border-accent focus:outline-none placeholder:text-fg-subtle" 
                />
              </div>

              <div>
                <label htmlFor="f-siglas-nombre-corto-3-4-letras-2" className="block mb-1 text-xs font-medium text-fg">Siglas / Nombre Corto (3-4 letras)</label>
                <input id="f-siglas-nombre-corto-3-4-letras-2" 
                  type="text" 
                  maxLength={4}
                  value={identity.shortName} 
                  onChange={e => setIdentity({...identity, shortName: e.target.value.toUpperCase()})} 
                  placeholder="CAP"
                  className="w-full px-4 py-2.5 text-sm text-fg border rounded-xl bg-bg/80 border-line/80 focus:border-accent focus:outline-none placeholder:text-fg-subtle uppercase font-mono" 
                />
              </div>

              <div>
                <label htmlFor="f-apodo-del-equipo-3" className="block mb-1 text-xs font-medium text-fg">Apodo del Equipo</label>
                <input id="f-apodo-del-equipo-3" 
                  type="text" 
                  value={identity.nickname} 
                  onChange={e => setIdentity({...identity, nickname: e.target.value})} 
                  placeholder="Los Guerreros del Barro"
                  className="w-full px-4 py-2.5 text-sm text-fg border rounded-xl bg-bg/80 border-line/80 focus:border-accent focus:outline-none placeholder:text-fg-subtle" 
                />
              </div>

              <div>
                <label htmlFor="f-ciudad-de-origen-4" className="block mb-1 text-xs font-medium text-fg">Ciudad de Origen</label>
                <input id="f-ciudad-de-origen-4" 
                  type="text" 
                  value={identity.city} 
                  onChange={e => setIdentity({...identity, city: e.target.value})} 
                  placeholder="Buenos Aires"
                  className="w-full px-4 py-2.5 text-sm text-fg border rounded-xl bg-bg/80 border-line/80 focus:border-accent focus:outline-none placeholder:text-fg-subtle" 
                />
              </div>

              <div>
                <label htmlFor="f-pais-5" className="block mb-1 text-xs font-medium text-fg">País</label>
                <input id="f-pais-5" 
                  type="text" 
                  value={identity.country} 
                  onChange={e => setIdentity({...identity, country: e.target.value})} 
                  className="w-full px-4 py-2.5 text-sm text-fg border rounded-xl bg-bg/80 border-line/80 focus:border-accent focus:outline-none" 
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: COLORS & BADGE */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-accent font-bold text-base">
              <Palette className="w-5 h-5" />
              <span>Colores y Blasón Oficial</span>
            </div>

            {/* Live Jersey Preview */}
            <div className="flex flex-col sm:flex-row items-center justify-center p-6 border rounded-lg bg-bg/80 border-line gap-6">
              <div className="flex flex-col items-center">
                {/* SVG Jersey */}
                <div className="relative w-28 h-32 flex items-center justify-center filter drop-shadow-md">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Shirt Body */}
                    <path d="M25,25 L10,40 L22,50 L28,42 L28,90 L72,90 L72,42 L78,50 L90,40 L75,25 L65,25 C63,33 37,33 35,25 Z" fill={colors.primary} stroke="#27272a" strokeWidth="2" />
                    {/* Vertical Center Stripe */}
                    <rect x="42" y="30" width="16" height="60" fill={colors.secondary} opacity="0.9" />
                    {/* Collar */}
                    <path d="M35,25 C37,33 63,33 65,25" fill="none" stroke={colors.secondary} strokeWidth="3" />
                  </svg>
                </div>
                <span className="text-[11px] font-mono text-fg-muted mt-2">Camiseta Titular</span>
              </div>

              <div className="flex-1 w-full space-y-3">
                <p className="text-xs font-semibold text-fg">Paletas Tradicionales:</p>
                <div className="grid grid-cols-2 gap-2">
                  {COLOR_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setColors({ primary: p.primary, secondary: p.secondary })}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                        colors.primary === p.primary && colors.secondary === p.secondary
                          ? 'border-accent bg-accent/10'
                          : 'border-line bg-surface/60 hover:border-line'
                      }`}
                    >
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="w-4 h-4 rounded-full border border-black/40" style={{ backgroundColor: p.primary }} />
                        <span className="w-4 h-4 rounded-full border border-black/40" style={{ backgroundColor: p.secondary }} />
                      </div>
                      <span className="text-xs text-fg truncate">{p.name}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <div>
                    <label htmlFor="f-color-primario-6" className="block mb-1 text-[11px] text-fg-muted">Color Primario</label>
                    <input id="f-color-primario-6" 
                      type="color" 
                      value={colors.primary} 
                      onChange={e => setColors({...colors, primary: e.target.value})} 
                      className="w-10 h-8 rounded-lg bg-surface-3 border border-line cursor-pointer"
                    />
                  </div>
                  <div>
                    <label htmlFor="f-color-secundario-7" className="block mb-1 text-[11px] text-fg-muted">Color Secundario</label>
                    <input id="f-color-secundario-7" 
                      type="color" 
                      value={colors.secondary} 
                      onChange={e => setColors({...colors, secondary: e.target.value})} 
                      className="w-10 h-8 rounded-lg bg-surface-3 border border-line cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-fg mb-2">Modelo de Escudo:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {BADGES.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBadgeId(b.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                      badgeId === b.id 
                        ? 'border-accent bg-accent/10 text-accent' 
                        : 'border-line bg-bg/70 text-fg-muted hover:border-line'
                    }`}
                  >
                    <b.icon className="w-6 h-6 mb-1" />
                    <span className="text-[11px] font-medium">{b.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: STADIUM & INFRASTRUCTURE */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 text-accent font-bold text-base">
              <Building2 className="w-5 h-5" />
              <span>Estadio e Infraestructura Inicial</span>
            </div>

            <div>
              <label htmlFor="f-nombre-del-estadio-8" className="block mb-1 text-xs font-medium text-fg">Nombre del Estadio</label>
              <input id="f-nombre-del-estadio-8" 
                type="text" 
                value={stadium.name} 
                onChange={e => setStadium({...stadium, name: e.target.value})} 
                className="w-full px-4 py-2.5 text-sm text-fg border rounded-xl bg-bg/80 border-line/80 focus:border-accent focus:outline-none" 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 border rounded-xl bg-bg/70 border-line">
                <span className="text-[10px] text-fg-subtle uppercase block">Aforo Oficial</span>
                <span className="text-lg font-semibold text-fg font-mono">1,500</span>
                <span className="text-[11px] text-fg-muted block mt-0.5">Capacidad autorizada Tier 5</span>
              </div>

              <div className="p-3 border rounded-xl bg-bg/70 border-line">
                <span className="text-[10px] text-fg-subtle uppercase block">Calidad del Césped</span>
                <span className="text-lg font-semibold text-gold font-mono">60 / 100</span>
                <span className="text-[11px] text-fg-muted block mt-0.5">Potrero con sectores de tierra</span>
              </div>

              <div className="p-3 border rounded-xl bg-bg/70 border-line">
                <span className="text-[10px] text-fg-subtle uppercase block">Entrada General</span>
                <span className="text-lg font-semibold text-accent font-mono">$10.00</span>
                <span className="text-[11px] text-fg-muted block mt-0.5">Precio regulado de taquilla</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: CONFIRMATION & CHARTER */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 text-accent font-bold text-base">
              <CheckCircle className="w-5 h-5" />
              <span>Acta de Fundación Oficial</span>
            </div>

            <div className="p-5 border border-accent/30 rounded-lg bg-gradient-to-br from-accent/30 via-bg to-surface/80 shadow-lg">
              <div className="flex items-start justify-between border-b border-line pb-4 mb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-accent font-bold">
                    Club Afiliado a la Liga Regional (Tier 5)
                  </span>
                  <h3 className="text-2xl font-semibold text-fg mt-0.5">
                    {identity.name} ({identity.shortName})
                  </h3>
                  <p className="text-xs text-fg-muted">
                    "{identity.nickname}" • Fundado en {identity.foundedYear} • {identity.city}, {identity.country}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-surface border border-line">
                  <span className="w-4 h-4 rounded-full border border-black/40" style={{ backgroundColor: colors.primary }} />
                  <span className="w-4 h-4 rounded-full border border-black/40" style={{ backgroundColor: colors.secondary }} />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 text-xs">
                <div className="p-2.5 rounded-lg bg-surface/80 border border-line">
                  <span className="text-fg-subtle text-[10px] block">Director Técnico</span>
                  <span className="font-bold text-fg">{manager ? `${manager.first_name} ${manager.last_name}` : 'Asignado'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface/80 border border-line">
                  <span className="text-fg-subtle text-[10px] block">Caja Inicial Oficial</span>
                  <span className="font-bold text-accent font-mono">$25,000 USD</span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface/80 border border-line">
                  <span className="text-fg-subtle text-[10px] block">Tope Salarial Semanal</span>
                  <span className="font-bold text-blue-400 font-mono">$3,500 USD</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface/50 border border-line text-xs text-fg-muted">
                <span className="text-fg font-semibold">Cancha Oficial: </span>
                {stadium.name} (Capacidad: 1,500 espectadores • Césped: 60/100)
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

          {step < 4 ? (
            <button 
              type="button"
              onClick={() => {
                if (step === 1 && !identity.name.trim()) {
                  toast.error('Por favor escribe el nombre de la institución.')
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
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 text-xs font-bold text-accent-fg transition-transform bg-accent rounded-xl hover:bg-accent-strong  shadow-raised disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fundar Club y Comenzar Temporada'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
