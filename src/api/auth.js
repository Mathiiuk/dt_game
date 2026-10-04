import { supabase } from './supabase'
import { queryCache } from '../utils/cache'
import { auditApi } from './audit'

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

export const authApi = {
  /**
   * Registro seguro de nuevo usuario con validación de robustez de contraseña
   */
  async register({ name, email, password }) {
    const strength = validatePasswordStrength(password)
    if (!strength.valid) {
      throw new Error(strength.errors[0])
    }

    const normalizedEmail = email.toLowerCase().trim()

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          display_name: name
        }
      }
    })

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
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    })

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
   * Obtiene la sesión activa actual con metadatos de carrera y DT
   */
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error || !session) return null

    const user = session.user

    let careerId = null
    try {
      const { data: career } = await supabase
        .from('careers')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .order('last_accessed_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      careerId = career?.id || null
    } catch {
      // Ignorar si la tabla no está creada
    }

    return {
      id: user.id,
      name: user.user_metadata?.display_name || 'Director Técnico',
      email: user.email,
      careerId,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
    }
  },

  /**
   * Cierre de sesión y revocación en cascada de sesiones activas
   */
  async logout() {
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
   * Solicitud de restablecimiento de contraseña con política anti-enumeración
   */
  async requestPasswordReset(email) {
    if (!email) throw new Error('Por favor, ingresa tu dirección de correo electrónico.')
    const normalizedEmail = email.toLowerCase().trim()

    await logSecurityAudit(null, 'PASSWORD_RESET_REQ', { email: normalizedEmail })

    try {
      await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/auth`
      })
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
