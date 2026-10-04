import React, { useState, useEffect } from 'react'
import { 
  Mic, 
  X, 
  Calendar, 
  Award, 
  MessageSquare, 
  Radio, 
  Newspaper,
  CheckCircle2,
  Clock
} from 'lucide-react'
import { pressApi } from '../../../api/press'
import { toast } from 'sonner'

export default function PressRoomModal({ club, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!club?.id) return
    const load = async () => {
      try {
        setLoading(true)
        const data = await pressApi.getConferenceHistory(club.id)
        setHistory(data)
      } catch (e) {
        console.error(e)
        toast.error('Error cargando hemeroteca de prensa')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [club?.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Mic className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Sala de Prensa & Hemeroteca</h2>
              <p className="text-xs text-zinc-400">Archivo histórico de declaraciones y ruedas de prensa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
              <Mic className="w-8 h-8 animate-pulse text-amber-400 mb-2" />
              <p className="text-sm font-medium">Consultando archivo de declaraciones...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-zinc-800 rounded-2xl">
              <Newspaper className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-300">Aún no hay conferencias archivadas</p>
              <p className="text-xs text-zinc-500 mt-1">
                A medida que disputes partidos oficiales y respondas a los cronistas, tus declaraciones quedarán registradas aquí.
              </p>
            </div>
          ) : (
            history.map((conf) => (
              <div 
                key={conf.id} 
                className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800/60 pb-2">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    {new Date(conf.completed_at || conf.created_at).toLocaleDateString()}
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {conf.delegated_to_assistant ? 'Delegada en 2º DT' : 'Atendida por el DT'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {(conf.press_qa_items || []).map((qa) => (
                    <div key={qa.id} className="text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span className="font-medium text-zinc-400">{qa.media_outlet} • {qa.journalist_name}</span>
                        <span className="font-mono text-amber-400 uppercase font-bold">{qa.chosen_tone || 'DECLARACIÓN'}</span>
                      </div>
                      <p className="font-medium text-zinc-200 italic">"{qa.question_text}"</p>
                      <p className="text-zinc-400 pl-3 border-l-2 border-emerald-500/50 text-[11px]">
                        "{qa.manager_answer_text || 'Sin respuesta registrada'}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
