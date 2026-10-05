import {
  decideCaptcha, corsHeadersFor, parseAllowedOrigins, validateGatePayload, passwordProblem, normalizeEmail, EMAIL_TEMPLATES, escapeHtml, MAIL_FROM, MAIL_REPLY_TO
} from '../../supabase/functions/_shared/gate'

const token = 'x'.repeat(40)
const ok = { success: true, score: 0.9, action: 'login', hostname: 'dt-game.vercel.app' }

describe('decisión de reCAPTCHA v3', () => {
  const opts = { expectedAction: 'login', allowedHostnames: ['dt-game.vercel.app'] }

  it('deja pasar un puntaje alto, de la acción esperada y del dominio del sitio', () => {
    expect(decideCaptcha(ok, opts)).toEqual({ ok: true, score: 0.9 })
  })

  it('rechaza sin respuesta, con error de Google, otra acción, otro dominio o puntaje bajo', () => {
    expect(decideCaptcha(null, opts)).toMatchObject({ ok: false, reason: 'sin_respuesta' })
    expect(decideCaptcha({ success: false, 'error-codes': ['timeout-or-duplicate'] }, opts).reason).toBe('rechazado:timeout-or-duplicate')
    expect(decideCaptcha({ ...ok, action: 'signup' }, opts).reason).toBe('accion_distinta')
    expect(decideCaptcha({ ...ok, hostname: 'sitio-trucho.com' }, opts).reason).toBe('dominio_no_permitido')
    expect(decideCaptcha({ ...ok, score: 0.3 }, opts).reason).toBe('puntaje_bajo')
  })

  it('el puntaje mínimo se puede ajustar y vale 0,5 por defecto', () => {
    expect(decideCaptcha({ ...ok, score: 0.5 }, opts).ok).toBe(true)
    expect(decideCaptcha({ ...ok, score: 0.6 }, { ...opts, minScore: 0.7 }).ok).toBe(false)
    expect(decideCaptcha({ ...ok, score: undefined }, opts).ok).toBe(false)
  })

  it('sin lista de dominios no filtra por dominio', () => {
    expect(decideCaptcha({ ...ok, hostname: 'cualquiera.com' }, { expectedAction: 'login' }).ok).toBe(true)
  })
})

describe('orígenes permitidos', () => {
  it('lee la lista, ignora espacios y barras finales', () => {
    expect(parseAllowedOrigins(' https://a.com/ , http://localhost:5173,, ')).toEqual(['https://a.com', 'http://localhost:5173'])
    expect(parseAllowedOrigins(undefined)).toEqual([])
  })

  it('solo habilita el origen si está en la lista', () => {
    const allowed = ['https://dt-game.vercel.app']
    expect(corsHeadersFor('https://dt-game.vercel.app', allowed)['Access-Control-Allow-Origin']).toBe('https://dt-game.vercel.app')
    expect(corsHeadersFor('https://otro.com', allowed)['Access-Control-Allow-Origin']).toBeUndefined()
    expect(corsHeadersFor(null, allowed)['Access-Control-Allow-Origin']).toBeUndefined()
  })
})

describe('validación del pedido', () => {
  const base = { action: 'login', email: ' DT@Potrero.com ', password: 'x', captchaToken: token }

  it('normaliza el correo y acepta un pedido válido', () => {
    const res = validateGatePayload(base)
    expect(res.ok).toBe(true)
    expect(res.data.email).toBe('dt@potrero.com')
  })

  it('rechaza acciones desconocidas, correos inválidos y tokens ausentes o enormes', () => {
    expect(validateGatePayload({ ...base, action: 'borrar' }).ok).toBe(false)
    expect(validateGatePayload({ ...base, email: 'no-es-un-correo' }).ok).toBe(false)
    expect(validateGatePayload({ ...base, captchaToken: '' }).ok).toBe(false)
    expect(validateGatePayload({ ...base, captchaToken: 'x'.repeat(5000) }).ok).toBe(false)
    expect(validateGatePayload(null).ok).toBe(false)
  })

  it('el alta exige una contraseña fuerte y el ingreso, una contraseña', () => {
    expect(validateGatePayload({ ...base, action: 'signup', password: 'corta1A' }).ok).toBe(false)
    expect(validateGatePayload({ ...base, action: 'signup', password: 'Potrero2026' }).ok).toBe(true)
    expect(validateGatePayload({ ...base, password: '' }).ok).toBe(false)
  })

  it('recuperar clave no pide contraseña y el nombre se recorta', () => {
    expect(validateGatePayload({ action: 'reset', email: 'a@b.co', captchaToken: token }).ok).toBe(true)
    const res = validateGatePayload({ ...base, action: 'signup', password: 'Potrero2026', name: 'N'.repeat(200) })
    expect(res.data.name).toHaveLength(60)
  })

  it('la regla de contraseña es la misma que la del formulario', () => {
    expect(passwordProblem('abc')).toMatch(/8 caracteres/)
    expect(passwordProblem('abcdefgh')).toMatch(/número/)
    expect(passwordProblem('abcdefg1')).toMatch(/mayúscula/)
    expect(passwordProblem('abcdefg1!')).toBeNull()
    expect(normalizeEmail('  A@B.com ')).toBe('a@b.com')
  })
})

describe('correos del juego', () => {
  it('la bienvenida sale de no-contestar y responde a hola@', () => {
    expect(MAIL_FROM).toContain('no-contestar@vestuario.com.ar')
    expect(MAIL_REPLY_TO).toBe('hola@vestuario.com.ar')
    const mail = EMAIL_TEMPLATES.welcome('Marcelo')
    expect(mail.subject).toMatch(/Bienvenido/)
    expect(mail.html).toContain('Marcelo')
    expect(mail.text).toContain('Marcelo')
  })

  it('el nombre no puede inyectar HTML en el correo', () => {
    expect(EMAIL_TEMPLATES.welcome('<script>alert(1)</script>').html).not.toContain('<script>')
    expect(escapeHtml('a & "b" <c>')).toBe('a &amp; &quot;b&quot; &lt;c&gt;')
    expect(EMAIL_TEMPLATES.welcome('').html).toContain('Hola DT')
  })
})
