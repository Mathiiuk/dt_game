import React from 'react'
import { ArrowDownRight, ArrowUpRight, Receipt } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle, CardDescription, EmptyState } from '../../components/ui'
import { formatMoney } from '../../lib/format'

export default function FinancesTransactionFeed({ transactions = [] }) {
  return (
    <Card as="section" aria-label="Movimientos" className="border border-line bg-surface/90">
      <CardHeader className="flex-wrap items-center justify-between border-b border-line pb-3">
        <div>
          <CardTitle className="text-base font-bold font-display text-fg">Últimos movimientos</CardTitle>
          <CardDescription className="text-xs">Registro histórico de ingresos y egresos de caja</CardDescription>
        </div>
        <span className="text-xs text-fg-subtle">{transactions.length} registros</span>
      </CardHeader>

      <CardBody className="p-4">
        {transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Sin movimientos"
            description="Los débitos y créditos se anotan durante los avances semanales y traspasos."
            className="py-8"
          />
        ) : (
          <>
            {/* Móvil: lista de tarjetas compactas */}
            <ul className="divide-y divide-line/60 md:hidden">
              {transactions.map((tx) => {
                const income = Number(tx.amount) >= 0
                return (
                  <li key={tx.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg border ${income ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-rose-500/10 text-rose-400 border-rose-500/25'}`}>
                        {income ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-fg truncate">{tx.description}</p>
                        <p className="text-[11px] text-fg-subtle">
                          Semana {tx.week_number} · Saldo {formatMoney(tx.balance_after)}
                        </p>
                      </div>
                    </div>
                    <p className={`num shrink-0 font-bold text-xs ${income ? 'text-accent' : 'text-danger'}`}>
                      {income ? '+' : ''}{formatMoney(tx.amount)}
                    </p>
                  </li>
                )
              })}
            </ul>

            {/* Desktop: tabla clara */}
            <table className="hidden w-full text-left text-xs md:table" aria-label="Movimientos contables">
              <thead>
                <tr className="border-b border-line text-fg-subtle">
                  <th scope="col" className="eyebrow pb-2">Semana</th>
                  <th scope="col" className="eyebrow pb-2">Descripción</th>
                  <th scope="col" className="eyebrow pb-2 text-right">Monto</th>
                  <th scope="col" className="eyebrow pb-2 text-right">Saldo posterior</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {transactions.map((tx) => {
                  const income = Number(tx.amount) >= 0
                  return (
                    <tr key={tx.id} className="hover:bg-surface-2/40 transition-colors">
                      <td className="num py-2.5 text-fg-muted font-medium">Sem {tx.week_number}</td>
                      <td className="py-2.5 font-semibold text-fg">{tx.description}</td>
                      <td className={`num py-2.5 text-right font-bold ${income ? 'text-accent' : 'text-danger'}`}>
                        {income ? '+' : ''}{formatMoney(tx.amount)}
                      </td>
                      <td className="num py-2.5 text-right text-fg-muted">{formatMoney(tx.balance_after)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </>
        )}
      </CardBody>
    </Card>
  )
}
