import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { managerApi } from '../../api/manager'
import { authApi } from '../../api/auth'
import { toast } from 'sonner'
import { Loader2, User, Activity, Brain, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react'

export default function CreateManagerWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  // Step 1: Identity
  const [identity, setIdentity] = useState({
    firstName: '',
    lastName: '',
    age: 35,
    nationality: 'Argentina',
    city: 'Buenos Aires',
    dominantFoot: 'Derecho'
  })

  // Step 2: Profile (Distribute points)
  // Max points: 30 to distribute, base is 10 for all. Max per attribute is 20 for now.
  const [pointsLeft, setPointsLeft] = useState(30)
  const [attributes, setAttributes] = useState({
    leadership: 10,
    tactics: 10,
    motivation: 10,
    management: 10,
    youth: 10,
    negotiation: 10,
    lockerRoom: 10
  })

  const handleAttributeChange = (attr, delta) => {
    const current = attributes[attr]
    if (delta > 0 && pointsLeft > 0 && current < 20) {
      setAttributes({ ...attributes, [attr]: current + 1 })
      setPointsLeft(pointsLeft - 1)
    } else if (delta < 0 && current > 10) {
      setAttributes({ ...attributes, [attr]: current - 1 })
      setPointsLeft(pointsLeft + 1)
    }
  }

  // Step 3: Philosophy
  const [philosophy, setPhilosophy] = useState('Equilibrado')
  const philosophies = [
    { id: 'Ofensivo', desc: 'Priorizar el ataque y la cantidad de llegadas.' },
    { id: 'Defensivo', desc: 'Armar el equipo de atrás hacia adelante.' },
    { id: 'Equilibrado', desc: 'No tomar riesgos innecesarios.' },
    { id: 'Posesión', desc: 'Tener la pelota para controlar el juego.' },
    { id: 'Contraataque', desc: 'Esperar agazapado y salir rápido.' },
    { id: 'Desarrollo juvenil', desc: 'Apostar siempre por los pibes del club.' }
  ]

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('dt_token')
      const currentUser = await authApi.getSession(token)
      if (!currentUser) {
        navigate('/auth')
      } else {
        setUser(currentUser)
        // Auto-fill names if empty
        const names = currentUser.name.split(' ')
        setIdentity(prev => ({
          ...prev,
          firstName: names[0] || '',
          lastName: names.slice(1).join(' ') || ''
        }))
      }
    }
    checkAuth()
  }, [navigate])

  const handleCreate = async () => {
    setLoading(true)
    try {
      await managerApi.createManager(user.id, {
        identity,
        attributes,
        philosophy
      })
      toast.success('¡Perfil de DT creado exitosamente!')
      // In phase 3 we go to club creation, for now go to dashboard/game
      navigate('/game')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {[1, 2, 3, 4].map(s => (
        <div key={s} className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${step >= s ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
            {s}
          </div>
          {s < 4 && (
            <div className={`w-8 sm:w-16 h-1 mx-2 ${step > s ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col items-center min-h-screen p-4 py-12">
      <div className="w-full max-w-2xl p-8 border border-zinc-800 rounded-3xl bg-zinc-900/50 backdrop-blur-md">
        <h1 className="mb-2 text-3xl font-black text-white">Creación de DT</h1>
        <p className="mb-8 text-zinc-400">Forja tu identidad en el banquillo.</p>
        
        <StepIndicator />

        {/* STEP 1: IDENTITY */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h2 className="flex items-center gap-2 mb-4 text-xl font-bold text-emerald-400">
              <User className="w-5 h-5" /> Identidad
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm text-zinc-400">Nombre</label>
                <input type="text" value={identity.firstName} onChange={e => setIdentity({...identity, firstName: e.target.value})} className="w-full px-4 py-2 text-white border rounded-lg bg-zinc-950 border-zinc-700 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block mb-1 text-sm text-zinc-400">Apellido</label>
                <input type="text" value={identity.lastName} onChange={e => setIdentity({...identity, lastName: e.target.value})} className="w-full px-4 py-2 text-white border rounded-lg bg-zinc-950 border-zinc-700 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block mb-1 text-sm text-zinc-400">Edad</label>
                <input type="number" min="25" max="80" value={identity.age} onChange={e => setIdentity({...identity, age: parseInt(e.target.value)})} className="w-full px-4 py-2 text-white border rounded-lg bg-zinc-950 border-zinc-700 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block mb-1 text-sm text-zinc-400">Pie Dominante</label>
                <select value={identity.dominantFoot} onChange={e => setIdentity({...identity, dominantFoot: e.target.value})} className="w-full px-4 py-2 text-white border rounded-lg bg-zinc-950 border-zinc-700 focus:border-emerald-500 focus:outline-none">
                  <option>Derecho</option>
                  <option>Izquierdo</option>
                  <option>Ambidiestro</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm text-zinc-400">Nacionalidad</label>
                <input type="text" value={identity.nationality} onChange={e => setIdentity({...identity, nationality: e.target.value})} className="w-full px-4 py-2 text-white border rounded-lg bg-zinc-950 border-zinc-700 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block mb-1 text-sm text-zinc-400">Ciudad</label>
                <input type="text" value={identity.city} onChange={e => setIdentity({...identity, city: e.target.value})} className="w-full px-4 py-2 text-white border rounded-lg bg-zinc-950 border-zinc-700 focus:border-emerald-500 focus:outline-none" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PROFILE */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h2 className="flex items-center gap-2 mb-4 text-xl font-bold text-emerald-400">
              <Activity className="w-5 h-5" /> Perfil y Atributos
            </h2>
            <p className="mb-4 text-sm text-zinc-400">
              Puntos disponibles: <span className="font-bold text-emerald-500">{pointsLeft}</span>
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Object.entries(attributes).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded-xl bg-zinc-950 border-zinc-800">
                  <span className="text-sm font-medium text-zinc-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleAttributeChange(key, -1)} disabled={val <= 10} className="w-8 h-8 font-bold rounded-lg bg-zinc-800 text-zinc-400 disabled:opacity-50 hover:bg-zinc-700">-</button>
                    <span className="w-6 text-center text-white">{val}</span>
                    <button onClick={() => handleAttributeChange(key, 1)} disabled={val >= 20 || pointsLeft === 0} className="w-8 h-8 font-bold rounded-lg bg-zinc-800 text-zinc-400 disabled:opacity-50 hover:bg-zinc-700">+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: PHILOSOPHY */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h2 className="flex items-center gap-2 mb-4 text-xl font-bold text-emerald-400">
              <Brain className="w-5 h-5" /> Filosofía de Juego
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {philosophies.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPhilosophy(p.id)}
                  className={`p-4 text-left border rounded-xl transition-all ${philosophy === p.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}
                >
                  <h3 className={`font-bold ${philosophy === p.id ? 'text-emerald-400' : 'text-zinc-200'}`}>{p.id}</h3>
                  <p className="mt-1 text-xs text-zinc-500">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: CONFIRMATION */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="flex items-center gap-2 mb-4 text-xl font-bold text-emerald-400">
              <CheckCircle className="w-5 h-5" /> Confirmación
            </h2>
            
            <div className="p-6 border border-emerald-900/50 bg-emerald-950/20 rounded-2xl">
              <h3 className="mb-1 text-2xl font-black text-white">{identity.firstName} {identity.lastName}</h3>
              <p className="text-sm text-zinc-400">{identity.age} años • {identity.nationality} • {identity.city}</p>
              
              <div className="my-4 border-t border-zinc-800" />
              
              <p className="mb-2 text-sm text-zinc-300">
                <span className="text-emerald-500">Filosofía:</span> {philosophy}
              </p>
              
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                {Object.entries(attributes).map(([key, val]) => (
                  <div key={key} className="flex justify-between p-2 rounded bg-zinc-900">
                    <span className="text-zinc-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-bold text-emerald-400">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* NAVIGATION BUTTONS */}
        <div className="flex justify-between mt-10">
          {step > 1 ? (
            <button 
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 px-6 py-3 font-bold transition-colors border text-zinc-300 border-zinc-700 rounded-xl hover:bg-zinc-800"
            >
              <ChevronLeft className="w-4 h-4" /> Atrás
            </button>
          ) : <div />}
          
          {step < 4 ? (
            <button 
              onClick={() => {
                if (step === 1 && (!identity.firstName || !identity.lastName)) {
                  toast.error('Completa tu nombre y apellido')
                  return
                }
                setStep(step + 1)
              }}
              className="flex items-center gap-2 px-6 py-3 font-bold text-black transition-transform bg-emerald-500 rounded-xl hover:bg-emerald-400 hover:scale-105"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleCreate}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 font-bold text-black transition-transform bg-emerald-500 rounded-xl hover:bg-emerald-400 hover:scale-105 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Firmar y Comenzar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
