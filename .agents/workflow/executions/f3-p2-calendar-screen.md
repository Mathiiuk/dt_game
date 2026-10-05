# Ejecución: f3-p2-calendar-screen

- Dominio `src/domain/calendarView.js` (filtros por fase/mercado/partidos, detección del partido vencido que bloquea el avance).
- CalendarScreen rediseñada: resumen (semana, fase, fecha, mercado), filtros accesibles, lista semántica `ol` con `aria-current`, local/visitante y resultado; si hay un partido vencido el botón de avance se reemplaza por "Jugar el partido pendiente" con aviso.
- Verificado a 375 px: 52 semanas sin desborde. 152 tests en verde.
