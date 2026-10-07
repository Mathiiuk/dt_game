# Specification — cash-server-primitive

## 1. Objetivo
Etapa 1 de M2: que la caja del club se mueva en el servidor, con fondos verificados y asiento contable, en vez de leer-restar-escribir desde el navegador.

## 2. Problema
Costos de decisiones, obras del estadio, mejoras, personal, ojeo, cantera, multas y taquilla escribían `clubs.budget` desde el navegador: nadie comprobaba los fondos en el servidor y un cliente alterado podía "arreglarse" la caja.

## 3. Resultado esperado
- `club_cash_move` (SQL, SECURITY INVOKER, `search_path` fijo): bloquea el club, verifica fondos (salvo `p_allow_negative`), actualiza la caja y escribe el asiento con temporada y semana de la fecha de juego; idempotente con `p_ref`.
- `financesApi.moveCash` en el cliente.
- Migrados: costo y efecto de los dilemas (una sola escritura), mejora de instalaciones y obras del estadio.

## 4. Alcance
No incluido (siguientes etapas de M2): personal, ojeo, cantera, directiva, multas, taquilla, y el disparador final que impida escribir `budget` desde el navegador (requiere que todas las funciones del servidor fijen la marca antes de actualizar la caja).

## 5. Criterios de aceptación
- [x] AC-01: gasto con fondos, ingreso, gasto sin fondos rechazado, negativo permitido y repetición por referencia (probado en la base con rollback).
- [x] AC-02: los tres sitios migrados no escriben `budget` desde el navegador.
- [x] AC-03: verificado en el navegador: dilema de -$400 baja la caja y deja el asiento.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/cash-server-primitive.yml`
