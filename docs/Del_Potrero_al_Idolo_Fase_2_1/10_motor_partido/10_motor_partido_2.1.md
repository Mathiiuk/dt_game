# FASE 10 — MOTOR DE SIMULACIÓN DE PARTIDOS Y DIRECCIÓN EN VIVO
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Definir el contrato funcional y formal de dominio para el motor de simulación de partidos de fútbol minuto a minuto, la interactividad del Director Técnico en vivo, las órdenes tácticas reactivas y la persistencia autoritativa del resultado. De acuerdo con las **Reglas Maestras 1, 3, 8 y 9**, el partido se computa en el backend de forma determinista y reproducible: una vez iniciado el partido, si el usuario refresca la página o se desconecta, el partido NO vuelve a comenzar desde el minuto 0, sino que preserva su estado o se auto-completa en servidor de manera inmutable e idempotente.

## 2. Alcance específico
- Motor de simulación probabilística minuto a minuto (0' a 90'+ añadido).
- Generación autoritativa de eventos de partido (Goles, ocasiones manifiestas, faltas, tarjetas amarillas/rojas, lesiones, tiros de esquina, penales).
- Intervenciones del DT en vivo: Realización de hasta 5 sustituciones en 3 ventanas reglamentarias, cambio de mentalidad táctica, arengas desde el banco (Gritos del DT).
- Modos de reproducción y control de tiempo: Velocidades x1 (normal), x2 (rápido), x4 (ultra-rápido) y resolución instantánea ("Simular hasta el final").
- Persistencia del estado en tiempo real (evitar reseteo a 0' al recargar el navegador).
- Motor de partidos simultáneos de la liga para clubes de IA.

## 3. Entidades y Modelo de Datos de Dominio
1. **MatchInstance (`fixtures`)**:
   - `id` (UUID, PK): Identificador inmutable del encuentro.
   - `career_id` (UUID, FK -> `careers.id`).
   - `competition_id` (UUID, FK -> `competitions.id`).
   - `season_year` (Integer).
   - `match_day` (Integer): Número de fecha de la liga (ej: 1 a 38).
   - `home_club_id` (UUID, FK -> `clubs.id`).
   - `away_club_id` (UUID, FK -> `clubs.id`).
   - `home_score` (Integer, Default 0).
   - `away_score` (Integer, Default 0).
   - `status` (Enum: `SCHEDULED`, `IN_PROGRESS`, `FINISHED`, `ABANDONED`).
   - `current_minute` (Integer, 0 a 90+): Minuto alcanzado en la simulación.
   - `seed` (String): Semilla pseudoaleatoria generada al iniciar el partido para reproducibilidad determinista.
   - `match_stats` (JSONB): Posesión (%), disparos, tiros al arco, faltas, tarjetas, córners.
   - `simulation_payload` (JSONB, Nullable): Timeline completo de eventos si ya fue pre-simulado en servidor.
   - `started_at` (Timestamp UTC, Nullable).
   - `finished_at` (Timestamp UTC, Nullable).

2. **MatchEvent (`match_events`)**:
   - `id` (UUID, PK).
   - `fixture_id` (UUID, FK -> `fixtures.id`, On Delete Cascade).
   - `minute` (Integer, 1-120).
   - `event_type` (Enum: `GOAL`, `OWN_GOAL`, `PENALTY_GOAL`, `PENALTY_MISSED`, `YELLOW_CARD`, `RED_CARD`, `INJURY`, `SUBSTITUTION`, `WOODWORK_HIT`, `CHANCE_MISSED`).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `player_id` (UUID, FK -> `players.id`, Nullable): Protagonista del evento.
   - `assist_player_id` (UUID, FK -> `players.id`, Nullable): Asistidor en caso de gol.
   - `in_player_id` (UUID, Nullable): Futbolista que ingresa en cambio.
   - `out_player_id` (UUID, Nullable): Futbolista que sale en cambio.
   - `description` (String): Relato radial/periodístico del micro-evento.

3. **LiveManagerIntervention (`match_interventions`)**:
   - `id` (UUID, PK).
   - `fixture_id` (UUID, FK -> `fixtures.id`).
   - `minute` (Integer).
   - `intervention_type` (Enum: `TACTIC_CHANGE`, `SUBSTITUTION`, `SHOUT`).
   - `payload` (JSONB): Nueva mentalidad o IDs de jugadores sustituidos.

## 4. Máquina de Estados del Partido
```
[SCHEDULED] ──(Command: StartMatch)──► [IN_PROGRESS (status='IN_PROGRESS')]
                                             │
                       ┌─────────────────────┴──────────────────────┐
                       │                                            │
        (Interacción activa en cliente)               (Usuario cierra web / F5)
                       │                                            │
        [SIMULANDO_MINUTO_A_MINUTO (x1/x2/x4)]        [SERVIDOR_AUTOCOMPLETA_EN_BG]
                       │                                            │
                       └──► [FIN_DEL_TIEMPO (90'+)] ◄───────────────┘
                                      │
                        (Command: FinalizeMatch)
                                      │
                                      ▼
                                  [FINISHED]
```

### Transiciones Principales
1. **Transición T-01: Inicio de Partido (StartMatch)**
   - **Actor:** DT humano o worker de liga.
   - **Precondiciones:** `status == 'SCHEDULED'`. Alineaciones titulares válidas de ambos equipos.
   - **Comando:** `StartMatchCommand(fixtureId, userLineup, opponentLineup)`.
   - **Consecuencias:**
     1. Marca `status = 'IN_PROGRESS'`.
     2. Genera una semilla criptográfica `seed` inmutable.
     3. Pre-calcula los eventos probables del partido y timeline en memoria del servidor.
     4. Guarda `started_at = NOW()`.
   - **Idempotencia:** Si ya está `IN_PROGRESS`, el endpoint NO reinicia el partido: devuelve el estado actual y los eventos transcurridos hasta el minuto actual.

2. **Transición T-02: Orden del DT en Vivo (LiveShout / Sub)**
   - **Actor:** DT humano en partido `IN_PROGRESS`.
   - **Precondiciones:**
     - Sustitución: Máximo 5 sustituciones por equipo y máximo 3 ventanas de interrupción en tiempo reglamentario.
     - Grito del DT: Enfriamiento de al menos 10 minutos de juego entre arengas.
   - **Comando:** `ApplyLiveInterventionCommand(fixtureId, minute, type, payload)`.
   - **Consecuencias:** Aplica un modificador transitorio en la moral o cálculo táctico para los minutos restantes. Inserta registro en `match_interventions`.

3. **Transición T-03: Finalización del Encuentro (FinalizeMatch)**
   - **Actor:** Servidor al alcanzar el minuto final.
   - **Precondiciones:** `current_minute >= 90`.
   - **Consecuencias:**
     1. Marca `status = 'FINISHED'`.
     2. Guarda marcador final `home_score` y `away_score`.
     3. Dispara evento de dominio `MATCH_FINISHED` para activar el Post-Partido (Fase 11) y actualizar la Tabla (Fase 12).
   - **Idempotencia:** No se puede finalizar dos veces; llamadas redundantes retornan el resultado consolidado.

## 5. Flujo Funcional Paso a Paso
1. **Entrada a Vestuarios:** El DT revisa su 11 titular y hace clic en "Comenzar Partido".
2. **Generación Autoritaria:** El servidor inicializa el fixture en `IN_PROGRESS`, genera la semilla y crea el timeline del partido.
3. **Simulación en Tiempo Real:**
   - La interfaz ejecuta el reloj del partido a la velocidad seleccionada (x1 = 90 seg reales; x2 = 45 seg reales; x4 = 20 seg reales).
   - Cada tick de tiempo evalúa duelos estadísticos posicionales: (Ataque vs Defensa, Mediocampo vs Mediocampo).
   - Si se produce un gol o tarjeta, el relato radial se actualiza y la barra de marcador cambia.
4. **Manejo de Desconexión / Recarga (F5):**
   - Si el usuario refresca la página en el minuto 42, el cliente solicita `GET /api/v1/fixtures/:id/live-state`.
   - El backend responde que el partido está `IN_PROGRESS` con el minuto y eventos ya ocurridos.
   - La pantalla se reconecta inmediatamente al minuto 42 (o minuto transcurrido) en lugar de reiniciar de cero.
   - Si el usuario abandona la aplicación por más de 3 minutos, un worker del backend auto-completa la simulación hasta los 90 minutos y consolida el resultado en `FINISHED`.
5. **Pitazo Final:** El árbitro pita el final a los 90'+. El DT presiona "Continuar al Resumen" (Fase 11).

## 6. Reglas Específicas
- **Regla 10.1 — Prohibición de Reseteo (Anti-Save Scumming):** Si el partido ya inició (`status != 'SCHEDULED'`), recargar la página web jamás puede borrar los goles o tarjetas ocurridos. El resultado es continuo y persistente.
- **Regla 10.2 — Límite Reglamentario de Sustituciones:** Cada equipo puede realizar un máximo de 5 cambios en un máximo de 3 momentos/ventanas de juego durante el partido (el entretiempo no computa como ventana de interrupción).
- **Regla 10.3 — Controles de Velocidad de Simulación:** El cliente debe ofrecer botones para alternar dinámicamente entre x1, x2 y x4 en cualquier momento, además de un botón "Simular hasta el final" para quienes prefieran resultado directo.
- **Regla 10.4 — Efecto de Órdenes del DT (Gritos / Arengas):**
  - "¡Más garra y concentración!": Aumenta la agresividad (+15% tackles) y reduce el riesgo de desconcentración por 10 minutos.
  - "¡Cálmense, toquen la pelota!": Reduce el riesgo de tarjetas amarillas y aumenta posesión por 10 minutos.
  - "¡Todos al ataque!": Incrementa presencia en área rival pero expone la espalda de los defensores a contraataques.
- **Regla 10.5 — Tarjeta Roja:** Si un futbolista es expulsado, su club queda en inferioridad numérica (10 jugadores). El motor recalcula la posesión y efectividad defensiva con una penalización del 20% permanente para el resto del partido.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`match_engine_balance.json`):
- `expected_goals_per_match_average`: 2.65 goles.
- `yellow_cards_per_match_average`: 3.8 tarjetas.
- `red_card_probability_per_foul`: 1.8%.
- `injury_in_match_probability_base`: 1.2% por equipo por partido.
- `home_advantage_modifier`: +8% efectividad en duelos individuales para el equipo local.
- `stamina_drain_per_minute`: -0.35 puntos de fitness por minuto jugado.
- `simulation_speed_intervals`:
  - `x1`: 1.000 ms por minuto de partido (total 90s).
  - `x2`: 500 ms por minuto de partido (total 45s).
  - `x4`: 220 ms por minuto de partido (total 20s).

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Marcador en tiempo real, cronómetro, relato textual de jugadas, estadísticas en vivo (Posesión %, Disparos, Faltas), estado físico/cansancio de sus jugadores, amonestaciones y cambios disponibles.
- **Parcial:** Calificación de rendimiento en vivo de los jugadores (ej: 6.8, 7.5).
- **Oculta al Cliente:** Semilla aleatoria del partido, tiradas numéricas exactas de cada cálculo de probabilidad, órdenes secretas del banco rival.

