import React from 'react'
import { Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from './ui'
import { momentCard } from '../domain/momentShare'
import { shareMoment } from '../lib/shareMatch'
import { track } from '../lib/analytics'

/** Botón para compartir un momento del club (campeonato, ascenso, fichaje, temporada) como tarjeta con imagen */
export default function ShareMomentButton({ moment, label = 'Compartir', variant = 'outline', className }) {
  const share = async () => {
    const card = momentCard(moment)
    const how = await shareMoment(card)
    track('share_moment', { placement: card.kind })
    if (how === 'copied') toast.success('Copiado: pegalo donde quieras.')
  }
  return <Button variant={variant} className={className} onClick={share}><Share2 />{label}</Button>
}
