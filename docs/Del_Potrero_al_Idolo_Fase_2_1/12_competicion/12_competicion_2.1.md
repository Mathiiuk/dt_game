# FASE 12 — COMPETICIÓN, LIGA Y TABLA DE POSICIONES
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Definir el contrato funcional de dominio para la competición de liga regular, la generación autoritativa del fixture anual de 38 fechas (formato todos contra todos a ida y vuelta para 20 clubes), la actualización matemática de la tabla de posiciones oficial y la simulación en segundo plano de los partidos entre rivales de IA. Blindar el sistema contra la creación descontrolada de competiciones o clubes duplicados mediante restricciones únicas estrictas.

## 2. Alcance específico
- Estructura formal de la liga: 20 instituciones deportivas, 38 jornadas (19 fechas de ida, 19 fechas de vuelta).
- Generación de fixture usando el algoritmo Round-Robin canónico con alternancia rigurosa de localía.
- Tabla de posiciones autoritativa con actualización transaccional inmediata tras cada partido finalizado.
- Reglas canónicas de desempate en la clasificación: (1) Puntos, (2) Diferencia de gol (`gd`), (3) Goles a favor (`gf`), (4) Resultado directo entre los equipos empatados, (5) Sorteo federativo.
- Zonas deportivas destacadas: Zona de Campeón (Puesto 1), Zona de Ascenso Directo (Puestos 1 y 2), Zona de Playoff / Reducido (Puestos 3 a 6), Zona de Descenso (Puestos 18 a 20).
- Prevención arquitectónica contra generación repetida de ligas o duplicados en `standings`.

## 3. Entidades y Modelo de Datos de Dominio
1. **Competition (`competitions`)**:
   - `id` (UUID, PK): Identificador inmutable del torneo.
   - `career_id` (UUID, FK -> `careers.id`): Aislamiento estricto de carrera.
   - `name` (String, ej: "Torneo Promocional Amateur - División Regional").
   - `division_tier` (Integer, Default 5): Nivel de categoría.
   - `season_year` (Integer): Año de la temporada.
   - `teams_count` (Integer, Default 20): Total de clubes competidores.
   - `total_match_days` (Integer, Default 38): Fechas totales del torneo.
   - `current_match_day` (Integer, 1-38, Default 1): Jornada en disputa.
   - `status` (Enum: `ACTIVE`, `COMPLETED`, `ARCHIVED`).
   - `created_at`, `updated_at` (Timestamp UTC).

2. **StandingRow (`standings`)**:
   - `id` (UUID, PK).
   - `competition_id` (UUID, FK -> `competitions.id`).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `points` (Integer, Default 0).
   - `played` (Integer, Default 0).
   - `won` (Integer, Default 0).
   - `drawn` (Integer, Default 0).
   - `lost` (Integer, Default 0).
   - `goals_for` (Integer, Default 0).
   - `goals_against` (Integer, Default 0).
   - `goal_difference` (Integer, Default 0): `goals_for - goals_against`.
   - `form` (String, ej: "W,D,W,L,W"): Últimos 5 resultados.
   - `updated_at` (Timestamp UTC).
   - **Restricción Unívoca:** `UNIQUE (competition_id, club_id)`.

3. **LeagueInitAudit (`competition_audit_log`)**:
   - `id` (UUID, PK).
   - `competition_id` (UUID).
   - `career_id` (UUID).
   - `action` (String: `LEAGUE_INITIALIZED`, `FIXTURE_SEEDED`, `STANDINGS_UPDATED`).
   - `details` (JSONB).
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados
```
[SIN_COMPETICION] ──(Command: InitializeLeague)──► [CREANDO_20_CLUBES_Y_FIXTURE]
                                                             │
                                                             ├──► Exactamente 20 registros en standings
                                                             ├──► Exactamente 380 partidos en fixtures
                                                             ▼
                                                    [COMPETICION_ACTIVA]
                                                             │
                              ┌──────────────────────────────┴──────────────────────────────┐
                              │                                                             │
            (Fin de partido de liga)                                      (Fecha 38 finalizada)
                              │                                                             │
                              ▼                                                             ▼
                 [ACTUALIZANDO_TABLA]                                              [LIGA_COMPLETADA]
```

### Transición T-01: Inicialización Única de la Liga
- **Actor:** Servidor al completar la fundación del club (Fase 03 y 04).
- **Precondiciones:**
  1. No existe una competición con `career_id = :id AND season_year = :year AND division_tier = :tier`.
  2. El club del usuario existe y está listo.
