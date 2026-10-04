# FASE 29 — TRANSICIÓN Y CIERRE ANUAL DE TEMPORADA
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Establecer el contrato funcional y formal de dominio para la macro-transición de fin de año, el cierre de ejercicio deportivo-económico y el reseteo del universo de juego entre la Semana 52 y la Semana 1 del año siguiente. De acuerdo con las **Reglas Maestras 4, 7, 8, 11 y 14**, el cierre de temporada es una transacción maestra atómica e irreversible: congela los snapshots históricos inmutables de la liga finalizada, liquida los premios federativos, envejece la población de futbolistas, desvincula a los jugadores con contratos vencidos y genera el nuevo ciclo sin mutar silenciosamente el pasado.

## 2. Alcance específico
- Congelamiento inmutable de la tabla de posiciones y coronación oficial del campeón de liga.
- Liquidación bancaria de premios por mérito deportivo según puesto final (Puesto 1: $100,000; Puesto 2: $60,000; ... Puesto 20: $5,000).
- Desvinculación de contratos expirados: Futbolistas que no renovaron pasan a la bolsa de Agentes Libres (Fase 13).
- Proceso biológico de envejecimiento: Incremento de +1 año a todos los futbolistas y empleados del mundo de juego.
- Balance contable anual: Resumen financiero anual de ingresos vs egresos y aprobación del presupuesto de la nueva temporada por la comisión directiva.
- Reinicio de calendario: Creación del calendario del nuevo año (Semana 1) con apertura de la ventana de pases de pretemporada.

## 3. Entidades y Modelo de Datos de Dominio
1. **SeasonArchiveSnapshot (`season_snapshots`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID, FK -> `careers.id`).
   - `season_year` (Integer).
   - `division_tier` (Integer).
   - `champion_club_id` (UUID, FK -> `clubs.id`).
   - `runner_up_club_id` (UUID, FK -> `clubs.id`).
   - `promoted_club_ids` (Array de UUID).
   - `relegated_club_ids` (Array de UUID).
   - `top_scorer_player_id` (UUID, FK -> `players.id`).
   - `top_scorer_goals` (Integer).
   - `best_player_id` (UUID, FK -> `players.id`).
   - `final_standings_json` (JSONB): Copia inmutable de la tabla de 20 posiciones.
   - `created_at` (Timestamp UTC).
   - **Restricción Unívoca:** `UNIQUE (career_id, season_year, division_tier)`.

2. **AnnualFinancialReport (`annual_financial_statements`)**:
   - `id` (UUID, PK).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `season_year` (Integer).
   - `total_income` (Numeric 12,2).
   - `total_expenses` (Numeric 12,2).
   - `net_profit_loss` (Numeric 12,2).
   - `prize_money_received` (Numeric 12,2).
   - `approved_transfer_budget_next_year` (Numeric 12,2).
   - `approved_wage_budget_next_year` (Numeric 10,2).

3. **SeasonTransitionAudit (`season_transition_log`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID).
   - `from_year` (Integer).
   - `to_year` (Integer).
   - `players_aged_count` (Integer).
   - `contracts_expired_count` (Integer).
   - `players_retired_count` (Integer).
   - `duration_ms` (Integer).
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados del Cierre de Temporada
```
[SEMANA_52_FINALIZADA] ──(Command: ExecuteSeasonClose)──► [BLOQUEANDO_UNIVERSO_DE_CARRERA]
                                                                     │
                                     ┌───────────────────────────────┴───────────────────────────────┐
                                     ▼                                                               ▼
                        [CONGELANDO_SNAPSHOT_HISTORICO]                                 [LIQUIDANDO_PREMIOS_Y_FINANZAS]
                        - Inmortaliza tabla en JSON                                     - Acredita premio por posición
                        - Registra campeón y goleador                                   - Aprueba presupuestos nuevo año
                                     │                                                               │
                                     └───────────────────────────────┬───────────────────────────────┘
                                                                     ▼
                                                      [MIGRACION_BIOLOGICA_Y_PLANTEL]
                                                      - Envejece +1 año a todos
                                                      - Ejecuta retiros confirmados
                                                      - Libera contratos vencidos a Agentes Libres
                                                                     │
                                                                     ▼
                                                      [REINICIANDO_CALENDARIO_NUEVO_ANO]
                                                      - year = year + 1, week = 1
                                                      - Abre libro de pases de verano
                                                                     ▼
                                                      [TEMPORADA_NUEVA_INICIADA]
```

### Transición Principal: Ejecución del Cierre Anual
- **Actor:** Servidor al solicitar el avance de tiempo en la Semana 52.
- **Precondiciones:**
  1. Todos los partidos de la Fecha 38 y copas de la temporada están en `FINISHED`.
  2. No existe un snapshot previo en `season_snapshots` para `(career_id, current_season_year)`.
