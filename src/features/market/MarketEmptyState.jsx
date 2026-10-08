import React from 'react'
import { Users } from 'lucide-react'
import { Card, EmptyState, Button } from '../../components/ui'

export default function MarketEmptyState({ hasFilters = false, onClearFilters }) {
  return (
    <Card as="div" className="border border-line bg-surface/80">
      <EmptyState
        icon={Users}
        title="Sin candidatos"
        description={
          hasFilters
            ? 'Ningún jugador coincide con los filtros actuales.'
            : 'No hay jugadores disponibles en el mercado por ahora.'
        }
        action={
          hasFilters && (
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              Quitar filtros
            </Button>
          )
        }
      />
    </Card>
  )
}
