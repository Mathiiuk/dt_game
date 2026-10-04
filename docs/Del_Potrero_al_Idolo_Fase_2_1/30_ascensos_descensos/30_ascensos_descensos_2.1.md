# FASE 30 — ASCENSOS, DESCENSOS Y ESTRUCTURA PIRAMIDAL DE LIGAS
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Establecer el contrato funcional y formal de dominio para el sistema piramidal de divisiones del fútbol nacional, la ejecución autoritativa de ascensos y descensos, la reasignación de instituciones en sus nuevas categorías y la adaptación económica y reputacional de los clubes promovidos o descendidos en *Del Potrero al Ídolo*. De acuerdo con las **Reglas Maestras 1, 4, 10 y 14**, el sistema piramidal preserva la coherencia del universo: ningún club desaparece arbitrariamente y los ascensos y descensos son hechos históricos inmutables calculados matemáticamente por la posición final en la tabla.

## 2. Alcance específico
- Pirámide Oficial de 5 Divisiones del Fútbol Argentino:
  - **Tier 1 (Liga Profesional):** 20 clubes de elite, estadios gigantes, presupuestos millonarios y televisación internacional.
  - **Tier 2 (Primera Nacional):** 20 clubes profesionales de segunda división, gran competitividad federal.
  - **Tier 3 (Primera B Metropolitana / Federal A):** 20 clubes con historia y mezcla de profesionalismo y garra.
  - **Tier 4 (Primera C Metropolitana):** 20 clubes semiprofesionales de gran fervor barrial.
  - **Tier 5 (Torneo Promocional Regional / Potrero):** 20 clubes amateurs de barrio (División de partida del usuario).
- Dinámica Deportiva de Ascensos y Descensos:
  - **Ascenso Directo:** Campeón (Puesto 1) y Subcampeón (Puesto 2) ascienden al Tier inmediatamente superior (`division_tier - 1`).
  - **Playoff / Torneo Reducido:** Puestos 3, 4, 5 y 6 disputan semifinales y final a partido único por el 3er boleto de ascenso.
  - **Descenso Directo:** Puestos 18, 19 y 20 descienden al Tier inmediatamente inferior (`division_tier + 1`).
- Reconfiguración Institucional tras Ascenso:
  - Multiplicador de Reputación del Club (+15 puntos).
  - Aumento del contrato de televisación y cuotas sociales (+60% a +100%).
  - Aumento automático del techo salarial autorizado por la comisión directiva.
- Trauma del Descenso: Reducción de ingresos por patrocinio (-40%), pérdida de masa social casual y exigencia de la directiva de ascender de inmediato al año siguiente.

## 3. Entidades y Modelo de Datos de Dominio
1. **DivisionTierConfig (`league_tiers_config`)**:
   - `tier_level` (Integer, 1-5, PK): Nivel piramidal.
   - `tier_name` (String, ej: "Torneo Promocional Regional", "Primera C", "Liga Profesional").
   - `total_teams`: 20.
   - `automatic_promotions`: 2.
   - `playoff_promotions`: 1.
   - `relegations_count`: 3.
   - `base_tv_revenue_weekly` (Numeric 10,2): Ingresos por televisación de la categoría.
   - `base_wage_cap_weekly` (Numeric 10,2): Techo salarial de referencia.
   - `min_stadium_capacity_required` (Integer): Aforo mínimo exigido por la federación.

2. **PromotionRelegationMovement (`promotion_relegation_ledger`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID, FK -> `careers.id`).
   - `season_year` (Integer).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `movement_type` (Enum: `PROMOTION_CHAMPION`, `PROMOTION_RUNNER_UP`, `PROMOTION_PLAYOFF`, `RELEGATION`).
   - `from_tier` (Integer).
   - `to_tier` (Integer).
   - `final_position` (Integer).
   - `timestamp` (Timestamp UTC).

3. **PlayoffMatchInstance (`playoff_fixtures`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID).
   - `season_year` (Integer).
   - `division_tier` (Integer).
   - `round_name` (Enum: `SEMI_FINAL`, `FINAL`).
   - `home_club_id` (UUID, FK -> `clubs.id`).
   - `away_club_id` (UUID, FK -> `clubs.id`).
   - `home_score` (Integer, Default 0).
   - `away_score` (Integer, Default 0).
   - `winner_club_id` (UUID, Nullable, FK -> `clubs.id`).
   - `status` (Enum: `SCHEDULED`, `FINISHED`).

