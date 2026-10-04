# FASE 34 — COMPETICIONES INTERNACIONALES Y COPAS CONTINENTALES
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Definir el contrato funcional de dominio para las competiciones internacionales de clubes (**Copa Continental de Campeones** y **Copa de Plata Sudamericana**), su formato de clasificación deportiva, sorteo autoritativo de fases de grupos, eliminatorias de ida y vuelta, premios económicos extraordinarios en divisa internacional y la gloria del trofeo continental supremo en *Del Potrero al Ídolo*. De acuerdo con las **Reglas Maestras 1, 3, 6 y 14**, el fixture de llaves y las clasificaciones se generan y resuelven inmutablemente en el servidor.

## 2. Alcance específico
- Criterios de Clasificación Continental desde la Liga Nacional (Tier 1):
  - **Copa Continental de Campeones (Libertadores):** Puestos 1 a 4 de Primera División y Campeón de la Copa Nacional.
  - **Copa de Plata Sudamericana:** Puestos 5 a 8 de Primera División.
- Formato Oficial del Torneo:
  - Fase de Grupos: 32 clubes repartidos en 8 grupos de 4 equipos (6 fechas todos contra todos ida y vuelta).
  - Fases de Eliminación Directa: Octavos de final, Cuartos de final y Semifinales a ida y vuelta con criterio de desempate por penales.
  - Gran Final Continental: Partido único en estadio neutral consagrado.
- Impacto Económico y Premios en Divisas:
  - Participación en fase de grupos: +$300,000.
  - Premio por partido ganado en fase de grupos: +$50,000.
  - Campeón Continental: +$2,000,000 y clasificación al Mundial de Clubes.
- Desgaste Físico por Viajes Transcontinentales: Vuelos de larga distancia provocan -10 de fitness adicional en los futbolistas titulares.

## 3. Entidades y Modelo de Datos de Dominio
1. **InternationalTournament (`international_tournaments`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID, FK -> `careers.id`).
   - `tournament_type` (Enum: `CONTINENTAL_CHAMPIONS_CUP`, `SILVER_CUP`, `CLUB_WORLD_CHAMPIONSHIP`).
   - `season_year` (Integer).
   - `current_stage` (Enum: `GROUP_STAGE`, `ROUND_OF_16`, `QUARTER_FINALS`, `SEMI_FINALS`, `FINAL`, `COMPLETED`).
   - `champion_club_id` (UUID, Nullable, FK -> `clubs.id`).
   - `created_at`, `updated_at` (Timestamp UTC).

2. **InternationalGroupStanding (`international_group_standings`)**:
   - `id` (UUID, PK).
   - `tournament_id` (UUID, FK -> `international_tournaments.id`).
   - `group_letter` (String, 'A' a 'H').
   - `club_id` (UUID, FK -> `clubs.id`).
   - `points` (Integer, Default 0).
   - `played`, `won`, `drawn`, `lost` (Integer, Default 0).
   - `goals_for`, `goals_against`, `goal_difference` (Integer, Default 0).
   - `qualified_to_knockout` (Boolean, Default false).
   - **Restricción Unívoca:** `UNIQUE (tournament_id, group_letter, club_id)`.

3. **InternationalKnockoutBracket (`international_brackets`)**:
   - `id` (UUID, PK).
   - `tournament_id` (UUID, FK -> `international_tournaments.id`).
   - `stage_name` (Enum: `ROUND_OF_16`, `QUARTER_FINALS`, `SEMI_FINALS`, `FINAL`).
   - `bracket_slot` (Integer, 1-8).
   - `home_club_id` (UUID, FK -> `clubs.id`).
   - `away_club_id` (UUID, FK -> `clubs.id`).
   - `leg_1_fixture_id` (UUID, FK -> `fixtures.id`).
   - `leg_2_fixture_id` (UUID, Nullable, FK -> `fixtures.id`): Null en Final única.
   - `aggregate_home_score` (Integer, Default 0).
   - `aggregate_away_score` (Integer, Default 0).
   - `winner_club_id` (UUID, Nullable, FK -> `clubs.id`).

