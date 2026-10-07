import React, { useEffect, useMemo, useState } from 'react'
import { ArrowRightLeft, Bell, Check, DollarSign, FileSignature, GraduationCap, Search, Sparkles, TrendingUp, UserMinus, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { playerApi } from '../../api/player'
import { contractApi } from '../../api/contracts'
import { loansApi } from '../../api/loans'
import { climateApi } from '../../api/climate'
import { saleWarning } from '../../domain/warnings'
import { askRisk } from '../../lib/risk'
import { personalitiesApi, PERSONALITY_ARCHETYPES } from '../../api/personalities'
import { useGameContext } from '../../context/GameContext'
import { queryCache } from '../../utils/cache'
import { formatMoney } from '../../lib/format'
import {
  POSITION_GROUP_OPTIONS, SORT_OPTIONS, filterPlayers, sortPlayers, meterTone, summarizeSquad,
  isListedForSale, playerLevel, playerSalary, playerMorale, positionGroup
} from '../../domain/squad'
import {
  Badge, Button, Card, CardBody, CardHeader, CardTitle, ChoiceChips, EmptyState, Input, PageHeader, Progress,
  Select, Skeleton, Stat, Tabs, TabsList, TabsTrigger, Tooltip
} from '../../components/ui'
import { absoluteWeek } from '../../domain/gameWeek'
import ContractRenewalModal from './ContractRenewalModal'
import MentorshipModal from './MentorshipModal'
import PlayerEvolutionModal from './PlayerEvolutionModal'
import SellPlayerModal from './SellPlayerModal'
import CounterOfferModal from './CounterOfferModal'
import { friendlyError } from '../../lib/errors'

const GROUP_LABEL = { GK: 'ARQ', DEF: 'DEF', MED: 'MED', DEL: 'DEL' }

function PlayerBadges({ player }) {
  const arche = player.personalityData?.primary_archetype
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {player.is_injured && <Badge tone="danger" dot>Lesionado{player.injury_type ? ` · ${player.injury_type}` : ''}</Badge>}
      {player.morale_unhappy_transfer_blocked && <Badge tone="warning">Descontento</Badge>}
      {isListedForSale(player) && <Badge tone="accent">En venta{player.asking_price ? ` · ${formatMoney(player.asking_price)}` : ''}</Badge>}
      {arche && (
        <Tooltip content={PERSONALITY_ARCHETYPES[arche]?.description || arche}>
          <span><Badge><Sparkles className="size-3" aria-hidden="true" />{PERSONALITY_ARCHETYPES[arche]?.name || arche}</Badge></span>
        </Tooltip>
      )}
    </div>
  )
}

/** Acciones de un jugador: con texto en móvil y sólo icono (con nombre accesible y tooltip) en tabla */
function PlayerActions({ player, onRenew, onSell, onTerminate, onLoan, compact }) {
  const listed = isListedForSale(player)
  const items = [
    { key: 'renew', label: 'Renovar contrato', short: 'Renovar', icon: FileSignature, onClick: () => onRenew(player), variant: 'secondary' },
    { key: 'sell', label: listed ? 'Editar precio de venta' : 'Poner en venta', short: listed ? 'Precio' : 'Vender', icon: DollarSign, onClick: () => onSell(player), variant: 'outline' },
    { key: 'loan', label: 'Ceder a préstamo', short: 'Prestar', icon: ArrowRightLeft, onClick: () => onLoan(player), variant: 'outline' },
    { key: 'end', label: 'Rescindir contrato', short: 'Rescindir', icon: UserMinus, onClick: () => onTerminate(player), variant: 'ghost', danger: true }
  ]
  return (
    <div className={compact ? 'flex items-center justify-end gap-1' : 'grid grid-cols-2 gap-2 sm:grid-cols-4'}>
      {items.map(({ key, label, short, icon: Icon, onClick, variant, danger }) => (
        compact ? (
          <Tooltip key={key} content={label}>
            <Button variant={variant} size="icon" aria-label={`${label}: ${player.first_name} ${player.last_name}`} onClick={onClick} className={danger ? 'text-danger' : undefined}>
              <Icon />
            </Button>
          </Tooltip>
        ) : (
          <Button key={key} variant={variant} size="sm" onClick={onClick} className={danger ? 'text-danger' : undefined}>
            <Icon />{short}
          </Button>
        )
      ))}
    </div>
  )
}

