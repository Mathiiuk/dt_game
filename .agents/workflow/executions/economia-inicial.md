# Economía inicial y simulación anual

- Diagnóstico con la simulación de un año completo (usuario de prueba contra producción): con el calendario actual el club arranca con $20.000 y termina la temporada con unos $133.000 (38 partidos, 5.º puesto, cierre completo, año 2 en marcha, **sin avisos ni errores**). La economía no es negativa por diseño.
- Causa real del club en negativo (−$17.416): los 4 clubes creados el 6/10, antes del calendario balanceado, tenían **1 partido de local y 18 de visitante** en una liga de 19 fechas. Sin taquilla de local (unos $9.000 netos por partido) los ingresos fijos (~$1.150 por semana) no alcanzan para los gastos (~$2.950) y la caja se hunde.
- Reparación aplicada en producción (`scripts/db/repair_home_away_balance.sql`): se dio vuelta la localía de los partidos programados de los 3 clubes activos afectados; ahora tienen 10 de local y 9 de visitante. Los partidos jugados no se tocan. El cuarto club (sin DT) ya no tiene partidos programados.
- Salvaguarda: `tests/domain/homeAwayBalance.test.js` exige 9 o 10 partidos de local por rueda y no más de 3 de visitante seguidos (20 clubes en tres órdenes y 19 clubes con descanso), y fija que sin taquilla la semana es deficitaria pero con un partido de local cada dos semanas la caja crece.
- Usuario de prueba de la simulación: se borra al terminar con la función `delete-account`.
