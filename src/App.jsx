import { useGameStore } from './store'
import StartScreen from './components/StartScreen'
import PlayScreen from './components/PlayScreen'
import GameOverScreen from './components/GameOverScreen'

function App() {
  const gameState = useGameStore(state => state.gameState)

  return (
    <div className="min-h-screen text-zinc-100 bg-zinc-950 font-sans selection:bg-emerald-500/30">
      {gameState === 'start' && <StartScreen />}
      {gameState === 'playing' && <PlayScreen />}
      {gameState === 'gameover' && <GameOverScreen />}
    </div>
  )
}

export default App