## 4. Máquina de Estados del Sistema Piramidal
```
[FECHA_38_CONCLUIDA] ──(Evalúa clasificación de tabla)──► [IDENTIFICANDO_ZONAS_DEPORTIVAS]
                                                                     │
                                     ┌───────────────────────────────┼───────────────────────────────┐
                                     ▼                               ▼                               ▼
                       [ZONA_ASCENSO_DIRECTO]             [ZONA_REDUCIDO_PLAYOFFS]             [ZONA_DESCENSO]
                        (Puestos 1 y 2)                    (Puestos 3 a 6)                     (Puestos 18 a 20)
                                     │                               │                               │
                                     │                    (Disputa Semis y Final)                    │
                                     │                               │                               │
                                     ▼                               ▼                               ▼
                          [ASIGNANDO_NUEVO_TIER]          [GANADOR_OBTIENE_3er_BOLETO]    [DESCENDIENDO_DE_TIER]
                          (tier = tier - 1)               (tier = tier - 1)               (tier = tier + 1)
                                     │                               │                               │
                                     └───────────────────────────────┼───────────────────────────────┘
                                                                     ▼
                                                      [MIGRANDO_CLUBES_A_NUEVA_LIGA]
                                                      - Reasigna division_tier en clubs
                                                      - Genera nuevo fixture de 38 fechas
                                                                     ▼
                                                      [COMPETICION_NUEVA_HABILITADA]
```

### Transición Principal: Migración de Clubes tras Cierre
- **Actor:** Servidor durante el Cierre de Temporada (Fase 29).
- **Precondiciones:** Tabla de posiciones finalizada y playoffs completados.
- **Comando:** `ProcessPromotionRelegationBatchCommand(careerId, seasonYear)`.
- **Consecuencias:**
  1. Identifica a los 3 clubes ascendidos y 3 descendidos por categoría.
  2. En el caso del club del usuario: Si finalizó Puesto 1 o 2, actualiza `clubs.division_tier = clubs.division_tier - 1`.
  3. Ajusta `clubs.reputation = clubs.reputation + 15` por ascenso.
  4. Inserta las filas inmutables en `promotion_relegation_ledger`.
  5. Asigna los clubes ascendidos a la nueva competición del Tier correspondiente para la temporada siguiente.
  6. En caso de descenso: Actualiza `clubs.division_tier = clubs.division_tier + 1` y resta -15 de reputación.
- **Idempotencia:** Asociado a la temporada; si ya se procesó, rechaza ejecuciones redundantes.

## 5. Flujo Funcional Paso a Paso
1. **La Alegría del Ascenso:** El club del DT humano concluye la temporada en el Puesto 1 de la división regional (Tier 5) coronándose CAMPEÓN.
2. **Festejo y Confirmación:**
   - La pantalla muestra la entrega del trofeo de campeón de la división.
   - El DT recibe +2,500 XP y un trofeo histórico para la vitrina del club (Fase 05 / 36).
3. **Migración Institucional:**
   - El club es promovido oficialmente a **Tier 4 (Primera C Metropolitana)**.
   - La comisión directiva anuncia un nuevo presupuesto salarial semanal que pasa de $3,500 a $6,800 para afrontar el desafío.
   - El valor de los derechos de televisión semanales sube de $400 a $900.
4. **Bienvenida a la Nueva Liga:**
   - El fixture de la nueva temporada ubica al club contra rivales de mayor jerarquía y tradición.
   - La exigencia dirigencial para el nuevo año se fija en "Luchar por la permanencia y consolidarse en Primera C".

## 6. Reglas Específicas
- **Regla 30.1 — Sin Techo Superior en Tier 1 ni Fondo Inferior en Tier 5:**
  - El campeón de Tier 1 no asciende más; se consagra Campeón de Primera División y clasifica a Copas Internacionales (Fase 34).
  - Los descendidos de Tier 5 permanecen en Tier 5 tras una profunda reestructuración dirigencial (no existe Tier 6 en el motor).
- **Regla 30.2 — Partidos de Playoff a Partido Único:** Las semifinales y la final del Torneo Reducido se juegan a partido único en cancha neutral o con ventaja deportiva para el mejor ubicado en caso de empate a los 90 minutos.
- **Regla 30.3 — Inmutabilidad de los Ascensos:** Una vez consagrado y registrado el ascenso en `promotion_relegation_ledger`, ningún error de simulación puede anular el cambio de categoría del club.
- **Regla 30.4 — Adaptación del Mercado de Pases:** Al ascender de división, jugadores de mayor OVR (60 a 70) que antes rechazaban negociar con el club ahora están dispuestos a escuchar ofertas salariales.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`promotion_relegation_rules.json`):
- `reputation_boost_on_promotion`: +15 puntos de reputación de club y DT.
- `reputation_penalty_on_relegation`: -15 puntos de reputación.
- `wage_budget_multiplier_tier_4`: 1.94× respecto a Tier 5.
- `wage_budget_multiplier_tier_3`: 1.85× respecto a Tier 4.
- `wage_budget_multiplier_tier_2`: 2.10× respecto a Tier 3.
- `wage_budget_multiplier_tier_1`: 3.50× respecto a Tier 2.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Cuadro de ascensos y descensos oficial de la temporada, llaves de playoffs con resultados y fechas, nuevo tier asignado y aumento de presupuesto estipulado por los directivos.
- **Parcial:** Ninguna.
- **Oculta al Cliente:** Ninguna (los ascensos son de conocimiento público en el fútbol).