- **Comando:** `InitializeLeagueCommand(careerId, userClubId, seasonYear, tier)`.
- **Consecuencias:**
  1. Inserta 1 registro en `competitions`.
  2. Genera los 19 clubes rivales de IA si no existen.
  3. Inserta exactamente 20 filas en `standings` (1 para el usuario, 19 para los bots).
  4. Genera exactamente 380 partidos en `fixtures` (20 equipos × 19 partidos = 190 ida + 190 vuelta) distribuidos en 38 jornadas de 10 partidos cada una.
- **Idempotencia:** Si ya existe la competición, el comando devuelve la competición activa sin crear clubes ni partidos adicionales (prevención de runaway league generation).

### Transición T-02: Actualización de Posiciones tras Partido
- **Actor:** Servidor al finalizar un partido de liga (`fixtures.status = 'FINISHED'`).
- **Precondiciones:** `competition_id` coincide con la liga activa.
- **Comando:** `UpdateStandingsAfterMatchCommand(fixtureId)`.
- **Consecuencias:**
  1. Incrementa `played` en +1 para ambos clubes.
  2. Si hubo victoria local: `won` local +1, `points` local +3; `lost` visitante +1, `points` visitante +0.
  3. Si hubo empate: `drawn` +1 y `points` +1 para ambos.
  4. Actualiza `goals_for`, `goals_against` y recalcula `goal_difference = gf - ga`.
  5. Actualiza la cadena `form` (W, D, L).
- **Idempotencia:** Solo se ejecuta una vez por partido finalizado; reintentos no alteran los puntos.

## 5. Flujo Funcional Paso a Paso
1. **Consulta de Tabla:** El usuario ingresa a la sección "Competición" o "Tabla de Posiciones".
2. **Caché y SWR:** Si la tabla está en `queryCache('standings:' + compId)`, se renderiza en 0ms sin pantalla en negro ni spinners bloqueantes. En segundo plano se verifica si hubo cambios recientes.
3. **Cálculo de Ordenamiento Autorizado:**
   - La consulta SQL ejecuta el ordenamiento canónico oficial:
     `ORDER BY points DESC, (goals_for - goals_against) DESC, goals_for DESC, name ASC`.
   - Se inyecta la posición ordinal (Puesto 1 al 20) y la zona (Ascenso = Verde, Reducido = Azul, Descenso = Rojo).
4. **Simulación de la Fecha:** Al disputar su partido, los otros 9 encuentros de la jornada entre rivales de IA se simulan en segundo plano. Al terminar la fecha, las 20 filas de la tabla quedan actualizadas con los 10 resultados del fin de semana.

## 6. Reglas Específicas
- **Regla 12.1 — Restricción de Unicidad Absoluta (Anti Runaway):** La tabla `standings` debe poseer un índice único compuesto: `UNIQUE (competition_id, club_id)`. Bajo ninguna circunstancia pueden existir múltiples filas para un mismo club en la misma competición.
- **Regla 12.2 — Cero Creaciones Fantasma:** El endpoint `getStandings` jamás debe invocar `initializeLeague` ante un error de consulta. La inicialización debe ser un comando explícito y desacoplado de las consultas de lectura.
- **Regla 12.3 — Cero Puntos desde Frontend:** El cliente jamás puede modificar puntos, goles ni estadísticas de la tabla. Toda la tabla es una proyección de solo lectura de los partidos finalizados.
- **Regla 12.4 — Simetría de Fixtures:** Cada club debe disputar exactamente 19 partidos como local y 19 partidos como visitante a lo largo de las 38 fechas.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`league_format_rules.json`):
- `clubs_per_league`: 20.
- `total_fixtures_count`: 380 partidos.
- `points_win`: 3.
- `points_draw`: 1.
- `points_loss`: 0.
- `promotion_automatic_spots`: 2 (Campeón y Subcampeón).
- `playoff_promotion_spots`: 4 (Puestos 3, 4, 5 y 6 juegan semifinales y final por el 3er ascenso).
- `relegation_spots`: 3 (Puestos 18, 19 y 20 descienden a división inferior).

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Tabla completa de posiciones con PJ, G, E, P, GF, GC, DG, Pts, racha reciente (últimos 5 partidos) y fixture completo con resultados de todos los clubes de la categoría.
- **Parcial:** Ninguna.
- **Oculta al Cliente:** Ninguna (la tabla de una liga oficial es de dominio público y transparente).

## 9. Inteligencia Artificial / Partidos Simulados
Los 9 partidos semanales entre clubes de IA se calculan utilizando el motor probabilístico rápido del backend, considerando la media general de cada plantel, la táctica del DT rival y la ventaja de localía, arrojando resultados estadísticamente realistas.

