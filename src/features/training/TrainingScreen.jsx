import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Dumbbell, Activity, HeartPulse } from 'lucide-react'
import { toast } from 'sonner'
import { useGameContext } from '../../context/GameContext'
import BottomNav from '../../components/BottomNav'
import { supabase } from '../../api/supabase'

const FOCUS_OPTIONS = [
  { id: 'EQUILIBRADO', label: 'Equilibrado', desc: 'Desarrolla todas las estadísticas de forma moderada.' },
  { id: 'FISICO', label: 'Físico', desc: 'Aumenta el Ritmo y Potencia Física.' },
  { id: 'TECNICO', label: 'Técnico', desc: 'Mejora el control de balón y Pases.' },
  { id: 'TACTICO', label: 'Táctico', desc: 'Potencia la Defensa y Posicionamiento.' },
  { id: 'OFENSIVO', label: 'Ofensivo', desc: 'Incrementa Definición y Tiros a Puerta.' }
]

export default function TrainingScreen() {
  const navigate = useNavigate()
  const { club, manager, refreshContext, navItems } = useGameContext()

  const [intensity, setIntensity] = useState(club?.training_intensity || 50)
  const [focus, setFocus] = useState(club?.training_focus || 'EQUILIBRADO')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await supabase.from('clubs').update({ 
        training_intensity: intensity,
        training_focus: focus 
      }).eq('id', club.id)
      await refreshContext()
      toast.success('Plan de entrenamiento guardado.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8 text-white bg-zinc-950 pb-24 lg:pb-8">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 transition-colors border rounded-lg border-zinc-800 bg-zinc-900 hover:bg-zinc-800 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl md:text-3xl font-black flex items-center gap-2 text-emerald-500 truncate">
            <Dumbbell className="w-6 h-6 md:w-8 md:h-8 shrink-0" /> ENTRENAMIENTO
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 max-w-5xl mx-auto">
        <div className="space-y-6">
          <div className="p-6 border border-zinc-800 rounded-3xl bg-zinc-900/50">
            <h2 className="flex items-center gap-2 mb-6 font-bold text-white text-xl">
              <Activity className="w-5 h-5 text-emerald-500" /> Intensidad Global
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                La intensidad afecta directamente el desgaste físico y el riesgo de lesiones. A mayor intensidad, mayor será el crecimiento potencial semanal, pero también será mayor la fatiga.
              </p>
              <div className="flex justify-between items-center text-sm font-bold mt-4">
                <span className="text-zinc-500">Recuperación (0)</span>
                <span className="text-emerald-500">Intensidad: {intensity}%</span>
                <span className="text-red-500">Extremo (100)</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={intensity} 
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-full accent-emerald-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="p-6 border border-zinc-800 rounded-3xl bg-zinc-900/50">
            <h2 className="flex items-center gap-2 mb-6 font-bold text-white text-xl">
              <Dumbbell className="w-5 h-5 text-emerald-500" /> Foco de la Semana
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {FOCUS_OPTIONS.map(opt => (
                <div 
                  key={opt.id}
                  onClick={() => setFocus(opt.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${focus === opt.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'}`}
                >
                  <p className={`font-bold ${focus === opt.id ? 'text-emerald-400' : 'text-zinc-200'}`}>{opt.label}</p>
                  <p className="text-xs text-zinc-500 mt-1">{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full py-4 font-black text-black bg-emerald-500 rounded-2xl hover:bg-emerald-400 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Planificación'}
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-6 border border-red-900/50 rounded-3xl bg-red-900/10">
            <h2 className="flex items-center gap-2 mb-6 font-bold text-red-400 text-xl">
              <HeartPulse className="w-5 h-5" /> Riesgo Médico (Sanidad)
            </h2>
            <p className="text-sm text-zinc-300 mb-6">
              Los jugadores por debajo de 60% de condición física tienen una probabilidad drásticamente superior de lesionarse al entrenar o jugar.
            </p>

            <div className="p-4 border border-zinc-800 bg-zinc-950 rounded-xl space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Riesgo Base (por defecto)</span>
                <span className="font-bold">5% por semana</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Riesgo con Intensidad ({intensity}%)</span>
                <span className="font-bold text-yellow-400">{((intensity / 50) * 5).toFixed(1)}% por semana</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Si un jugador tiene {`<`} 60% Fitness</span>
                <span className="font-bold text-red-500">¡ALERTA ROJA!</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav navItems={navItems} manager={manager} />
    </div>
  )
}