- **Comando:** `ExecuteSeasonCloseCommand(careerId)`.
- **Consecuencias:**
  1. Genera y persiste `season_snapshots` con la foto definitiva e inmutable del año.
  2. Acredita el premio monetario en `club_finances.balance` según la posición en la tabla.
  3. Ejecuta la evolución y envejecimiento de futbolistas (Fase 28).
  4. Muta contratos vencidos a `status = 'TERMINATED'` y `players.club_id = NULL` (quedan libres).
  5. Ejecuta ascensos y descensos de clubes entre divisiones (Fase 30).
  6. Avanza el reloj de la carrera: `current_season_year = current_season_year + 1`, `current_week = 1`.
  7. Inserta auditoría completa en `season_transition_log`.
  8. Invalida todas las cachés de datos del juego.
- **Idempotencia:** Si el proceso se interrumpe o se reintenta, detecta el snapshot del año y no repite los premios ni vuelve a envejecer a los futbolistas.

## 5. Flujo Funcional Paso a Paso
1. **El Gran Fin de Fiesta:** Termina la Fecha 38 de la liga. El club del usuario finaliza en el Puesto 2 (Subcampeón y ascenso directo).
2. **Disparo del Cierre:** El DT pulsa "Completar Temporada y Avanzar al Nuevo Año".
3. **Procesamiento en Servidor:**
   - La tabla se congela con el escudo del campeón y los puestos definitivos.
   - El club recibe un premio federativo de $60,000 en su cuenta bancaria.
   - El goleador del torneo recibe su bota de oro conmemorativa.
   - 2 jugadores cuyos contratos vencían este año y no fueron renovados se despiden de la afición y quedan libres.
   - El zaguero de 35 años que había anunciado su retiro se despide formalmente del fútbol.
   - Todo el plantel cumple un año biológico más (`age += 1`).
4. **Pantalla de Gala de Fin de Temporada:** El usuario es recibido con una pantalla interactiva tipo resumen anual:
   - Trofeos conquistados o medalla de subcampeón.
   - Ganancias y pérdidas contables del ejercicio cerrado.
   - Presentación de los presupuestos aprobados para la nueva temporada en la división superior.
5. **Bienvenida a la Pretemporada:** El reloj marca Semana 1 de la nueva temporada con el libro de transferencias abierto de par en par.

## 6. Reglas Específicas
- **Regla 29.1 — Inmutabilidad Absoluta del Pasado (Master Rule 14):** La fila generada en `season_snapshots` jamás puede ser actualizada ni sobreescrita; cualquier consulta a temporadas anteriores lee directamente este snapshot congelado.
- **Regla 29.2 — Fuga Automática de Vencidos:** Todo futbolista cuyo contrato tenga `expires_at <= current_date` al momento del cierre de temporada queda automáticamente desvinculado del club sin coste de rescisión.
- **Regla 29.3 — Presupuesto según Nueva Categoría:** Si el club logró el ascenso, la comisión directiva reajusta autoritativamente al alza el presupuesto salarial semanal (`wage_budget_weekly`) en al menos un 80% para competir en el nuevo nivel.
- **Regla 29.4 — Cero Reseteos de Carrera:** El cierre de temporada no borra la partida ni el progreso del DT; es una transición continua que avanza el mundo de juego manteniendo el historial de clubes y jugadores.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`season_transition_balance.json`):
- **Premios de Liga Regional (Tier 5):**
  - Puesto 1 (Campeón): $100,000.
  - Puesto 2 (Subcampeón): $60,000.
  - Puestos 3 a 6: $30,000.
  - Puestos 7 a 17: $15,000.
  - Puestos 18 a 20: $5,000.
- `top_scorer_prize`: $10,000 al club y trofeo individual.
- `preseason_duration_weeks`: 2 semanas (Semanas 1 y 2 sin partidos oficiales).

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Cuadro de honor de la temporada concluida, desglose completo de premios recibidos, balance anual de pérdidas y ganancias, nuevo presupuesto fijado por la presidencia y lista de bajas por fin de contrato.
- **Parcial:** Ninguna.
- **Oculta al Cliente:** Ninguna (el cierre deportivo es público e institucional).

## 9. Inteligencia Artificial / Adaptación de Rivales
Todos los clubes de la liga ejecutan el mismo protocolo: despiden a sus contratos vencidos, cobran sus premios y planifican su presupuesto de fichajes para la pretemporada entrante.

