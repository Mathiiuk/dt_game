import React, { useEffect, useMemo, useState } from 'react'
import { Eye, Lock, Search, ShoppingCart, Users } from 'lucide-react'
import { toast } from 'sonner'
import { marketApi } from '../../api/market'
import { scoutingApi } from '../../api/scouting'
import { buybackApi } from '../../api/buyback'
import { scoutInsights } from '../../domain/scoutInsights'
import { supabase } from '../../api/supabase'
import { useGameContext } from '../../context/GameContext'
import { formatMoney } from '../../lib/format'
import { POSITION_GROUP_OPTIONS } from '../../domain/squad'
import {
  MARKET_SORT_OPTIONS, SCOUT_COST, filterMarketPlayers, hiddenRange, isScouted, marketPrice, offerBlockReason, sortMarketPlayers
} from '../../domain/market'
import {
  Badge, Button, Card, CardBody, ChoiceChips, EmptyState, Input, PageHeader, Select, Skeleton, Stat, Switch
} from '../../components/ui'
import OfferModal from './OfferModal'
import { friendlyError } from '../../lib/errors'
import { financesApi } from '../../api/finances'
import { climateApi } from '../../api/climate'
import { purchaseWarning } from '../../domain/warnings'
import { askRisk } from '../../lib/risk'
import { playerDemands } from '../../domain/contractDemands'

const levelOf = (p) => p.attr_overall || p.overall || 0

/** Muestra el valor real si el jugador fue ojeado; si no, un rango o un signo de pregunta */
const Revealed = ({ scouted, value, hidden }) => (scouted ? <>{value ?? '—'}</> : <span className="text-fg-subtle">{hidden}</span>)

