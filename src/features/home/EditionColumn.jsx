import React from 'react'
import { Link } from 'react-router-dom'
import { track } from '../../lib/analytics'

const NOTES = [
  { to: '/tacticas', title: 'Armá tu once y tu táctica', text: 'Formación, instrucciones y química del grupo.' },
  { to: '/mercado-de-pases', title: 'Fichá y vendé jugadores', text: 'Mercado de pases, ojeadores y cantera.' },
  { to: '/guias/liga-con-amigos', title: 'Jugá con tus amigos', text: 'Salas con hasta diez DT y el reto del día.' }
]

/** "En esta edición": tres notas que llevan a páginas públicas. Solo en pantallas anchas (en el celular la portada es una sola pantalla). */
export default function EditionColumn() {
  return (
    <aside aria-label="En esta edición" className="hidden border-l border-line-strong pl-7 lg:block">
      <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-danger">En esta edición</p>
      <ul className="mt-1">
        {NOTES.map(note => (
          <li key={note.to} className="border-b border-line py-2.5">
            <Link
              to={note.to}
              onClick={() => track('game_info_click', { placement: 'edition', path: note.to })}
              className="block rounded-sm text-fg hover:text-primary"
            >
              <span className="block font-slab text-[1.0625rem] font-bold leading-snug">{note.title}</span>
              <span className="mt-0.5 block text-[0.8125rem] text-fg-muted">{note.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}
