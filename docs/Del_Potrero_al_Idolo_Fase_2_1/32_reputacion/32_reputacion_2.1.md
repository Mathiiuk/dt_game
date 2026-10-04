# FASE 32 — REPUTACIÓN PROFESIONAL Y PRESTIGIO DEL DT
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Definir el contrato funcional de dominio para el sistema de reputación profesional del Director Técnico, su prestigio en el ecosistema futbolístico y su impacto en la capacidad de atracción de fichajes, contratos de patrocinio y ofertas laborales de elite en *Del Potrero al Ídolo*. De acuerdo con las **Reglas Maestras 1, 2, 4 y 6**, la reputación es una métrica autoritativa calculada exclusivamente en el backend en base a méritos deportivos objetivos, títulos conquistados, efectividad en clásicos y cumplimiento de metas institucionales.

## 2. Alcance específico
- Escala de Reputación Continua de 1 a 100 puntos y 6 Rangos de Prestigio:
  - **Rango 1 (1 a 20 pts):** Desconocido de Potrero / DT Barrial.
  - **Rango 2 (21 a 40 pts):** Promesa del Ascenso Regional.
  - **Rango 3 (41 a 60 pts):** Estratega Consolidado en el Ascenso.
  - **Rango 4 (61 a 75 pts):** Director Técnico de Primera División.
  - **Rango 5 (76 a 90 pts):** Entrenador de Elite Continental.
  - **Rango 6 (91 a 100 pts):** Mito del Fútbol Mundial / Leyenda de los Banquillos.
- Mecánica de Variación de Reputación:
  - Victorias en partidos regulares (+0.2 pts) vs Derrotas (-0.2 pts).
  - Victorias en Clásicos Barriales (+1.5 pts) vs Derrotas en Clásicos (-1.5 pts).
  - Títulos de Liga y Copas (+8 a +25 pts según categoría).
  - Ascensos de División (+15 pts) vs Descensos (-15 pts).
- Impacto Operativo en el Juego: Facilidad para convencer a figuras de firmar contratos y atracción de ofertas de clubes grandes y selecciones (Fase 33).

## 3. Entidades y Modelo de Datos de Dominio
1. **ManagerReputationProfile (`managers` extension)**:
   - `reputation` (Integer, 1-100, Default 20): Puntuación actual.
   - `reputation_rank` (Enum: `LOCAL_UNKNOWN`, `REGIONAL_PROSPECT`, `ASCENT_SPECIALIST`, `FIRST_TIER_PRO`, `CONTINENTAL_ELITE`, `WORLD_LEGEND`).
   - `peak_career_reputation` (Integer, Default 20): Máxima reputación alcanzada en su historia.

2. **ReputationTransactionLedger (`manager_reputation_ledger`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID).
   - `manager_id` (UUID, FK -> `managers.id`).
   - `event_type` (Enum: `MATCH_RESULT`, `DERBY_VICTORY`, `TITLE_WON`, `PROMOTION`, `RELEGATION`, `DISMISSAL`, `INTERNATIONAL_TRIUMPH`).
   - `delta_amount` (Numeric 4,2): Variación aplicada (+/-).
   - `reputation_after` (Integer): Valor resultante clamped entre 1 y 100.
   - `source_entity_id` (UUID, Nullable): ID del partido, torneo o evento.
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados de la Reputación
```
[DESCONOCIDO_DE_POTRERO (1-20)] ──(Ascensos + Títulos locales)──► [PROCURADOR_DEL_ASCENSO (21-60)]
                                                                               │
                                                                   (Campeón en Primera División)
                                                                               │
                                                                               ▼
                                                                  [DT_DE_ELITE_NACIONAL (61-80)]
                                                                               │
                                                                   (Copa Continental / Mundial)
                                                                               │
                                                                               ▼
                                                                  [LEYENDA_MUNDIAL (81-100)]
```

### Transición Principal: Actualización de Reputación
- **Actor:** Servidor tras un partido o evento de fin de temporada.
- **Precondiciones:** Evento deportivo finalizado.
- **Comando:** `ApplyReputationDeltaCommand(managerId, eventType, sourceEntityId, delta)`.
- **Consecuencias:**
  1. Calcula el nuevo valor: `new_rep = clamp(round(current_rep + delta), 1, 100)`.
  2. Determina el nuevo `reputation_rank` correspondiente.
  3. Inserta la entrada inmutable en `manager_reputation_ledger`.
  4. Si `new_rep > peak_career_reputation`, actualiza la marca histórica personal.
- **Idempotencia:** Asociado al `source_entity_id` para evitar múltiples aplicaciones del mismo hecho.

## 5. Flujo Funcional Paso a Paso
1. **La Campaña:** El DT humano comienza su carrera en el Rango 1 con 20 puntos de reputación en la división regional.
2. **Hitos Conquistados:**
   - Temporada 1: Sale Campeón regional (+15 pts por ascenso, +8 pts por título). Su reputación sube a 43 puntos (Rango 3: Consolidado en el Ascenso).
   - Al alcanzar los 43 puntos, futbolistas de 55 OVR que antes rechazaban unirse ahora aceptan firmar con el club.
3. **El Salto de Nivel:** Clubes de Primera B y Primera Nacional comienzan a enviarle ofertas laborales formales (Fase 31).
4. **Resbalón:** Si en temporadas futuras sufre un descenso, pierde -15 puntos, debiendo reconstruir su prestigio con victorias de mérito.

