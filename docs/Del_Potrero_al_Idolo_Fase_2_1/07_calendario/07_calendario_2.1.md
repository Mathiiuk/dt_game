# FASE 7 — CALENDARIO Y MOTOR DE TIEMPO
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Definir el contrato funcional de dominio para el motor de tiempo, la progresión del calendario anual y el avance cronológico en *Del Potrero al Ídolo*. De acuerdo con la **Regla Maestra 9**, el tiempo del juego pertenece exclusiva y autoritativamente al servidor: el cliente no puede acelerar, alterar ni manipular la fecha del juego, y cada avance temporal constituye una transacción atómica que orquesta el ciclo de vida del club y la liga.

## 2. Alcance específico
- Representación del tiempo de juego (Fecha actual de la carrera, número de semana 1-52, número de temporada).
- Estructura anual del calendario (Pretemporada, Fecha 1 a 38 de Liga, Ventanas de Mercado, Fechas FIFA/Descanso).
- Transición autoritativa de avance de semana ("Avance Temporal").
- Orquestación en cascada de subsistemas: devengo de salarios semanales, regeneración física de futbolistas, avance de plazos de lesiones y scouting, simulación de partidos de IA.
- Control de idempotencia y prevención de saltos dobles de tiempo.

## 3. Entidades y Modelo de Datos de Dominio
1. **CareerTimeState (`career_calendar`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID, FK -> `careers.id`, Unique): Una sola línea de tiempo por carrera.
   - `current_season_year` (Integer, ej: 2026): Año calendario activo.
   - `current_week` (Integer, 1 a 52): Semana actual de la temporada.
   - `current_date` (Date): Fecha ficticia actual (ej: "2026-08-15").
   - `season_phase` (Enum: `PRE_SEASON`, `REGULAR_SEASON_APERTURA`, `MID_SEASON_BREAK`, `REGULAR_SEASON_CLAUSURA`, `POST_SEASON`).
   - `transfer_window_open` (Boolean, Default false): Bandera de libro de pases abierto.
   - `is_advancing` (Boolean, Default false): Semáforo anti-concurrencia durante la simulación semanal.
   - `updated_at` (Timestamp UTC).

2. **CalendarScheduleItem (`calendar_events`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID, FK -> `careers.id`).
   - `season_year` (Integer).
   - `week_number` (Integer).
   - `date` (Date).
   - `event_type` (Enum: `LEAGUE_MATCH`, `CUP_MATCH`, `FRIENDLY`, `TRANSFER_DEADLINE`, `SALARY_PAYMENT`, `YOUTH_INTAKE`, `BOARD_MEETING`).
   - `entity_id` (UUID, Nullable): ID del partido o hito asociado.
   - `is_completed` (Boolean, Default false).

3. **TimeAdvanceAudit (`time_advance_log`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID).
   - `week_advanced_from` (Integer).
   - `week_advanced_to` (Integer).
   - `financials_processed` (Boolean).
   - `fixtures_simulated_count` (Integer).
   - `injuries_updated_count` (Integer).
   - `duration_ms` (Integer).
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados
```
[SEMANA_N_EN_ESPERA] ──(Command: AdvanceWeek)──► [BLOQUEANDO_TIEMPO (is_advancing=true)]
                                                           │
                                                           ├──► 1. Devengo financiero y salarios
                                                           ├──► 2. Recuperación física y evolución lesiones
                                                           ├──► 3. Simulación de partidos de liga IA
                                                           ├──► 4. Despacho de eventos dinámicos semanales
                                                           │
                                                           ├──► [ACTUALIZANDO_SEMANA (N -> N+1)]
                                                           │                 │
                                                           │                 ▼
                                                           │       [SEMANA_N+1_CONFIRMADA]
                                                           │                 │
                                                           └── (Fallo) ──────┴──► [LIBERANDO_BLOQUEO (is_advancing=false)]
```

### Transición Principal: Avance Semanal del Juego
- **Actor:** DT humano a través del cliente, o worker de background.
- **Precondiciones:**
  1. `is_advancing == false`.
  2. No existen partidos obligatorios pendientes de disputar por el club en la semana actual (`fixtures WHERE status = 'SCHEDULED' AND week = current_week`).
  3. No hay decisiones de eventos dinámicos bloqueantes pendientes.
- **Comando:** `AdvanceWeekCommand(careerId, clubId, expectedCurrentWeek)`.
- **Consecuencias:**
  1. Activa semáforo `is_advancing = true`.
  2. Ejecuta cascada de servicios: Finanzas, Salud/Física, Fixtures IA, Scouters.
  3. Incrementa `current_week = current_week + 1` y suma 7 días a `current_date`.
  4. Si `current_week > 52`, transiciona a cierre de temporada (Fase 29/30).
  5. Inserta registro en `time_advance_log`.
  6. Libera semáforo `is_advancing = false`.
