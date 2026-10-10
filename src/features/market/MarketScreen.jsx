import React, { useEffect, useMemo, useState } from 'react'
import { Eye, Handshake, Lock, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { marketApi } from '../../api/market'
import { scoutingApi } from '../../api/scouting'
import { buybackApi } from '../../api/buyback'
import { supabase } from '../../api/supabase'
import { useGameContext } from '../../context/GameContext'
import { formatMoney } from '../../lib/format'
import {
  MARKET_SORT_OPTIONS,
  SCOUT_COST,
  filterMarketPlayers,
  marketPrice,
  sortMarketPlayers
} from '../../domain/market'
import {
  Badge, Button, Card, CardBody, PageHeader, Skeleton
} from '../../components/ui'
import OfferModal from './OfferModal'
import MarketHeader from './MarketHeader'
import MarketFilterBar from './MarketFilterBar'
import MarketPlayerCard from './MarketPlayerCard'
import MarketEmptyState from './MarketEmptyState'
import MarketHistory from './MarketHistory'
import { friendlyError } from '../../lib/errors'
import { financesApi } from '../../api/finances'
import { climateApi } from '../../api/climate'
import { purchaseWarning, financeSafetyWarning } from '../../domain/warnings'
import { askRisk } from '../../lib/risk'
import { playerDemands } from '../../domain/contractDemands'

export default function MarketScreen() {
  const { club, loading: contextLoading, refreshContext, confirmAction, confirmRisk } = useGameContext()
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState([])
  const [marketStatus, setMarketStatus] = useState(null)

  const [group, setGroup] = useState('ALL')
  const [activeChip, setActiveChip] = useState('ALL')
  const [query, setQuery] = useState('')
  const [minPace, setMinPace] = useState('')
  const [sortKey, setSortKey] = useState('overall')

  const [ownSquad, setOwnSquad] = useState([])
  const [rights, setRights] = useState([])
  const [offerPlayer, setOfferPlayer] = useState(null)
  const [wageInfo, setWageInfo] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [wageBudgetWeekly, setWageBudgetWeekly] = useState(0)
  const [currentPayroll, setCurrentPayroll] = useState(0)
  const [history, setHistory] = useState([])

  const budget = Number(club?.budget || 0)

  const loadData = async () => {
    try {
      if (!club?.id) return
      // Mercado, informes de ojeo, plantel propio y derechos de recompra no dependen entre sí: se piden a la vez
      const [list, { data: scouted }, { data: mine }, rightsList] = await Promise.all([
        marketApi.getMarketPlayers(club.id, { gameDate: club.game_date }),
        supabase.from('scout_reports').select('*').eq('club_id', club.id),
        supabase.from('players').select('position, attr_overall, last_name, first_name').eq('club_id', club.id),
        buybackApi.getRights(club.id).catch(() => [])
      ])
      setMarketStatus(marketApi.getMarketStatus(club.game_date))
      setOwnSquad(mine || [])
      setRights(rightsList)
      const reports = new Map((scouted || []).map(s => [s.player_id, s]))

      setPlayers(list.map(p => {
        const report = reports.get(p.id)
        return { ...p, scout_level: report ? (report.knowledge_level ?? report.level ?? 1) : 0 }
      }))

      // Intentar cargar masa salarial de forma segura sin bloquear si finances no está mockeado
      if (typeof financesApi?.getFinances === 'function') {
        financesApi.getFinances(club.id)
          .then(finances => {
            if (finances) {
              setWageBudgetWeekly(Number(finances.wageBudgetWeekly || 0))
              setCurrentPayroll(Number(finances.expenses?.playerWages || 0) + Number(finances.expenses?.staffWages || 0))
            }
          })
          .catch(() => {})
      }
    } catch (e) {
      toast.error(friendlyError(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (contextLoading || !club) return
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextLoading, club?.id])

  // Filtrado y ordenamiento de jugadores
  const visible = useMemo(() => {
    const baseFiltered = filterMarketPlayers(players, {
      group,
      query,
      minPace,
      budget,
      onlyAffordable: activeChip === 'AFFORDABLE'
    })

    const chipFiltered = baseFiltered.filter(p => {
      if (activeChip === 'FREE') {
        return !p.clubs || p.asking_price === 0
      }
      if (activeChip === 'BARGAINS') {
        const pPrice = marketPrice(p)
        return pPrice <= 15000 || (pPrice <= 30000 && (p.attr_overall || 50) >= 60)
      }
      if (activeChip === 'PROSPECTS') {
        return Number(p.age || 25) <= 21
      }
      return true
    })

    return sortMarketPlayers(chipFiltered, sortKey)
  }, [players, group, activeChip, query, minPace, budget, sortKey])

  const hasFilters = group !== 'ALL' || activeChip !== 'ALL' || query || minPace
  const clearFilters = () => {
    setGroup('ALL')
    setActiveChip('ALL')
    setQuery('')
    setMinPace('')
  }

  const isOpen = !!marketStatus?.isOpen

  const handleScout = async (p) => {
    const proceed = await askRisk(confirmRisk, async () => {
      const finances = await financesApi.getFinances(club.id)
      return financeSafetyWarning({
        cost: SCOUT_COST,
        balance: finances.balance,
        expectedWeeklyFlow: finances.expectedWeeklyFlow,
        gameDate: club.game_date
      })
    })
    if (!proceed) return

    const confirmed = await confirmAction({
      title: `Ojear a ${p.first_name} ${p.last_name}`,
      description: `Un ojeador elaborará un informe completo: revela atributos, potencial y cotización por ${formatMoney(SCOUT_COST)}.`,
      confirmText: `Enviar ojeador (${formatMoney(SCOUT_COST)})`,
      cancelText: 'Cancelar',
      variant: 'primary'
    })
    if (!confirmed) return
    try {
      await scoutingApi.scoutPlayer(club.id, p.id, 'FULL')
      toast.success(`Informe completado para ${p.last_name}`)
      if (typeof refreshContext === 'function') await refreshContext()
      loadData()
    } catch (e) {
      toast.error(friendlyError(e))
    }
  }

  const handleBuyback = async (right) => {
    const name = `${right.players?.first_name || ''} ${right.players?.last_name || ''}`.trim()

    const proceed = await askRisk(confirmRisk, async () => {
      const finances = await financesApi.getFinances(club.id)
      return financeSafetyWarning({
        cost: Number(right.price),
        balance: finances.balance,
        expectedWeeklyFlow: finances.expectedWeeklyFlow,
        gameDate: club.game_date
      })
    })
    if (!proceed) return

    const confirmed = await confirmAction({
      title: `Recomprar a ${name}`,
      description: `Ejercés la cláusula de recompra: pagás ${formatMoney(right.price)} y el jugador vuelve a tu plantel.`,
      confirmText: `Recomprar (${formatMoney(right.price)})`,
      cancelText: 'Cancelar',
      variant: 'primary'
    })
    if (!confirmed) return
    try {
      await buybackApi.exercise(club.id, right.id)
      toast.success(`${name} volvió al club.`)
      if (typeof refreshContext === 'function') await refreshContext()
      loadData()
    } catch (e) {
      toast.error(friendlyError(e))
    }
  }

  const openOffer = async (player) => {
    setOfferPlayer(player)
    setWageInfo(null)
    try {
      const finances = await financesApi.getFinances(club.id)
      const demands = playerDemands(player)
      setWageInfo({
        newWage: demands.expectedWage,
        years: Math.max(2, demands.desiredYears),
        payroll: Number(finances?.expenses?.playerWages || 0) + Number(finances?.expenses?.staffWages || 0),
        budget: Number(finances?.wageBudgetWeekly || 0)
      })
    } catch {
      // Sin la masa salarial se negocia igual
    }
  }

  const handleSubmitOffer = async (amount, installments) => {
    try {
      setSubmitting(true)
      const proceed = await askRisk(confirmRisk, async () => {
        const finances = await financesApi.getFinances(club.id)
        const safety = financeSafetyWarning({
          cost: amount,
          balance: finances.balance,
          expectedWeeklyFlow: finances.expectedWeeklyFlow,
          gameDate: club.game_date
        })
        if (safety) return safety
        return purchaseWarning({
          fee: amount,
          marketValue: Math.round((offerPlayer.asking_price || offerPlayer.market_value || marketApi.calculateMarketValue(offerPlayer)) * (installments === 3 ? 1.08 : 1)),
          balance: Number(club.budget || 0),
          weeklyExpenses: finances?.expenses?.total || 0,
          installments,
          wageOverBudget: Boolean(wageInfo && wageInfo.budget > 0 && wageInfo.payroll + wageInfo.newWage > wageInfo.budget)
        }, climateApi.difficulty)
      })
      if (!proceed) return null

      const reply = await marketApi.negotiate(club.id, offerPlayer.id, amount, installments, club.manager_id)

      if (reply.status === 'ACCEPTED') {
        toast.success(`¡Acuerdo cerrado! ${offerPlayer.last_name} es nuevo jugador del club por ${formatMoney(reply.price)}.`)
        setHistory(prev => [
          {
            id: Date.now(),
            playerName: `${offerPlayer.first_name} ${offerPlayer.last_name}`,
            position: offerPlayer.position,
            clubName: offerPlayer.clubs?.name,
            status: 'ACCEPTED',
            price: reply.price
          },
          ...prev.slice(0, 4)
        ])
        if (typeof refreshContext === 'function') await refreshContext()
        loadData()
      } else if (reply.status === 'REJECTED') {
        setHistory(prev => [
          {
            id: Date.now(),
            playerName: `${offerPlayer.first_name} ${offerPlayer.last_name}`,
            position: offerPlayer.position,
            clubName: offerPlayer.clubs?.name,
            status: 'REJECTED',
            price: amount
          },
          ...prev.slice(0, 4)
        ])
      }

      return reply
    } catch (e) {
      toast.error(friendlyError(e))
      return null
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || contextLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6" role="status" aria-label="Cargando mercado">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-24" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-56" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8 space-y-6">
      <PageHeader
        eyebrow="Transferencias"
        title="Mercado de pases"
        description="Ojeá a los candidatos para ver sus atributos reales antes de ofertar."
        actions={<Badge tone={isOpen ? 'accent' : 'warning'} dot>{marketStatus?.windowName || 'Mercado cerrado'}</Badge>}
      />

      {/* 1. Header con métricas financieras y período */}
      <MarketHeader
        budget={budget}
        wageBudgetWeekly={wageBudgetWeekly}
        currentPayroll={currentPayroll}
        marketStatus={marketStatus}
        candidatesCount={visible.length}
        totalCount={players.length}
      />

      {/* 2. Derechos de recompra */}
      {rights.length > 0 && (
        <Card as="section" aria-label="Derechos de recompra" className="mb-6 border border-line">
          <CardBody className="space-y-2 p-4">
            <h2 className="font-display text-base font-semibold text-fg">Derechos de recompra</h2>
            <p className="text-xs text-fg-muted">
              Jugadores que vendiste con cláusula: podés traerlos de vuelta por el precio pactado hasta que venza.
            </p>
            <ul className="divide-y divide-line text-sm">
              {rights.map(r => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                  <span>
                    <span className="font-semibold text-fg">{r.players?.first_name} {r.players?.last_name}</span>
                    <span className="ml-2 text-fg-muted">hasta la temporada {r.expires_season}</span>
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!isOpen || budget < Number(r.price)}
                    onClick={() => handleBuyback(r)}
                    aria-label={`Recomprar a ${r.players?.first_name} ${r.players?.last_name}`}
                  >
                    Recomprar · {formatMoney(r.price)}
                  </Button>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {/* 3. Barra de filtros de posición y estrategia */}
      <MarketFilterBar
        group={group}
        onGroupChange={setGroup}
        activeChip={activeChip}
        onChipChange={setActiveChip}
        query={query}
        onQueryChange={setQuery}
        minPace={minPace}
        onMinPaceChange={setMinPace}
        sortKey={sortKey}
        onSortKeyChange={setSortKey}
        hasFilters={hasFilters}
        onClearFilters={clearFilters}
      />

      {/* 4. Historial de negociaciones recientes */}
      <MarketHistory history={history} />

      {/* 5. Grilla de Figuritas Panini o Estado Vacío */}
      {visible.length === 0 ? (
        <MarketEmptyState hasFilters={hasFilters} onClearFilters={clearFilters} />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Jugadores disponibles">
          {visible.map(p => (
            <li key={p.id}>
              <MarketPlayerCard
                player={p}
                allPlayers={players}
                ownSquad={ownSquad}
                budget={budget}
                wageBudgetWeekly={wageBudgetWeekly}
                currentPayroll={currentPayroll}
                isOpen={isOpen}
                onScout={handleScout}
                onNegotiate={openOffer}
              />
            </li>
          ))}
        </ul>
      )}

      {/* 6. Modal de Negociación Conversacional (Chat con el Representante) */}
      {offerPlayer && (
        <OfferModal
          player={offerPlayer}
          budget={budget}
          wageInfo={wageInfo}
          processing={submitting}
          onClose={() => setOfferPlayer(null)}
          onSubmit={handleSubmitOffer}
        />
      )}
    </div>
  )
}