## 9. Inteligencia Artificial / DT Rival en Vivo
La IA rival ejecuta sustituciones y cambios tácticos automáticos:
- Si va perdiendo en el minuto 65+: Realiza cambios ofensivos y activa mentalidad de ataque.
- Si va ganando por 1 gol en el minuto 80+: Introduce defensores o mediocampistas de marca para cerrar el partido.
- Si tiene un jugador amonestado con baja disciplina, lo sustituye preventivamente para evitar la expulsión.

## 10. Eventos y Auditoría
- `MATCH_STARTED`: Registro de pitazo inicial con alineaciones consolidadas.
- `MATCH_GOAL_SCORED`: Gol anotado con autor, asistente y minuto.
- `MATCH_SUBSTITUTION_MADE`: Sustitución reglamentaria aplicada.
- `MATCH_FINISHED`: Pitazo final con marcador y estadísticas auditadas.

## 11. Idempotencia y Mitigación de Errores de Red
- El endpoint `POST /api/v1/fixtures/:id/start` es estrictamente idempotente. Si se invoca cuando el partido ya está `IN_PROGRESS` o `FINISHED`, no genera una nueva simulación ni duplica eventos: devuelve el estado existente.

## 12. Concurrencia
- Durante la simulación, se actualiza el fixture con optimistic locking (`UPDATE fixtures SET home_score = :h, away_score = :a, current_minute = :m WHERE id = :id AND status = 'IN_PROGRESS'`).