## 4. Máquina de Estados del Torneo Continental
```
[SORTEO_DE_GRUPOS] ──(Disputa de las 6 Fechas de Grupo)──► [EVALUANDO_2_PRIMEROS_POR_GRUPO]
                                                                        │
                                                                        ▼
                                                             [OCTAVOS_DE_FINAL (16 clubes)]
                                                                        │
                                                               (Ida y Vuelta)
                                                                        │
                                                                        ▼
                                                             [CUARTOS_Y_SEMIFINALES]
                                                                        │
                                                                        ▼
                                                             [GRAN_FINAL_CONTINENTAL]
                                                                        │
                                                      (Pitazo final en cancha neutral)
                                                                        │
                                                                        ▼
                                                          [CAMPEON_CONTINENTAL_CORONADO]
                                                          (Premio de $2,000,000 acreditado)
```

### Transición Principal: Liquidación de Fase y Emparejamiento
- **Actor:** Servidor durante el calendario semanal al concluir una etapa continental.
- **Precondiciones:** Todos los partidos de la etapa en curso están en estado `FINISHED`.
- **Comando:** `AdvanceInternationalKnockoutStageCommand(tournamentId, currentStage)`.
- **Consecuencias:**
  1. Computa los clasificados y ganadores globales de cada llave.
  2. Acredita los premios económicos correspondientes a los clubes que avanzan de ronda.
  3. Genera las llaves de la siguiente fase (`international_brackets`) y los fixtures de ida y vuelta en el calendario (Fase 07).
  4. Si concluyó la Final: Asigna `champion_club_id`, otorga trofeo en vitrina y clasifica al campeón al Mundial de Clubes.
- **Idempotencia:** Asociado al `(tournament_id, stage_name)` impidiendo dobles sorteos o dobles cobros de premios.

## 5. Flujo Funcional Paso a Paso
1. **La Noche de Copa:** El club humano, tras consagrarse en Primera División, debuta en la fase de grupos de la Copa Continental visitando a Flamengo en el Estadio Maracaná.
2. **Atmósfera Especial:**
   - La pantalla adopta la identidad gráfica de noche continental (tonos dorados y negros con parche de copa en la manga).
   - Los ingresos por derechos de transmisión se acreditan antes del partido (+$50,000 por televisación internacional).
3. **El Partido de Visitante:** El equipo lucha con garra y consigue un empate 1-1 histórico. Suma su primer punto en el Grupo C.
4. **Camino a la Gloria:**
   - Termina 2º de grupo y clasifica a Octavos de Final (cobrando $400,000 de premio).
   - Avanza ronda tras ronda hasta llegar a la Gran Final única.
5. **La Consagración:** Gana la final 2-0. El DT alza el máximo trofeo continental del continente, cobra el premio de $2,000,000 y suma +25 puntos de reputación personal.

## 6. Reglas Específicas
- **Regla 34.1 — Prohibición de Cruces del Mismo País en Octavos:** En el sorteo de octavos de final, los primeros de grupo se enfrentan a los segundos de grupo evitando en la medida de lo posible enfrentamientos entre clubes de la misma federación en la primera ronda eliminatoria.
- **Regla 34.2 — Desempate Global sin Gol de Visitante:** En caso de empate en el marcador global al cabo de los 180 minutos de la serie, no rige la regla del gol de visitante: se disputan directamente 30 minutos de tiempo suplementario y posterior tanda de penales reglamentaria.
- **Regla 34.3 — Premios Inembargables:** Los premios económicos de la confederación continental se depositan directamente en la tesorería del club y habilitan a la comisión directiva a autorizar presupuestos de fichajes de escala internacional.
- **Regla 34.4 — Fatiga de Vuelo Internacional:** Disputar un partido de copa internacional entre semana resta -10 de fitness adicional a los convocados por el desgaste de los vuelos transfronterizos.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`international_cups_balance.json`):
- `group_stage_qualification_prize`: $300,000.
- `group_stage_win_bonus`: $50,000.
- `round_of_16_prize`: $400,000.
- `quarter_finals_prize`: $600,000.
- `semi_finals_prize`: $900,000.
- `runner_up_prize`: $1,200,000.
- `champion_prize`: $2,000,000.
- `continental_title_reputation_boost`: +25 puntos.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Tabla de posiciones de los 8 grupos continentales, cuadro general de llaves eliminatorias de octavos a la final, estadísticas de goleadores del torneo y premios económicos acumulados.
- **Parcial:** Ninguna.
- **Oculta al Cliente:** Ninguna (el torneo continental es de difusión televisiva masiva y transparente).

## 9. Inteligencia Artificial / Gigantes del Continente
Los clubes de potencias continentales (Brasil, Colombia, Chile, Uruguay) presentan futbolistas de alto OVR (72 a 82), obligando al DT humano a planificar estrategias tácticas de repliegue y contraataque inteligente cuando juega de visitante.