## 10. Eventos y Auditoría
- `LEAGUE_INITIALIZED`: Creación de la temporada y fixture.
- `MATCH_DAY_COMPLETED`: Finalización de los 10 partidos de la jornada.
- `LEAGUE_CHAMPION_CROWNED`: Campeón matemático coronado.

## 11. Idempotencia y Mitigación de Errores de Red
- Si un partido se reporta como terminado dos veces, el trigger de actualización de tabla comprueba que la fecha no haya sido ya computada en `standings` mediante un log de partidos procesados.

## 12. Concurrencia
- La actualización de la tabla tras la fecha se realiza mediante una transacción única que bloquea las filas de los dos clubes involucrados (`SELECT ... FOR UPDATE`), evitando race conditions durante simulaciones masivas en paralelo.

## 13. Persistencia y Ciclo de Vida
- Al finalizar la temporada (Semana 52 / Fecha 38), la tabla se congela y persiste como snapshot histórico en `season_history_standings` para que pueda consultarse en la vitrina y sala de trofeos de las décadas futuras.

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de Posiciones / Tabla del Torneo.
- **¿Qué puedo hacer?:** Analizar la posición de mi equipo, consultar la zona de ascenso y revisar los resultados de la fecha.
- **¿Qué cuesta?:** Sin coste.
- **¿Qué puede pasar?:** Si caes en los últimos puestos, la dirigencia comenzará a emitir advertencias de despido.
- **¿Qué ocurrió?:** Tabla limpia, con scroll horizontal fluido en móvil para columnas secundarias (GF, GC) y columna fija para Club y Puntos.

## 15. Casos Extremos
- **Empate exacto en puntos, DG y GF en la fecha final:** Se aplica el criterio de desempate por partidos jugados entre sí (`head-to-head`). Si persiste la igualdad, se realiza sorteo federativo auditado.
- **Sanción federativa con quita de puntos:** La tabla soporta una columna `points_deduction` para reflejar sanciones disciplinarias de la dirigencia o federación.

## 16. Anti-Exploits
- **Inyección de puntos o resultados:** No existe endpoint para alterar la tabla de posiciones; los puntos se derivan exclusivamente del evento inmutable de cierre de partido en el servidor.
- **Bucle de recreación de liga:** Bloqueado a nivel de base de datos con la restricción de clave única.

## 17. Observabilidad y Métricas
- Verificación periódica de la suma de puntos en la liga: `SUM(points) == 3 * won_games + 2 * drawn_games`.
- Verificación de suma de goles: `SUM(goals_for) == SUM(goals_against)`.
- Latencia de consulta de la tabla (< 50ms).

## 18. Matriz de Pruebas
1. Inicialización de liga -> Exactamente 20 clubes, 20 filas en `standings`, 380 fixtures.
2. Invocación repetida de inicialización -> Idempotente, 0 registros duplicados creados.
3. Victoria 3-1 -> Ganador suma +3 puntos, +1 PJ, +1 PG, +3 GF, +1 GC, +2 DG. Perdedor suma +0 puntos, +1 PJ, +1 PP, +1 GF, +3 GC, -2 DG.
4. Consulta de tabla ordenada -> El líder con más puntos figura en el puesto 1.
5. Intento de insertar club duplicado en la misma liga -> Rechazado por `uq_standings_club_competition`.

## 19. Criterios de Aceptación
- [x] Modelo de datos de competición, tabla y auditoría formalizado.
- [x] Máquina de estados de temporada regular y fixture cerrada.
- [x] Backend como autoridad absoluta de desempates y clasificación.
- [x] Erradicación de pantallas en negro y bugs de recreación descontrolada.
- [x] Simulación en segundo plano de rivales IA balanceada y realista.
- [x] Eventos y auditoría de liga implementados por diseño.
- [x] Idempotencia y restricciones de unicidad de base de datos verificadas.
- [x] Concurrencia de simulaciones paralelas resuelta con bloqueos de fila.
- [x] Criterios de desempate y zonas de ascenso/descenso parametrizados.
- [x] Casos de empates totales y quita de puntos contemplados.
- [x] Anti-exploits de manipulación de puntos neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `CompetitionService`, `FixtureGeneratorService`, `StandingsCalculator`, `TieBreakEngine`.
- **Comandos:** `InitializeLeagueCommand`, `RecordFixtureResultCommand`, `SimulateAiMatchDayCommand`.
- **Queries:** `GetLeagueStandingsQuery`, `GetMatchDayFixturesQuery`.
- **Políticas DB:** `ALTER TABLE standings ADD CONSTRAINT uq_standings_club_competition UNIQUE (club_id, competition_id)`.