## 9. Inteligencia Artificial / Clubes Ascendidos y Descendidos
Los 3 clubes que descienden de la división superior a la liga del usuario traen consigo presupuestos mayores y futbolistas de mayor experiencia, convirtiéndose de inmediato en candidatos a pelear el torneo.

## 10. Eventos y Auditoría
- `PROMOTION_ACHIEVED`: Ascenso confirmado con categoría de destino registrada.
- `RELEGATION_SUFFERED`: Descenso confirmado y reajuste económico forzoso.
- `PLAYOFF_FINAL_CONCLUDED`: Campeón del reducido consagrado.

## 11. Idempotencia y Mitigación de Errores de Red
- El ledger `promotion_relegation_ledger` cuenta con restricción única `UNIQUE (career_id, season_year, club_id)`, impidiendo dobles ascensos de división en el mismo año.

## 12. Concurrencia
- La reasignación de divisiones de los 20 clubes se realiza en una sola transacción serializada durante el cierre de temporada (Fase 29).

## 13. Persistencia y Ciclo de Vida
- El historial de todos los ascensos y descensos del club se mantiene de forma perpetua en la sección de Historia Institucional (Fase 36).

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de Ascensos y Nueva Temporada.
- **¿Qué puedo hacer?:** Ver el nuevo mapa de la división a la que ascendiste y conocer a tus 19 nuevos rivales de torneo.
- **¿Qué cuesta?:** Sin coste.
- **¿Qué puede pasar?:** Al jugar en una división más alta, los rivales tendrán mayor velocidad, técnica y resistencia atlética.
- **¿Qué ocurrió?:** Notificación triunfal: *"¡HISTÓRICO! El club ha ascendido a la Primera C Metropolitana. El barrio está de fiesta"*.

## 15. Casos Extremos
- **Empate en la final del Reducido tras 120 minutos:** Se define mediante tanda de 5 penales reglamentarios en el motor de partido.
- **Club que desciende dos temporadas seguidas:** El presidente emite un mensaje de refundación institucional y ajusta los salarios a mínimos históricos para evitar la desaparición del club.

## 16. Anti-Exploits
- **Forzar permanencia tras descender en la cancha:** El backend evalúa la columna `points` de la tabla oficial; no se permite manipular la asignación de tier desde el cliente.

## 17. Observabilidad y Métricas
- Distribución de clubes que logran mantenerse en la categoría tras el primer año del ascenso.
- Tiempo promedio de temporadas requeridas por los usuarios para llegar de Tier 5 a Primera División (Tier 1).

## 18. Matriz de Pruebas
1. Puesto 1 en Tier 5 -> Muta `division_tier` de 5 a 4, reputación suma +15, registrado en ledger.
2. Puesto 2 en Tier 5 -> Ascenso directo confirmado a Tier 4.
3. Puesto 4 gana la final del Reducido -> Ascenso a Tier 4 como ganador de playoff.
4. Puesto 19 en Tier 4 -> Desciende a Tier 5 (`division_tier` pasa a 5).
5. Campeón de Tier 1 -> Permanece en Tier 1 y no supera el techo piramidal.

## 19. Criterios de Aceptación
- [x] Modelo de pirámide de ligas, movimientos y playoffs formalizado.
- [x] Máquina de estados de ascensos directos, reducidos y descensos cerrada.
- [x] Backend como autoridad absoluta de migración piramidal de clubes.
- [x] Ajustes de reputación, televisación y presupuestos cuantificados.
- [x] Movimientos de ascenso y descenso activos en clubes de IA.
- [x] Eventos y auditoría de ascensos implementados por diseño.
- [x] Idempotencia estricta en el ledger de movimientos anuales.
- [x] Concurrencia serializada en la migración de clubes resuelta.
- [x] Estructura de 5 divisiones y multiplicadores parametrizada en JSON.
- [x] Casos extremos de tandas de penales en finales de playoff cubiertos.
- [x] Anti-exploits de evasión de descensos neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `PromotionRelegationService`, `PlayoffTournamentEngine`, `TierMigrationManager`, `LeagueTierRepository`.
- **Comandos:** `ProcessPromotionRelegationCommand`, `SimulatePlayoffRoundCommand`.
- **Queries:** `GetLeagueTiersStructureQuery`, `GetClubDivisionHistoryQuery`.
- **Políticas DB:** `ALTER TABLE promotion_relegation_ledger ADD CONSTRAINT uq_club_season_move UNIQUE (career_id, season_year, club_id)`.
