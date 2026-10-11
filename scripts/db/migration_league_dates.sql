-- Partidos de liga en el día de juego: la fecha de juego avanza de a 7 días desde el 1 de julio (miércoles en 2026) y los partidos
-- se generaban en sábado, así que "avanzar la semana" saltaba siempre el día del partido. Los partidos de liga que todavía no se
-- jugaron se mueven 3 días atrás (del sábado al miércoles): quedan en el primer día de su semana del calendario.
-- Solo cambia datos (no columnas ni funciones): la versión anterior de la app sigue funcionando. Es repetible: tras correrla ya
-- no queda ningún pendiente en sábado.
update public.fixtures
set match_date = match_date - 3
where status in ('SCHEDULED', 'PENDING')
  and extract(dow from match_date) = 6;
