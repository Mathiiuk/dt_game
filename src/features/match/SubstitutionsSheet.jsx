import React from 'react'
import InteractiveSubstitutionsModal from './InteractiveSubstitutionsModal'
import { benchOf, substitutionsLeft } from '../../domain/substitutions'

export default function SubstitutionsSheet({ 
  open, 
  onClose,
  preselectOutId,
  onField = [],
  sentOffIds = new Set(),
  players = [],
  subsMade = [],
  onSubstitute,
  tactic,
  layout = null,
  statusById = {}
}) {
  const eligibleOnField = onField.filter(p => !sentOffIds.has(p.id))
  const bench = benchOf(players, onField, subsMade)
  const subsLeft = substitutionsLeft(subsMade)

  return (
    <InteractiveSubstitutionsModal
      open={open}
      onClose={onClose}
      onField={eligibleOnField}
      bench={bench}
      subsLeft={subsLeft}
      onSubstitute={onSubstitute}
      preselectOutId={preselectOutId}
      tactic={tactic}
      layout={layout}
      statusById={statusById}
    />
  )
}
