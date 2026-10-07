# Specification — season-expiring-contracts

## 1. Objetivo
Que el DT sepa antes de cerrar la temporada qué jugadores quedan libres, para renovarlos a tiempo.

## 2. Problema
Al cerrar la temporada los jugadores con contrato vencido quedan libres. La gala solo decía "los sin renovación quedan libres": en la cuenta de prueba el plantel se vació a 1 jugador sin ningún aviso concreto.

## 3. Resultado esperado
La gala muestra cuántos jugadores quedan libres y los mejores por nombre y nivel, con la indicación de renovar desde el plantel antes de cerrar. El aviso desaparece una vez cerrada la temporada.

## 4. Alcance
`seasonCloseApi.getExpiringContracts` y la gala. No incluido: renovar desde la propia gala.

## 5. Criterios de aceptación
- [x] AC-01: la lista usa el mismo corte que el cierre (contrato hasta el 30 de junio del año siguiente).
- [x] AC-02: orden por nivel.
- [x] AC-03: la gala muestra el aviso.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/season-expiring-contracts.yml`
