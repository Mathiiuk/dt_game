import React, { useEffect, useState } from 'react'
import { Trophy, CheckCircle2, Landmark, Building2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { seasonCloseApi } from '../../api/seasonClose'
import { competitionApi } from '../../api/competition'
import { seasonOutlook } from '../../domain/divisions'
import { climateApi } from '../../api/climate'
import { seasonStory } from '../../domain/seasonStory'
import { useGameContext } from '../../context/GameContext'
import { formatMoney } from '../../lib/format'
import { Badge, Button, Card, CardBody, ResponsiveOverlay } from '../../components/ui'
import { friendlyError } from '../../lib/errors'

const CONSEQUENCES = [
  ['Tabla archivada', 'La tabla de posiciones se congela para siempre en la historia de la liga.'],
  ['Evolución del plantel', 'Todos cumplen un año: los juveniles progresan según sus minutos y los veteranos acusan el paso del tiempo.'],
  ['Contratos vencidos', 'Los jugadores sin renovación quedan libres, sin costo de indemnización.'],
  ['Mercado abierto', 'El reloj pasa a la semana 1 de la nueva temporada con la ventana de pretemporada activa.']
]

/** Gala de fin de temporada: diálogo en escritorio, página completa en móvil */
export default function SeasonCloseModal({ club, careerId, seasonYear = 2026, onClose, onSuccess }) {
  const { refreshContext } = useGameContext()
  const [closing, setClosing] = useState(false)
  const [closedSummary, setClosedSummary] = useState(null)
  const [story, setStory] = useState(null)
  const [outlook, setOutlook] = useState(null)
  const [expiring, setExpiring] = useState([])

  // Puesto actual en la tabla: de ahí salen el premio y el ascenso que se muestran antes de cerrar
  useEffect(() => {
    let alive = true
    competitionApi.getStandings(club?.id).then(rows => {
      const mine = (rows || []).find(r => r.club_id === club?.id)
      if (alive) setOutlook(seasonOutlook(mine?.position, club?.league_tier || 5))
    }).catch(() => {})
    return () => { alive = false }
  }, [club?.id, club?.league_tier])

  useEffect(() => {
    let alive = true
    seasonCloseApi.getExpiringContracts(club?.id, seasonYear).then(list => { if (alive) setExpiring(list || []) }).catch(() => {})
    return () => { alive = false }
  }, [club?.id, seasonYear])

  const handleExecuteClose = async () => {
    try {
      setClosing(true)
      const res = await seasonCloseApi.executeSeasonClose({ careerId: careerId || club?.career_id, clubId: club.id, seasonYear })
      setClosedSummary(res)
      // Resumen de historia del año: se arma con el resultado final y las consecuencias registradas
      try {
        const data = await climateApi.getSeasonSummaryData(club.id, seasonYear)
        setStory(seasonStory({
          clubName: club.name,
          position: res.userPosition,
          champion: res.championClub?.club_id === club.id,
          promoted: res.isPromoted,
          relegated: res.isRelegated,
          prize: res.totalPrizeAwarded,
          cash: res.newBudget,
          state: data.state,
          counts: data.counts,
          arcs: data.arcsClosed,
          signings: data.signings,
          decisions: data.decisions
        }))
      } catch (storyErr) {
        console.warn('Aviso: no se pudo armar el resumen de la temporada:', storyErr)
      }
      toast.success('Temporada cerrada. Comienza la pretemporada.')
      if (typeof refreshContext === 'function') await refreshContext()
      onSuccess?.(res)
    } catch (err) {
      console.error(err)
      toast.error(friendlyError(err, 'Error al procesar el cierre de temporada'))
    } finally {
      setClosing(false)
    }
  }

  const footer = closedSummary ? (
    <Button onClick={onClose}>Comenzar pretemporada</Button>
  ) : (
    <>
      <Button variant="ghost" onClick={onClose}>Revisar plantel</Button>
      <Button onClick={handleExecuteClose} loading={closing}>
        {closing ? 'Procesando cierre anual…' : <>Cerrar temporada y abrir el nuevo año<ArrowRight /></>}
      </Button>
    </>
  )

  return (
    <ResponsiveOverlay
      title={`Gala de fin de temporada ${seasonYear}`}
      description="El torneo terminó: la dirigencia hace balance y se prepara el nuevo ciclo."
      onClose={onClose}
      size="md"
      footer={footer}
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Card as="div">
            <CardBody className="space-y-1.5">
              <p className="flex items-center gap-2 text-sm text-fg-muted"><Landmark className="size-4 text-accent" aria-hidden="true" />Premios federativos</p>
              {outlook ? (
                <>
                  <p className="num font-display text-3xl font-semibold text-accent">{formatMoney(outlook.prize)}</p>
                  <p className="text-xs text-fg-subtle">Por terminar {outlook.position}.º. Se acredita en la caja al cerrar (más un bono si tu goleador llega a 8 goles).</p>
                </>
              ) : (
                <>
                  <p className="num font-display text-3xl font-semibold text-accent">{formatMoney(1000)} a {formatMoney(12000)}</p>
                  <p className="text-xs text-fg-subtle">Según la posición final. Se acreditan en la caja al cerrar la temporada.</p>
                </>
              )}
            </CardBody>
          </Card>
          <Card as="div">
            <CardBody className="space-y-1.5">
              <p className="flex items-center gap-2 text-sm text-fg-muted"><Building2 className="size-4 text-accent" aria-hidden="true" />Presupuesto del próximo año</p>
              <p className="num font-display text-3xl font-semibold text-fg">{outlook ? (outlook.wageChangePct > 0 ? '+' : '') + outlook.wageChangePct : '+10'}% <span className="text-base font-medium text-fg-muted">de la masa salarial</span></p>
              <p className="text-xs text-fg-subtle">{outlook?.promoted ? 'Ascendés: la presidencia aprueba un salto grande para la categoría nueva.' : outlook?.relegated ? 'Descendés: la presidencia recorta el presupuesto para la categoría de abajo.' : 'Te quedás en la categoría: ajuste chico (con los dos primeros puestos sube 80%; los tres últimos bajan de categoría).'}</p>
            </CardBody>
          </Card>
        </div>

        {expiring.length > 0 && !closedSummary && (
          <div role="alert" className="rounded-lg border border-warning/40 bg-surface-2 p-4 text-sm">
            <p className="font-semibold text-fg">Quedan libres {expiring.length} jugador{expiring.length === 1 ? '' : 'es'} si cerrás ahora</p>
            <p className="mt-1 text-fg-muted">
              {expiring.slice(0, 5).map(p => `${p.first_name} ${p.last_name} (${p.overall})`).join(', ')}{expiring.length > 5 ? ` y ${expiring.length - 5} más` : ''}.
              Renová los que quieras conservar desde el plantel antes de cerrar: después no hay vuelta atrás.
            </p>
          </div>
        )}

        <section aria-labelledby="season-consequences">
          <h3 id="season-consequences" className="mb-2.5 flex items-center gap-2 font-display text-lg font-semibold text-fg">
            <Trophy className="size-4.5 text-gold" aria-hidden="true" />Qué pasa al cerrar
          </h3>
          <ul className="space-y-2.5">
            {CONSEQUENCES.map(([title, text]) => (
              <li key={title} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                <span className="text-fg-muted"><strong className="font-semibold text-fg">{title}.</strong> {text}</span>
              </li>
            ))}
          </ul>
        </section>

        {closedSummary && (
          <div role="status" className="rounded-lg border border-accent/40 bg-accent-soft p-4">
            <div className="flex items-center gap-2 font-display text-lg font-semibold text-accent">
              <CheckCircle2 className="size-5" aria-hidden="true" />Transición completada
              <Badge tone="accent" className="num">Temporada {closedSummary.newSeasonYear}</Badge>
            </div>
            <p className="mt-1.5 text-sm text-fg-muted">
              Se archivó el balance oficial. Tu caja es de <span className="num font-semibold text-fg">{formatMoney(closedSummary.newBudget)}</span>.
            </p>
          </div>
        )}

        {story && (
          <section aria-labelledby="season-story" className="rounded-lg border border-line bg-surface-2 p-4">
            <h3 id="season-story" className="font-display text-lg font-semibold text-fg">{story.headline}</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-fg-muted">
              {story.lines.map(line => <li key={line}>{line}</li>)}
            </ul>
          </section>
        )}
      </div>
    </ResponsiveOverlay>
  )
}
