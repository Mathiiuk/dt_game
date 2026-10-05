import React, { useState } from 'react'
import { Trophy, CheckCircle2, Landmark, Building2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { seasonCloseApi } from '../../api/seasonClose'
import { useGameContext } from '../../context/GameContext'
import { formatMoney } from '../../lib/format'
import { Badge, Button, Card, CardBody, ResponsiveOverlay } from '../../components/ui'

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

  const handleExecuteClose = async () => {
    try {
      setClosing(true)
      const res = await seasonCloseApi.executeSeasonClose({ careerId: careerId || club?.career_id, clubId: club.id, seasonYear })
      setClosedSummary(res)
      toast.success('Temporada cerrada. Comienza la pretemporada.')
      if (typeof refreshContext === 'function') await refreshContext()
      onSuccess?.(res)
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Error al procesar el cierre de temporada')
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
              <p className="num font-display text-3xl font-semibold text-accent">+{formatMoney(60000)}</p>
              <p className="text-xs text-fg-subtle">Se acreditan en la caja al cerrar la temporada.</p>
            </CardBody>
          </Card>
          <Card as="div">
            <CardBody className="space-y-1.5">
              <p className="flex items-center gap-2 text-sm text-fg-muted"><Building2 className="size-4 text-accent" aria-hidden="true" />Presupuesto del próximo año</p>
              <p className="num font-display text-3xl font-semibold text-fg">80% <span className="text-base font-medium text-fg-muted">de la masa salarial</span></p>
              <p className="text-xs text-fg-subtle">Aprobado por la presidencia para el nuevo ciclo.</p>
            </CardBody>
          </Card>
        </div>

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
      </div>
    </ResponsiveOverlay>
  )
}
