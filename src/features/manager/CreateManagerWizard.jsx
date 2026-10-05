import { emailApi } from '../../api/email'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Minus, Plus } from 'lucide-react'
import { managerApi, MANAGER_BACKGROUND_PRESETS, FREE_POINTS_POOL, ATTRIBUTE_MAX_INITIAL_CAP } from '../../api/manager'
import { authApi } from '../../api/auth'
import {
  MANAGER_ATTRIBUTES, PHILOSOPHIES, SPECIALIZATIONS, changePoint, finalValue, remainingPoints
} from '../../domain/managerBuild'
import { Badge, Button, Field, Input, OptionCards, Select, Wizard } from '../../components/ui'
import { cn } from '../../lib/utils'
import { friendlyError } from '../../lib/errors'

const STEPS = ['Identidad', 'Trasfondo', 'Atributos', 'Filosofía', 'Firma']
const CAP_MESSAGE = `Tope inicial alcanzado (${ATTRIBUTE_MAX_INITIAL_CAP} pts). Se desbloquean más subiendo de nivel.`

export default function CreateManagerWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [errors, setErrors] = useState({})

  const [identity, setIdentity] = useState({ firstName: '', lastName: '', age: 38, nationality: 'Argentina', city: 'Buenos Aires', dominantFoot: 'Derecho' })
  const [background, setBackground] = useState('STREET_COACH')
  const [distributed, setDistributed] = useState({ tactics: 3, motivation: 4, youth: 3, management: 3, negotiation: 2 })
  const [philosophy, setPhilosophy] = useState('Ofensivo')
  const [specialization, setSpecialization] = useState('TACTICO')

  const preset = MANAGER_BACKGROUND_PRESETS[background] || MANAGER_BACKGROUND_PRESETS.STREET_COACH
  const free = remainingPoints(distributed, FREE_POINTS_POOL)
  const set = (field) => (e) => setIdentity(prev => ({ ...prev, [field]: e.target.value }))

  useEffect(() => {
    const checkAuth = async () => {
      const current = await authApi.getSession()
      if (!current) return navigate('/auth')
      setUser(current)
      if (current.name) {
        const parts = current.name.trim().split(' ')
        setIdentity(prev => ({ ...prev, firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' }))
      }
    }
    checkAuth()
  }, [navigate])

  const adjust = (key, change) => {
    const res = changePoint({ distributed, baseAttributes: preset.baseAttributes, key, change, pool: FREE_POINTS_POOL, cap: ATTRIBUTE_MAX_INITIAL_CAP })
    if (res.ok) setDistributed(res.distributed)
    else if (res.reason === 'CAP') toast.warning(CAP_MESSAGE)
  }

  const goNext = () => {
    if (step === 1) {
      const next = {}
      if (!identity.firstName.trim()) next.firstName = 'Ingresá tu nombre.'
      if (!identity.lastName.trim()) next.lastName = 'Ingresá tu apellido.'
      setErrors(next)
      if (Object.keys(next).length) return
    }
    setStep(s => s + 1)
  }

  const handleCreate = async () => {
    if (free !== 0) return toast.error(`Tenés que repartir los ${FREE_POINTS_POOL} puntos libres antes de confirmar.`)
    setLoading(true)
    try {
      await managerApi.createManager(user.id, { identity, background, distributedPoints: distributed, philosophy, specialization })
      toast.success('¡Credencial oficial de Director Técnico emitida con éxito!')
      emailApi.sendWelcome() // correo de bienvenida, sin esperar ni frenar el flujo
      navigate('/create-club')
    } catch (err) {
      toast.error(friendlyError(err, 'Error al crear el perfil de DT.'))
    } finally {
      setLoading(false)
    }
  }

  const isLast = step === STEPS.length

  return (
    <Wizard
      eyebrow="Creación de carrera"
      title="Ficha de director técnico"
      steps={STEPS}
      step={step}
      onBack={() => setStep(s => s - 1)}
      onNext={isLast ? handleCreate : goNext}
      isLast={isLast}
      loading={loading}
      nextDisabled={(step === 3 && free !== 0) || (isLast && free !== 0)}
      finalLabel="Firmar credencial y continuar"
    >
      {step === 1 && (
        <div className="space-y-5">
          <h2 className="font-display text-2xl font-semibold text-fg">Datos personales</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre" error={errors.firstName}>{(p) => <Input {...p} autoComplete="given-name" value={identity.firstName} onChange={set('firstName')} placeholder="Ej: Marcelo" />}</Field>
            <Field label="Apellido" error={errors.lastName}>{(p) => <Input {...p} autoComplete="family-name" value={identity.lastName} onChange={set('lastName')} placeholder="Ej: Gallardo" />}</Field>
            <Field label={`Edad: ${identity.age} años`}>
              {(p) => <input {...p} type="range" min="25" max="70" value={identity.age} onChange={(e) => setIdentity(prev => ({ ...prev, age: parseInt(e.target.value, 10) }))} className="h-11 w-full cursor-pointer accent-accent" />}
            </Field>
            <Field label="Pie dominante">
              {(p) => <Select {...p} value={identity.dominantFoot} onChange={set('dominantFoot')}><option>Derecho</option><option>Izquierdo</option><option>Ambidiestro</option></Select>}
            </Field>
            <Field label="Nacionalidad">{(p) => <Input {...p} value={identity.nationality} onChange={set('nationality')} />}</Field>
            <Field label="Ciudad de origen">{(p) => <Input {...p} value={identity.city} onChange={set('city')} />}</Field>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-fg">Trasfondo y trayectoria previa</h2>
            <p className="mt-1 text-sm text-fg-muted">Tu historia define la reputación con la que empezás y los atributos base de tu perfil.</p>
          </div>
          <OptionCards
            label="Trasfondo"
            value={background}
            onChange={setBackground}
            options={Object.values(MANAGER_BACKGROUND_PRESETS).map(p => ({ value: p.id, ...p }))}
            renderOption={(p, active) => (
              <>
                <span className="flex items-start justify-between gap-2">
                  <span className={cn('text-sm font-semibold', active ? 'text-accent' : 'text-fg')}>{p.title}</span>
                  <Badge>Rep. {p.reputation}</Badge>
                </span>
                <span className="mt-1 block text-xs text-fg-muted">{p.description}</span>
                <span className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] text-fg-muted">
                  {MANAGER_ATTRIBUTES.map(a => <span key={a.key} className="rounded bg-surface-3 px-1.5 py-0.5">{a.label.split(' ')[0]} {p.baseAttributes[a.key]}</span>)}
                </span>
              </>
            )}
          />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold text-fg">Distribución de habilidades</h2>
              <p className="mt-1 text-sm text-fg-muted">Repartí los {FREE_POINTS_POOL} puntos libres sobre la base de <strong className="text-fg">{preset.title}</strong>. Máximo inicial: {ATTRIBUTE_MAX_INITIAL_CAP}.</p>
            </div>
            <Badge tone={free === 0 ? 'accent' : 'warning'} role="status">Puntos libres: {free}</Badge>
          </div>
          <ul className="space-y-2.5">
            {MANAGER_ATTRIBUTES.map(({ key, label, description }) => {
              const base = preset.baseAttributes[key] || 5
              const delta = distributed[key] || 0
              const value = base + delta
              return (
                <li key={key} className="flex flex-col gap-3 rounded-lg border border-line bg-surface-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-fg">{label} <span className="text-xs font-normal text-fg-subtle">(base {base} + {delta})</span></p>
                    <p className="text-xs text-fg-muted">{description}</p>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button variant="outline" size="icon" onClick={() => adjust(key, -1)} disabled={delta <= 0} aria-label={`Restar un punto a ${label}`}><Minus /></Button>
                    <span className={cn('num w-9 text-center font-display text-2xl font-semibold', value >= ATTRIBUTE_MAX_INITIAL_CAP ? 'text-gold' : 'text-accent')} aria-label={`${label}: ${value}`}>{value}</span>
                    <Button variant="outline" size="icon" onClick={() => adjust(key, 1)} disabled={free <= 0 || value >= ATTRIBUTE_MAX_INITIAL_CAP} aria-label={`Sumar un punto a ${label}`}><Plus /></Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 font-display text-2xl font-semibold text-fg">Filosofía de juego</h2>
            <OptionCards label="Filosofía de juego" value={philosophy} onChange={setPhilosophy} options={PHILOSOPHIES} />
          </div>
          <div>
            <h2 className="mb-3 font-display text-2xl font-semibold text-fg">Especialización del entrenador</h2>
            <OptionCards label="Especialización" value={specialization} onChange={setSpecialization} options={SPECIALIZATIONS} />
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-5">
          <h2 className="font-display text-2xl font-semibold text-fg">Credencial oficial</h2>
          <div className="rounded-lg border border-accent/40 bg-surface-2 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
              <div>
                <p className="eyebrow text-accent">Licencia Pro Conmebol / UEFA</p>
                <p className="mt-1 font-display text-3xl font-semibold text-fg">{identity.firstName} {identity.lastName}</p>
                <p className="text-xs text-fg-muted">{identity.age} años · {identity.nationality} · {identity.city} · Pie {identity.dominantFoot}</p>
              </div>
              <div className="text-right"><p className="eyebrow">Reputación</p><p className="num font-display text-2xl font-semibold text-accent">{preset.reputation} pts</p></div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-surface p-2.5"><dt className="eyebrow">Trasfondo</dt><dd className="font-semibold text-fg">{preset.title}</dd></div>
              <div className="rounded-md bg-surface p-2.5"><dt className="eyebrow">Filosofía</dt><dd className="font-semibold text-fg">{philosophy}</dd></div>
            </dl>
            <p className="eyebrow mb-2 mt-4">Atributos verificados</p>
            <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              {MANAGER_ATTRIBUTES.map(a => (
                <div key={a.key} className="flex justify-between gap-2 rounded-md bg-surface p-2.5"><dt className="text-fg-muted">{a.label.split(' ')[0]}</dt><dd className="num font-semibold text-accent">{finalValue(preset.baseAttributes, distributed, a.key)}</dd></div>
              ))}
              <div className="flex justify-between gap-2 rounded-md bg-surface p-2.5"><dt className="text-fg-muted">Nivel inicial</dt><dd className="num font-semibold text-fg">1</dd></div>
            </dl>
          </div>
        </div>
      )}
    </Wizard>
  )
}
