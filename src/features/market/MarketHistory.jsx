import React from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Badge } from '../../components/ui'
import { formatMoney } from '../../lib/format'

export default function MarketHistory({ history = [] }) {
  if (!history || history.length === 0) return null

  return (
    <details className="group" aria-label="Historial de negociaciones">
      <summary className="flex cursor-pointer items-baseline gap-3 text-sm">
        <h3 className="font-slab text-sm font-bold text-fg">Últimas negociaciones del período</h3>
        <span className="h-0 grow border-b border-line-strong" aria-hidden="true" />
        <span className="text-xs text-fg-subtle">{history.length} {history.length === 1 ? 'operación' : 'operaciones'}</span>
      </summary>
      <ul className="mt-1 divide-y divide-line text-xs">
        {history.map((item, idx) => (
          <li key={item.id || idx} className="flex items-center justify-between gap-2 py-2">
            <div className="flex min-w-0 items-center gap-2">
              {item.status === 'ACCEPTED' ? <CheckCircle2 className="size-4 shrink-0 text-accent" /> : <XCircle className="size-4 shrink-0 text-danger" />}
              <span className="truncate"><span className="font-semibold text-fg">{item.playerName}</span><span className="ml-1.5 text-fg-muted">({item.position} · {item.clubName || 'Libre'})</span></span>
            </div>
            {item.status === 'ACCEPTED' ? <Badge tone="accent">Acuerdo · {formatMoney(item.price)}</Badge> : <Badge tone="danger">Mesa levantada</Badge>}
          </li>
        ))}
      </ul>
    </details>
  )
}
