# Ejecución: fix-advance-week-calendar

Causa: el calendario de la carrera (career_calendar) podía quedar desfasado de la fecha del club (club restablecido: calendario en semana 10/02-sep y club en 08-jul), y Calendario usaba un calendario virtual (careerId null). Resultado: ERR_MATCH_MUST_BE_PLAYED_FIRST falso (se comparaba contra la fecha desfasada) y avance que no cambiaba nada en pantalla.

- `calendarApi.reconcileWithClub`: la fecha del club es la fuente de verdad; alinea semana/fecha/temporada y lo persiste.
- `getSeasonCalendar` y `advanceWeek` lo aplican; `resolveCareerId` extraído y reutilizado por gameLoop y Calendario.
- Calendario avanza con `gameLoopApi.advanceWeek` (igual que Inicio: dirigencia y auditoría) y traduce el error de partido pendiente.
- Verificado en el navegador: semana 2 → 3 (15 jul). 135 tests en verde.
