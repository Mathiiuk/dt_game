import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { financesApi } from '../../api/finances'
import { useGameContext } from '../../context/GameContext'
import { 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Building, 
  ShieldPlus, 
  ShoppingBag,
  Ticket,
  Receipt,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Sliders,
  Check,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'
import { queryCache } from '../../utils/cache'

const FACILITY_NAMES = {
  stadium_level: 'Tribunas del Estadio',
  medical_level: 'Centro Médico',
  store_level: 'Tienda Oficial'
}

export default function FinancesScreen() {
  const navigate = useNavigate()
  const { club: contextClub, confirmAction, refreshContext } = useGameContext()

  const cachedFinances = contextClub?.id ? queryCache.get(`finances:${contextClub.id}`) : null
  const [loading, setLoading] = useState(!cachedFinances)
  const [finances, setFinances] = useState(cachedFinances || null)
  const [transactions, setTransactions] = useState([])
  const [activeTab, setActiveTab] = useState('balance') // 'balance' | 'ledger' | 'facilities'
  const [ticketPrice, setTicketPrice] = useState(10)
  const [updatingTicket, setUpdatingTicket] = useState(false)

  const loadData = async () => {
    try {
      if (!contextClub?.id) return
      const [fin, txs] = await Promise.all([
        financesApi.getFinances(contextClub.id),
        financesApi.getLedgerTransactions(contextClub.id, 25)
      ])
      setFinances(fin)
      setTransactions(txs)
      setTicketPrice(fin?.ticketPrice || 10)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!contextClub?.id) return
    loadData()
  }, [contextClub?.id])

  const handleUpdateTicketPrice = async (newPrice) => {
    try {
      setUpdatingTicket(true)
      await financesApi.updateTicketPrice(contextClub.id, newPrice)
      toast.success(`Precio de la entrada fijado en $${newPrice.toFixed(2)}`)
      setTicketPrice(newPrice)
      loadData()
      if (typeof refreshContext === 'function') await refreshContext()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setUpdatingTicket(false)
    }
  }

  const handleUpgrade = async (facility, currentLevel, cost) => {
    const facilityName = FACILITY_NAMES[facility] || facility
    const confirmed = await confirmAction({
      title: `Mejorar ${facilityName}`,
      description: `¿Confirmas la inversión de $${cost.toLocaleString()} para mejorar ${facilityName} al nivel ${currentLevel + 1}?`,
      confirmText: 'Invertir y Mejorar',
      cancelText: 'Cancelar',
      variant: 'primary'
    })
    if (!confirmed) return

    try {
      await financesApi.upgradeFacility(contextClub.id, facility, cost, currentLevel)
      toast.success(`${facilityName} mejorada con éxito`)
      if (typeof refreshContext === 'function') await refreshContext()
      loadData()
    } catch (e) {
      toast.error(e.message)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white gap-3 p-4">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-emerald-400 font-medium text-sm animate-pulse">Analizando finanzas del club...</p>
      </div>
    )
  }

  const f = finances
  const isProfitable = (f?.netWeeklyFlow || 0) >= 0

  return (
    <div className="min-h-screen px-3 sm:px-6 md:px-8 py-4 sm:py-6 text-white bg-zinc-950 pb-28 md:pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="p-2 transition-colors border rounded-xl border-zinc-800 bg-zinc-900 hover:bg-zinc-800 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black flex items-center gap-2 text-emerald-500 leading-tight">
              <DollarSign className="w-6 h-6 md:w-8 md:h-8 shrink-0 text-emerald-500" /> FINANZAS & ECONOMÍA
            </h1>
            <p className="text-xs text-zinc-400">Balance contable, flujo semanal de caja e infraestructura</p>
          </div>
        </div>

        {/* Estado de Salud Financiera */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-zinc-900/80 border-zinc-800 self-start sm:self-auto">
          {f?.healthStatus === 'HEALTHY' ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          )}
          <span className="text-xs font-bold text-zinc-200">
            {f?.healthStatus === 'HEALTHY' ? 'Finanzas Saludables' : f?.healthStatus === 'CAUTION' ? 'Alerta de Liquidez' : 'Déficit Crítico'}
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setActiveTab('balance')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'balance' 
              ? 'bg-emerald-500 text-black border-emerald-500 shadow-sm' 
              : 'bg-zinc-900 text-zinc-400 border-zinc-800'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Flujo Semanal</span>
        </button>
        <button
          onClick={() => setActiveTab('facilities')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'facilities' 
              ? 'bg-emerald-500 text-black border-emerald-500 shadow-sm' 
              : 'bg-zinc-900 text-zinc-400 border-zinc-800'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Instalaciones</span>
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'ledger' 
              ? 'bg-emerald-500 text-black border-emerald-500 shadow-sm' 
              : 'bg-zinc-900 text-zinc-400 border-zinc-800'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Libro Mayor</span>
        </button>
      </div>

      {/* TAB 1: FLUJO SEMANAL & BALANCE */}
      {activeTab === 'balance' && (
        <div className="space-y-5">
          {/* Tarjetas Principales */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 sm:p-5 border rounded-2xl bg-zinc-900/60 border-zinc-800">
              <span className="text-zinc-500 font-semibold text-xs block mb-1">Caja (Dinero en Tesorería)</span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                ${Number(f?.balance || 0).toLocaleString()}
              </p>
              <span className="text-[10px] text-zinc-400 block mt-1">Saldo bancario líquido</span>
            </div>

            <div className="p-4 sm:p-5 border rounded-2xl bg-zinc-900/60 border-zinc-800">
              <span className="text-zinc-500 font-semibold text-xs block mb-1">Flujo Neto Semanal</span>
              <div className="flex items-center gap-2">
                {isProfitable ? (
                  <TrendingUp className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500 shrink-0" />
                )}
                <p className={`text-2xl sm:text-3xl font-black font-mono ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isProfitable ? '+' : ''}${Number(f?.netWeeklyFlow || 0).toLocaleString()}
                </p>
              </div>
              <span className="text-[10px] text-zinc-400 block mt-1">Estimación entre fechas de liga</span>
            </div>

            <div className="p-4 sm:p-5 border rounded-2xl bg-zinc-900/60 border-zinc-800">
              <span className="text-zinc-500 font-semibold text-xs block mb-1">Respaldo de Liquidez</span>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400 shrink-0" />
                <p className="text-lg sm:text-xl font-bold text-blue-400 font-mono">
                  {f?.liquidityWeeks}
                </p>
              </div>
              <span className="text-[10px] text-zinc-400 block mt-1">Autonomía sin ingresos extras</span>
            </div>
          </div>

          {/* Desglose de Ingresos y Gastos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ingresos Recurrentes */}
            <div className="p-4 sm:p-5 border rounded-2xl bg-emerald-950/10 border-emerald-900/30">
              <h3 className="font-bold text-emerald-400 mb-3 border-b border-emerald-900/30 pb-2 text-sm flex items-center justify-between">
                <span>Ingresos Recurrentes Semanales</span>
                <span className="text-xs font-mono font-black">+${Number(f?.income?.totalRecurring || 0).toLocaleString()}</span>
              </h3>
              <ul className="space-y-2.5 text-xs">
                <li className="flex justify-between py-1 border-b border-zinc-900">
                  <span className="text-zinc-400">Cuotas de Socios</span>
                  <span className="font-mono font-bold text-zinc-200">+${Number(f?.income?.membersIncome || 0).toLocaleString()}</span>
                </li>
                <li className="flex justify-between py-1 border-b border-zinc-900">
                  <span className="text-zinc-400">Patrocinador Principal</span>
                  <span className="font-mono font-bold text-zinc-200">+${Number(f?.income?.sponsorsIncome || 0).toLocaleString()}</span>
                </li>
                <li className="flex justify-between py-1 border-b border-zinc-900">
                  <span className="text-zinc-400">Derechos de Televisación Local</span>
                  <span className="font-mono font-bold text-zinc-200">+${Number(f?.income?.tvIncome || 0).toLocaleString()}</span>
                </li>
                <li className="flex justify-between py-1 border-b border-zinc-900">
                  <span className="text-zinc-400">Tienda y Merchandising</span>
                  <span className="font-mono font-bold text-zinc-200">+${Number(f?.income?.storeIncome || 0).toLocaleString()}</span>
                </li>
                <li className="flex justify-between py-1 pt-2 bg-emerald-500/5 px-2 rounded-lg">
                  <span className="text-emerald-300 font-semibold">Taquilla Estimada (Partido Local)</span>
                  <span className="font-mono font-bold text-emerald-400">+${Number(f?.income?.projectedMatchdayGate || 0).toLocaleString()}</span>
                </li>
              </ul>
            </div>

            {/* Gastos Operativos */}
            <div className="p-4 sm:p-5 border rounded-2xl bg-red-950/10 border-red-900/30">
              <h3 className="font-bold text-red-400 mb-3 border-b border-red-900/30 pb-2 text-sm flex items-center justify-between">
                <span>Gastos Fijos Semanales</span>
                <span className="text-xs font-mono font-black">-${Number(f?.expenses?.total || 0).toLocaleString()}</span>
              </h3>
              <ul className="space-y-2.5 text-xs">
                <li className="flex justify-between py-1 border-b border-zinc-900">
                  <span className="text-zinc-400">Nómina del Primer Plantel</span>
                  <span className="font-mono font-bold text-zinc-200">-${Number(f?.expenses?.playerWages || 0).toLocaleString()}</span>
                </li>
                <li className="flex justify-between py-1 border-b border-zinc-900">
                  <span className="text-zinc-400">Sueldos del Cuerpo Técnico</span>
                  <span className="font-mono font-bold text-zinc-200">-${Number(f?.expenses?.staffWages || 0).toLocaleString()}</span>
                </li>
                <li className="flex justify-between py-1 border-b border-zinc-900">
                  <span className="text-zinc-400">Mantenimiento del Estadio</span>
                  <span className="font-mono font-bold text-zinc-200">-${Number(f?.expenses?.stadiumMaint || 0).toLocaleString()}</span>
                </li>
                <li className="flex justify-between py-1 border-b border-zinc-900">
                  <span className="text-zinc-400">Mantenimiento de Cantera</span>
                  <span className="font-mono font-bold text-zinc-200">-${Number(f?.expenses?.academyMaint || 0).toLocaleString()}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Configuración de Taquilla y Entradas */}
          <div className="p-4 sm:p-5 border rounded-2xl bg-zinc-900/50 border-zinc-800 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Política de Entradas y Taquilla</h4>
                  <p className="text-[11px] text-zinc-400">Regula el precio general de la entrada ($5 a $25 USD)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Precio actual:</span>
                <span className="text-base font-black text-amber-400 font-mono">${ticketPrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 pt-2">
              {[6, 8, 10, 14, 18].map(price => (
                <button
                  key={price}
                  disabled={updatingTicket}
                  onClick={() => handleUpdateTicketPrice(price)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    Math.abs(ticketPrice - price) < 0.1
                      ? 'bg-amber-400 text-black border-amber-400 shadow-sm'
                      : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  ${price}.00
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INSTALACIONES Y MEJORAS */}
      {activeTab === 'facilities' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Estadio */}
          <div className="p-4 sm:p-5 border rounded-2xl bg-zinc-900/50 border-zinc-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{contextClub?.stadium_name || 'Estadio del Club'}</h3>
                  <p className="text-[11px] text-zinc-400">Nivel {contextClub?.stadium_level || 1} • Capacidad: {Number(contextClub?.stadium_capacity || 1000).toLocaleString()}</p>
                </div>
              </div>
              <p className="text-xs text-zinc-400 mb-4">
                Amplía las tribunas populares para aumentar la taquilla y los ingresos en días de partido como local.
              </p>
            </div>
            <button 
              onClick={() => handleUpgrade('stadium_level', contextClub?.stadium_level || 1, (contextClub?.stadium_level || 1) * 35000)}
              className="w-full py-2.5 text-xs font-bold bg-blue-500 text-white rounded-xl hover:bg-blue-400 transition-colors"
            >
              Ampliar Tribunas (-${((contextClub?.stadium_level || 1) * 35000).toLocaleString()})
            </button>
          </div>

          {/* Centro Médico */}
          <div className="p-4 sm:p-5 border rounded-2xl bg-zinc-900/50 border-zinc-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                  <ShieldPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Centro Médico y Kinesiología</h3>
                  <p className="text-[11px] text-zinc-400">Nivel {contextClub?.medical_level || 1} • Recuperación pasiva</p>
                </div>
              </div>
              <p className="text-xs text-zinc-400 mb-4">
                Instalaciones de rehabilitación que reducen las recaídas y acortan el tiempo de baja por lesión.
              </p>
            </div>
            <button 
              onClick={() => handleUpgrade('medical_level', contextClub?.medical_level || 1, (contextClub?.medical_level || 1) * 20000)}
              className="w-full py-2.5 text-xs font-bold bg-red-500 text-white rounded-xl hover:bg-red-400 transition-colors"
            >
              Mejorar Equipamiento (-${((contextClub?.medical_level || 1) * 20000).toLocaleString()})
            </button>
          </div>

          {/* Tienda Oficial */}
          <div className="p-4 sm:p-5 border rounded-2xl bg-zinc-900/50 border-zinc-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Tienda Oficial y Merchandising</h3>
                  <p className="text-[11px] text-zinc-400">Nivel {contextClub?.store_level || 1} • +${(contextClub?.store_level || 1) * 350}/sem</p>
                </div>
              </div>
              <p className="text-xs text-zinc-400 mb-4">
                Venta de camisetas, bufandas y accesorios del club para incrementar ingresos comerciales semanales.
              </p>
            </div>
            <button 
              onClick={() => handleUpgrade('store_level', contextClub?.store_level || 1, (contextClub?.store_level || 1) * 12000)}
              className="w-full py-2.5 text-xs font-bold bg-amber-400 text-black rounded-xl hover:bg-amber-300 transition-colors"
            >
              Expandir Tienda (-${((contextClub?.store_level || 1) * 12000).toLocaleString()})
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: LIBRO MAYOR CONTABLE */}
      {activeTab === 'ledger' && (
        <div className="p-4 sm:p-5 border rounded-2xl bg-zinc-900/50 border-zinc-800 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Libro Mayor Contable</span>
              </h3>
              <p className="text-[11px] text-zinc-400">Registro inmutable de movimientos financieros</p>
            </div>
            <span className="text-xs text-zinc-500">{transactions.length} registros</span>
          </div>

          {transactions.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-zinc-800 rounded-xl">
              <p className="text-xs text-zinc-500">No hay movimientos contables registrados aún.</p>
              <p className="text-[11px] text-zinc-600 mt-1">Los débitos y créditos se anotan durante los avances semanales y traspasos.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 uppercase text-[10px] tracking-wider">
                    <th className="pb-2.5 font-semibold">Semana</th>
                    <th className="pb-2.5 font-semibold">Descripción</th>
                    <th className="pb-2.5 font-semibold text-right">Monto</th>
                    <th className="pb-2.5 font-semibold text-right">Saldo Tras Operación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {transactions.map(tx => {
                    const isIncome = Number(tx.amount) >= 0
                    return (
                      <tr key={tx.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-2.5 text-zinc-400 font-mono">Sem {tx.week_number}</td>
                        <td className="py-2.5 font-medium text-white">{tx.description}</td>
                        <td className={`py-2.5 text-right font-mono font-bold ${isIncome ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isIncome ? '+' : ''}${Number(tx.amount).toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right font-mono text-zinc-300">
                          ${Number(tx.balance_after).toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
