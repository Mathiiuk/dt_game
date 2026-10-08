import React, { useLayoutEffect, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

const GAP = 8

/**
 * Lista paginada sin scroll: muestra tantos elementos como entran en el alto disponible y flechas para pasar de página.
 * El contenedor padre tiene que darle alto acotado (`flex` con `min-h-0`); con `perPage` se fija la cantidad a mano.
 * Mide el alto de los elementos una vez (con todos a la vista) y vuelve a medir sólo si cambia el tamaño del área.
 */
export function Pager({ items, perPage: fixed = null, render, className, label = 'Páginas' }) {
  const listRef = useRef(null)
  const [fit, setFit] = useState(fixed || 3)
  const [measuring, setMeasuring] = useState(!fixed)
  const [page, setPage] = useState(0)
  const perPage = fixed || fit
  const pages = Math.max(1, Math.ceil(items.length / perPage))

  // Medición: con todos los elementos a la vista se calcula cuántos entran
  useLayoutEffect(() => {
    if (fixed || !measuring) return
    const el = listRef.current
    if (!el) return
    // Sin layout (por ejemplo en pruebas) no hay nada que medir: se muestran todos
    if (!el.clientHeight) { setFit(Math.max(1, items.length)); setMeasuring(false); return }
    const heights = [...el.children].map(c => c.getBoundingClientRect().height)
    const tallest = Math.max(1, ...heights)
    setFit(Math.max(1, Math.floor((el.clientHeight + GAP) / (tallest + GAP))))
    setMeasuring(false)
  }, [measuring, fixed, items.length])

  // Si el área cambia de tamaño (rotar el teléfono, abrir el teclado), se vuelve a medir
  useEffect(() => {
    if (fixed || typeof ResizeObserver === 'undefined' || !listRef.current) return undefined
    let first = true
    const ro = new ResizeObserver(() => { if (first) { first = false; return } setMeasuring(true) })
    ro.observe(listRef.current)
    return () => ro.disconnect()
  }, [fixed])

  useEffect(() => { setPage(p => Math.min(p, pages - 1)) }, [pages])

  const visible = measuring ? items : items.slice(page * perPage, page * perPage + perPage)

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-hidden">
        {visible.map((item, i) => render(item, (measuring ? 0 : page * perPage) + i))}
      </div>
      {/* El control ocupa siempre su lugar (aunque sea una sola página) para que la medición no cambie al aparecer */}
      <nav aria-label={label} className={cn('flex shrink-0 items-center justify-between gap-3 pt-2', pages === 1 && 'invisible')} aria-hidden={pages === 1}>
        <button
          type="button"
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          aria-label="Página anterior"
          className="grid size-9 place-items-center rounded-lg border border-line bg-surface text-fg transition-colors hover:bg-surface-3 disabled:opacity-30"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <span className="flex items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: pages }, (_, i) => (
            <span key={i} className={cn('h-1.5 rounded-full transition-all', i === page ? 'w-5 bg-accent' : 'w-1.5 bg-surface-3')} />
          ))}
        </span>
        <span className="sr-only" aria-live="polite">Página {page + 1} de {pages}</span>
        <button
          type="button"
          onClick={() => setPage(p => Math.min(pages - 1, p + 1))}
          disabled={page >= pages - 1}
          aria-label="Página siguiente"
          className="grid size-9 place-items-center rounded-lg border border-line bg-surface text-fg transition-colors hover:bg-surface-3 disabled:opacity-30"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </nav>
    </div>
  )
}
