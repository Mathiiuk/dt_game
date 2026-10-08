import { supabase, AUTH_STORAGE_KEY } from './supabase'
import { queryCache } from '../utils/cache'
import { auditApi } from './audit'
import { getRecaptchaToken, isRecaptchaEnabled } from '../lib/recaptcha'

export const DT_LAST_USER_KEY = 'dt_last_active_user'

/**
 * Escucha la recuperación de visibilidad y foco en PWA y navegadores móviles.
 * Al volver tras suspensión, fuerza la comprobación y auto-refresco del token de Supabase.
 */
export function setupSessionVisibilityListener(callback) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {}
  }

  const handleVisibility = async () => {
    if (document.visibilityState === 'visible') {
      try {
        if (typeof supabase.auth?.startAutoRefresh === 'function') {
          supabase.auth.startAutoRefresh()
        }
        let { data: { session }, error } = await supabase.auth.getSession()
        if ((!session || error) && typeof supabase.auth?.refreshSession === 'function') {
          const refreshRes = await supabase.auth.refreshSession()
          if (refreshRes.data?.session && !refreshRes.error) {
            session = refreshRes.data.session
          }
        }
        if (session && typeof callback === 'function') {
          callback(session)
        }
      } catch (err) {
        console.warn('Error refrescando sesión al recuperar visibilidad:', err)
      }
    }
  }

  document.addEventListener('visibilitychange', handleVisibility)
  window.addEventListener('focus', handleVisibility)
  window.addEventListener('pageshow', handleVisibility)

  return () => {
    document.removeEventListener('visibilitychange', handleVisibility)
    window.removeEventListener('focus', handleVisibility)
    window.removeEventListener('pageshow', handleVisibility)
  }
}

const RATE_LIMIT_STORAGE_KEY = 'dt_auth_rate_limit'
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_TIME_MS = 15 * 60 * 1000 // 15 minutos

/**
 * Genera un fingerprint básico y consistente del navegador
 */
function getDeviceFingerprint() {
  try {
    const nav = window.navigator || {}
    const screen = window.screen || {}
    const str = `${nav.userAgent || ''}-${nav.language || ''}-${screen.width}x${screen.height}-${Intl.DateTimeFormat().resolvedOptions().timeZone || ''}`
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i)
      hash |= 0
    }
    return `fp_${Math.abs(hash).toString(16)}`
  } catch {
    return 'fp_unknown'
  }
}

/**
 * Administrador de Rate Limiting por email/cliente
 */
function getRateLimitStore() {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveRateLimitStore(store) {
  try {
    localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(store))
  } catch (e) {
    console.warn('No se pudo guardar el estado de rate limit:', e)
  }
}

export function checkRateLimit(email) {
  if (!email) return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS }
  const normalized = email.toLowerCase().trim()
  const store = getRateLimitStore()
  const entry = store[normalized]

  if (!entry) {
    return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS }
  }

  const now = Date.now()
  if (entry.lockedUntil && now < entry.lockedUntil) {
    const minutesLeft = Math.ceil((entry.lockedUntil - now) / 60000)
    return {
      locked: true,
      minutesRemaining: minutesLeft,
      remainingAttempts: 0
    }
  }

  // Si ya pasó el bloqueo, limpiar
  if (entry.lockedUntil && now >= entry.lockedUntil) {
    delete store[normalized]
    saveRateLimitStore(store)
    return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS }
  }

  const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - (entry.attempts || 0))
  return { locked: false, remainingAttempts: remaining }
}

function recordFailedAttempt(email) {
  if (!email) return
  const normalized = email.toLowerCase().trim()
  const store = getRateLimitStore()
  const entry = store[normalized] || { attempts: 0, lockedUntil: null }
  
  entry.attempts = (entry.attempts || 0) + 1
  if (entry.attempts >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_TIME_MS
  }
  
  store[normalized] = entry
  saveRateLimitStore(store)
  return entry
}

function resetRateLimit(email) {
  if (!email) return
  const normalized = email.toLowerCase().trim()
  const store = getRateLimitStore()
  if (store[normalized]) {
    delete store[normalized]
    saveRateLimitStore(store)
  }
}

