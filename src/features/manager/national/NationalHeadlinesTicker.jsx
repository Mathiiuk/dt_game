import React from 'react'
import { Newspaper } from 'lucide-react'

export default function NationalHeadlinesTicker({ headlines = [] }) {
  if (!headlines || headlines.length === 0) return null

  return (
    <div className="rounded-xl border border-line bg-surface/70 p-3 flex items-center gap-3 overflow-hidden shadow-inner">
      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-accent/10 border border-accent/20 text-accent shrink-0">
        <Newspaper className="size-3.5" />
        <span className="text-[11px] font-bold uppercase tracking-wider">Diarios</span>
      </div>
      
      <div className="flex-1 overflow-x-auto no-scrollbar whitespace-nowrap text-xs text-fg">
        {headlines.map((text, idx) => (
          <span key={idx} className="mr-6 inline-flex items-center gap-2">
            <span className="text-fg-subtle">•</span>
            <span className="italic font-medium">"{text}"</span>
          </span>
        ))}
      </div>
    </div>
  )
}
