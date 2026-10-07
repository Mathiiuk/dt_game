# Reporte de Ejecución: Red de Contención Financiera (M11)

## Resumen
Se implementó el blindaje financiero para las primeras 8 semanas del juego (M11) para evitar que los usuarios principiantes queden en bancarrota antes de hacer pie en la liga.

## Tareas Completadas

1. **Pretemporada sin drenaje**: La dirigencia ahora cubre el **100% de los sueldos del plantel** durante la pretemporada (hasta el primer partido de liga), modificado tanto en las reglas del cliente (`src/domain/preseason.js`) como en el cierre semanal del servidor (`close_week_finances`).
2. **Motor de Avisos Financieros (`financeSafetyWarning`)**: 
   - Se añadió la regla `FINANCE_SAFETY_NET` a `src/domain/warnings.js` que dispara un modal de alto riesgo (`HIGH`) si un gasto único va a dejar al club con menos de 4 semanas de caja estructural (según el `expectedWeeklyFlow`).
   - Esta validación se integró en la pantalla del **Club** (al mejorar instalaciones en `FinancesScreen.jsx`) y en la pantalla del **Mercado** (al ojear a un jugador, al pagar una cláusula de recompra y al ofertar formalmente por un jugador en `MarketScreen.jsx`).
3. **Flujo Semanal Real (Indicador de Caja)**: 
   - En `src/api/finances.js`, el `expectedWeeklyFlow` ahora incluye la taquilla proyectada **únicamente** si el club tiene programado un partido como local durante los siguientes 7 días. Si no hay partido en casa esa semana, el indicador mostrará un flujo negativo realista, reflejando el costo operativo neto real de la semana.
4. **Actualización de Base de Datos**: Se corrió el script que reemplaza la función `close_week_finances` en el entorno Supabase para asegurar que los cálculos de la base empaten con la nueva regla de la pretemporada.
5. **Corrección de Mocks en Tests**: Se corrigieron los mocks de `supabase` en `tests/api/preseasonWeek.test.js` para admitir las cláusulas `gte` y `lt` necesarias para la nueva validación de taquilla.

## Qué probar
1. **Pretemporada sin costo operativo**: Avanzar una semana de pretemporada y verificar en la pestaña Finanzas (y en la base) que la dirigencia cubrió el equivalente exacto a la nómina de los jugadores y que no hubo una caída masiva del presupuesto.
2. **Aviso en Mejoras**: Iniciar una carrera nueva, ir a Club > Instalaciones y tratar de mejorar el Estadio, la Tienda o las Inferiores; un modal rojo advertirá del riesgo de liquidez (menos de 4 semanas).
3. **Aviso en Mercado**: Ir al Mercado y tratar de comprar a un jugador costoso u ojear si el presupuesto es bajo; debe interrumpirse con el mismo aviso de liquidez.
4. **Flujo de caja dinámico**: Comprobar en el Dashboard y en Finanzas que el "flujo semanal esperado" varía en las semanas que el club juega de local (incluye media taquilla / taquilla) y en las que juega de visitante (sólo gastos y cuota social).

## Próximos pasos
La tarea actual (`M11`) se integró exitosamente en la rama `feat/finance-safety-net-m11-red-de-contencion-financiera` y los tests locales se encuentran pasando, listos para que la Integración Continua valide en GitHub Actions.