function OfferCard({ offer, busy, onAccept, onCounter, onReject }) {
  return (
    <Card as="article">
      <CardBody className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-fg">{offer.players?.first_name} {offer.players?.last_name}</p>
            <p className="mt-0.5 text-xs text-fg-muted">De {offer.from_club_name || 'un club de IA'}</p>
          </div>
          <Badge className="shrink-0">{offer.expires_at_week ? `Vence sem. ${offer.expires_at_week}` : 'Activa'}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 rounded-md bg-surface-2 p-3">
          <Stat label="Monto ofrecido" value={formatMoney(offer.amount)} valueClassName="text-2xl text-accent" />
          <Stat label="A caja (80%)" value={`+${formatMoney(Math.round(offer.amount * 0.8))}`} valueClassName="text-2xl" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button size="sm" disabled={busy} onClick={() => onAccept(offer)}><Check />Aceptar</Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onCounter(offer)}><TrendingUp />Contra</Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => onReject(offer)}><X />Rechazar</Button>
        </div>
      </CardBody>
    </Card>
  )
}

export default function SquadScreen() {
  const { club, manager, loading: contextLoading, refreshContext, confirmAction, confirmRisk } = useGameContext()

  const cachedPlayers = club?.id ? queryCache.get(`squad:${club.id}`) : null
  const cachedOffers = club?.id ? queryCache.get(`offers:${club.id}`) : null

  const [loading, setLoading] = useState(!cachedPlayers)
  const [data, setData] = useState({ players: cachedPlayers || [], offers: cachedOffers || [] })
  const [loans, setLoans] = useState({ players: [], weeklySaving: 0 })
  const [mobileTab, setMobileTab] = useState('squad')
  const [group, setGroup] = useState('ALL')
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState('overall')
  const [showMentorshipModal, setShowMentorshipModal] = useState(false)
  const [showEvolutionModal, setShowEvolutionModal] = useState(false)
  const [renewalPlayer, setRenewalPlayer] = useState(null)
  const [sellPlayer, setSellPlayer] = useState(null)
  const [counterOffer, setCounterOffer] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const loadData = async () => {
    try {
      if (!club?.id) return
      const [players, offers, loanList] = await Promise.all([
        playerApi.getSquad(club.id),
        contractApi.getOffersForClub(club.id),
        loansApi.getLoans(club.id).catch(() => ({ players: [], weeklySaving: 0 }))
      ])
      setLoans(loanList)
      // Las personalidades se leen con el plantel ya cargado (sin pedirlo otra vez)
      const personalitiesList = await personalitiesApi.syncSquadPersonalities(club.id, players || []).catch(() => [])
      const persMap = new Map((personalitiesList || []).map(p => [p.id, p.personality]))
      setData({ players: (players || []).map(p => ({ ...p, personalityData: persMap.get(p.id) || null })), offers })
    } catch (e) {
      toast.error(friendlyError(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (contextLoading || !club) return
    loadData()
  }, [contextLoading, club]) // eslint-disable-line react-hooks/exhaustive-deps

  const visiblePlayers = useMemo(
    () => sortPlayers(filterPlayers(data.players, { group, query }), sortKey),
    [data.players, group, query, sortKey]
  )
  const summary = useMemo(() => summarizeSquad(data.players), [data.players])

  const afterChange = async () => {
    if (typeof refreshContext === 'function') await refreshContext()
    loadData()
  }

  const handleSaveTransferStatus = async (isListed, price) => {
    if (!sellPlayer) return
    try {
      setIsProcessing(true)
      await contractApi.setTransferStatus(sellPlayer.id, {
        transfer_status: isListed ? 'TRANSFER_LISTED' : 'NOT_FOR_SALE',
        asking_price: isListed ? price : null
      })
      toast.success(isListed
        ? `${sellPlayer.last_name} está en la lista de transferibles por ${formatMoney(price)}`
        : `${sellPlayer.last_name} salió de la lista de transferibles`)
      setSellPlayer(null)
      loadData()
    } catch (e) {
      toast.error(friendlyError(e))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleLoanOut = async (player) => {
    const confirmed = await confirmAction({
      title: `Ceder a ${player.first_name} ${player.last_name} a préstamo`,
      description: `Se va a otro club de tu liga hasta el cierre de la temporada: no está disponible, dejás de pagarle ${formatMoney(player.contract_salary || 0)} por semana y vuelve al terminar el año. Máximo 3 cedidos a la vez y un plantel de 16 como mínimo.`,
      confirmText: 'Ceder a préstamo',
      cancelText: 'Cancelar',
      variant: 'primary'
    })
    if (!confirmed) return
    try {
      setIsProcessing(true)
      const res = await loansApi.loanOut(club.id, player.id)
      toast.success(`${player.last_name} se fue a ${res.borrowerName}. Ahorrás ${formatMoney(res.wageSaved)} por semana y vuelve al cierre de la temporada.`)
      await afterChange()
    } catch (e) {
      toast.error(friendlyError(e))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTerminateContract = async (player) => {
    const severance = contractApi.calculateSeveranceCost(player, club?.game_date)
    const clubBudget = club?.budget || 0

    if (clubBudget < severance) {
      return toast.error(`Fondos insuficientes: el finiquito es de ${formatMoney(severance)} y la caja tiene ${formatMoney(clubBudget)}`)
    }

    const confirmed = await confirmAction({
      title: `Rescindir el contrato de ${player.first_name} ${player.last_name}`,
      description: `La rescisión unilateral abona el 65% de los sueldos pendientes (${formatMoney(severance)}) y el jugador queda libre. ¿Confirmas?`,
      confirmText: `Abonar finiquito (${formatMoney(severance)})`,
      cancelText: 'Cancelar',
      variant: 'danger'
    })
    if (!confirmed) return

    try {
      setIsProcessing(true)
      await contractApi.terminateContract(club.id, player.id, { managerId: manager?.id, careerId: club?.career_id })
      toast.success(`Contrato rescindido. Se abonaron ${formatMoney(severance)} de indemnización.`)
      await afterChange()
    } catch (e) {
      toast.error(friendlyError(e))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAcceptOffer = async (offer) => {
    const confirmed = await confirmAction({
      title: 'Aceptar la oferta de traspaso',
      description: `¿Vender a ${offer.players?.first_name} ${offer.players?.last_name} a ${offer.from_club_name || 'un club interesado'} por ${formatMoney(offer.amount)}? El 80% (${formatMoney(Math.round(offer.amount * 0.8))}) se suma a la caja.`,
      confirmText: 'Cerrar la venta',
      cancelText: 'Cancelar',
      variant: 'primary'
    })
    if (!confirmed) return

    // Vender al ídolo o al capitán tiene costo en la tribuna y en el vestuario
    const proceed = await askRisk(confirmRisk, async () => {
      const flags = await climateApi.getReferentFlags(club.id, offer.player_id)
      return saleWarning({ ...flags, playerName: offer.players?.last_name }, climateApi.difficulty)
    })
    if (!proceed) return

    try {
      setIsProcessing(true)
      await contractApi.resolveOffer(offer.id, 'ACCEPTED', offer.player_id, offer.from_club_id, club.id, offer.amount, manager?.id)
      toast.success(`Venta cerrada: ${formatMoney(offer.amount)} por el traspaso.`)
      await afterChange()
    } catch (e) {
      toast.error(friendlyError(e))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectOffer = async (offer) => {
    try {
      setIsProcessing(true)
      await contractApi.resolveOffer(offer.id, 'REJECTED', offer.player_id, offer.from_club_id, club.id, offer.amount, manager?.id)
      toast.info('Oferta rechazada.')
      loadData()
    } catch (e) {
      toast.error(friendlyError(e))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSendCounterOffer = async (counterAmount) => {
    if (!counterOffer) return
    try {
      setIsProcessing(true)
      const res = await contractApi.resolveOffer(
        counterOffer.id, 'COUNTER', counterOffer.player_id, counterOffer.from_club_id, club.id, counterOffer.amount, manager?.id, { counterAmount }
      )
      if (res?.status === 'ACCEPTED') {
        toast.success(`Aceptaron tu contraoferta de ${formatMoney(counterAmount)}. Traspaso concretado.`)
        if (typeof refreshContext === 'function') await refreshContext()
      } else {
        toast.info(res?.message || 'El club comprador rechazó la contraoferta.')
      }
      setCounterOffer(null)
      loadData()
    } catch (e) {
      toast.error(friendlyError(e))
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading || contextLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6" aria-busy="true" aria-label="Cargando el plantel">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-24" />
        <Skeleton className="h-80" />
      </div>
    )
  }

  const offersPanel = (
    <div className="space-y-3">
      {data.offers.length === 0 ? (
        <Card as="div"><EmptyState icon={Bell} title="Sin ofertas por ahora" description="Pon jugadores en la lista de transferibles para atraer propuestas." /></Card>
      ) : (
        data.offers.map(o => (
          <OfferCard key={o.id} offer={o} busy={isProcessing} onAccept={handleAcceptOffer} onCounter={setCounterOffer} onReject={handleRejectOffer} />
        ))
      )}
    </div>
  )

  const lockerPanel = (
    <Card>
      <CardHeader><CardTitle>Vestuario</CardTitle></CardHeader>
      <CardBody className="space-y-4">
        {[['Moral del plantel', club?.squad_morale ?? 70], ['Cohesión del grupo', club?.squad_cohesion ?? 70]].map(([label, value]) => (
          <div key={label}>
            <div className="mb-1.5 flex justify-between text-sm"><span className="text-fg-muted">{label}</span><span className="num font-semibold text-fg">{value}%</span></div>
            <Progress auto value={value} label={label} />
          </div>
        ))}
        <p className="text-xs leading-relaxed text-fg-subtle">Vender referentes o rechazar ofertas jugosas de juveniles ambiciosos baja la moral y la cohesión.</p>
      </CardBody>
    </Card>
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        eyebrow="Gestión deportiva"
        title="Plantel"
        description="Contratos, transferibles y ofertas entrantes."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowEvolutionModal(true)}><TrendingUp />Desarrollo</Button>
            <Button variant="outline" size="sm" onClick={() => setShowMentorshipModal(true)}><GraduationCap />Mentorías</Button>
          </>
        }
      />

      <Card className="mb-6">
        <CardBody className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          <Stat label="Jugadores" value={summary.total} hint={`${summary.injured} lesionados`} />
          <Stat label="Nivel medio" value={summary.avgLevel} />
          <Stat label="Masa salarial" value={formatMoney(summary.weeklyWages)} hint="por semana" valueClassName="text-2xl sm:text-3xl" />
          <Stat label="Caja" value={formatMoney(club?.budget || 0)} valueClassName="text-2xl text-accent sm:text-3xl" />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 space-y-4">
          {/* Móvil: pestañas que alternan jugadores / ofertas / vestuario (en escritorio todo es visible a la vez) */}
          <Tabs value={mobileTab} onValueChange={setMobileTab} className="lg:hidden">
            <TabsList>
              <TabsTrigger value="squad">Jugadores ({data.players.length})</TabsTrigger>
              <TabsTrigger value="offers">Ofertas ({data.offers.length})</TabsTrigger>
              <TabsTrigger value="locker">Vestuario</TabsTrigger>
            </TabsList>
          </Tabs>
          {mobileTab === 'offers' && <div className="lg:hidden">{offersPanel}</div>}
          {mobileTab === 'locker' && <div className="lg:hidden">{lockerPanel}</div>}

        <section className={mobileTab === 'squad' ? 'min-w-0 space-y-4' : 'hidden min-w-0 space-y-4 lg:block'} aria-label="Jugadores">

          {/* Controles de lista: filtro por línea, búsqueda y orden */}
          <div className="space-y-3">
            <ChoiceChips label="Filtrar por línea" value={group} onChange={setGroup} options={POSITION_GROUP_OPTIONS} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden="true" />
                <Input type="search" aria-label="Buscar jugador" placeholder="Buscar por nombre" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
              </div>
              <Select aria-label="Ordenar por" value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="sm:w-48">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>Ordenar por {o.label.toLowerCase()}</option>)}
              </Select>
            </div>
          </div>

          {visiblePlayers.length === 0 ? (
            <Card as="div"><EmptyState icon={Users} title="Sin resultados" description="Ningún jugador coincide con el filtro actual." action={<Button variant="outline" size="sm" onClick={() => { setGroup('ALL'); setQuery('') }}>Quitar filtros</Button>} /></Card>
          ) : (
            <>
              {/* Móvil y tablet: tarjetas */}
              <ul className="space-y-3 md:hidden">
                {visiblePlayers.map(p => (
                  <li key={p.id}>
                    <Card as="article">
                      <CardBody className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="num grid size-11 shrink-0 place-items-center rounded-full bg-surface-3 font-display text-lg font-semibold">{p.shirt_number ?? '·'}</span>
                            <div className="min-w-0">
                              <h3 className="truncate text-base font-semibold text-fg">{p.first_name} {p.last_name}</h3>
                              <p className="text-xs text-fg-muted">{p.position} · {p.age} años · {p.contract_role || 'Rotación'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="num font-display text-2xl font-semibold leading-none text-fg">{playerLevel(p)}</p>
                            <p className="eyebrow mt-1">Nivel</p>
                          </div>
                        </div>
                        <PlayerBadges player={p} />
                        <div className="grid grid-cols-3 gap-3 border-t border-line pt-3">
                          <div><p className="eyebrow">Físico</p><p className={`num mt-0.5 text-sm font-semibold ${{ accent: 'text-accent', warning: 'text-warning', danger: 'text-danger' }[meterTone(p.state_fitness ?? 75)]}`}>{p.state_fitness ?? 75}%</p></div>
                          <div><p className="eyebrow">Moral</p><p className={`num mt-0.5 text-sm font-semibold ${{ accent: 'text-accent', warning: 'text-warning', danger: 'text-danger' }[meterTone(playerMorale(p))]}`}>{playerMorale(p)}%</p></div>
                          <div><p className="eyebrow">Salario</p><p className="num mt-0.5 text-sm font-semibold text-fg">{formatMoney(playerSalary(p) || 500)}</p></div>
                        </div>
                        <PlayerActions player={p} onRenew={setRenewalPlayer} onSell={setSellPlayer} onTerminate={handleTerminateContract} onLoan={handleLoanOut} />
                      </CardBody>
                    </Card>
                  </li>
                ))}
              </ul>

              {/* Escritorio: tabla */}
              <Card className="hidden overflow-hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <caption className="sr-only">Plantel profesional</caption>
                    <thead>
                      <tr className="border-b border-line text-fg-subtle">
                        {['Jugador', 'Línea', 'Edad', 'Nivel', 'Moral', 'Salario'].map(h => <th key={h} scope="col" className="eyebrow px-4 py-3 font-semibold">{h}</th>)}
                        <th scope="col" className="eyebrow px-4 py-3 text-right font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {visiblePlayers.map(p => (
                        <tr key={p.id} className="transition-colors hover:bg-surface-2/60">
                          <th scope="row" className="px-4 py-3 text-left font-normal">
                            <p className="font-semibold text-fg">{p.first_name} {p.last_name}</p>
                            <div className="mt-1"><PlayerBadges player={p} /></div>
                          </th>
                          <td className="px-4 py-3"><Badge>{GROUP_LABEL[positionGroup(p.position)]}</Badge> <span className="text-xs text-fg-subtle">{p.position}</span></td>
                          <td className="num px-4 py-3 text-fg-muted">{p.age}</td>
                          <td className="num px-4 py-3 font-display text-lg font-semibold text-fg">{playerLevel(p)}</td>
                          <td className="px-4 py-3"><div className="w-24"><div className="num mb-1 text-xs text-fg-muted">{playerMorale(p)}%</div><Progress auto value={playerMorale(p)} label={`Moral de ${p.last_name}`} /></div></td>
                          <td className="num px-4 py-3 text-fg">{formatMoney(playerSalary(p) || 500)}</td>
                          <td className="px-4 py-3"><PlayerActions compact player={p} onRenew={setRenewalPlayer} onSell={setSellPlayer} onTerminate={handleTerminateContract} onLoan={handleLoanOut} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {loans.players.length > 0 && (
                <Card as="section" aria-label="Jugadores a préstamo">
                  <CardBody className="space-y-2">
                    <h3 className="font-display text-lg font-semibold text-fg">A préstamo</h3>
                    <p className="text-xs text-fg-muted">Vuelven al cerrar la temporada. Mientras tanto ahorrás <span className="num font-semibold text-fg">{formatMoney(loans.weeklySaving)}</span> por semana en sueldos.</p>
                    <ul className="divide-y divide-line text-sm">
                      {loans.players.map(p => (
                        <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                          <span className="font-semibold text-fg">{p.first_name} {p.last_name}</span>
                          <span className="text-fg-muted">en {p.clubs?.name || 'otro club'}</span>
                        </li>
                      ))}
                    </ul>
                  </CardBody>
                </Card>
              )}
            </>
          )}
        </section>
        </div>

        {/* Panel lateral (escritorio): ofertas y vestuario */}
        <aside className="hidden min-w-0 space-y-6 lg:block" aria-label="Ofertas y vestuario">
          <section aria-labelledby="offers-title" className="space-y-3">
            <h2 id="offers-title" className="font-display text-xl font-semibold text-fg">Ofertas entrantes <span className="num text-fg-subtle">({data.offers.length})</span></h2>
            {offersPanel}
          </section>
          {lockerPanel}
        </aside>
      </div>

      {renewalPlayer && (
        <ContractRenewalModal
          player={renewalPlayer} club={club} manager={manager} currentWeek={club?.game_date ? absoluteWeek(club.game_date) : 1}
          onClose={() => setRenewalPlayer(null)}
          onSuccess={() => { loadData(); if (typeof refreshContext === 'function') refreshContext() }}
        />
      )}
      {sellPlayer && <SellPlayerModal player={sellPlayer} processing={isProcessing} onClose={() => setSellPlayer(null)} onSave={handleSaveTransferStatus} />}
      {counterOffer && <CounterOfferModal offer={counterOffer} processing={isProcessing} onClose={() => setCounterOffer(null)} onSend={handleSendCounterOffer} />}
      {showMentorshipModal && <MentorshipModal club={club} players={data.players} onClose={() => setShowMentorshipModal(false)} onMentorshipStarted={() => loadData()} />}
      {showEvolutionModal && <PlayerEvolutionModal club={club} players={data.players} onClose={() => setShowEvolutionModal(false)} currentSeasonYear={club?.current_season_year || 2026} />}
    </div>
  )
}