## 10. Eventos y Auditoría
- `INTERNATIONAL_TOURNAMENT_INITIALIZED`: Sorteo de grupos oficializado.
- `CONTINENTAL_ROUND_ADVANCED`: Llave eliminatoria ganada y premio acreditado.
- `CONTINENTAL_CHAMPION_CROWNED`: Campeón continental inmortalizado.

## 11. Idempotencia y Mitigación de Errores de Red
- El avance de ronda está respaldado por la clave única `(tournament_id, stage_name)` en la tabla `international_brackets`. Reintentos de simulación no duplican fixtures ni premios de fase.

## 12. Concurrencia
- La transacción de liquidación de premios bloquea las finanzas del club participante con `FOR UPDATE`, garantizando la correcta integración del premio millonario en tesorería.

## 13. Persistencia y Ciclo de Vida
- La conquista de la Copa Continental se inscribe de por vida en la vitrina de trofeos del club (Fase 36) y en el Salón de la Fama personal del DT (Fase 38).

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de la Copa Continental / Cuadro de Honor Internacional.
- **¿Qué puedo hacer?:** Inspeccionar el cuadro de llaves, ver al próximo gigante que te toca enfrentar y revisar los millones acumulados en premios.
- **¿Qué cuesta?:** Desgaste físico de tus titulares en viajes internacionales.
- **¿Qué puede pasar?:** Si conquistas la Copa, tu club se convertirá en una potencia respetada en todo el planeta.
- **¿Qué ocurrió?:** Espectacular pantalla de premiación con el trofeo continental dorado y la hinchada entonando cánticos de gloria eterna.

## 15. Casos Extremos
- **Club que desciende en liga pero sigue compitiendo en la Copa:** Puede darse el caso insólito de un club que juega en Segunda División y a la vez disputa la final continental.
- **Definición por penales interminable (12-11 en penales):** El motor resuelve la tanda completa hasta encontrar un ganador.

## 16. Anti-Exploits
- **Clasificar a la copa sin haber obtenido el puesto en la tabla:** El algoritmo de clasificación se ejecuta de forma estricta en el servidor leyendo el snapshot final de liga (Fase 29).

## 17. Observabilidad y Métricas
- Porcentaje de usuarios que logran clasificar a la Copa Continental.
- Tasa de victorias de clubes argentinos frente a clubes extranjeros de elite.
- Dinero promedio ingresado por premios internacionales.

## 18. Matriz de Pruebas
1. Clasificación a la Copa según puesto en liga -> Club insertado en `international_group_standings`.
2. Victoria en fase de grupos -> Se acreditan exactamente $50,000 en tesorería del club.
3. Clasificación a Octavos como 1º o 2º de grupo -> Llave generada en `international_brackets` con premio de $400,000.
4. Definición de serie de cuartos empatada en el global -> Disputa suplementario y penales en el servidor.
5. Campeón continental coronado -> $2,000,000 acreditados, trofeo registrado en vitrina y +25 reputación al DT.

## 19. Criterios de Aceptación
- [x] Modelo de torneo continental, fases de grupos y llaves formalizado.
- [x] Máquina de estados de grupos, cruces eliminatorios y final única cerrada.
- [x] Backend como autoridad absoluta de sorteos y liquidación de divisas.
- [x] Desgaste por viajes transfronterizos y premios millonarios cuantificados.
- [x] Clubes de potencias continentales de IA activos y competitivos.
- [x] Eventos y auditoría de copas internacionales implementados.
- [x] Idempotencia estricta en el avance de llaves y cobro de premios.
- [x] Concurrencia con bloqueo pesimista en premios de fase resuelta.
- [x] Escala de premios y bonificaciones versionada en JSON.
- [x] Casos extremos de tandas de penales extensas cubiertos.
- [x] Anti-exploits de clasificación indebida neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `InternationalCupService`, `ContinentalBracketEngine`, `PrizeMoneyLedgerManager`, `InternationalTournamentRepository`.
- **Comandos:** `InitializeContinentalCupCommand`, `AdvanceKnockoutRoundCommand`, `CrownContinentalChampionCommand`.
- **Queries:** `GetTournamentBracketsQuery`, `GetGroupStandingsQuery`.
- **Políticas DB:** `ALTER TABLE international_group_standings ADD CONSTRAINT uq_intl_group_club UNIQUE (tournament_id, group_letter, club_id)`.
