import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function AuthScreen() {
  const [mode, setMode] = useState('splash') // splash, login, register
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleRegister = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    
    setLoading(true)
    try {
      const { user } = await authApi.register({ name, email, password })
      toast.success(`¡Bienvenido, ${user.name}!`)
      navigate('/create-manager')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { user } = await authApi.login({ email, password })
      toast.success(`Hola de nuevo, ${user.name}`)
      navigate('/game')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'splash') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="mb-2 text-5xl font-black text-emerald-500">DEL POTRERO</h1>
        <h2 className="mb-8 text-3xl font-black text-white">AL ÍDOLO</h2>
        <p className="mb-12 text-zinc-400">Modo carrera de DT</p>
        
        <div className="flex flex-col w-full max-w-sm gap-4">
          <button 
            onClick={() => setMode('register')}
            className="w-full py-4 font-bold text-black transition-transform rounded-xl bg-emerald-500 hover:bg-emerald-400 hover:scale-[1.02]"
          >
            Nueva Carrera
          </button>
          <button 
            onClick={() => setMode('login')}
            className="w-full py-4 font-bold transition-colors border text-zinc-300 border-zinc-700 rounded-xl bg-zinc-800 hover:bg-zinc-700"
          >
            Continuar Carrera
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-sm p-8 border border-zinc-800 rounded-2xl bg-zinc-900/50 backdrop-blur-sm">
        <h2 className="mb-6 text-2xl font-bold text-white">
          {mode === 'login' ? 'Iniciar Sesión' : 'Registro de DT'}
        </h2>
        
        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block mb-1 text-sm text-zinc-400">Nombre</label>
              <input 
                required 
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2 text-white border rounded-lg bg-zinc-950 border-zinc-700 focus:border-emerald-500 focus:outline-none" 
              />
            </div>
          )}
          
          <div>
            <label className="block mb-1 text-sm text-zinc-400">Email</label>
            <input 
              required 
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 text-white border rounded-lg bg-zinc-950 border-zinc-700 focus:border-emerald-500 focus:outline-none" 
            />
          </div>

          <div>
            <label className="block mb-1 text-sm text-zinc-400">Contraseña</label>
            <input 
              required 
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 text-white border rounded-lg bg-zinc-950 border-zinc-700 focus:border-emerald-500 focus:outline-none" 
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block mb-1 text-sm text-zinc-400">Confirmar Contraseña</label>
              <input 
                required 
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 text-white border rounded-lg bg-zinc-950 border-zinc-700 focus:border-emerald-500 focus:outline-none" 
              />
            </div>
          )}

          <button 
            disabled={loading}
            type="submit"
            className="flex items-center justify-center w-full py-3 mt-6 font-bold text-black rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === 'login' ? 'Entrar' : 'Registrarse')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-sm text-zinc-400 hover:text-emerald-400"
          >
            {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
          </button>
        </div>
        <div className="mt-2 text-center">
          <button 
            type="button"
            onClick={() => setMode('splash')}
            className="text-xs text-zinc-600 hover:text-zinc-400"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  )
}
