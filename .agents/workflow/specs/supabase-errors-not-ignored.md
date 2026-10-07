# Specification — supabase-errors-not-ignored

## 1. Objetivo
Que un error de lectura de Supabase no se trate como "no hay datos".

## 2. Problema
El lint mostró cinco lugares que ignoraban el `error` de una consulta (misma clase de fallo silencioso que ocultaba `clubs.logo_url`). Los más graves:
- `getStandings`: ante un error de red creaba otra liga con 19 rivales nuevos encima de la existente.
- `generateInitialSquad`: ante un error generaba otro plantel encima del existente.
- `resolveEvent`: si no se leía el club se salteaba el chequeo de fondos de la opción con costo (se podía gastar sin caja).
- `getOrCreateCalendar`: ante un error de lectura intentaba insertar otro calendario.
- `getClubTrainingPlan`: variable de error sin uso (el upsert ya es idempotente, sin cambio de comportamiento).

## 3. Resultado esperado
Cada caso corta con el error (o cae en su respaldo existente) sin escribir nada.

## 5. Criterios de aceptación
- [x] AC-01: con la lectura fallando no se insertan competiciones, jugadores ni calendarios.
- [x] AC-02: sin poder leer el club la opción con costo no se ejecuta.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/supabase-errors-not-ignored.yml`