/**
 * Validador de fortaleza de contraseña según Master Rules y Fase 01
 */
export function validatePasswordStrength(password) {
  const errors = []
  if (!password || password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres.')
  }
  if (!/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número.')
  }
  if (!/[A-Z!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('La contraseña debe contener al menos una mayúscula o carácter especial.')
  }
  return {
    valid: errors.length === 0,
    errors,
    hasLength: password?.length >= 8,
    hasNumber: /\d/.test(password || ''),
    hasUpperOrSymbol: /[A-Z!@#$%^&*(),.?":{}|<>]/.test(password || '')
  }
}

/**
 * Registro de auditoría de seguridad
 */
async function logSecurityAudit(userId, eventType, payload = {}) {
  try {
    await supabase.from('security_audit_log').insert({
      user_id: userId || null,
      event_type: eventType,
      user_agent: navigator.userAgent,
      payload: {
        ...payload,
        fingerprint: getDeviceFingerprint(),
        timestamp: new Date().toISOString()
      }
    })
  } catch (err) {
    // Si la tabla no existe o falla en Supabase, registrar en audit_log general
    try {
      await auditApi.logAction({
        whoId: userId || '00000000-0000-0000-0000-000000000000',
        action: `SECURITY_${eventType}`,
        stateAfter: payload
      })
    } catch {
      console.warn('Auditoría de seguridad no pudo ser persistida remotamente')
    }
  }
}

/**
 * Alta, ingreso y recuperar clave pasan por la función `auth-gate` cuando hay reCAPTCHA configurado: el servidor verifica
 * el token con la clave secreta antes de tocar la cuenta. Sin clave del sitio (desarrollo) se usa el camino directo.
 * Devuelve el mismo formato { data, error } que supabase.auth.
 */
async function callGate(action, payload) {
  const captchaToken = await getRecaptchaToken(action)
  const { data, error } = await supabase.functions.invoke('auth-gate', { body: { action, ...payload, captchaToken } })

  if (error) {
    let message = 'No pudimos completar la operación. Probá de nuevo.'
    try {
      const body = await error.context?.json?.()
      if (body?.message) message = body.message
    } catch {
      // Sin cuerpo legible: se deja el mensaje genérico
    }
    return { data: null, error: { message } }
  }
  if (!data?.ok) return { data: null, error: { message: data?.message || 'No pudimos completar la operación.' } }

  // El servidor devuelve la sesión: se instala en el cliente para que las consultas siguientes vayan autenticadas
  if (data.session?.access_token) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    })
    if (sessionError) return { data: null, error: { message: sessionError.message } }
  }
  return { data: { user: data.user, session: data.session, needsConfirmation: data.needsConfirmation }, error: null }
}

const signUpSecure = (payload) => (isRecaptchaEnabled()
  ? callGate('signup', payload)
  : supabase.auth.signUp({ email: payload.email, password: payload.password, options: { data: { display_name: payload.name } } }))

const signInSecure = (payload) => (isRecaptchaEnabled()
  ? callGate('login', payload)
  : supabase.auth.signInWithPassword({ email: payload.email, password: payload.password }))

