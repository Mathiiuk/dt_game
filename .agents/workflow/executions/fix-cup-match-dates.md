# Ejecución: fix-cup-match-dates
La copa se podía jugar apenas se abría la pantalla, tomaba clubes de cualquier carrera, el torneo era uno solo por temporada para todos los usuarios, repetía las semifinales si se llamaba dos veces y dejaba de avanzar si el usuario perdía.
Ahora (como en la vida real):
- `src/domain/cupTournament.js` (puro, 10 tests): calendario fijo (sorteo 1 de septiembre, cuartos el primer miércoles desde el 15 de septiembre, semis 5 semanas después, final un sábado), clasificación de los 8 mejores de la liga, cruces 1º-8º/4º-5º/3º-6º/2º-7º, y `planTournamentStep` que decide qué simular y qué fase crear.
- `internationalCupApi`: torneo por LIGA del usuario, sorteo con su tabla, los partidos de IA se juegan solos al llegar su fecha (deterministas por fuerza de plantel), las fases se crean una sola vez y la copa sigue aunque el usuario quede afuera. `playUserMatch` rechaza jugar antes de la fecha.
- `calendarApi.advanceWeek`: un partido propio de copa vencido frena el avance, igual que la liga.
- Pantalla: antes del sorteo explica el calendario, si no clasificás lo dice y mira desde afuera, cada llave muestra su fecha y el botón sólo aparece el día.
- `src/lib/errors.js` (`friendlyError`): mensajes en castellano para errores de dominio y de la base (primer paso de B10), usado por Inicio, Calendario y Copa.
- Verificado en vivo: sorteo con la liga del usuario, cuartos jugados el 16/9, semis el 21/10.
- Pendiente (decidido): ida y vuelta queda para más adelante; el resultado sigue calculándose en el cliente hasta la Fase 5.