export default function MarketScreen() {
  const { club, loading: contextLoading, refreshContext, confirmAction, confirmRisk } = useGameContext()
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState([])
  const [marketStatus, setMarketStatus] = useState(null)

  const [group, setGroup] = useState('ALL')
  const [query, setQuery] = useState('')
  const [minPace, setMinPace] = useState('')
  const [sortKey, setSortKey] = useState('overall')
  const [onlyAffordable, setOnlyAffordable] = useState(false)

  const [ownSquad, setOwnSquad] = useState([])
  const [rights, setRights] = useState([])
  const [offerPlayer, setOfferPlayer] = useState(null)
  // Sueldo que cobraría el jugador y cómo queda la masa salarial con él: se calcula al abrir la negociación
  const [wageInfo, setWageInfo] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const budget = Number(club?.budget || 0)

  const loadData = async () => {
    try {
      if (!club?.id) return
      const list = await marketApi.getMarketPlayers(club.id, { gameDate: club.game_date })
      setMarketStatus(marketApi.getMarketStatus(club.game_date))

      const [{ data: scouted }, { data: mine }] = await Promise.all([
        supabase.from('scout_reports').select('*').eq('club_id', club.id),
        supabase.from('players').select('position, attr_overall').eq('club_id', club.id)
      ])
      setOwnSquad(mine || [])
      setRights(await buybackApi.getRights(club.id).catch(() => []))
      const reports = new Map((scouted || []).map(s => [s.player_id, s]))

      setPlayers(list.map(p => {
        const report = reports.get(p.id)
        return { ...p, scout_level: report ? (report.knowledge_level ?? report.level ?? 1) : 0 }
      }))
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

  const visible = useMemo(
    () => sortMarketPlayers(filterMarketPlayers(players, { group, query, minPace, budget, onlyAffordable }), sortKey),
    [players, group, query, minPace, budget, onlyAffordable, sortKey]
  )

  const hasFilters = group !== 'ALL' || query || minPace || onlyAffordable
  const clearFilters = () => { setGroup('ALL'); setQuery(''); setMinPace(''); setOnlyAffordable(false) }
  const isOpen = !!marketStatus?.isOpen

  const handleScout = async (p) => {
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
        // Años que firma el jugador al llegar (la base le da dos como mínimo)
        years: Math.max(2, demands.desiredYears),
        payroll: Number(finances?.expenses?.playerWages || 0) + Number(finances?.expenses?.staffWages || 0),
        budget: Number(finances?.wageBudgetWeekly || 0)
      })
    } catch {
      // Sin la masa salarial se negocia igual, sin el aviso del sueldo
    }
  }

  // Cada oferta va al club vendedor, que acepta, contraoferta o rechaza (hasta dos rondas); el modal muestra su respuesta
  const handleSubmitOffer = async (amount, installments) => {
    try {
      setSubmitting(true)
      // Pagar de más o dejar la caja flaca molesta a la dirigencia: se avisa antes de cerrar el fichaje
      const proceed = await askRisk(confirmRisk, async () => {
        const finances = await financesApi.getFinances(club.id)
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
        if (typeof refreshContext === 'function') await refreshContext()
        loadData()
      }
      return reply
    } catch (e) {
      toast.error(friendlyError(e))
      return null
    } finally {
      setSubmitting(false)
    }
  }

  const action = (p) => {
    if (!isScouted(p)) {
      return <Button size="sm" variant="outline" onClick={() => handleScout(p)} aria-label={`Ojear a ${p.first_name} ${p.last_name}`}><Eye />Ojear · {formatMoney(SCOUT_COST)}</Button>
    }
    const blocked = offerBlockReason(p, { isOpen, budget })
    return (
      <Button size="sm" disabled={!!blocked} onClick={() => openOffer(p)} aria-label={`Ofertar por ${p.first_name} ${p.last_name}`}>
        {blocked ? <Lock /> : <ShoppingCart />}{blocked || 'Ofertar'}
      </Button>
    )
  }

  if (loading || contextLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6" role="status" aria-label="Cargando mercado">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-24" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-48" />)}</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        eyebrow="Transferencias"
        title="Mercado de pases"
        description="Ojeá a los candidatos para ver sus atributos reales antes de ofertar."
        actions={<Badge tone={isOpen ? 'accent' : 'warning'} dot>{marketStatus?.windowName || 'Mercado cerrado'}</Badge>}
      />

      <Card className="mb-6">
        <CardBody className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          <Stat label="Presupuesto" value={formatMoney(budget)} valueClassName="text-2xl text-accent sm:text-3xl" />
          <Stat label="Candidatos" value={visible.length} hint={`de ${players.length}`} />
          <Stat label="Estado" value={isOpen ? 'Abierto' : 'Cerrado'} hint={isOpen ? 'Podés ofertar' : 'Sólo podés ojear'} valueClassName="text-2xl sm:text-3xl" />
        </CardBody>
      </Card>

      {rights.length > 0 && (
        <Card as="section" aria-label="Derechos de recompra" className="mb-6">
          <CardBody className="space-y-2">
            <h2 className="font-display text-lg font-semibold text-fg">Derechos de recompra</h2>
            <p className="text-xs text-fg-muted">Jugadores que vendiste con cláusula: podés traerlos de vuelta por el precio pactado hasta que venza.</p>
            <ul className="divide-y divide-line text-sm">
              {rights.map(r => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                  <span>
                    <span className="font-semibold text-fg">{r.players?.first_name} {r.players?.last_name}</span>
                    <span className="ml-2 text-fg-muted">hasta la temporada {r.expires_season}</span>
                  </span>
                  <Button size="sm" variant="outline" disabled={!isOpen || budget < Number(r.price)} onClick={() => handleBuyback(r)} aria-label={`Recomprar a ${r.players?.first_name} ${r.players?.last_name}`}>
                    Recomprar · {formatMoney(r.price)}
                  </Button>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <section aria-label="Filtros" className="mb-5 space-y-3">
        <ChoiceChips label="Filtrar por línea" value={group} onChange={setGroup} options={POSITION_GROUP_OPTIONS} />
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden="true" />
            <Input type="search" aria-label="Buscar jugador o club" placeholder="Buscar por nombre o club" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
          <Input type="number" inputMode="numeric" min="0" max="99" aria-label="Ritmo mínimo" placeholder="Ritmo mínimo" value={minPace} onChange={(e) => setMinPace(e.target.value)} className="lg:w-40" />
          <Select aria-label="Ordenar por" value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="lg:w-48">
            {MARKET_SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>Ordenar por {o.label.toLowerCase()}</option>)}
          </Select>
          <label className="flex items-center gap-2 text-sm text-fg-muted">
            <Switch checked={onlyAffordable} onCheckedChange={setOnlyAffordable} aria-label="Sólo los que puedo pagar" />
            Sólo los que puedo pagar
          </label>
        </div>
      </section>

      {visible.length === 0 ? (
        <Card as="div">
          <EmptyState
            icon={Users}
            title="Sin candidatos"
            description={hasFilters ? 'Ningún jugador coincide con los filtros actuales.' : 'No hay jugadores disponibles en el mercado por ahora.'}
            action={hasFilters && <Button variant="outline" size="sm" onClick={clearFilters}>Quitar filtros</Button>}
          />
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Jugadores disponibles">
          {visible.map(p => {
            const scouted = isScouted(p)
            return (
              <li key={p.id}>
                <Card as="article" className="h-full">
                  <CardBody className="flex h-full flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-fg">{p.first_name} {p.last_name}</h3>
                        <p className="truncate text-xs text-fg-muted">{p.clubs?.name || 'Agente libre'} · {p.age} años</p>
                      </div>
                      <Badge>{p.position}</Badge>
                    </div>

                    <dl className="grid grid-cols-3 gap-3">
                      <div>
                        <dt className="eyebrow">Nivel</dt>
                        <dd className="num font-display text-2xl font-semibold leading-tight">{levelOf(p) || '—'}</dd>
                      </div>
                      <div>
                        <dt className="eyebrow">Ritmo</dt>
                        <dd className="num font-display text-2xl font-semibold leading-tight"><Revealed scouted={scouted} value={p.attr_pace} hidden={<span className="text-base">{hiddenRange(p.attr_pace)}</span>} /></dd>
                      </div>
                      <div>
                        <dt className="eyebrow">Potencial</dt>
                        <dd className="num font-display text-2xl font-semibold leading-tight"><Revealed scouted={scouted} value={p.attr_potential} hidden="?" /></dd>
                      </div>
                    </dl>

                    {scouted && (
                      <ul className="space-y-1 text-xs" aria-label="Lectura del ojeador">
                        {scoutInsights({ player: p, squad: ownSquad, price: marketPrice(p) }).map(line => (
                          <li key={line.text} className={line.tone === 'good' ? 'text-accent' : line.tone === 'warn' ? 'text-warning' : 'text-fg-muted'}>
                            {line.text}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-3">
                      <Stat label="Cotización" value={scouted ? formatMoney(marketPrice(p)) : 'Desconocida'} valueClassName="text-lg" />
                      {action(p)}
                    </div>
                  </CardBody>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      {offerPlayer && (
        <OfferModal player={offerPlayer} budget={budget} wageInfo={wageInfo} processing={submitting} onClose={() => setOfferPlayer(null)} onSubmit={handleSubmitOffer} />
      )}
    </div>
  )
}
