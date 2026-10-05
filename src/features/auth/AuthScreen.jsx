import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertTriangle, ArrowLeft, Check, Eye, EyeOff, KeyRound, Play, Shield, Sparkles, X } from 'lucide-react'
import { authApi, checkRateLimit, validatePasswordStrength } from '../../api/auth'
import { Button, Field, Input } from '../../components/ui'
import { cn } from '../../lib/utils'
import { friendlyError } from '../../lib/errors'

/** Marco común de las pantallas de acceso: tarjeta centrada sobre el fondo de la app */
function AuthShell({ children }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-raised sm:p-8">{children}</div>
    </main>
  )
}

function Requirement({ ok, children }) {
  return (
    <li className="flex items-center gap-2">
      {ok ? <Check className="size-3.5 text-accent" aria-hidden="true" /> : <X className="size-3.5 text-fg-subtle" aria-hidden="true" />}
      <span className={ok ? 'text-fg' : 'text-fg-subtle'}>{children}<span className="sr-only">{ok ? ' (cumplido)' : ' (pendiente)'}</span></span>
    </li>
  )
}

function PasswordInput({ show, onToggle, ...props }) {
  return (
    <div className="relative">
      <Input type={show ? 'text' : 'password'} className="pr-12" {...props} />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-md text-fg-subtle hover:text-fg"
      >
        {show ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
    </div>
  )
}

export default function AuthScreen({ initialMode = 'splash' }) {
  const [mode, setMode] = useState(initialMode) // splash | login | register | forgot_password
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [rateLimitInfo, setRateLimitInfo] = useState({ locked: false, remainingAttempts: 5 })

  useEffect(() => {
    if (email) setRateLimitInfo(checkRateLimit(email))
  }, [email, mode])

  const passwordStats = validatePasswordStrength(password)
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const mismatch = confirmPassword.length > 0 && !passwordsMatch

  const go = (next) => { setMode(next); setEmail(''); setPassword(''); setConfirmPassword('') }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!passwordsMatch) return toast.error('Las contraseñas no coinciden.')
    if (!passwordStats.valid) return toast.error(passwordStats.errors[0])
    setLoading(true)
    try {
      const { user } = await authApi.register({ name, email, password })
      toast.success(`¡Bienvenido al fútbol profesional, ${user.name}!`)
      navigate('/create-manager')
    } catch (err) {
      toast.error(friendlyError(err, 'Error al crear la cuenta.'))
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const current = checkRateLimit(email)
    if (current.locked) return toast.error(`Acceso bloqueado por ${current.minutesRemaining} min debido a múltiples intentos fallidos.`)
    setLoading(true)
    try {
      const { user } = await authApi.login({ email, password })
      toast.success(`Bienvenido de vuelta, DT ${user.name || ''}`)
      navigate('/game')
    } catch (err) {
      toast.error(friendlyError(err, 'Error al iniciar sesión.'))
      setRateLimitInfo(checkRateLimit(email))
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!forgotEmail) return toast.error('Ingresá tu correo electrónico.')
    setLoading(true)
    try {
      const res = await authApi.requestPasswordReset(forgotEmail)
      setForgotSent(true)
      toast.success(res.message)
    } catch (err) {
      toast.error(friendlyError(err, 'Error al procesar la solicitud.'))
    } finally {
      setLoading(false)
    }
  }

  // Bienvenida
  if (mode === 'splash') {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg px-4 py-8">
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <span className="mb-6 grid size-16 place-items-center rounded-lg border border-line bg-surface text-accent"><Shield className="size-8" aria-hidden="true" /></span>
          <p className="eyebrow mb-2">Juego de director técnico de fútbol</p>
          <h1 className="font-display text-5xl font-semibold leading-none text-fg sm:text-6xl">Vestuario</h1>
          <p className="font-display text-3xl font-semibold leading-tight text-accent sm:text-4xl">Vos sos el DT.</p>
          <p className="mb-8 mt-4 max-w-xs text-sm text-fg-muted">Del barro barrial a la gloria continental. Armá tu plantel, bancá tus decisiones y escribí tu dinastía.</p>
          <div className="flex w-full flex-col gap-3">
            <Button size="lg" onClick={() => go('register')}><Sparkles />Nueva carrera</Button>
            <Button size="lg" variant="outline" onClick={() => go('login')}><Play />Continuar carrera</Button>
          </div>
        </div>
      </main>
    )
  }

  // Recuperar contraseña
  if (mode === 'forgot_password') {
    return (
      <AuthShell>
        <button type="button" onClick={() => { setMode('login'); setForgotSent(false) }} className="-ml-2 mb-4 flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium text-fg-muted hover:text-fg">
          <ArrowLeft className="size-4" aria-hidden="true" />Volver a iniciar sesión
        </button>
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-md bg-accent-soft text-accent"><KeyRound className="size-5" aria-hidden="true" /></span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-fg">Recuperar acceso</h1>
            <p className="text-xs text-fg-muted">Restablecé tu contraseña de DT</p>
          </div>
        </div>
        {forgotSent ? (
          <div role="status" className="space-y-4 rounded-lg border border-accent/30 bg-accent-soft p-4 text-sm">
            <p className="font-semibold text-accent">Solicitud procesada</p>
            <p className="text-fg-muted">Si el correo <strong className="text-fg">{forgotEmail}</strong> existe en el sistema, recibirás las instrucciones en breve. Revisá la casilla de spam.</p>
            <Button className="w-full" onClick={() => setMode('login')}>Ir a iniciar sesión</Button>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-sm text-fg-muted">Ingresá el correo asociado a tu cuenta y te enviamos un enlace de recuperación seguro.</p>
            <Field label="Correo electrónico">
              {(p) => <Input {...p} required type="email" autoComplete="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="ejemplo@club.com" />}
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={loading}>Enviar enlace de recuperación</Button>
          </form>
        )}
      </AuthShell>
    )
  }

  // Iniciar sesión / registrarse
  const isLogin = mode === 'login'
  return (
    <AuthShell>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-fg">{isLogin ? 'Iniciar sesión' : 'Nueva cuenta de DT'}</h1>
        <p className="mt-1 text-sm text-fg-muted">{isLogin ? 'Accedé a tu banquillo técnico y continuá tu carrera.' : 'Registrate para empezar a forjar tu dinastía.'}</p>
      </div>

      {isLogin && rateLimitInfo.locked && (
        <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-lg border border-danger/40 bg-danger-soft p-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
          <div>
            <p className="font-semibold text-danger">Acceso bloqueado por seguridad</p>
            <p className="text-fg-muted">Demasiados intentos fallidos. Podrás intentar de nuevo en {rateLimitInfo.minutesRemaining} minuto(s).</p>
          </div>
        </div>
      )}
      {isLogin && !rateLimitInfo.locked && rateLimitInfo.remainingAttempts < 5 && (
        <p role="status" className="mb-4 flex items-center gap-2 rounded-lg border border-warning/40 bg-warning-soft p-3 text-sm text-warning">
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />Te quedan {rateLimitInfo.remainingAttempts} intento(s) antes del bloqueo temporal.
        </p>
      )}

      <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
        {!isLogin && (
          <Field label="Nombre de entrenador">
            {(p) => <Input {...p} required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Marcelo Gallardo" />}
          </Field>
        )}

        <Field label="Correo electrónico">
          {(p) => <Input {...p} required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dt@potrero.com" />}
        </Field>

        <div>
          <Field label="Contraseña">
            {(p) => <PasswordInput {...p} required autoComplete={isLogin ? 'current-password' : 'new-password'} show={showPassword} onToggle={() => setShowPassword(s => !s)} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />}
          </Field>
          {isLogin && (
            <button type="button" onClick={() => { setForgotEmail(email); setMode('forgot_password') }} className="mt-1.5 min-h-8 text-xs font-medium text-accent hover:underline">
              ¿Olvidaste tu contraseña?
            </button>
          )}
        </div>

        {!isLogin && (
          <>
            <div className="rounded-lg border border-line bg-surface-2 p-3 text-xs">
              <p className="mb-1.5 font-semibold text-fg-muted">Requisitos de seguridad</p>
              <ul className="space-y-1">
                <Requirement ok={passwordStats.hasLength}>Mínimo 8 caracteres</Requirement>
                <Requirement ok={passwordStats.hasNumber}>Al menos un número (0-9)</Requirement>
                <Requirement ok={passwordStats.hasUpperOrSymbol}>Al menos una mayúscula o símbolo</Requirement>
              </ul>
            </div>
            <Field label="Confirmar contraseña" error={mismatch ? 'Las contraseñas no coinciden.' : undefined}>
              {(p) => <PasswordInput {...p} required autoComplete="new-password" show={showPassword} onToggle={() => setShowPassword(s => !s)} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />}
            </Field>
          </>
        )}

        <Button type="submit" size="lg" className="w-full" loading={loading} disabled={isLogin && rateLimitInfo.locked}>
          {isLogin ? 'Ingresar al banquillo' : 'Registrar y comenzar carrera'}
        </Button>
      </form>

      <div className={cn('mt-6 space-y-1 border-t border-line pt-4 text-center')}>
        <Button variant="link" type="button" onClick={() => { setMode(isLogin ? 'register' : 'login'); setPassword(''); setConfirmPassword('') }}>
          {isLogin ? '¿No tenés carrera? Registrate acá' : '¿Ya tenés cuenta de DT? Iniciá sesión'}
        </Button>
        <div>
          <button type="button" onClick={() => setMode('splash')} className="min-h-9 text-xs text-fg-subtle hover:text-fg">Volver al inicio</button>
        </div>
      </div>
    </AuthShell>
  )
}
