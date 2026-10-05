import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Award, Shield } from 'lucide-react'
import { authApi } from '../../api/auth'
import { managerApi } from '../../api/manager'
import { clubApi, TIER_5_STARTING_CONFIG } from '../../api/club'
import { useGameContext } from '../../context/GameContext'
import { BADGES, COLOR_PRESETS, defaultStadiumName, isAutoStadiumName, sameColors, validateIdentity } from '../../domain/clubIdentity'
import { formatMoney } from '../../lib/format'
import { Field, Input, OptionCards, Wizard } from '../../components/ui'
import { cn } from '../../lib/utils'

const STEPS = ['Identidad', 'Colores y escudo', 'Estadio', 'Acta']
const BADGE_ICONS = { SHIELD: Shield, CREST: Award, CIRCLE: Shield, DIAMOND: Shield }

function Jersey({ primary, secondary, className }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Vista previa de la camiseta titular">
      <path d="M25,25 L10,40 L22,50 L28,42 L28,90 L72,90 L72,42 L78,50 L90,40 L75,25 L65,25 C63,33 37,33 35,25 Z" fill={primary} stroke="#27272a" strokeWidth="2" />
      <rect x="42" y="30" width="16" height="60" fill={secondary} opacity="0.9" />
      <path d="M35,25 C37,33 63,33 65,25" fill="none" stroke={secondary} strokeWidth="3" />
    </svg>
  )
}

