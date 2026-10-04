# FASE 28 — EVOLUCIÓN, MADURACIÓN Y DECLIVE NATURAL DEL JUGADOR
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Definir el contrato funcional de dominio para la curva de vida deportiva, maduración biológica, progresión técnica y declive físico natural de los futbolistas a lo largo de los años en *Del Potrero al Ídolo*. De acuerdo con las **Reglas Maestras 1, 2, 4 y 6**, la evolución no es un incremento lineal arbitrario: el servidor computa anualmente el desarrollo y la merma de cada futbolista basándose en su edad biológica, minutos disputados en partidos oficiales, calidad de entrenamientos y el techo máximo impuesto por su potencial oculto.

## 2. Alcance específico
- Curva Biológica en 5 Etapas Etarias:
  - **Fase de Crecimiento Acelerado (16 a 20 años):** Gran ganancia de atributos técnicos y físicos; desarrollo proporcional a los minutos jugados en primera.
  - **Fase de Maduración Competitiva (21 a 24 años):** Consolidación de atributos mentales (`vision`, `composure`) y afinamiento táctico.
  - **Pico de Rendimiento Deportivo (25 a 29 años):** Atributos en su máximo apogeo histórico; estabilidad de OVR.
  - **Madurez y Compensación Táctica (30 a 33 años):** Inicio del declive físico leve (-pace, -stamina) compensado con aumento en inteligencia táctica y liderazgo (+positioning, +anticipation).
  - **Declive Físico Acelerado y Retiro (34 a 38+ años):** Fuerte caída atlética; el jugador evalúa colgar las botas al final de la temporada.
- Algoritmo de Recálculo de OVR por Posición: Ponderación estricta de atributos según la demarcación en la cancha.
- Anuncio de Retiro Voluntario: Futbolistas veteranos que anuncian con 6 meses de anticipación que se retiran al finalizar el torneo.

## 3. Entidades y Modelo de Datos de Dominio
1. **PlayerBiologicalState (`players` extension)**:
   - `age`: Edad calculada respecto al año de temporada.
   - `career_phase` (Enum: `YOUTH_GROWTH`, `PRIME_DEVELOPMENT`, `PEAK`, `EXPERIENCED_TRANSITION`, `DECLINING`, `RETIREMENT_PENDING`).
   - `minutes_played_current_season` (Integer, Default 0).
   - `avg_rating_current_season` (Float, Default 0.0).
   - `announced_retirement_year` (Integer, Nullable): Año en el que cuelga las botas.

2. **PlayerAnnualEvolutionRecord (`player_evolution_history`)**:
   - `id` (UUID, PK).
   - `player_id` (UUID, FK -> `players.id`).
   - `season_year` (Integer).
   - `age_at_season` (Integer).
   - `ovr_before` (Integer).
   - `ovr_after` (Integer).
   - `attributes_delta` (JSONB): Variaciones exactas por atributo (ej: `{ pace: -2, vision: +1, composure: +1 }`).
   - `minutes_played` (Integer).
   - `created_at` (Timestamp UTC).

3. **RetirementAnnouncement (`player_retirements`)**:
   - `id` (UUID, PK).
   - `player_id` (UUID, FK -> `players.id`, Unique).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `announcement_week` (Integer).
   - `planned_retirement_season` (Integer).
   - `future_role_interest` (Enum: `COACH`, `SCOUT`, `PHYSIO`, `LEAVE_FOOTBALL`).

## 4. Máquina de Estados del Ciclo de Vida del Futbolista
```
[JUVENIL_PROMESA (16-20)] ──(Minutos jugados + Entrenamiento)──► [PLENITUD_PRIME (25-29)]
                                                                          │
                                                               (Envejecimiento anual)
                                                                          │
                                                                          ▼
                                                              [DECLIVE_NATURAL (33-36)]
                                                                          │
                                                (Evalúa OVR < 45 o edad >= 35)
                                                                          │
                                                                          ▼
                                                              [RETIRO_ANUNCIADO]
                                                                          │
                                                      (Cierre de temporada Fase 29)
                                                                          │
                                                                          ▼
                                                                [FUTBOLISTA_RETIRADO]
                                                                (Pasa a Salón de la Fama o Staff)
```

