import React, { useMemo, useState } from 'react'
import { MANAGER_QUOTES } from '../../data/managerQuotes'
import { publishableQuotes } from './quoteCycle'
import { useQuoteCycle } from './useQuoteCycle'
import { cn } from '../../lib/utils'

/**
 * Flash de frases de DT: aparece una, se va, aparece otra. No es un carrusel: no hay flechas ni contadores.
 * Se presenta como "El pensamiento del día", un recuadro de diario. La altura está reservada para que el cambio de frase no mueva el resto de la portada.
 * Se detiene al pasar el mouse o al enfocarla, y hay un botón (visible con teclado) para pausarla.
 */
export default function ManagerQuoteFlash({ quotes = MANAGER_QUOTES }) {
  const list = useMemo(() => publishableQuotes(quotes), [quotes])
  const [hover, setHover] = useState(false)
  const [stopped, setStopped] = useState(false)
  const { quote, phase, reduced } = useQuoteCycle(list, { paused: hover || stopped })
  const shown = phase === 'enter' || phase === 'visible'

  return (
    <aside
      aria-label="El pensamiento del día"
      className="relative flex min-h-[7.25rem] w-full flex-col justify-center border-y border-b-line-strong border-t-[4px] border-t-fg py-2.5 [border-top-style:double] lg:min-h-[10rem] lg:border-y-0 lg:border-r lg:border-r-line-strong lg:py-0 lg:pr-7"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <p className="font-display text-[0.78rem] font-bold uppercase tracking-[0.18em] text-danger lg:text-sm">El pensamiento del día</p>
      <figure
        data-phase={phase}
        className={cn(
          'mt-1 transition-[opacity,translate,scale,filter] duration-700 ease-out-quart',
          shown ? 'translate-y-0 scale-100 opacity-100 blur-none' : 'translate-y-1.5 scale-[0.98] opacity-0 blur-[2px]'
        )}
      >
        <blockquote className="text-balance font-slab text-[1.0625rem] font-bold leading-snug text-fg lg:text-2xl">
          <p>“{quote.text}”</p>
        </blockquote>
        {quote.manager && (
          <figcaption className="mt-1 font-display text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-fg-muted lg:text-sm">— {quote.manager}</figcaption>
        )}
      </figure>
      {!reduced && list.length > 1 && (
        <button
          type="button"
          aria-pressed={stopped}
          onClick={() => setStopped(s => !s)}
          className="sr-only rounded-sm px-2 py-1 text-xs text-fg-muted focus-visible:not-sr-only focus-visible:absolute focus-visible:-bottom-7"
        >
          {stopped ? 'Reanudar frases' : 'Pausar frases'}
        </button>
      )}
    </aside>
  )
}
