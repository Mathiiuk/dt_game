// Contexto del juego fijo para el arnés del partido (sin sesión)
export const useGameContext = () => ({
  confirmAction: async () => true,
  club: { id: 'c1', name: 'Club Atlético Potrero', primary_color: '#1F4E9D', secondary_color: '#F5C542', jersey_pattern: 'STRIPES_VERTICAL' },
  manager: { id: 'm1', first_name: 'Matías', last_name: 'Gallardo' },
  user: { id: 'u1' },
  refreshContext: async () => {}
})
export const useGame = useGameContext
export const GameProvider = ({ children }) => children
export const RETIRED_ALLOWED_ROUTES = []
