import React from 'react'
import { CheckCircle2, History, XCircle } from 'lucide-react'
import { Card, CardBody, Badge } from '../../components/ui'
import { formatMoney } from '../../lib/format'

export default function MarketHistory({ history = [] }) {
  if (!history || history.length === 0) return null

  return (
    <Card as="section" aria-label="Historial de negociaciones" className="mb-6 border border-line bg-surface/90">
      <CardBody className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="size-4 text-accent" />
            <h3 className="font-display text-sm font-bold text-fg">Últimas negociaciones del período</h3>
          </div>
          <span className="text-xs text-fg-subtle">{history.length} {history.length === 1 ? 'operación' : 'operaciones'}</span>
        </div>

        <ul className="divide-y divide-line/60 text-xs">
          {history.map((item, idx) => (
            <li key={item.id || idx} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                {item.status === 'ACCEPTED' ? (
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="size-4 text-danger shrink-0" />
                )}
                <div>
                  <span className="font-semibold text-fg">{item.playerName}</span>
                  <span className="text-fg-muted ml-1.5">({item.position} · {item.clubName || 'Libre'})</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {item.status === 'ACCEPTED' ? (
                  <Badge tone="accent">
                    Acuerdo · {formatMoney(item.price)}
                  </Badge>
                ) : (
                  <Badge tone="danger">
                    Mesa levantada
                  </Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}
