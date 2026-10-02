import { create } from 'zustand'

export const useGameStore = create((set) => ({
  gameState: 'start', // start, playing, gameover
  managerName: '',
  managerStyle: '', // tactical, motivator, developer
  year: 2024,
  week: 1,
  club: 'Rojo de Avellaneda',
  division: 3, // 3: Ascenso, 2: Segunda, 1: Primera
  stats: {
    board: 50,
    squad: 50,
    fans: 50
  },
  
  startGame: (name, style) => set({ 
    managerName: name, 
    managerStyle: style, 
    gameState: 'playing',
    stats: { board: 60, squad: 60, fans: 60 } // Initial boost
  }),
  
  updateStat: (stat, amount) => set((state) => {
    const newValue = Math.min(100, Math.max(0, state.stats[stat] + amount));
    const newStats = { ...state.stats, [stat]: newValue };
    
    // Check game over condition
    if (newStats.board === 0 || newStats.squad === 0 || newStats.fans === 0) {
      return { stats: newStats, gameState: 'gameover' };
    }
    
    return { stats: newStats };
  }),

  advanceWeek: () => set((state) => ({
    week: state.week >= 4 ? 1 : state.week + 1,
    year: state.week >= 4 ? state.year + 1 : state.year
  })),

  resetGame: () => set({
    gameState: 'start',
    managerName: '',
    managerStyle: '',
    year: 2024,
    week: 1,
    stats: { board: 50, squad: 50, fans: 50 }
  })
}))
