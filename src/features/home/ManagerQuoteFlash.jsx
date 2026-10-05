import React, { useMemo, useState } from 'react'
import { MANAGER_QUOTES } from '../../data/managerQuotes'
import { publishableQuotes } from './quoteCycle'
import { useQuoteCycle } from './useQuoteCycle'
import { cn } from '../../lib/utils'

/**
 * Flash de frases de DT: aparece una, se va, aparece otra. No es un carrusel: no hay flechas ni contadores.
 * La altura está reservada para que el cambio de frase no mueva el resto de la portada.
 * Se detiene al pasar el mouse o al enfocarla, y hay un botón (visible con teclado) para pausarla.
 */
export default function ManagerQuoteFlash({ quotes = MANAGER_QUOTES }) {
  const list = useMemo(() => publishableQuotes(quotes), [quotes])
  const [hover, setHover] = useState(false)
  const [stopped, setStopped] = useState(false)
  const { quote, phase, reduced } = useQuoteCycle(list, { paused: hover || stopped })
  const shown = phase === 'enter' || phase === 'visible'

  return (
    <div
      className="relative flex min-h-[6.5rem] w-full max-w-xl flex-col items-center justify-end sm:min-h-[7rem]"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <figure
        data-phase={phase}
        className={cn(
          'transition-[opacity,translate,scale,filter] duration-700 ease-out-quart',
          shown ? 'translate-y-0 scale-100 opacity-100 blur-none' : 'translate-y-1.5 scale-[0.98] opacity-0 blur-[2px]'
        )}
      >
        <blockquote className="text-balance text-base font-light leading-snug text-fg-muted sm:text-xl">
          <p>“{quote.text}”</p>
        </blockquote>
        {quote.manager && (
          <figcaption className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-fg-subtle">— {quote.manager}</figcaption>
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
    </div>
  )
}
