import React, { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import PublicHeader from './PublicHeader'
import PublicFooter from './PublicFooter'
import { FULL_SCREEN } from './HomeLanding'
import { useVisitorState } from './useVisitorState'
import { useSeo } from '../../seo/useSeo'
import { fetchPublicProfile } from '../../lib/publicProfile'
import { Button, DataStrip, Jersey, Kicker } from '../../components/ui'
import { buttonVariants } from '../../components/ui/button'
import { cn } from '../../lib/utils'

const fmt = (n) => new Intl.NumberFormat('es-AR').format(n)

/**
 * Perfil público de un DT (/dt/<dirección>): solo existe para quien aceptó aparecer en la tabla de los mejores DT.
 * Muestra lo mismo que la tabla (nombre, puntos, títulos, victorias, puesto) y los colores de la camiseta; nunca el club ni datos de la cuenta.
 * No se indexa en buscadores: es para compartir con quien uno quiera.
 */
export default function PublicProfilePage() {
  const { slug } = useParams()
  const visitor = useVisitorState()
  const [state, setState] = useState({ status: 'loading', profile: null })
  const [attempt, setAttempt] = useState(0)

  useSeo({ title: 'Perfil de DT | Vestuario', description: 'Perfil público de un Director Técnico de Vestuario.', robots: 'noindex,nofollow' })

  useEffect(() => {
    const ctrl = new AbortController()
    setState({ status: 'loading', profile: null })
    fetchPublicProfile(slug, { signal: ctrl.signal })
      .then(profile => setState({ status: profile ? 'ready' : 'missing', profile }))
      .catch(() => { if (!ctrl.signal.aborted) setState({ status: 'error', profile: null }) })
    return () => ctrl.abort()
  }, [slug, attempt])

  const retry = useCallback(() => setAttempt(a => a + 1), [])
  const { status, profile } = state

  return (
    <div className={`grid ${FULL_SCREEN} grid-rows-[auto_1fr_auto] bg-bg`}>
      <PublicHeader visitor={visitor} />
      <main className="mx-auto w-full max-w-xl border-y border-b-line-strong border-t-[4px] border-t-fg px-5 py-8 [border-top-style:double]">
        {status === 'loading' && (
          <div role="status" aria-label="Cargando el perfil" className="grid place-items-center py-16 text-accent"><Loader2 className="size-8 animate-spin" aria-hidden="true" /></div>
        )}

        {status === 'error' && (
          <div className="py-10 text-center">
            <h1 className="font-slab text-2xl font-extrabold text-fg">No pudimos cargar el perfil</h1>
            <p className="mt-2 text-fg-muted">Revisá tu conexión y probá de nuevo.</p>
            <Button className="mt-4" onClick={retry}>Reintentar</Button>
          </div>
        )}

        {status === 'missing' && (
          <div className="py-10 text-center">
            <Kicker>Perfil de DT</Kicker>
            <h1 className="mt-1 font-slab text-3xl font-extrabold text-fg">No encontramos a este DT</h1>
            <p className="mt-2 text-fg-muted">La dirección no existe o esa persona decidió no aparecer en la tabla pública.</p>
            <Link to="/" className={cn(buttonVariants({ variant: 'outline' }), 'mt-5')}>Volver al inicio</Link>
          </div>
        )}

        {status === 'ready' && profile && (
          <article className="space-y-5">
            <header className="flex items-center gap-4">
              <Jersey primary={profile.kit.primary} secondary={profile.kit.secondary} pattern={profile.kit.pattern} label={`Camiseta de ${profile.name}`} className="size-20 shrink-0" />
              <div className="min-w-0">
                <Kicker>Perfil de DT</Kicker>
                <h1 className="text-balance font-slab text-3xl font-extrabold leading-tight tracking-tight text-fg">{profile.name}</h1>
              </div>
            </header>
            <DataStrip
              label="Carrera del DT"
              items={[
                { label: 'Puntos de legado', value: fmt(profile.points) },
                { label: 'Títulos', value: fmt(profile.titlesNational + profile.titlesContinental), hint: `${profile.titlesNational} de liga · ${profile.titlesContinental} continentales` },
                { label: 'Victorias', value: fmt(profile.won), hint: `${fmt(profile.played)} partidos` },
                { label: 'Puesto', value: profile.rank ? `${profile.rank}º` : '—' }
              ]}
            />
            {!profile.rank && <p className="text-sm text-fg-muted">Aparece en la tabla desde los 10 partidos: lleva {fmt(profile.played)}.</p>}
            <p className="text-sm text-fg-muted">Los puntos suman títulos de liga y continentales, victorias, efectividad y reputación: la misma cuenta del Salón de la Fama.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/demo" className={cn(buttonVariants({ size: 'lg' }))}>Probar la demo gratis</Link>
              <Link to="/registro" className={cn(buttonVariants({ size: 'lg', variant: 'outline' }))}>Crear mi carrera</Link>
            </div>
          </article>
        )}
      </main>
      <PublicFooter />
    </div>
  )
}
