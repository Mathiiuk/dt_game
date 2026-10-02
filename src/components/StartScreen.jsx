import { useGameStore } from '../store'
import { useState } from 'react'
import { Trophy, Users, BookOpen } from 'lucide-react'

export default function StartScreen() {
  const [name, setName] = useState('')
  const [style, setStyle] = useState('tactical')
  const startGame = useGameStore(state => state.startGame)

  const styles = [
    { id: 'tactical', name: 'Táctico', icon: <BookOpen className="w-5 h-5" />, desc: 'Mejora resultados en partidos clave.' },
    { id: 'motivator', name: 'Motivador', icon: <Users className="w-5 h-5" />, desc: 'Mantiene alta la moral del vestuario.' },
    { id: 'developer', name: 'Formador', icon: <Trophy className="w-5 h-5" />, desc: 'Mejora la calidad de los juveniles.' }
  ]

  const handleStart = (e) => {
    e.preventDefault()
    if (name.trim()) startGame(name, style)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-zinc-950">
      <div className="w-full max-w-md p-8 border border-zinc-800 rounded-2xl bg-zinc-900/50 backdrop-blur-sm">
        <h1 className="mb-2 text-4xl font-black text-center text-emerald-400">El Pizarrón</h1>
        <p className="mb-8 text-center text-zinc-400">Modo carrera de DT en 5 minutos</p>

        <form onSubmit={handleStart} className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-zinc-300">Nombre del Míster</label>
            <input 
              type="text" 
              required
              placeholder="Ej. Carlos Bianchi"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 text-white border rounded-xl bg-zinc-950 border-zinc-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-zinc-300">Estilo de Juego</label>
            <div className="grid grid-cols-1 gap-3">
              {styles.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={`flex items-start p-4 text-left border rounded-xl transition-colors ${
                    style === s.id 
                    ? 'border-emerald-500 bg-emerald-500/10' 
                    : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50'
                  }`}
                >
                  <div className={`p-2 mr-4 rounded-lg ${style === s.id ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                    {s.icon}
                  </div>
                  <div>
                    <h3 className={`font-bold ${style === s.id ? 'text-emerald-400' : 'text-zinc-200'}`}>{s.name}</h3>
                    <p className="text-xs text-zinc-500">{s.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 font-bold text-black transition-transform rounded-xl bg-emerald-500 hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98]"
          >
            Firmar Contrato
          </button>
        </form>
      </div>
    </div>
  )
}
