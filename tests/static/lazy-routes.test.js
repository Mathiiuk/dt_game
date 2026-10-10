// Velocidad: las pantallas pesadas se descargan al entrar a cada una, no todas juntas al abrir el juego
import { readFileSync } from 'node:fs'

const gameApp = readFileSync('src/GameApp.jsx', 'utf8')
const shell = readFileSync('src/components/layout/AppShell.jsx', 'utf8')
const vite = readFileSync('vite.config.ts', 'utf8')

const HEAVY = ['MatchScreen', 'PostMatchScreen', 'MarketScreen', 'SquadScreen', 'ClubScreen', 'FinancesScreen', 'TrainingScreen', 'TacticsScreen', 'CalendarScreen', 'StandingsScreen']

describe('pantallas con carga perezosa', () => {
  it.each(HEAVY)('%s se importa con React.lazy', (name) => {
    expect(gameApp).toMatch(new RegExp(`const ${name} = lazy\\(\\(\\) => import\\(`))
    expect(gameApp).not.toMatch(new RegExp(`^import ${name} from`, 'm'))
  })

  it('el juego espera las pantallas con Suspense, también dentro del menú para que no desaparezca', () => {
    expect(gameApp).toMatch(/<Suspense/)
    expect(shell).toMatch(/<Suspense[\s\S]*?<Outlet \/>\s*<\/Suspense>/)
  })

  it('el empaquetado separa las librerías pesadas en trozos propios', () => {
    expect(vite).toMatch(/manualChunks/)
    for (const lib of ['react', 'supabase', 'motion']) expect(vite).toContain(lib)
  })
})
