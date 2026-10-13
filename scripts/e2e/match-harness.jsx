// Arnés de navegador para ver la pantalla del partido SIN sesión: usa los módulos reales y les cambia los datos por unos de prueba.
// Lo compila scripts/e2e/match-shots.mjs (que reemplaza el contexto del juego por uno fijo).
import React from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import '../../src/index.css'
import { authApi } from '../../src/api/auth'
import { managerApi } from '../../src/api/manager'
import { clubApi } from '../../src/api/club'
import { tacticsApi } from '../../src/api/tactics'
import { playerApi } from '../../src/api/player'
import { staffApi } from '../../src/api/staff'
import { chemistryApi } from '../../src/api/chemistry'
import { squadsApi } from '../../src/api/squads'
import { matchEngineApi } from '../../src/api/matchEngine'
import MatchScreen from '../../src/features/match/MatchScreen'

const NAMES = ['Esteban Moyano', 'Rodrigo Benítez', 'Federico Aranda', 'Mateo Martínez', 'Maximiliano Ledesma', 'Mauro Castro', 'Ramiro Medina', 'Mauro Aguirre', 'Santiago Gil', 'Rodrigo García', 'Tomás Luna', 'Nicolás Ibarra', 'Lucas Pereyra', 'Julián Roldán', 'Bruno Sosa', 'Agustín Peña', 'Facundo Ríos', 'Gonzalo Vera']
const POS = ['PO', 'DFC', 'DFC', 'LI', 'LD', 'MC', 'MC', 'MI', 'MD', 'DC', 'DC', 'PO', 'DFC', 'MC', 'MD', 'DC', 'LD', 'MI']
const players = NAMES.map((n, i) => {
  const [first, ...rest] = n.split(' ')
  return { id: `p${i}`, first_name: first, last_name: rest.join(' '), position: POS[i], attr_overall: 52 + ((i * 7) % 18), state_fitness: 70 + ((i * 3) % 30), attr_pace: 60, attr_shooting: 60, attr_finishing: 60, attr_passing: 60, attr_defending: 60, shirt_number: i + 1 }
})

authApi.getSession = async () => ({ id: 'u1' })
managerApi.getManager = async () => ({ id: 'm1' })
clubApi.getClubByManager = async () => ({ id: 'c1', name: 'Club Atlético Potrero', short_name: 'CAP', manager_id: 'm1', squad_morale: 70, primary_color: '#1F4E9D', secondary_color: '#F5C542', jersey_pattern: 'STRIPES_VERTICAL' })
tacticsApi.getTactic = async () => ({ formation: '4-4-2', lineup: Array.from({ length: 11 }, (_, i) => `p${i}`) })
playerApi.getSquad = async () => players
staffApi.getStaff = async () => [{ id: 's1', role: 'HEAD_SCOUT' }]
chemistryApi.getContext = async () => ({})
chemistryApi.withArchetypes = (p) => p
squadsApi.getClubSquad = async () => []
matchEngineApi.finalizeMatch = async () => {}

createRoot(document.getElementById('root')).render(
  <MemoryRouter initialEntries={['/match']}><Routes><Route path="/match" element={<MatchScreen />} /></Routes></MemoryRouter>
)