export default function CreateClubWizard() {
  const navigate = useNavigate()
  const { refreshContext } = useGameContext()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [manager, setManager] = useState(null)
  const [errors, setErrors] = useState({})

  const [identity, setIdentity] = useState({ name: 'Club Atlético Potrero', shortName: 'CAP', city: 'Buenos Aires', country: 'Argentina', foundedYear: 2026, nickname: 'El Expreso del Barrio' })
  const [colors, setColors] = useState({ primary: '#047857', secondary: '#FFFFFF' })
  const [badgeId, setBadgeId] = useState('SHIELD')
  const [stadium, setStadium] = useState({ name: defaultStadiumName('Club Atlético Potrero'), capacity: TIER_5_STARTING_CONFIG.stadiumCapacity, pitchCondition: TIER_5_STARTING_CONFIG.pitchCondition })

  const setField = (field) => (e) => setIdentity(prev => ({ ...prev, [field]: e.target.value }))

  // El nombre del estadio acompaña al del club mientras no se lo edite a mano
  const changeName = (e) => {
    const name = e.target.value
    setStadium(prev => (isAutoStadiumName(prev.name, identity.name) ? { ...prev, name: defaultStadiumName(name) } : prev))
    setIdentity(prev => ({ ...prev, name }))
  }

  useEffect(() => {
    const check = async () => {
      const user = await authApi.getSession()
      if (!user) return navigate('/auth')
      const current = await managerApi.getManager(user.id)
      if (!current) return navigate('/create-manager')
      setManager(current)
      const existing = await clubApi.getClubByManager(current.id)
      if (existing) navigate('/game')
    }
    check()
  }, [navigate])

  const goNext = () => {
    if (step === 1) {
      const next = validateIdentity(identity)
      setErrors(next)
      if (Object.keys(next).length) return
    }
    setStep(s => s + 1)
  }

  const handleCreate = async () => {
    setLoading(true)
    try {
      await clubApi.createClub(manager.id, { identity, colors, badgeId, stadium })
      toast.success('¡Institución fundada e inscripta en la liga!')
      // Recarga manager y club en el contexto antes de entrar al juego (evita estado obsoleto tras una sucesión)
      await refreshContext()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Error al fundar el club.')
    } finally {
      setLoading(false)
    }
  }

  const isLast = step === STEPS.length

  return (
    <Wizard
      eyebrow="Creación de carrera"
      title="Fundación de la institución"
      steps={STEPS}
      step={step}
      onBack={() => setStep(s => s - 1)}
      onNext={isLast ? handleCreate : goNext}
      isLast={isLast}
      loading={loading}
      finalLabel="Fundar club y comenzar temporada"
    >
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-2xl font-semibold text-fg">Identidad institucional</h2>
            <p className="mt-1 text-sm text-fg-muted">Origen en el Torneo Regional (Tier 5).</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre oficial del club" error={errors.name} className="sm:col-span-2">
              {(p) => <Input {...p} value={identity.name} onChange={changeName} placeholder="Ej: Club Atlético Potrero" />}
            </Field>
            <Field label="Siglas (3-4 letras)">
              {(p) => <Input {...p} maxLength={4} value={identity.shortName} onChange={(e) => setIdentity(prev => ({ ...prev, shortName: e.target.value.toUpperCase() }))} className="font-mono uppercase" placeholder="CAP" />}
            </Field>
            <Field label="Apodo del equipo">{(p) => <Input {...p} value={identity.nickname} onChange={setField('nickname')} placeholder="Los Guerreros del Barro" />}</Field>
            <Field label="Ciudad de origen">{(p) => <Input {...p} value={identity.city} onChange={setField('city')} />}</Field>
            <Field label="País">{(p) => <Input {...p} value={identity.country} onChange={setField('country')} />}</Field>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h2 className="font-display text-2xl font-semibold text-fg">Colores y blasón</h2>
          <div className="flex flex-col items-center gap-6 rounded-lg bg-surface-2 p-5 sm:flex-row">
            <div className="text-center">
              <Jersey primary={colors.primary} secondary={colors.secondary} className="mx-auto h-32 w-28" />
              <p className="mt-1 text-xs text-fg-muted">Camiseta titular</p>
            </div>
            <div className="w-full flex-1 space-y-4">
              <OptionCards
                label="Paletas tradicionales"
                value={COLOR_PRESETS.find(p => sameColors(p, colors))?.name}
                onChange={(name) => { const p = COLOR_PRESETS.find(x => x.name === name); setColors({ primary: p.primary, secondary: p.secondary }) }}
                options={COLOR_PRESETS.map(p => ({ value: p.name, ...p }))}
                renderOption={(p, active) => (
                  <span className="flex items-center gap-2.5">
                    <span className="flex shrink-0 gap-1" aria-hidden="true">
                      <span className="size-4 rounded-full border border-black/40" style={{ backgroundColor: p.primary }} />
                      <span className="size-4 rounded-full border border-black/40" style={{ backgroundColor: p.secondary }} />
                    </span>
                    <span className={cn('truncate text-xs font-medium', active ? 'text-accent' : 'text-fg')}>{p.name}</span>
                  </span>
                )}
              />
              <div className="flex gap-5">
                <Field label="Color primario">{(p) => <input {...p} type="color" value={colors.primary} onChange={(e) => setColors(prev => ({ ...prev, primary: e.target.value }))} className="h-11 w-16 cursor-pointer rounded-md border border-line bg-surface-3 p-1" />}</Field>
                <Field label="Color secundario">{(p) => <input {...p} type="color" value={colors.secondary} onChange={(e) => setColors(prev => ({ ...prev, secondary: e.target.value }))} className="h-11 w-16 cursor-pointer rounded-md border border-line bg-surface-3 p-1" />}</Field>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-fg">Modelo de escudo</h3>
            <OptionCards
              label="Modelo de escudo"
              value={badgeId}
              onChange={setBadgeId}
              columns="grid-cols-2 sm:grid-cols-4"
              options={BADGES.map(b => ({ value: b.id, ...b }))}
              renderOption={(b, active) => {
                const Icon = BADGE_ICONS[b.id] || Shield
                return (
                  <span className={cn('flex flex-col items-center gap-1 text-center', active ? 'text-accent' : 'text-fg-muted')}>
                    <Icon className="size-6" aria-hidden="true" />
                    <span className="text-xs font-medium">{b.label}</span>
                  </span>
                )
              }}
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <h2 className="font-display text-2xl font-semibold text-fg">Estadio e infraestructura inicial</h2>
          <Field label="Nombre del estadio">{(p) => <Input {...p} value={stadium.name} onChange={(e) => setStadium(prev => ({ ...prev, name: e.target.value }))} />}</Field>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-surface-2 p-3"><dt className="eyebrow">Aforo oficial</dt><dd className="num font-display text-2xl font-semibold text-fg">{TIER_5_STARTING_CONFIG.stadiumCapacity.toLocaleString('es-AR')}</dd><p className="text-xs text-fg-muted">Capacidad autorizada Tier 5</p></div>
            <div className="rounded-lg bg-surface-2 p-3"><dt className="eyebrow">Calidad del césped</dt><dd className="num font-display text-2xl font-semibold text-gold">{TIER_5_STARTING_CONFIG.pitchCondition} / 100</dd><p className="text-xs text-fg-muted">Potrero con sectores de tierra</p></div>
            <div className="rounded-lg bg-surface-2 p-3"><dt className="eyebrow">Entrada general</dt><dd className="num font-display text-2xl font-semibold text-accent">{formatMoney(TIER_5_STARTING_CONFIG.ticketPrice)}</dd><p className="text-xs text-fg-muted">Precio regulado de taquilla</p></div>
          </dl>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          <h2 className="font-display text-2xl font-semibold text-fg">Acta de fundación</h2>
          <div className="rounded-lg border border-accent/40 bg-surface-2 p-5">
            <div className="flex items-start justify-between gap-3 border-b border-line pb-4">
              <div>
                <p className="eyebrow text-accent">Club afiliado a la Liga Regional (Tier 5)</p>
                <p className="mt-1 font-display text-3xl font-semibold leading-tight text-fg">{identity.name} <span className="text-fg-muted">({identity.shortName})</span></p>
                <p className="text-xs text-fg-muted">“{identity.nickname}” · Fundado en {identity.foundedYear} · {identity.city}, {identity.country}</p>
              </div>
              <Jersey primary={colors.primary} secondary={colors.secondary} className="size-16 shrink-0" />
            </div>
            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-md bg-surface p-2.5"><dt className="eyebrow">Director técnico</dt><dd className="font-semibold text-fg">{manager ? `${manager.first_name} ${manager.last_name}` : 'Asignado'}</dd></div>
              <div className="rounded-md bg-surface p-2.5"><dt className="eyebrow">Caja inicial</dt><dd className="num font-semibold text-accent">{formatMoney(TIER_5_STARTING_CONFIG.initialCashBalance)}</dd></div>
              <div className="rounded-md bg-surface p-2.5"><dt className="eyebrow">Tope salarial semanal</dt><dd className="num font-semibold text-fg">{formatMoney(TIER_5_STARTING_CONFIG.initialWeeklyWageCap)}</dd></div>
            </dl>
            <p className="mt-4 rounded-md bg-surface p-3 text-sm text-fg-muted"><span className="font-semibold text-fg">Cancha oficial: </span>{stadium.name} (capacidad {TIER_5_STARTING_CONFIG.stadiumCapacity.toLocaleString('es-AR')} · césped {TIER_5_STARTING_CONFIG.pitchCondition}/100)</p>
          </div>
        </div>
      )}
    </Wizard>
  )
}
