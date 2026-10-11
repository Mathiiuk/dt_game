import React from 'react'
import { Link } from 'react-router-dom'
import PublicHeader from '../home/PublicHeader'
import PublicFooter from '../home/PublicFooter'
import { FULL_SCREEN } from '../home/HomeLanding'
import { useVisitorState } from '../home/useVisitorState'
import { useSeo } from '../../seo/useSeo'
import { buttonVariants } from '../../components/ui/button'
import { cn } from '../../lib/utils'

/** Página inexistente: con humor, con salidas útiles y sin indexar (el servidor responde 404) */
export default function NotFoundScreen() {
  const visitor = useVisitorState()
  useSeo({ title: 'Página no encontrada | Vestuario', description: 'Esta página no existe.', robots: 'noindex,nofollow' })

  return (
    <div className={`grid ${FULL_SCREEN} grid-rows-[auto_1fr_auto] bg-bg`}>
      <PublicHeader visitor={visitor} />
      <main className="mx-auto flex w-full max-w-xl flex-col items-center justify-center px-5 py-12 text-center">
        <p className="font-display text-7xl font-bold text-accent" aria-hidden="true">404</p>
        <h1 className="mt-3 text-balance font-display text-4xl font-bold leading-none text-fg sm:text-5xl">Esta jugada fue al VAR y no existe</h1>
        <p className="mt-4 text-lg leading-relaxed text-fg-muted">
          La página que buscás está en offside, se la llevó un dirigente en un sobre o nunca existió. Volvé a la cancha.
        </p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link to="/" className={cn(buttonVariants({ size: 'lg' }))}>Volver al inicio</Link>
          <Link to="/como-jugar" className={cn(buttonVariants({ size: 'lg', variant: 'outline' }))}>Cómo jugar</Link>
          <Link to="/demo" className={cn(buttonVariants({ size: 'lg', variant: 'ghost' }))}>Probar la demo</Link>
        </div>
        <p className="mt-8 text-sm text-fg-subtle">¿Buscabas algo de táctica o fichajes? Mirá las <Link to="/guias" className="font-semibold text-accent underline underline-offset-4">guías para dirigir mejor</Link>.</p>
      </main>
      <PublicFooter />
    </div>
  )
}