### Transición Principal: Recalibración Anual de Atributos
- **Actor:** Servidor durante el Cierre de Temporada (Fase 29).
- **Precondiciones:** Temporada finalizada.
- **Comando:** `ProcessAnnualPlayerEvolutionCommand(playerId, seasonYear)`.
- **Consecuencias:**
  1. Si `age <= 22` y tuvo minutos oficiales regulares (> 900 min en el año): Aplica crecimiento técnico y físico guiado por la distancia hacia su `potential_rating`.
  2. Si `age >= 32`: Aplica declive físico (-1 a -3 en velocidad y resistencia). Si el jugador tiene alto profesionalismo, el declive se amortigua a la mitad.
  3. Recalcula el `overall_rating` definitivo de acuerdo a las ponderaciones de su posición.
  4. Inserta el registro histórico en `player_evolution_history`.
- **Idempotencia:** Asociado unívocamente a `(player_id, season_year)`.

## 5. Flujo Funcional Paso a Paso
1. **La Campaña de un Juvenil:** Un volante central de 18 años disputa 28 partidos en la temporada con un rendimiento medio de 6.8 puntos.
2. **Evaluación de Fin de Temporada:**
   - Edad: Pasa de 18 a 19 años.
   - Rendimiento destacado y minutos abundantes: Supera con creces el umbral de consolidación.
   - El algoritmo le otorga +3 en `passing`, +2 en `vision` y +1 en `stamina`.
   - Su media global escala de 46 OVR a 50 OVR.
3. **El Declive de un Veterano:** En el mismo plantel, el zaguero central de 34 años ve caer su velocidad de 58 a 52, pero su veteranía incrementa su anticipación defensiva a 74. Su media neta baja solo de 56 a 55 OVR.
4. **Anuncio de Retiro:** Al cumplir los 35 años, el zaguero central notifica al DT que la próxima será su última temporada como profesional.

## 6. Reglas Específicas
- **Regla 28.1 — Sin Minutos no hay Milagro:** Un jugador joven con potencial de 80 que pasa toda la temporada sin jugar un solo minuto en primera división no evoluciona; el estancamiento reduce su margen de crecimiento futuro en un 10%.
- **Regla 28.2 — El Escudo del Profesionalismo:** Jugadores con `professionalism >= 16` retrasan su declive físico hasta los 33 años y pueden seguir compitiendo con solvencia hasta los 37 o 38 años.
- **Regla 28.3 — Techo Infranqueable de Potencial:** Ningún futbolista bajo ninguna circunstancia puede superar su `potential_rating` original en su OVR final.
- **Regla 28.4 — Retiro Forzoso por Pérdida de Nivel:** Si un futbolista mayor de 33 años sufre una caída de OVR por debajo de 38 puntos y no tiene club, el motor de servidor ejecuta su retiro automático del fútbol profesional.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`player_evolution_rules.json`):
- `minutes_threshold_regular`: 900 minutos en la temporada.
- `minutes_threshold_starter`: 1,800 minutos en la temporada.
- `youth_max_ovr_gain_per_year`: +5 puntos de media.
- `veteran_physical_loss_per_year_base`: -2 puntos en velocidad y resistencia.
- `high_professionalism_decline_mitigation`: 0.50 (50% menos de pérdida física).

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Edad exacta, resumen de evolución anual (flechas verdes y rojas en cada estadística comparando con el año anterior), minutos disputados y anuncio de retiro si fue confirmado.
- **Parcial:** Diagnóstico del cuerpo técnico sobre el techo del jugador ("Aún tiene margen de desarrollo").
- **Oculta al Cliente (Estrictamente privada):** La curva matemática interna y el año exacto en que la IA decidirá retirarse antes del anuncio público.

## 9. Inteligencia Artificial / Evolución en Rivales
Los futbolistas de los 19 clubes rivales evolucionan y envejecen bajo las mismas fórmulas exactas de servidor, garantizando que el ecosistema futbolístico de la liga mantenga una rotación generacional orgánica.

