# Specification — cash-server-migrate-rest

## 1. Objetivo
Cerrar M2: que ninguna escritura de la caja del club salga del navegador.

## 2. Cambios
- Migrados a `financesApi.moveCash` (servidor): cantera (mejora y ojeo de juveniles), aporte extraordinario de la directiva, ojeo (dos caminos), finiquitos del personal, multas (auditoría y prensa), taquilla (con referencia por partido: no se acredita dos veces) y `recordTransaction`.
- Eliminado `src/api/season.js` (código muerto que escribía la caja y no se usaba).
- Migración `migration_protect_club_cash.sql`: las 7 funciones del servidor que tocan la caja fijan la marca `app.server_result` en su cuerpo (Supabase no permite fijarla con `ALTER FUNCTION`) y un disparador rechaza todo cambio de `clubs.budget` que no venga de ellas; al crear un club desde el navegador, la caja inicial se limita a 25.000.

## 3. Pruebas
Tests de los caminos migrados (`tests/api/cashMove.test.js`, 8) y de los viejos adaptados; base real: el UPDATE directo es rechazado, `club_cash_move`, `close_week_finances` y `settle_season_prize` funcionan, el INSERT se limita a 25.000; navegador: partidos, decisiones y semanas sin errores de caja.

## 4. Límites conocidos
La taquilla acreditada la calcula el navegador (asistencia y precio): el servidor garantiza que entra una sola vez y que queda asentada, pero no recalcula la asistencia. Pasar la fórmula de asistencia al servidor queda como mejora.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/cash-server-migrate-rest.yml`
