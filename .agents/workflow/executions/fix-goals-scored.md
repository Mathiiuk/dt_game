# Ejecución: fix-goals-scored
Causa y efectos encontrados en el post-partido:
1. `goals_scored` nunca subía: el historial de jugadores recibía `scorers` vacío. Ahora se arma desde las calificaciones (`scorersFromRatings`).
2. Todo el plantel (20) se cansaba, sumaba minutos, recibía calificación y `matches_played` aunque sólo jueguen 11 (el MVP podía ser alguien del banco). Ahora MatchScreen envía `starterIds` y sólo los titulares participan (`selectParticipants`); el resto vive el resultado con la mitad del impacto en la moral.
3. El asistidor sumaba el gol del goleador porque su nombre aparece en el texto del evento. `isGoalBy` usa `playerId` y, sólo en eventos viejos, el texto "Golazo de ...".
9 tests nuevos (199 en total).
