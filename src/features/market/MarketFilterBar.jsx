import React from 'react'
import { Filter, RotateCcw, Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import { ChoiceChips, Input, Select, Button } from '../../components/ui'
import { POSITION_GROUP_OPTIONS } from '../../domain/squad'
import { MARKET_SORT_OPTIONS } from '../../domain/market'

export const MARKET_CHIP_OPTIONS = [
  { value: 'ALL', label: 'Todos' },
  { value: 'FREE', label: 'Libres' },
  { value: 'BARGAINS', label: 'Gangas' },
  { value: 'PROSPECTS', label: 'Pibes' },
  { value: 'AFFORDABLE', label: 'Mi billetera' }
]

export default function MarketFilterBar({
  group,
  onGroupChange,
  activeChip,
  onChipChange,
  query,
  onQueryChange,
  minPace,
  onMinPaceChange,
  sortKey,
  onSortKeyChange,
  hasFilters,
  onClearFilters
}) {
  return (
    <section aria-label="Filtros" className="mb-6 space-y-3">
      {/* 1. Chips de Posición por Línea */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <ChoiceChips
          label="Filtrar por línea"
          value={group}
          onChange={onGroupChange}
          options={POSITION_GROUP_OPTIONS}
        />

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="self-start text-xs text-fg-muted hover:text-fg sm:self-auto"
          >
            <RotateCcw className="size-3.5 mr-1" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* 2. Chips de Estrategia Arcade */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" role="group" aria-label="Filtros rápidos de mercado">
        {MARKET_CHIP_OPTIONS.map((chip) => {
          const isActive = activeChip === chip.value
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => onChipChange(chip.value)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-accent text-accent-contrast shadow-sm shadow-accent/20 scale-[1.02]'
                  : 'bg-surface-2 border border-line text-fg-muted hover:text-fg hover:border-line-focus'
              }`}
            >
              {chip.label}
            </button>
          )
        })}
      </div>

      {/* 3. Búsqueda y Ordenamiento */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-12 lg:items-center">
        <div className="relative sm:col-span-2 lg:col-span-6">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Buscar jugador o club"
            placeholder="Buscar por nombre o club..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        <div className="lg:col-span-3">
          <Input
            type="number"
            inputMode="numeric"
            min="0"
            max="99"
            aria-label="Ritmo mínimo"
            placeholder="Ritmo mínimo"
            value={minPace}
            onChange={(e) => onMinPaceChange(e.target.value)}
            className="text-sm"
          />
        </div>

        <div className="lg:col-span-3">
          <Select
            aria-label="Ordenar por"
            value={sortKey}
            onChange={(e) => onSortKeyChange(e.target.value)}
            className="text-sm"
          >
            {MARKET_SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Ordenar por {o.label.toLowerCase()}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </section>
  )
}
