import React, { useState, useEffect } from 'react'
import { Newspaper, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import { pressApi } from '../../../api/press'
import { Badge, Card, CardBody, EmptyState, ResponsiveOverlay, Skeleton } from '../../../components/ui'
import { toneLabel } from '../../../domain/press'

/** Sala de prensa: archivo histórico de ruedas de prensa. Diálogo en escritorio, página completa en móvil. */
export default function PressRoomModal({ club, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!club?.id) return
    const load = async () => {
      try {
        setLoading(true)
        setHistory(await pressApi.getConferenceHistory(club.id))
      } catch (e) {
        console.error(e)
        toast.error('Error cargando la hemeroteca de prensa')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [club?.id])

  return (
    <ResponsiveOverlay
      title="Sala de prensa"
      description="Archivo de declaraciones y ruedas de prensa"
      onClose={onClose}
      size="md"
    >
      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Cargando declaraciones">
          <Skeleton className="h-28" /><Skeleton className="h-28" />
        </div>
      ) : history.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="Todavía no hay conferencias archivadas"
          description="A medida que disputes partidos oficiales y respondas a los cronistas, tus declaraciones quedarán registradas aquí."
        />
      ) : (
        <ul className="space-y-3">
          {history.map((conf) => (
            <li key={conf.id}>
              <Card as="article">
                <CardBody className="space-y-3">
                  <div className="flex items-center justify-between gap-3 border-b border-line pb-2.5 text-xs text-fg-muted">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CalendarDays className="size-3.5" aria-hidden="true" />
                      {new Date(conf.completed_at || conf.created_at).toLocaleDateString('es-AR')}
                    </span>
                    <Badge tone={conf.delegated_to_assistant ? 'neutral' : 'accent'}>
                      {conf.delegated_to_assistant ? 'Delegada en el 2º DT' : 'Atendida por el DT'}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {(conf.press_qa_items || []).map((qa) => (
                      <div key={qa.id} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3 text-xs text-fg-subtle">
                          <span className="min-w-0 truncate font-medium text-fg-muted">{qa.media_outlet} · {qa.journalist_name}</span>
                          <Badge tone="warning" className="shrink-0">{toneLabel(qa.chosen_tone, 'Declaración')}</Badge>
                        </div>
                        <p className="text-sm italic text-fg">“{qa.question_text}”</p>
                        <p className="border-l-2 border-accent/50 pl-3 text-sm text-fg-muted">
                          “{qa.manager_answer_text || 'Sin respuesta registrada'}”
                        </p>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </ResponsiveOverlay>
  )
}
