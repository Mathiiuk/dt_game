import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchTopManagers } from '../../lib/publicRanking'
import { profilePath } from '../../lib/publicProfile'

const fmt = (n) => new Intl.NumberFormat('es-AR').format(n)

/**
 * "Los mejores DT": los DT con más puntos de legado, mezclados con cinco leyendas: los DT argentinos más ganadores de la historia (600 puntos por título).
 * Si no se puede cargar, no se muestra nada: la portada no depende de esto.
 */
export default function TopManagersTable({ limit = 3 }) {
  const [state, setState] = useState({ status: 'loading', rows: [] })

  useEffect(() => {
    const ctrl = new AbortController()
    fetchTopManagers(limit, { signal: ctrl.signal })
      .then(rows => setState({ status: 'ready', rows }))
      .catch(() => { if (!ctrl.signal.aborted) setState({ status: 'error', rows: [] }) })
    return () => ctrl.abort()
  }, [limit])

  if (state.status === 'error') return null
  const loading = state.status === 'loading'

  return (
    <section aria-label="Los mejores DT" aria-busy={loading} className="min-h-[9rem]">
      <p className="font-display text-[0.78rem] font-bold uppercase tracking-[0.18em] text-danger lg:text-sm">Los mejores DT</p>
      <p className="text-xs text-fg-muted">Puntos de legado en toda su carrera</p>
      {loading ? (
        <div className="mt-2 space-y-1.5" aria-hidden="true">
          {Array.from({ length: 3 }, (_, i) => <div key={i} className="h-6 rounded-sm bg-surface-2" />)}
        </div>
      ) : state.rows.length === 0 ? (
        <p className="mt-2 text-sm text-fg-muted">Todavía no hay DT en la tabla. ¡Sé el primero en llegar!</p>
      ) : (
        <table aria-label="Los mejores DT por puntos de legado" className="mt-1.5 w-full text-left text-sm">
          <thead className="sr-only">
            <tr><th scope="col">Puesto</th><th scope="col">DT</th><th scope="col">Puntos</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {state.rows.map(r => (
              <tr key={`${r.rank}-${r.name}-${r.points}`}>
                <td className="num w-7 py-1 font-display text-base font-bold text-fg">{r.rank}</td>
                <td className="truncate py-1 font-semibold text-fg">
                  {r.slug ? <Link to={profilePath(r.slug)} className="hover:underline">{r.name}</Link> : r.name}
                  {r.legend && <span className="ml-1.5 align-middle font-display text-[0.65rem] font-bold uppercase tracking-[0.14em] text-danger">Leyenda</span>}
                </td>
                <td className="num py-1 text-right font-display text-base font-bold text-fg">{fmt(r.points)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && state.rows.some(r => r.legend) && (
        <p className="mt-1.5 text-xs text-fg-muted">Las leyendas son los DT más ganadores de la historia argentina: ¡superalos!</p>
      )}
    </section>
  )
}
