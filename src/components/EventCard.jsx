import { useGameStore } from '../store'
import { gameEvents } from '../data/events'
import { AlertTriangle } from 'lucide-react'

export default function EventCard() {
  const activeEventId = useGameStore(state => state.activeEvent)
  const resolveEvent = useGameStore(state => state.resolveEvent)
  
  const event = gameEvents.find(e => e.id === activeEventId)

  if (!event) return null

  const handleOption = (effects) => {
    resolveEvent(effects)
  }

  return (
    <div className="p-6 text-center border border-amber-900/50 rounded-2xl bg-amber-950/20">
      <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
      <h3 className="mb-2 text-xl font-bold text-amber-500">{event.title}</h3>
      <p className="mb-6 text-sm text-zinc-300">{event.description}</p>
      
      <div className="space-y-3">
        {event.options.map((opt, idx) => (
          <button 
            key={idx}
            onClick={() => handleOption(opt.effects)}
            className="w-full p-4 font-medium text-left border transition-colors rounded-xl border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:border-amber-500/50"
          >
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  )
}
