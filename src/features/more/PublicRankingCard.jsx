import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { managerApi } from '../../api/manager'
import { Card, CardBody, Switch } from '../../components/ui'
import { friendlyError } from '../../lib/errors'
import { track } from '../../lib/analytics'
import { fetchPublicProfile, profilePath } from '../../lib/publicProfile'

/**
 * Privacidad: aparecer (o no) en la tabla pública de los mejores DT. Es un consentimiento: por defecto está apagado,
 * se puede activar y retirar en cualquier momento.
 */
export default function PublicRankingCard({ manager }) {
  const [on, setOn] = useState(Boolean(manager?.public_ranking))
  const [busy, setBusy] = useState(false)
  const [profile, setProfile] = useState(null) // { slug, rank, played } cuando aceptó aparecer

  // Dirección del perfil público y puesto actual; si algo falla, el interruptor sigue andando sin ellos
  const loadProfile = useCallback(async () => {
    try {
      const slug = await managerApi.claimPublicSlug()
      if (!slug) return setProfile(null)
      const data = await fetchPublicProfile(slug).catch(() => null)
      setProfile({ slug, rank: data?.rank ?? null, played: data?.played ?? null })
    } catch {
      setProfile(null)
    }
  }, [])

  useEffect(() => { if (on && manager?.id) loadProfile() }, [on, manager?.id, loadProfile])

  const toggle = async (value) => {
    setOn(value)
    setBusy(true)
    try {
      await managerApi.setPublicRanking(manager.id, value)
      if (value) track('ranking_opt_in')
      if (!value) setProfile(null)
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
          {on && profile && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2 text-xs">
              <span className="text-fg-muted">
                {profile.rank ? `Tu puesto: ${profile.rank}º` : profile.played != null ? `Te faltan ${Math.max(0, 10 - profile.played)} partidos para entrar en la tabla.` : 'Tu perfil público ya está listo.'}
              </span>
              <Link to={profilePath(profile.slug)} className="font-semibold text-primary underline-offset-4 hover:underline">Ver mi perfil público</Link>
            </div>
          )}
          <p className="text-xs text-fg-subtle">Más detalles en la <Link to="/privacidad" className="font-semibold text-primary underline-offset-4 hover:underline">política de privacidad</Link>.</p>
        </CardBody>
      </Card>
    </section>
  )
}
