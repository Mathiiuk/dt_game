import React from 'react'
import {
  CircleDot, Crosshair, Flag, Angry, Annoyed, Bandage, Brain, Briefcase, ChevronsDown, Cigarette, CircleCheck, CircleMinus, CircleX, Crown, Eye, Flame,
  Footprints, Frown, Gem, Glasses, Hand, Handshake, Meh, MessageSquareQuote, Mic, PartyPopper, ScanFace, Search, Shield, Smile,
  Sparkles, Star, Target, ThumbsDown, ThumbsUp, Trophy, Wrench, Zap
} from 'lucide-react'

const ICONS = {
  CircleDot, Crosshair, Flag, Angry, Annoyed, Bandage, Brain, Briefcase, ChevronsDown, Cigarette, CircleCheck, CircleMinus, CircleX, Crown, Eye, Flame,
  Footprints, Frown, Gem, Glasses, Hand, Handshake, Meh, MessageSquareQuote, Mic, PartyPopper, ScanFace, Search, Shield, Smile,
  Sparkles, Star, Target, ThumbsDown, ThumbsUp, Trophy, Wrench, Zap
}

/** Ícono vectorial a partir de su nombre (los datos del juego guardan el nombre, no el dibujo). Sin emojis. */
export function NamedIcon({ name, className = 'size-4', ...props }) {
  const Icon = ICONS[name] || Sparkles
  return <Icon className={className} aria-hidden="true" {...props} />
}