const resetSecure = async (email) => {
  if (isRecaptchaEnabled()) return callGate('reset', { email })
  return supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth` })
}

/** Carrera activa del usuario; si no tiene (primer ingreso, por ejemplo con Google) se crea una */
async function ensureActiveCareer(userId) {
  const { data: active } = await supabase
    .from('careers')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .order('last_accessed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (active) return active
  const { data: created } = await supabase
    .from('careers')
    .insert({ user_id: userId, status: 'ACTIVE', ruleset_version: '3.0.0', balance_version: '1.0.0' })
    .select()
    .single()
  return created || null
}

export const authApi = {
  /**
   * Ingreso con Google. Redirige a Google y vuelve a /game con la sesión puesta; la carrera inicial se crea al
   * leer la sesión por primera vez (ver getSession).
   */
  async loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/game` }
    })
    if (error) throw new Error(error.message)
  },

  /**
   * Registro seguro de nuevo usuario con validación de robustez de contraseña
   */
  async register({ name, email, password }) {
    const strength = validatePasswordStrength(password)
    if (!strength.valid) {
      throw new Error(strength.errors[0])
    }

    const normalizedEmail = email.toLowerCase().trim()

    const { data, error } = await signUpSecure({ email: normalizedEmail, password, name })

    if (error) {
      await logSecurityAudit(null, 'LOGIN_FAILED', { email: normalizedEmail, reason: error.message })
      throw new Error(error.message)
    }

    const userId = data.user?.id

    // Crear carrera inicial para aislar el contexto de juego (Career Partitioning)
    let career = null
    if (userId) {
      try {
        const { data: newCareer } = await supabase
          .from('careers')
          .insert({
            user_id: userId,
            status: 'ACTIVE',
            ruleset_version: '3.0.0',
            balance_version: '1.0.0'
          })
          .select()
          .single()
        career = newCareer
      } catch (e) {
        console.warn('No se pudo inicializar careers en base de datos:', e)
      }

      // Registrar sesión activa
      try {
        await supabase.from('user_sessions').insert({
          user_id: userId,
          device_fingerprint: getDeviceFingerprint(),
          active_career_id: career?.id || null,
          expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
          is_revoked: false
        })
      } catch (e) {
        console.warn('No se pudo registrar user_sessions en base de datos:', e)
      }

      await logSecurityAudit(userId, 'USER_REGISTERED', { email: normalizedEmail, name })
    }

    return {
      user: {
        id: data.user.id,
        name: data.user.user_metadata?.display_name || name,
        email: data.user.email,
        careerId: career?.id || null
      },
      token: data.session?.access_token
    }
  },

  /**
   * Inicio de sesión autoritativo con rate limiting de 5 intentos y auditoría
   */
  async login({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim()

    // 1. Verificación de Rate Limiting
    const rateStatus = checkRateLimit(normalizedEmail)
    if (rateStatus.locked) {
      throw new Error(
        `Demasiados intentos fallidos. Acceso bloqueado temporalmente por ${rateStatus.minutesRemaining} minuto(s) por seguridad.`
      )
    }

    // 2. Intento de autenticación en Supabase
    const { data, error } = await signInSecure({ email: normalizedEmail, password })

    if (error) {
      const updated = recordFailedAttempt(normalizedEmail)
      const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - (updated?.attempts || 0))
      await logSecurityAudit(null, 'LOGIN_FAILED', {
        email: normalizedEmail,
        remainingAttempts: remaining,
        reason: error.message
      })

      if (remaining === 0) {
        throw new Error(
          'Demasiados intentos fallidos. Tu cuenta ha sido bloqueada temporalmente por 15 minutos.'
        )
      }

      throw new Error(`Credenciales incorrectas. Te quedan ${remaining} intento(s) antes del bloqueo.`)
    }

    // 3. Inicio exitoso: resetear contador de rate limit
    resetRateLimit(normalizedEmail)

    const userId = data.user?.id

    // 4. Cargar o vincular carrera activa
    let career = null
    if (userId) {
      try {
        const { data: activeCareer } = await supabase
          .from('careers')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'ACTIVE')
          .order('last_accessed_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (activeCareer) {
          career = activeCareer
          // Actualizar last_accessed_at
          await supabase
            .from('careers')
            .update({ last_accessed_at: new Date().toISOString() })
            .eq('id', activeCareer.id)
        } else {
          // Provisionar carrera activa por defecto
          const { data: newCareer } = await supabase
            .from('careers')
            .insert({
              user_id: userId,
              status: 'ACTIVE',
              ruleset_version: '3.0.0',
              balance_version: '1.0.0'
            })
            .select()
            .single()
          career = newCareer
        }
      } catch (e) {
        console.warn('Tabla careers no disponible en Supabase:', e)
      }

      // Registrar sesión activa
      try {
        await supabase.from('user_sessions').insert({
          user_id: userId,
          device_fingerprint: getDeviceFingerprint(),
          active_career_id: career?.id || null,
          expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
          is_revoked: false
        })
      } catch (e) {
        console.warn('Tabla user_sessions no disponible en Supabase:', e)
      }

      await logSecurityAudit(userId, 'LOGIN_SUCCESS', {
        email: normalizedEmail,
        careerId: career?.id || null
      })
    }

    return {
      user: {
        id: data.user.id,
        name: data.user.user_metadata?.display_name || '',
        email: data.user.email,
        careerId: career?.id || null
      },
      token: data.session?.access_token
    }
  },

  /**
   * Obtiene la sesión activa actual con metadatos de carrera y DT.
   * En caso de token expirado o suspensión en PWA, intenta refrescar proactivamente.
   */
  async getSession() {
    let { data: { session }, error } = await supabase.auth.getSession()

    // Si la sesión no vino o hubo error, intentar refresh proactivo antes de dar por cerrada la sesión
    if ((!session || error) && typeof supabase.auth?.refreshSession === 'function') {
      try {
        const refreshRes = await supabase.auth.refreshSession()
        if (refreshRes.data?.session && !refreshRes.error) {
          session = refreshRes.data.session
          error = null
        }
      } catch {
        // Fallback silencioso ante falla de conectividad
      }
    }

    if (error || !session) return null

    const user = session.user

    let careerId = null
    try {
      careerId = (await ensureActiveCareer(user.id))?.id || null
    } catch {
      // Ignorar si la tabla no está creada
    }

    const userData = {
      id: user.id,
      name: user.user_metadata?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || 'Director Técnico',
      email: user.email,
      careerId,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
    }

    try {
      localStorage.setItem(DT_LAST_USER_KEY, JSON.stringify({
        id: userData.id,
        email: userData.email,
        name: userData.name
      }))
    } catch {
      // Ignorar si el almacenamiento local está restringido
    }

    return userData
  },

  /**
   * Cierre de sesión y revocación en cascada de sesiones activas
   */
  async logout() {
    try {
      localStorage.removeItem(DT_LAST_USER_KEY)
    } catch {
      // Ignorar
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) {
        await logSecurityAudit(session.user.id, 'LOGOUT', {})
        try {
          await supabase
            .from('user_sessions')
            .update({ is_revoked: true })
            .eq('user_id', session.user.id)
        } catch {
          // Ignorar si la tabla no está disponible
        }
      }
    } catch {
      // Continuar con sign out
    }

    // Limpieza de memoria y caché SWR
    queryCache.clear()

    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  },

  /**
   * Elimina la cuenta propia (correo o Google) con todos sus datos. Lo hace una función del servidor que verifica la sesión,
   * borra los datos del juego y después el usuario de acceso. Al terminar limpia lo que quedó en este dispositivo.
   */
  async deleteAccount(confirm) {
    const { data, error } = await supabase.functions.invoke('delete-account', { body: { confirm } })
    if (error) {
      // Las respuestas con error traen el motivo en el cuerpo
      let message = ''
      try { message = (await error.context?.json?.())?.message || '' } catch { /* sin detalle */ }
      throw new Error(message || 'No pudimos eliminar la cuenta. Probá de nuevo.')
    }
    if (!data?.ok) throw new Error(data?.message || 'No pudimos eliminar la cuenta. Probá de nuevo.')

    try {
      localStorage.removeItem(DT_LAST_USER_KEY)
      sessionStorage.clear()
    } catch {
      // Sin almacenamiento no hay nada que limpiar
    }
    queryCache.clear()
    // La cuenta ya no existe: se cierra la sesión local (si el servidor ya la revocó, no pasa nada)
    try { await supabase.auth.signOut({ scope: 'local' }) } catch { /* ya cerrada */ }
    return data
  },

  /**
   * Solicitud de restablecimiento de contraseña con política anti-enumeración
   */
  async requestPasswordReset(email) {
    if (!email) throw new Error('Por favor, ingresa tu dirección de correo electrónico.')
    const normalizedEmail = email.toLowerCase().trim()

    await logSecurityAudit(null, 'PASSWORD_RESET_REQ', { email: normalizedEmail })

    try {
      await resetSecure(normalizedEmail)
    } catch (e) {
      console.warn('Error en supabase resetPasswordForEmail:', e)
    }

    // Respuesta segura anti-enumeración de usuarios
    return {
      success: true,
      message: 'Si el correo electrónico está registrado en el sistema, recibirás un enlace de recuperación en los próximos minutos.'
    }
  }
}
