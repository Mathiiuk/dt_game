import React from 'react'
import { ResponsiveOverlay } from '../../components/ui/responsive-overlay'
import DecisionCard from './DecisionCard'

export default function DecisionSheet({ 
  open, 
  moment,
  onChoose
}) {
  if (!moment) return null
  
  return (
    <ResponsiveOverlay 
      open={open}
      title="¡Momento Crítico!" 
      placement="center"
      size="sm"
    >
      <div className="py-2">
        <DecisionCard moment={moment} onChoose={onChoose} />
      </div>
    </ResponsiveOverlay>
  )
}
