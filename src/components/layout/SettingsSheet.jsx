import React from 'react'
import { GraduationCap } from 'lucide-react'
import { Dialog, DialogContent, DialogBody, DialogFooter, Card } from '../ui'
import { useGameContext } from '../../context/GameContext'
import DifficultySelector from '../../features/dashboard/DifficultySelector'
import NotificationsCard from '../../features/notifications/NotificationsCard'
import ThemeToggle from '../../features/more/ThemeToggle'
import PublicRankingCard from '../../features/more/PublicRankingCard'
import { EVENT_START_TOUR } from '../../features/tutorial/tourState'
import { APP_VERSION } from '../../lib/appVersion'

/**
 * Menú de ajustes de escritorio (panel lateral): apariencia (claro por defecto), dificultad, avisos y privacidad.
 * En el celular las mismas tarjetas viven en la página "Más".
 */
export default function SettingsSheet({ open, onOpenChange }) {
  const { club, user, manager } = useGameContext()

  const startTour = () => {
    onOpenChange(false)
    window.dispatchEvent(new Event(EVENT_START_TOUR))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent placement="right" size="md" title="Ajustes" description="Apariencia, avisos y privacidad">
        <DialogBody className="space-y-6">
          <ThemeToggle />

          <section aria-labelledby="settings-game">
            <h2 id="settings-game" className="eyebrow mb-2 px-1">Ajustes de partida</h2>
            <Card as="div" className="p-4">
              <DifficultySelector clubId={club?.id} />
            </Card>
          </section>

          <NotificationsCard userId={user?.id} />

          {manager && <PublicRankingCard key={manager.id} manager={manager} />}

          <button
            type="button"
            onClick={startTour}
            className="flex min-h-12 w-full items-center gap-3 rounded-md border border-line bg-surface px-3 text-left text-sm font-semibold text-fg transition-colors hover:bg-surface-2"
          >
            <GraduationCap className="size-5 text-accent" aria-hidden="true" />
            Ver el tutorial
          </button>
        </DialogBody>
        <DialogFooter className="justify-between text-xs text-fg-subtle sm:flex-row">
          <span>Vestuario {APP_VERSION}</span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