- **Idempotencia:** Si `expectedCurrentWeek != career_calendar.current_week`, el backend rechaza la orden como duplicada o desfasada (optimistic lock).
- **Errores:** `ERR_MATCH_MUST_BE_PLAYED_FIRST`, `ERR_TIME_ADVANCE_IN_PROGRESS`, `ERR_STALE_WEEK_VERSION`.

## 5. Flujo Funcional Paso a Paso
1. **Acción de Usuario:** El DT revisa su equipo y presiona "Avanzar Semana" desde el Dashboard.
2. **Recepción Autoritaria:** El servidor recibe el comando con la semana que el cliente cree tener (`expectedCurrentWeek = 14`).
3. **Bloqueo Transaccional:** El servidor abre una transacción con aislamiento `SERIALIZABLE` sobre `career_calendar`. Comprueba que la semana coincida y que no esté en curso otro avance.
4. **Cascada Semanal de Dominio:**
   - **Economía:** Descuenta masa salarial semanal de `club_finances.balance` y suma ingresos por patrocinio recurrente.
   - **Preparación Física:** Futbolistas sanos recuperan +15 a +25 de `fitness` (hasta el tope de 100%). Jugadores con sobrecarga descansan.
   - **Enfermería:** Se descuenta 1 semana del tiempo de recuperación de jugadores lesionados. Si llega a 0, `is_injured = false`.
   - **Simulación de Liga:** Si la semana contiene fecha de torneo para los otros 18 clubes IA, el motor simula sus 9 partidos y actualiza la tabla de posiciones (Fase 10 / 12).
   - **Scouting y Fichajes:** Avanzan los días de informes de ojeadores y se evalúan ofertas de mercado pendientes.
5. **Consolidación:** Se actualiza `current_week = 15`, se escribe la auditoría en `time_advance_log` y se libera el semáforo.
6. **Respuesta al Cliente:** Devuelve el nuevo estado con HTTP 200 y el cliente actualiza el Dashboard en tiempo real.

## 6. Reglas Específicas
- **Regla 7.1 — El Reloj Pertenece al Servidor:** El cliente jamás envía la nueva fecha. Toda adición cronológica se realiza con aritmética de fechas en el servidor PostgreSQL (`current_date + INTERVAL '7 days'`).
- **Regla 7.2 — Partidos no Evadibles:** Un DT no puede saltarse un partido de su propio club usando "Avanzar Semana". Debe ingresar al motor de partido o solicitar simulación rápida autorizada.
- **Regla 7.3 — Idempotencia por Versión de Semana:** Cada petición de avance debe suministrar el token de semana actual. Si una petición duplicada llega por lag, es descartada limpiamente sin avanzar una segunda semana.
- **Regla 7.4 — Inmutabilidad del Pasado:** Las semanas finalizadas y sus eventos históricos no pueden volver a ejecutarse ni recalcularse.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`calendar_rules.json`):
- `weeks_per_season`: 52 semanas.
- `league_match_weeks`: Semanas 3 a 21 (Apertura) y 26 a 44 (Clausura).
- `summer_transfer_window`: Semanas 1 a 6.
- `winter_transfer_window`: Semanas 22 a 25.
- `weekly_base_stamina_recovery`: 20 puntos de fitness.
- `youth_intake_week`: Semana 35.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Calendario de la temporada completo con fechas de partidos programados, descansos, cierres de mercado de transferencias y festividades deportivas.
- **Parcial:** Estimación de semanas restantes para recuperación de lesionados ("Aprox. 2 a 3 semanas").
- **Oculta al Cliente:** Semilla aleatoria que determinará eventos aleatorios futuros de la semana siguiente.

## 9. Inteligencia Artificial / Sincronización del Mundo
Todos los clubes de la liga avanzan al unísono. La IA no puede adelantar ni atrasar su reloj respecto al jugador humano; todo el ecosistema de la liga comparte el mismo `current_week`.

## 10. Eventos y Auditoría
- `WEEK_ADVANCED`: Registro oficial de cambio de semana con métricas de salud y finanzas.
- `SEASON_PHASE_CHANGED`: Notificación de cambio de etapa (ej: apertura de libro de pases).
- `SIMULATION_STALLED_ERROR`: Alerta de fallo en cascada si un subsistema tardó más de 5 segundos.

