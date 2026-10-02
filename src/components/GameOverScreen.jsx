import { useGameStore } from '../store'
import { AlertOctagon } from 'lucide-react'

export default function GameOverScreen() {
  const resetGame = useGameStore(state => state.resetGame)
  const stats = useGameStore(state => state.stats)

  let reason = 'Has sido despedido.'
  if (stats.board === 0) reason = 'La directiva perdió la paciencia con tus resultados.'
  if (stats.squad === 0) reason = 'El vestuario te hizo la cama. Has perdido el control.'
  if (stats.fans === 0) reason = 'La hinchada exigió tu cabeza en el último partido.'

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="p-8 border border-red-900/50 rounded-3xl bg-red-950/20">
        <AlertOctagon className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h1 className="mb-2 text-4xl font-black text-red-500">¡DESPEDIDO!</h1>
        <p className="mb-8 text-zinc-400">{reason}</p>
        
        <button 
          onClick={resetGame}
          className="px-8 py-3 font-bold text-white transition-colors bg-red-600 rounded-xl hover:bg-red-500"
        >
          Volver a empezar
        </button>
      </div>
    </div>
  )
}