## 10. Eventos y Auditoría
- `PLAYER_EVOLVED_ANNUALLY`: Variación anual de atributos registrada.
- `PLAYER_RETIREMENT_ANNOUNCED`: Anuncio público de última temporada.
- `PLAYER_RETIRED_PERMANENTLY`: Finalización oficial de la carrera deportiva.

## 11. Idempotencia y Mitigación de Errores de Red
- El proceso anual de evolución se ejecuta dentro de un batch controlado con control de versión de temporada (`season_year`). Reintentos del worker de fin de año no envejecen dos veces a los futbolistas.

## 12. Concurrencia
- La transacción de recalibración masiva itera a los futbolistas mediante cursores de base de datos divididos por lotes (`batch processing`), impidiendo bloqueos de tabla prolongados.

## 13. Persistencia y Ciclo de Vida
- Al retirarse, el jugador es archivado en la tabla histórica de ex-futbolistas; sus estadísticas de partidos y goles se conservan intactas de por vida.

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de Resumen de Temporada / Ficha de Evolución del Plantel.
- **¿Qué puedo hacer?:** Analizar quiénes crecieron y planificar el recambio generacional de los futbolistas veteranos.
- **¿Qué cuesta?:** Sin coste monetario.
- **¿Qué puede pasar?:** Si confiaste en los pibes y les diste minutos, hoy tendrás un plantel revalorizado en millones.
- **¿Qué ocurrió?:** Pantalla interactiva de progresión con gráficos radiales de habilidades comparando el antes y el después de la temporada.

## 15. Casos Extremos
- **Jugador que sufre rotura de ligamentos en su año de retiro:** El jugador opta por adelantar su retiro de inmediato sin jugar el resto del torneo.
- **Canterano que explota y supera expectativas:** Si promedia más de 7.5 puntos por partido, puede recibir un bonus de evolución acelerada de +1 OVR extra.

## 16. Anti-Exploits
- **Rejuvenecer jugadores:** No existe forma de alterar la fecha de nacimiento de un futbolista desde el cliente.
- **Inyección de estadísticas en veteranos:** El servidor valida que los deltas correspondan a las fórmulas biológicas del catálogo de balance.

## 17. Observabilidad y Métricas
- Distribución etaria de la liga (pirámide poblacional de futbolistas).
- Promedio de crecimiento anual de los menores de 21 años.
- Edad promedio de retiro en cada posición (los porteros suelen retirarse más tarde que los extremos).

## 18. Matriz de Pruebas
1. Juvenil con 2,000 minutos disputados -> Crecimiento de atributos y OVR incrementado en fin de temporada.
2. Juvenil con 0 minutos disputados -> 0 ganancia de atributos técnicos.
3. Veterano de 35 años -> Pérdida de velocidad y resistencia aplicada de acuerdo a su profesionalismo.
4. Cumplimiento de edad de retiro -> Emisión de evento de retiro formal y fecha de salida programada.
5. Invarianza de potencial: El OVR resultante nunca supera el `potential_rating`.

## 19. Criterios de Aceptación
- [x] Modelo de curva biológica, historial de evolución y retiros formalizado.
- [x] Máquina de estados de vida deportiva en 5 etapas cerrada.
- [x] Backend como autoridad absoluta de maduración y declive natural.
- [x] Ponderación de minutos jugados y profesionalismo cuantificada.
- [x] Rotación generacional simétrica en clubes de IA.
- [x] Eventos y auditoría de evolución implementados por diseño.
- [x] Idempotencia estricta en la recalibración anual.
- [x] Concurrencia por lotes en cierre de temporada resuelta.
- [x] Fórmulas etarias y umbrales parametrizados en JSON.
- [x] Casos extremos de lesiones de retiro cubiertos.
- [x] Anti-exploits de congelamiento de edad neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `PlayerEvolutionService`, `AgingDeclineCalculator`, `RetirementDecisionEngine`, `EvolutionRepository`.
- **Comandos:** `ProcessSeasonEvolutionBatchCommand`, `RegisterRetirementCommand`.
- **Queries:** `GetPlayerEvolutionHistoryQuery`, `GetRetiringPlayersQuery`.
- **Políticas DB:** `CREATE UNIQUE INDEX uq_player_season_evolution ON player_evolution_history(player_id, season_year)`.
