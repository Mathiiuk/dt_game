import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, checkRateLimit, validatePasswordStrength } from '../../api/auth'
import { toast } from 'sonner'
import { 
  Shield, 
  Play, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  AlertTriangle, 
  KeyRound, 
  ArrowLeft, 
  Loader2,
  Sparkles
} from 'lucide-react'

export default function AuthScreen() {
  const [mode, setMode] = useState('splash') // splash, login, register, forgot_password
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  // Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  // Rate Limiting Status
  const [rateLimitInfo, setRateLimitInfo] = useState({ locked: false, remainingAttempts: 5 })

  useEffect(() => {
    if (email) {
      setRateLimitInfo(checkRateLimit(email))
    }
  }, [email, mode])

  // Password analysis
  const passwordStats = validatePasswordStrength(password)
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword

  const handleRegister = async (e) => {
    e.preventDefault()

    if (!passwordsMatch) {
      toast.error('Las contraseñas no coinciden.')
      return
    }

    if (!passwordStats.valid) {
      toast.error(passwordStats.errors[0])
      return
    }

    setLoading(true)
    try {
      const { user } = await authApi.register({ name, email, password })
      toast.success(`¡Bienvenido al fútbol profesional, ${user.name}!`)
      navigate('/create-manager')
    } catch (err) {
      toast.error(err.message || 'Error al crear la cuenta.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()

    const currentRate = checkRateLimit(email)
    if (currentRate.locked) {
      toast.error(`Acceso bloqueado por ${currentRate.minutesRemaining} min debido a múltiples intentos fallidos.`)
      return
    }

    setLoading(true)
    try {
      const { user } = await authApi.login({ email, password })
      toast.success(`Bienvenido de vuelta, DT ${user.name || ''}`)
      navigate('/game')
    } catch (err) {
      toast.error(err.message || 'Error al iniciar sesión.')
      setRateLimitInfo(checkRateLimit(email))
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!forgotEmail) {
      toast.error('Por favor ingresa tu correo electrónico.')
      return
    }

    setLoading(true)
    try {
      const res = await authApi.requestPasswordReset(forgotEmail)
      setForgotSent(true)
      toast.success(res.message)
    } catch (err) {
      toast.error(err.message || 'Error al procesar la solicitud.')
    } finally {
      setLoading(false)
    }
  }

  // Vista 1: Pantalla de Bienvenida / Splash
  if (mode === 'splash') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-zinc-950">
        <div className="flex flex-col items-center max-w-md w-full text-center">
          <div className="flex items-center justify-center w-20 h-20 mb-6 border rounded-3xl bg-zinc-900/80 border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            <Shield className="w-10 h-10 text-emerald-500" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-emerald-500 mb-1">
            DEL POTRERO
          </h1>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
            AL ÍDOLO
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 mb-8 max-w-xs">
            Simulador estratégico de carrera para Directores Técnicos. Del barro barrial a la gloria continental.
          </p>

          <div className="flex flex-col w-full gap-3 sm:gap-4">
            <button
              onClick={() => {
                setMode('register')
                setEmail('')
                setPassword('')
              }}
              className="flex items-center justify-center gap-2 w-full py-4 px-6 font-bold text-black transition-all rounded-xl bg-emerald-500 hover:bg-emerald-400 hover:scale-[1.02] shadow-md shadow-emerald-500/20 active:scale-95"
            >
              <Sparkles className="w-5 h-5" />
              Nueva Carrera
            </button>
            <button
              onClick={() => {
                setMode('login')
                setEmail('')
                setPassword('')
              }}
              className="flex items-center justify-center gap-2 w-full py-4 px-6 font-bold transition-all border text-zinc-200 border-zinc-700/80 rounded-xl bg-zinc-900/70 hover:bg-zinc-800 hover:border-zinc-600 active:scale-95"
            >
              <Play className="w-5 h-5 text-emerald-400" />
              Continuar Carrera
            </button>
          </div>

          <div className="mt-8 text-xs text-zinc-600 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-zinc-500" />
            <span>Versión 3.0 • Sistema de Gestión Autoritativa</span>
          </div>
        </div>
      </div>
    )
  }

  // Vista 2: Recuperación de Contraseña
  if (mode === 'forgot_password') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-zinc-950">
        <div className="w-full max-w-md p-6 sm:p-8 border border-zinc-800/80 rounded-2xl bg-zinc-900/60 backdrop-blur-md shadow-xl">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setForgotSent(false)
            }}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-emerald-400 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Iniciar Sesión
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Recuperar Acceso</h2>
              <p className="text-xs text-zinc-400">Restablece tu contraseña de DT</p>
            </div>
          </div>

          {forgotSent ? (
            <div className="p-4 my-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-sm">
              <p className="font-semibold mb-1">Solicitud procesada con éxito</p>
              <p className="text-xs text-emerald-300/80">
                Si el correo <strong className="text-white">{forgotEmail}</strong> existe en el sistema, recibirás las instrucciones en breve. Revisa tu casilla de spam.
              </p>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="mt-4 w-full py-2.5 px-4 text-xs font-bold text-black bg-emerald-500 rounded-lg hover:bg-emerald-400 transition-colors"
              >
                Ir a Iniciar Sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-xs text-zinc-400">
                Ingresa el correo electrónico asociado a tu cuenta para enviarte un enlace de recuperación seguro.
              </p>

              <div>
                <label className="block mb-1.5 text-xs font-medium text-zinc-300">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    required
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="ejemplo@club.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm text-white border rounded-xl bg-zinc-950/80 border-zinc-700/80 focus:border-emerald-500 focus:outline-none placeholder:text-zinc-600 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-3 mt-4 text-sm font-bold text-black rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-md shadow-emerald-500/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar Enlace de Recuperación'}
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  // Vista 3: Login y Registro
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-zinc-950">
      <div className="w-full max-w-md p-6 sm:p-8 border border-zinc-800/80 rounded-2xl bg-zinc-900/60 backdrop-blur-md shadow-xl">
        {/* Cabecera del formulario */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white">
              {mode === 'login' ? 'Iniciar Sesión' : 'Nueva Cuenta de DT'}
            </h2>
            <p className="text-xs text-zinc-400">
              {mode === 'login' 
                ? 'Accede a tu banquillo técnico y continúa tu carrera' 
                : 'Regístrate para comenzar a forjar tu dinastía'}
            </p>
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Shield className="w-6 h-6" />
          </div>
        </div>

        {/* Banner de Rate Limit si hay fallos previos */}
        {mode === 'login' && rateLimitInfo.locked && (
          <div className="flex items-start gap-2.5 p-3 mb-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Acceso bloqueado por seguridad</p>
              <p className="text-rose-300/80">
                Demasiados intentos fallidos. Podrás intentar de nuevo en {rateLimitInfo.minutesRemaining} minuto(s).
              </p>
            </div>
          </div>
        )}

        {mode === 'login' && !rateLimitInfo.locked && rateLimitInfo.remainingAttempts < 5 && (
          <div className="flex items-center gap-2 p-2.5 mb-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Te quedan {rateLimitInfo.remainingAttempts} intento(s) antes del bloqueo temporal.</span>
          </div>
        )}

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block mb-1.5 text-xs font-medium text-zinc-300">Nombre de Entrenador</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Marcelo Gallardo"
                  className="w-full pl-10 pr-4 py-2.5 text-sm text-white border rounded-xl bg-zinc-950/80 border-zinc-700/80 focus:border-emerald-500 focus:outline-none placeholder:text-zinc-600 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block mb-1.5 text-xs font-medium text-zinc-300">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dt@potrero.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm text-white border rounded-xl bg-zinc-950/80 border-zinc-700/80 focus:border-emerald-500 focus:outline-none placeholder:text-zinc-600 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-300">Contraseña</label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email)
                    setMode('forgot_password')
                  }}
                  className="text-xs text-emerald-400 hover:underline transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
              <input
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-sm text-white border rounded-xl bg-zinc-950/80 border-zinc-700/80 focus:border-emerald-500 focus:outline-none placeholder:text-zinc-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Indicadores de requisitos de contraseña para Registro */}
          {mode === 'register' && (
            <div className="p-3 border rounded-xl bg-zinc-950/60 border-zinc-800 space-y-1.5 text-xs">
              <p className="font-semibold text-zinc-400 mb-1">Requisitos de seguridad:</p>
              <div className="flex items-center gap-2">
                {passwordStats.hasLength ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <X className="w-3.5 h-3.5 text-zinc-600" />
                )}
                <span className={passwordStats.hasLength ? 'text-zinc-200' : 'text-zinc-500'}>
                  Mínimo 8 caracteres
                </span>
              </div>
              <div className="flex items-center gap-2">
                {passwordStats.hasNumber ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <X className="w-3.5 h-3.5 text-zinc-600" />
                )}
                <span className={passwordStats.hasNumber ? 'text-zinc-200' : 'text-zinc-500'}>
                  Al menos un número (0-9)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {passwordStats.hasUpperOrSymbol ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <X className="w-3.5 h-3.5 text-zinc-600" />
                )}
                <span className={passwordStats.hasUpperOrSymbol ? 'text-zinc-200' : 'text-zinc-500'}>
                  Al menos una mayúscula o símbolo
                </span>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block mb-1.5 text-xs font-medium text-zinc-300">Confirmar Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm text-white border rounded-xl bg-zinc-950/80 border-zinc-700/80 focus:border-emerald-500 focus:outline-none placeholder:text-zinc-600 transition-colors"
                />
                {confirmPassword && (
                  <div className="absolute right-3 top-3">
                    {passwordsMatch ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <X className="w-4 h-4 text-rose-500" />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            disabled={loading || (mode === 'login' && rateLimitInfo.locked)}
            type="submit"
            className="flex items-center justify-center gap-2 w-full py-3.5 mt-6 text-sm font-bold text-black rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-500/20 active:scale-95"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'login' ? (
              'Ingresar al Banquillo'
            ) : (
              'Registrar y Comenzar Carrera'
            )}
          </button>
        </form>

        {/* Alternar modo */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center space-y-2">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setPassword('')
              setConfirmPassword('')
            }}
            className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors"
          >
            {mode === 'login' 
              ? '¿No tienes carrera creada? Regístrate aquí' 
              : '¿Ya tienes una cuenta de DT? Inicia Sesión'}
          </button>

          <div>
            <button
              type="button"
              onClick={() => setMode('splash')}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
