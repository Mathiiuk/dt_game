import { useGameStore } from '../store'
import { Briefcase, Activity, Megaphone } from 'lucide-react'
import EventCard from './EventCard'
import { gameEvents } from '../data/events'

export default function PlayScreen() {
  const state = useGameStore()
  const advanceWeek = useGameStore(state => state.advanceWeek)
  const updateStat = useGameStore(state => state.updateStat)
  const setActiveEvent = useGameStore(state => state.setActiveEvent)

  // Temporal simulation logic for v0.1
  const simulateMatch = (tactic) => {
    const result = Math.random()
    if (result > 0.6) {
      updateStat('board', 10)
      updateStat('fans', 15)
      updateStat('squad', 5)
    } else if (result > 0.3) {
      updateStat('board', -5)
      updateStat('fans', -5)
    } else {
      updateStat('board', -15)
      updateStat('fans', -10)
      updateStat('squad', -10)
    }
    
    // 40% chance of an event happening after a match
    if (Math.random() < 0.4) {
      const randomEvent = gameEvents[Math.floor(Math.random() * gameEvents.length)]
      setActiveEvent(randomEvent.id)
    }
    
    advanceWeek()
  }

  const StatBar = ({ label, value, icon: Icon, colorClass }) => (
    <div className="flex items-center gap-3">
      <Icon className={`w-5 h-5 ${colorClass}`} />
      <div className="flex-1">
        <div className="flex justify-between mb-1 text-xs">
          <span className="text-zinc-400">{label}</span>
          <span className="font-bold text-zinc-200">{value}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-zinc-800">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${colorClass.replace('text-', 'bg-')}`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen p-4 max-w-md mx-auto">
      {/* Header Info */}
      <header className="mb-6">
        <h2 className="text-xl font-bold text-white">{state.managerName}</h2>
        <p className="text-sm text-emerald-400">{state.club} • Div {state.division}</p>
        <p className="text-xs text-zinc-500">Temporada {state.year} • Semana {state.week}/4</p>
      </header>

      {/* Stats Cards */}
      <section className="p-4 mb-6 border border-zinc-800 rounded-2xl bg-zinc-900/50">
        <div className="space-y-4">
          <StatBar label="Directiva" value={state.stats.board} icon={Briefcase} colorClass="text-blue-400" />
          <StatBar label="Vestuario" value={state.stats.squad} icon={Activity} colorClass="text-emerald-400" />
          <StatBar label="Hinchada" value={state.stats.fans} icon={Megaphone} colorClass="text-rose-400" />
        </div>
      </section>

      {/* Action Area (Event or Match) */}
      <main className="flex-1">
        {state.activeEvent ? (
          <EventCard />
        ) : (
          <div className="p-6 text-center border border-zinc-800 rounded-2xl bg-zinc-900">
            <h3 className="mb-2 text-lg font-bold text-white">Día de Partido</h3>
            <p className="mb-6 text-sm text-zinc-400">Elige tu planteo táctico para el próximo encuentro.</p>
            
            <div className="space-y-3">
              <button 
                onClick={() => simulateMatch('Juego Ofensivo')}
                className="w-full p-4 font-medium text-left border transition-colors rounded-xl border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
              >
                ⚔️ Salir a atacar
              </button>
              <button 
                onClick={() => simulateMatch('Equilibrio')}
                className="w-full p-4 font-medium text-left border transition-colors rounded-xl border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
              >
                ⚖️ Juego equilibrado
              </button>
              <button 
                onClick={() => simulateMatch('Defensivo')}
                className="w-full p-4 font-medium text-left border transition-colors rounded-xl border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
              >
                🛡️ Defender el cero
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