## 13. Persistencia y Ciclo de Vida
- Los micro-eventos (`match_events`) se persisten en base de datos.
- Tras finalizar el partido, las estadísticas individuales (goles, asistencias, minutos jugados) impactan inmutablemente en el historial del futbolista (Fase 11 / 28) y en la tabla de posiciones (Fase 12).

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de Partido en Vivo / Cancha Virtual 2D.
- **¿Qué puedo hacer?:** Ver el desarrollo, alternar velocidad (x1, x2, x4), dar órdenes tácticas desde el banco y realizar sustituciones interactivas arrastrando suplentes.
- **¿Qué cuesta?:** Consume minutos de partido y energía física de los futbolistas en campo.
- **¿Qué puede pasar?:** Un gol en contra de último minuto, una tarjeta roja o una lesión.
- **¿Qué ocurrió?:** Relato vibrante minuto a minuto con tipografías deportivas legibles y colores temáticos del club local y visitante.

## 15. Casos Extremos
- **Usuario cierra la pestaña en el entretiempo:** El partido queda guardado en `IN_PROGRESS` en el minuto 45. Al regresar, la UI le permite reanudar el segundo tiempo o simularlo de inmediato.
- **Lesión sin cambios disponibles:** Si el equipo ya agotó las 5 sustituciones y un jugador se lesiona, el equipo debe disputar el resto del partido con 10 futbolistas (situación reglamentaria de emergencia).

