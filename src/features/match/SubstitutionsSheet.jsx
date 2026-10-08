import React from 'react'
import { ResponsiveOverlay } from '../../components/ui/responsive-overlay'
import SubstitutionsPanel from './SubstitutionsPanel'
import { benchOf, substitutionsLeft } from '../../domain/substitutions'

export default function SubstitutionsSheet({ 
  open, 
  onClose,
  preselectOutId,
  onField,
  sentOffIds,
  players,
  subsMade,
  onSubstitute
}) {
  return (
    <ResponsiveOverlay 
      open={open} 
      onClose={onClose} 
      title="Cambios y T�ctica" 
      placement="bottom"
      size="md"
    >
      <div className="py-2">
        <SubstitutionsPanel
          preselectOutId={preselectOutId}
          onField={onField.filter(p => !sentOffIds.has(p.id))}
          bench={benchOf(players, onField, subsMade)}
          subsLeft={substitutionsLeft(subsMade)}
          onSubstitute={(subIn, subOut) => {
            onSubstitute(subIn, subOut)
            onClose() // Cerrar al realizar el cambio
          }}
        />
      </div>
    </ResponsiveOverlay>
  )
}
