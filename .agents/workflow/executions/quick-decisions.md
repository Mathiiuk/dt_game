# quick-decisions

Decisiones rápidas del DT en el partido, todas con efecto real sobre el resultado.

- Motor (`simulateMatch`): `changes` admite efectos (`buff` {att, def, mid} + `duration`) además de cambios de jugadores. Los gritos del DT, antes decorativos, ahora multiplican ataque, defensa y mediocampo 15 minutos, con enfriamiento de 15.
- Se corrigió un error del motor: la probabilidad de gol usaba siempre el ataque del local, aunque atacara la visita.
- La roja deja al equipo con diez (-8% por expulsado) y quien sigue lesionado juega con molestias (-4%) hasta que se lo cambia; el posesión sale del mediocampo efectivo de cada minuto.
- `domain/quickDecisions.js`: charla de entretiempo (minuto 45; elogiar rinde según el humor del vestuario), roja propia y del rival, lesión propia (sacarlo abre los cambios con él marcado), ir perdiendo por 2 pasado el 60, ganar pasado el 75. Cada momento sale una vez y pausa el partido solo.
- `MatchScreen` aplica cada decisión rejugando el partido con la misma semilla (hasta el minuto actual todo queda igual) y guarda el resultado para que recargar no la deshaga.
- Prensa relámpago: no se hizo; la conferencia posterior al partido ya cubre ese rol. Banco mínimo de 70: descartado por el usuario.
- Tests: motor (efectos, visitante, posesión, roja), dominio, tarjeta y pantalla con reloj (entretiempo, grito con enfriamiento, lesión).