## 16. Anti-Exploits
- **Anti-Save Scumming (Reiniciar partido cuando vas perdiendo):** Al presionar "Iniciar Partido", el estado cambia inmediatamente a `IN_PROGRESS` en base de datos. Si el usuario recarga la web tras recibir un gol en contra, el gol permanece registrado en el servidor.
- **Inyección de goles desde el cliente:** El cliente no tiene capacidad de enviar `{ home_score: 5 }`. El marcador solo se altera mediante los eventos calculados y firmados por el motor de backend.

## 17. Observabilidad y Métricas
- Distribución de goles por partido en la liga (debe converger entre 2.4 y 2.9 goles por partido).
- Velocidad de simulación más utilizada por los usuarios (x1 vs x2 vs x4).
- Tasa de abandonos de partidos a mitad de simulación.

## 18. Matriz de Pruebas
1. Iniciar partido programado -> `status` pasa a `IN_PROGRESS`, se genera semilla y timeline.
2. Recarga de navegador en el minuto 30 -> Devuelve el partido en curso en el minuto 30 con eventos intactos.
3. Intento de realizar una 6ª sustitución -> HTTP 400 `ERR_MAX_SUBSTITUTIONS_EXCEEDED`.
4. Intento de sustituir en una 4ª ventana de juego -> HTTP 400 `ERR_MAX_SUB_WINDOWS_EXCEEDED`.
5. Fin del partido en minuto 90 -> Marcador consolidado y `status` pasa a `FINISHED`.
6. Simulación automática de 9 partidos de rivales IA de la fecha -> Todos concluyen con marcadores plausibles.

## 19. Criterios de Aceptación
- [x] Modelo de datos de fixture, eventos de partido e intervenciones formalizado.
- [x] Máquina de estados con persistencia continua anti-save scumming cerrada.
- [x] Backend como autoridad absoluta del cálculo de goles y resultados.
- [x] Controles de velocidad x1, x2, x4 y simulación rápida especificados.
- [x] Órdenes tácticas del DT en vivo y sustituciones reglamentarias definidas.
- [x] IA rival con capacidad de respuesta táctica en entretiempo.
- [x] Eventos y auditoría de partido implementados por diseño.
- [x] Idempotencia estricta en el inicio y finalización del partido.
- [x] Concurrencia y reconexión tras desconexión del cliente resuelta.
- [x] Balance estadístico de goles y tarjetas parametrizado en JSON.
- [x] Casos de lesiones sin cambios y desconexiones mitigados.
- [x] Anti-exploits de manipulación de marcadores neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `MatchEngineService`, `MatchSimulationWorker`, `LiveInterventionManager`, `MatchEventRepository`.
- **Comandos:** `StartMatchCommand`, `ApplyLiveInterventionCommand`, `AutoFinishMatchCommand`.
- **Queries:** `GetLiveMatchStateQuery`, `GetMatchEventsQuery`.
- **Políticas DB:** `CREATE INDEX idx_match_events_fixture ON match_events(fixture_id, minute)`.