## 10. Eventos y Auditoría
- `SEASON_CLOSED_OFFICIALLY`: Snapshot histórico archivado.
- `PRIZE_MONEY_DISBURSED`: Transferencia bancaria de premios.
- `PLAYERS_AGED_GLOBALLY`: Incremento etario en la población de futbolistas.
- `NEW_SEASON_INITIALIZED`: Calendario del nuevo año en marcha.

## 11. Idempotencia y Mitigación de Errores de Red
- El endpoint `POST /api/v1/career/season/close` está protegido por la restricción `UNIQUE (career_id, season_year)` en la tabla `season_snapshots`. Si el cliente o el worker fallan a mitad de camino y se reintenta, la base de datos detecta el año ya cerrado y evita dobles premios o envejecimientos repetidos.

## 12. Concurrencia
- La transacción de cierre adquiere un bloqueo exclusivo sobre la fila de `careers` (`FOR UPDATE`), impidiendo que cualquier otro endpoint interactúe con el mundo mientras se realiza la migración anual de datos.

## 13. Persistencia y Ciclo de Vida
- Los snapshots de temporadas pasadas persisten indefinidamente, permitiendo al DT consultar tablas de hace 20 años en la sala de trofeos histórica del club (Fase 36).

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de Gala de Cierre de Temporada.
- **¿Qué puedo hacer?:** Festejar logros, revisar finanzas del año y aceptar los nuevos presupuestos aprobados para el año entrante.
- **¿Qué cuesta?:** Sin coste; otorga las recompensas ganadas en la cancha.
- **¿Qué puede pasar?:** Al confirmar, el calendario pasará a la Semana 1 del año siguiente.
- **¿Qué ocurrió?:** Animación festiva con confeti y vitrina con las condecoraciones y cheques ganados.

## 15. Casos Extremos
- **Jugador que se marcha libre pero renueva a último minuto:** Si el DT renueva el contrato antes de pulsar el cierre de temporada, el vínculo se preserva y no pasa a agentes libres.
- **Club que desciende con balance negativo:** Los premios menores por puestos de descenso sumados a la caída de sponsors obligan al club a vender a sus figuras en pretemporada para subsistir.

## 16. Anti-Exploits
- **Cobrar los premios dos veces:** Blindado por la transacción atómica y la unicidad del snapshot en base de datos.
- **Evitar el envejecimiento cerrando el juego:** El envejecimiento ocurre de forma atómica en el backend al procesar la transición de año.

## 17. Observabilidad y Métricas
- Tiempo total de ejecución del batch de fin de año (< 600ms para todos los clubes y jugadores).
- Masa total de dinero inyectada en premios en la economía de la liga.
- Porcentaje de futbolistas que pasan a la agencia libre en cada cambio de temporada.

## 18. Matriz de Pruebas
1. Cierre de temporada en Semana 52 -> Snapshot inmutable creado en `season_snapshots` con campeón y posiciones.
2. Acreditación de premios -> Tesorería del subcampeón incrementa en exactamente $60,000.
3. Envejecimiento poblacional -> Futbolistas pasan de edad N a N+1.
4. Desvinculación de contratos vencidos -> Jugadores sin contrato pasan a tener `club_id = NULL`.
5. Intento de ejecutar cierre dos veces en el mismo año -> HTTP 409 Conflict, 0 duplicación.

## 19. Criterios de Aceptación
- [x] Modelo de snapshot de temporada, balance anual y auditoría formalizado.
- [x] Máquina de estados de macro-transición de fin de año cerrada.
- [x] Backend como autoridad absoluta e inviolable del cierre de temporada.
- [x] Inmutabilidad histórica de tablas pasadas garantizada por diseño (Master Rule 14).
- [x] Envejecimiento y desvinculaciones automáticas parametrizadas.
- [x] Eventos y auditoría de transición de año implementados.
- [x] Idempotencia estricta contra doble cobro de premios.
- [x] Concurrencia con bloqueo exclusivo en carrera resuelta.
- [x] Escala de premios y presupuestos versionada en JSON.
- [x] Casos extremos de descensos con deudas cubiertos.
- [x] Anti-exploits de congelamiento de edad o premios dobles neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `SeasonCloseOrchestrator`, `PrizeMoneyDistributor`, `PlayerAgingEngine`, `SeasonSnapshotRepository`.
- **Comandos:** `ExecuteSeasonCloseCommand`, `GenerateAnnualFinancialReportCommand`.
- **Queries:** `GetSeasonSnapshotQuery`, `GetHistoricalStandingsArchiveQuery`.
- **Políticas DB:** `ALTER TABLE season_snapshots ADD CONSTRAINT uq_career_season_tier UNIQUE (career_id, season_year, division_tier)`.