## 11. Idempotencia y Mitigación de Errores de Red
- Si el usuario hace doble clic frenético en "Avanzar Semana", la primera petición adquiere el bloqueo. La segunda petición es rechazada de inmediato con HTTP 409 Conflict (`ERR_TIME_ADVANCE_IN_PROGRESS`) o HTTP 200 con el estado ya actualizado, impidiendo que el juego avance dos semanas consecutivas de golpe.

## 12. Concurrencia
- La columna `is_advancing` actúa como cerrojo optimista y mutex a nivel de base de datos. Se utiliza `SELECT ... FOR UPDATE` sobre `career_calendar` durante toda la duración de la cascada.

## 13. Persistencia y Ciclo de Vida
- El calendario se inicializa al fundar el club y concluye al retirarse el DT (Fase 40). El registro de eventos históricos permanece accesible para el visor de historial de temporadas pasadas.

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de Calendario Institucional o botón de acción rápida en Dashboard.
- **¿Qué puedo hacer?:** Inspeccionar el fixture anual y accionar el avance a la próxima semana.
- **¿Qué cuesta?:** Devengará los salarios semanales del presupuesto y consumirá 1 semana del calendario.
- **¿Qué puede pasar?:** Al avanzar, jugadores lesionados pueden recibir el alta médica y se simularán los demás resultados de la liga.
- **¿Qué ocurrió?:** Modal de transición elegante con resumen semanal: "Semana 15 completada. Gastos en salarios: -$3,200. Próximo rival: Deportivo Central".

## 15. Casos Extremos
- **Cierre inesperado del servidor a mitad de cascada:** Gracias a la transacción atómica (`BEGIN ... COMMIT`), si el servidor se interrumpe durante el cálculo, la base de datos ejecuta `ROLLBACK` completo, dejando el tiempo exactamente en la semana previa sin corrupciones parciales.
- **Temporada concluida (Semana 52):** El comando de avance bloquea el avance regular y transiciona obligatoriamente a la rutina de Cierre de Temporada (Fase 29).

## 16. Anti-Exploits
- **Manipulación del reloj del sistema operativo del cliente:** Cambiar la hora de Windows/Android no afecta en absoluto el juego. El tiempo es estrictamente la columna `current_date` en PostgreSQL UTC.
- **Evitar derrotas cerrando el navegador:** Si un partido está programado para la semana, no se puede avanzar sin jugar o simular oficialmente el encuentro.

## 17. Observabilidad y Métricas
- Tiempo total de procesamiento de la cascada semanal (debe ser < 250ms).
- Frecuencia de rechazos por doble invocación concurrente.
- Número de semanas promedio jugadas por sesión de usuario.

## 18. Matriz de Pruebas
1. Avance semanal estándar -> Semana incrementa en +1, fecha avanza 7 días, salarios debitados.
2. Avance semanal con partido programado para hoy -> HTTP 400 `ERR_MATCH_MUST_BE_PLAYED_FIRST`.
3. Dos peticiones simultáneas de avance -> Solo una procesa, la otra recibe 409 o estado actualizado sin salto doble.
4. Reducción de tiempo de lesión -> Jugador con 2 semanas de baja pasa a 1 semana tras el avance.
5. Transición en semana 52 -> Se activa la fase de fin de temporada y reseteo de fixture.

## 19. Criterios de Aceptación
- [x] Modelo de tiempo de carrera y agenda anual formalizado.
- [x] Máquina de estados de avance temporal con semáforo mutex cerrada.
- [x] Backend como autoridad absoluta e inviolable del reloj del juego.
- [x] Cascada de subsistemas (salud, finanzas, IA) orquestada atómicamente.
- [x] Sincronización temporal idéntica para clubes humanos y de IA.
- [x] Logs de auditoría de avance temporal implementados.
- [x] Idempotencia estricta contra doble clic y saltos dobles de tiempo.
- [x] Concurrencia con bloqueo serializable garantizada.
- [x] Estructura del calendario de 52 semanas parametrizable en JSON.
- [x] Casos extremos y recuperación ante caídas cubiertos.
- [x] Anti-exploits de manipulación de hora local bloqueados por diseño.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `TimeProgressionService`, `CalendarRepository`, `WeeklyCascadeOrchestrator`, `TimeAdvanceMutex`.
- **Comandos:** `AdvanceWeekCommand`, `ScheduleCalendarEventCommand`.
- **Queries:** `GetCareerTimeStateQuery`, `GetSeasonCalendarQuery`.
- **Políticas DB:** `ALTER TABLE career_calendar ADD CONSTRAINT chk_valid_week CHECK (current_week BETWEEN 1 AND 52)`.