## 6. Reglas Específicas
- **Regla 32.1 — Techo Clamped de 1 a 100:** La reputación jamás puede descender por debajo de 1 ni superar los 100 puntos.
- **Regla 32.2 — Inercia de Prestigio:** Entrenadores consagrados (Rango 5 o 6) pierden reputación a un ritmo más lento tras derrotas ordinarias que entrenadores novatos, reflejando el crédito ganado por sus títulos históricos.
- **Regla 32.3 — El Respeto de los Árbitros:** Un DT con reputación superior a 75 recibe un trato más considerado por parte de la terna arbitral: reduce en un 10% las tarjetas amarillas por protestas de su banco de suplentes.
- **Regla 32.4 — Imán de Patrocinios:** La reputación personal del DT se suma a la del club para negociar contratos de sponsors: marcas de mayor presupuesto exigen que el equipo esté dirigido por un DT con reputación mínima de 60 puntos.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`reputation_balance.json`):
- `delta_regular_win`: +0.25 pts.
- `delta_regular_loss`: -0.25 pts.
- `delta_derby_win`: +1.50 pts.
- `delta_derby_loss`: -1.50 pts.
- `delta_tier_5_title`: +8.0 pts.
- `delta_tier_1_title`: +20.0 pts.
- `delta_copa_continental_title`: +25.0 pts.
- `delta_promotion`: +15.0 pts.
- `delta_relegation`: -15.0 pts.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Puntuación numérica exacta de reputación (1-100), título honorífico de rango, historial de variaciones recientes en el ledger de carrera.
- **Parcial:** Nivel de reputación percibido por la afición y medios.
- **Oculta al Cliente:** Ninguna (la reputación es la tarjeta de presentación del DT).

## 9. Inteligencia Artificial / Reputación de DTs Rivales
Todos los entrenadores de IA poseen su propia reputación que sube o baja con sus resultados, determinando qué clubes pueden contratar a cada técnico en el mercado de pases de DTs.

## 10. Eventos y Auditoría
- `REPUTATION_RANK_INCREASED`: Ascenso a nuevo rango de prestigio con condecoración.
- `REPUTATION_DELTA_LOGGED`: Registro de cada punto ganado o perdido.

## 11. Idempotencia y Mitigación de Errores de Red
- El ledger `manager_reputation_ledger` cuenta con restricción `UNIQUE (manager_id, event_type, source_entity_id)` que garantiza que un partido o copa otorgue reputación exactamente una sola vez.

## 12. Concurrencia
- La actualización se realiza de forma atómica en el mismo lote transaccional de post-partido o cierre de temporada.

## 13. Persistencia y Ciclo de Vida
- La reputación persiste durante toda la trayectoria profesional del DT y constituye una de las variables fundamentales para calcular el puntaje de inducción al Salón de la Fama (Fase 38) y el Endgame (Fase 40).

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Perfil de Carrera del Entrenador.
- **¿Qué puedo hacer?:** Inspeccionar tu reputación acumulada y verificar qué escalón te falta para acceder a los grandes clubes.
- **¿Qué cuesta?:** Sin coste.
- **¿Qué puede pasar?:** Si alcanzas el rango de Elite, recibirás llamados de la Selección Nacional.
- **¿Qué ocurrió?:** Insignia de rango dorada con animación de estrellas al cruzar umbrales clave.

## 15. Casos Extremos
- **DT que pierde 10 partidos seguidos:** Su reputación desciende pero se frena en el piso mínimo de 1 punto; siempre tendrá la posibilidad de reiniciar en clubes modestos.
- **DT despedido tras ganar un título:** La gloria del campeonato mitiga el golpe del cese laboral en su reputación final.

## 16. Anti-Exploits
- **Inyección de reputación desde el frontend:** No existen endpoints de modificación de reputación; toda variación es una consecuencia secundaria de victorias y títulos firmados en el backend.

## 17. Observabilidad y Métricas
- Distribución de reputación entre todos los entrenadores activos en el universo del juego.
- Tiempo medio en temporadas para alcanzar el estatus de DT de Primera División.

## 18. Matriz de Pruebas
1. Victoria en partido -> Reputación suma +0.25 puntos y se registra en `manager_reputation_ledger`.
2. Conquista de título de liga -> Reputación suma +8.0 puntos, rango actualizado si cruza umbral.
3. Reputación en 99 puntos que suma +15 -> Clamped estrictamente en 100 puntos.
4. Reputación en 2 puntos que pierde -15 -> Clamped estrictamente en 1 punto.
5. Invocación duplicada con el mismo `match_id` -> Rechazada por índice de unicidad del ledger.

## 19. Criterios de Aceptación
- [x] Modelo de reputación, rangos y ledger inmutable formalizado.
- [x] Máquina de estados de prestigio en 6 niveles cerrada.
- [x] Backend como autoridad absoluta del cálculo de deltas deportivos.
- [x] Impactos en fichajes, arbitrajes y sponsors cuantificados.
- [x] Reputación activa y dinámica en entrenadores de IA.
- [x] Eventos y auditoría de prestigio implementados.
- [x] Idempotencia estricta en la acreditación de puntos.
- [x] Concurrencia atómica resuelta en base de datos.
- [x] Tabla de deltas de victorias y títulos parametrizada en JSON.
- [x] Casos extremos de caídas libres y techos máximos cubiertos.
- [x] Anti-exploits de manipulación de prestigio neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `ReputationEngineService`, `PrestigeRankCalculator`, `ReputationLedgerRepository`.
- **Comandos:** `ApplyReputationDeltaCommand`, `RecalculateManagerRankCommand`.
- **Queries:** `GetManagerReputationHistoryQuery`, `GetReputationRankStatusQuery`.
- **Políticas DB:** `ALTER TABLE managers ADD CONSTRAINT chk_reputation_range CHECK (reputation BETWEEN 1 AND 100)`.
