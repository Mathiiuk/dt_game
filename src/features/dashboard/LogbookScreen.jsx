import React, { useEffect, useState } from 'react'
import { History, Zap, Filter } from 'lucide-react'
import { climateApi } from '../../api/climate'
import { useGameContext } from '../../context/GameContext'
import { PageHeader, Card, CardBody, Badge, Segmented } from '../../components/ui'

const SOURCE_LABELS = {
  ALL: 'Todos',
  MATCH: 'Partido',
  PRESS: 'Prensa',
  MARKET: 'Mercado',
  EVENT: 'Evento',
  BARRA: 'Barra',
  COMBO: 'Combo'
}

export default function LogbookScreen() {
  const { club } = useGameContext()
  const [items, setItems] = useState(null)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    if (!club?.id) return
    let alive = true
    // Traemos más límite para la bitácora completa
    climateApi.getRecent(club.id, 100).then(rows => {
      if (alive) setItems(rows)
    }).catch(() => {
      if (alive) setItems([])
    })
    return () => { alive = false }
  }, [club?.id])

  const filteredItems = items?.filter(item => filter === 'ALL' || item.source === filter) || []

  // Agrupar por semana
  const groupedItems = filteredItems.reduce((acc, item) => {
    const w = item.week_number
    if (!acc[w]) acc[w] = []
    acc[w].push(item)
    return acc
  }, {})

  const sortedWeeks = Object.keys(groupedItems).map(Number).sort((a, b) => b - a)

  return (
    <div className="mx-auto max-w-4xl py-6 sm:py-8 lg:py-10">
      <PageHeader
        title="Bitácora"
        eyebrow="Tus decisiones"
        description="El registro histórico de todo lo que afectó al club."
        icon={History}
      />

      <div className="mb-6 flex overflow-x-auto pb-2">
        <Segmented
          label="Filtro"
          size="sm"
          value={filter}
          onChange={setFilter}
          options={Object.keys(SOURCE_LABELS).map(k => ({ value: k, label: SOURCE_LABELS[k] }))}
        />
      </div>

      <div className="space-y-6">
        {items === null ? (
          <p className="text-sm text-fg-subtle">Cargando bitácora...</p>
        ) : sortedWeeks.length === 0 ? (
          <p className="text-sm text-fg-muted">No hay registros para este filtro.</p>
        ) : (
          sortedWeeks.map(week => (
            <Card key={week}>
              <CardBody className="p-4 sm:p-5">
                <h3 className="mb-4 text-sm font-semibold text-fg-muted">Semana {week}</h3>
                <ul className="divide-y divide-line">
                  {groupedItems[week].map(item => (
                    <li key={item.id} className="py-3 text-sm">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <Badge tone="surface">{SOURCE_LABELS[item.source] || item.source}</Badge>
                        {item.source === 'COMBO' && <Badge tone={/Círculo vicioso/.test(item.message) ? 'danger' : 'accent'}><Zap className="size-3" aria-hidden="true" />{/Círculo vicioso/.test(item.message) ? 'Círculo vicioso' : 'Combo'}</Badge>}
                        {item.fans !== 0 && <Badge tone={item.fans > 0 ? 'success' : 'danger'}>Hinchada {item.fans > 0 ? '+' : ''}{item.fans}</Badge>}
                        {item.board !== 0 && <Badge tone={item.board > 0 ? 'success' : 'danger'}>Dirigencia {item.board > 0 ? '+' : ''}{item.board}</Badge>}
                        {item.locker !== 0 && <Badge tone={item.locker > 0 ? 'success' : 'danger'}>Vestuario {item.locker > 0 ? '+' : ''}{item.locker}</Badge>}
                        {item.message.includes('-$') && <Badge tone="danger">Caja -${item.message.split('-$')[1]?.replace(/[^0-9]/g, '')}</Badge>}
                        {item.message.includes('+$') && <Badge tone="success">Caja +${item.message.split('+$')[1]?.replace(/[^0-9]/g, '')}</Badge>}
                      </div>
                      <p className="text-fg leading-relaxed">{item.message}</p>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
