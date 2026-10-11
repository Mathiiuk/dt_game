// Reglas de rendimiento de la primera carga (en redes lentas cada KB compite con el formulario de acceso)
import { readFileSync } from 'node:fs'
import { GAME_PATHS } from '../../src/data/gameRoutes'

const html = readFileSync('index.html', 'utf8')
const gameApp = readFileSync('src/GameApp.jsx', 'utf8')
const authScreen = readFileSync('src/features/auth/AuthScreen.jsx', 'utf8')
const gtmBlock = html.slice(html.indexOf('Google Tag Manager'), html.indexOf('End Google Tag Manager'))

describe('primera carga del juego', () => {
  it('el Inicio se baja aparte (no engorda lo que hay que descargar para ver el login)', () => {
    expect(gameApp).toMatch(/const Dashboard = lazy\(\(\) => import\('\.\/features\/dashboard\/Dashboard'\)\)/)
    expect(gameApp).not.toMatch(/^import Dashboard /m)
  })

  it('mientras se escriben los datos de acceso se va bajando el Inicio (ya está en caché al entrar)', () => {
    expect(authScreen).toMatch(/import\('\.\.\/dashboard\/Dashboard'\)/)
    expect(authScreen).toMatch(/requestIdleCallback|setTimeout/)
  })

  it('el juego avisa cuando ya se dibujó para que el medidor no compita con su descarga', () => {
    expect(gameApp).toMatch(/dispatchEvent\(new Event\('vestuario:ready'\)\)/)
  })

  it('en las rutas del juego el medidor espera ese aviso (o un tope), y en las públicas solo a que el navegador esté libre', () => {
    expect(gtmBlock).toContain('vestuario:ready')
    expect(gtmBlock).toMatch(/setTimeout\(load, ?\d+\)/)
    expect(gtmBlock).toMatch(/requestIdleCallback/)
  })

  it('la lista de rutas del juego del HTML coincide con la de la app (no se desactualiza)', () => {
    const match = gtmBlock.match(/\/\^\\\/\(([^)]*)\)/)
    expect(match).not.toBeNull()
    const inHtml = match[1].split('|').sort()
    const inApp = GAME_PATHS.map(p => p.replace(/^\//, '')).sort()
    expect(inHtml).toEqual(inApp)
  })
})
