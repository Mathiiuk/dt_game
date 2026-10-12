import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { managerApi } from '../../api/manager'
import { Card, CardBody, Switch } from '../../components/ui'
import { friendlyError } from '../../lib/errors'

/**
 * Privacidad: aparecer (o no) en la tabla pública de los mejores DT. Es un consentimiento: por defecto está apagado,
 * se puede activar y retirar en cualquier momento.
 */
export default function PublicRankingCard({ manager }) {
  const [on, setOn] = useState(Boolean(manager?.public_ranking))
  const [busy, setBusy] = useState(false)

  const toggle = async (value) => {
    setOn(value)
    setBusy(true)
    try {
      await managerApi.setPublicRanking(manager.id, value)
      toast.success(value ? 'Vas a aparecer en la tabla pública cuando juntes 10 partidos.' : 'Dejaste de aparecer en la tabla pública.')
    } catch (err) {
      setOn(!value)
      toast.error(friendlyError(err, 'No pudimos guardar tu elección. Probá de nuevo.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby="more-privacy">
      <h2 id="more-privacy" className="eyebrow mb-2 px-1">Privacidad</h2>
      <Card as="div">
        <CardBody className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p id="public-ranking-label" className="text-sm font-semibold text-fg">Aparecer en la tabla pública de los mejores DT</p>
              <p className="mt-0.5 text-xs text-fg-muted">
                Se publica el nombre y apellido de tu DT, tus puntos, títulos y victorias. Nunca tu correo ni tu club. Podés cambiarlo cuando quieras.
              </p>
            </div>
            <Switch checked={on} onCheckedChange={toggle} disabled={busy || !manager?.id} aria-labelledby="public-ranking-label" />
          </div>
          <p className="text-xs text-fg-subtle">Más detalles en la <Link to="/privacidad" className="font-semibold text-primary underline-offset-4 hover:underline">política de privacidad</Link>.</p>
        </CardBody>
      </Card>
    </section>
  )
}
