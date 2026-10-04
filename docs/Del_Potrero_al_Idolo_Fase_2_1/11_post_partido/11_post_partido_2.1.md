# FASE 11 — POST-PARTIDO, CALIFICACIONES Y BALANCE DEPORTIVO
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Establecer el contrato funcional y formal de dominio para la etapa inmediatamente posterior a la finalización de un encuentro de fútbol. De acuerdo con las **Reglas Maestras 1, 2, 7 y 8**, el cierre de partido es una operación atómica autoritativa del backend: computa las consecuencias físicas definitivas (`fitness`), las valoraciones numéricas individuales (ratings 1.0 a 10.0), el reparto de experiencia (XP), el ingreso financiero por taquilla y venta de entradas (si actuó de local), y actualiza el estado anímico (`morale`) del vestuario de forma inmutable e idempotente.

## 2. Alcance específico
- Resumen ejecutivo estructurado en 4 secciones canónicas: (1) Marcador e incidencias, (2) Estadísticas comparativas de equipo, (3) Calificaciones y rendimiento individual, (4) Balance financiero de taquilla e informe médico.
- Algoritmo de calificación de jugadores (Rating 1.0 a 10.0) basado en acciones positivas (goles, asistencias, quites) y negativas (errores, goles recibidos, tarjetas).
- Aplicación de desgaste físico definitivo y consolidación de lesiones sufridas en cancha.
- Cálculo autoritativo de recaudación por boletería local (asistencia × precio de entrada) y devengo a las finanzas del club.
- Ajuste de moral grupal e individual según el resultado obtenido vs las expectativas previas.
- Despacho idempotente de consecuencias deportivas para evitar duplicaciones por recarga o múltiples clics.

## 3. Entidades y Modelo de Datos de Dominio
1. **MatchPostReport (`match_reports`)**:
   - `id` (UUID, PK).
   - `fixture_id` (UUID, FK -> `fixtures.id`, Unique).
   - `home_club_id` (UUID, FK -> `clubs.id`).
   - `away_club_id` (UUID, FK -> `clubs.id`).
   - `final_score` (String, ej: "2 - 1").
   - `attendance` (Integer): Espectadores presentes en el estadio.
   - `gate_receipts_gross` (Numeric 10,2): Recaudación total de boletería.
   - `match_xp_awarded` (Integer): Puntos de experiencia otorgados al DT.
   - `mvp_player_id` (UUID, FK -> `players.id`, Nullable): Jugador del partido.
   - `manager_press_quote` (String, Nullable): Declaración del DT si hubo conferencia.
   - `created_at` (Timestamp UTC).

2. **PlayerMatchPerformance (`player_match_stats`)**:
   - `id` (UUID, PK).
   - `fixture_id` (UUID, FK -> `fixtures.id`).
   - `player_id` (UUID, FK -> `players.id`).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `minutes_played` (Integer).
   - `rating` (Numeric 3,1, 1.0 a 10.0): Nota de rendimiento.
   - `goals` (Integer, Default 0).
   - `assists` (Integer, Default 0).
   - `shots` (Integer, Default 0).
   - `tackles_won` (Integer, Default 0).
   - `passes_completed` (Integer, Default 0).
   - `passes_attempted` (Integer, Default 0).
   - `fouls_committed` (Integer, Default 0).
   - `yellow_cards` (Integer, Default 0).
   - `red_cards` (Integer, Default 0).
   - `fitness_after_match` (Integer, 0-100).
   - `morale_delta` (Integer, -15 a +15).

## 4. Máquina de Estados
```
[PARTIDO_FINALIZADO_EN_MOTOR] ──(Command: ProcessPostMatch)──► [CALCULANDO_CONSECUENCIAS_ATOMICAS]
                                                                        │
                                   ┌────────────────────────────────────┴────────────────────────────────────┐
                                   ▼                                                                         ▼
                      [CONSOLIDANDO_ESTADISTICAS]                                               [ACREDITANDO_FINANZAS_Y_XP]
                                   │                                                                         │
                                   └────────────────────────────────────┬────────────────────────────────────┘
                                                                        ▼
                                                           [REPORTE_POST_PARTIDO_ACTIVO]
```

### Transición Principal: Consolidación de Post-Partido
- **Actor:** Servidor / Worker de finalización de encuentro.
- **Precondiciones:**
  1. `fixtures.status == 'FINISHED'`.
  2. No existe un registro previo en `match_reports` para el `fixture_id` (idempotencia estricta).
- **Comando:** `ProcessPostMatchCommand(fixtureId)`.
- **Consecuencias:**
  1. Computa la taquilla si el club es local: `ingreso = asistencia * ticket_price`. Se añade el dinero a `club_finances.balance`.
  2. Actualiza el `fitness` de cada futbolista en `players` según los minutos disputados.
  3. Si un jugador sufrió lesión en el partido, se inserta en `player_injuries` y se marca `is_injured = true`.
  4. Otorga XP al DT humano según resultado (Fase 05).
  5. Ajusta la moral de los jugadores: victoria (+5 a +10), derrota (-5 a -12), empate (-2 a +3).
  6. Inserta el reporte en `match_reports` y las notas individuales en `player_match_stats`.
- **Idempotencia:** Si el comando se reintenta por micro-corte de red, la base de datos detecta el `fixture_id` existente y responde el reporte ya computado sin volver a acreditar dinero de taquilla ni duplicar XP.
- **Errores:** `ERR_FIXTURE_NOT_FINISHED`, `ERR_POST_MATCH_ALREADY_PROCESSED`.

## 5. Flujo Funcional Paso a Paso
1. **Pitazo Final:** El motor de partido concluye los 90 minutos y transiciona a la pantalla `/match/:id/post`.
2. **Llamada Autoritaria:** El cliente invoca `GET /api/v1/fixtures/:id/post-report`.
3. **Cálculo de Calificaciones:**
   - Base = 6.0 puntos.
   - Gol anotado: +1.2 por gol. Asistencia: +0.7.
   - Valla invicta para arquero y defensores: +0.8.
   - Gol concedido (arquero/defensas): -0.4 por gol en contra.
   - Tarjeta amarilla: -0.3. Tarjeta roja: -2.0.
   - Se fija el rating en rango `[2.0, 10.0]`.
4. **Liquidación de Taquilla:**
   - Capacidad del estadio: 1,500. Asistencia = 1,120 espectadores (74.6% de ocupación).
   - Precio de entrada: $10.00. Ingreso bruto = $11,200.
   - Coste de organización y seguridad: -$1,800.
   - Ingreso neto acreditado en finanzas del club local: +$9,400.
5. **Presentación Visual Mobile-First:** El usuario visualiza la pantalla con tabs o acordeón claro:
   - **Tab 1: Crónica & Goles** (Resumen de anotadores y minuto).
   - **Tab 2: Estadísticas de Equipo** (Posesión %, Tiros al arco, Faltas).
   - **Tab 3: Rendimiento Individual** (Lista de futbolistas con su nota destacada, MVP con insignia dorada).
   - **Tab 4: Informe Financiero y Médico** (Recaudación de taquilla y novedades físicas).

## 6. Reglas Específicas
- **Regla 11.1 — Prohibición de Duplicación de Taquilla:** La recaudación de un partido se acredita UNA SOLA VEZ. Ningún refresh o reingreso a la pantalla puede volver a sumar fondos a la caja.
- **Regla 11.2 — Desgaste Físico Proporcional a la Intensidad:** Jugar los 90 minutos reduce el `fitness` entre -18 y -28 puntos dependiendo del ritmo táctico y la resistencia (`stamina`) del jugador.
- **Regla 11.3 — Impacto Psicológico del Resultado:**
  - Derrota por goleada (3+ goles de diferencia): -15 de moral a titulares y arquero.
  - Remontada épica en últimos 10 minutos: +12 de moral y bonificación de reputación.
- **Regla 11.4 — Elección del MVP:** El MVP se asigna automáticamente al futbolista con la calificación más alta del partido. En caso de empate, se desempata por goles anotados, asistencias o valla invicta.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`post_match_balance.json`):
- `base_player_rating`: 6.0.
- `goal_rating_boost`: 1.25.
- `assist_rating_boost`: 0.75.
- `clean_sheet_defender_boost`: 0.80.
- `yellow_card_penalty`: -0.35.
- `red_card_penalty`: -2.20.
- `stadium_operating_cost_percentage`: 15% de la taquilla bruta.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Marcador oficial, desglose de taquilla neta, recaudación, notas individuales de sus futbolistas y del rival, estado físico resultante y moral de su plantel.
- **Parcial:** Ninguna.
- **Oculta al Cliente:** Multiplicador oculto de fatiga residual para la semana próxima.

## 9. Inteligencia Artificial / Repercusión en Rivales
Los futbolistas de los clubes de IA también sufren el desgaste de fitness y el impacto de moral resultante del partido, asegurando paridad física para las siguientes fechas de la liga.

## 10. Eventos y Auditoría
- `POST_MATCH_PROCESSED`: Notificación de balance consolidado del encuentro.
- `GATE_RECEIPTS_CREDITED`: Acreditación bancaria de la recaudación del partido.
- `PLAYER_INJURY_RECORDED`: Registro formal de lesión sufrida durante el juego.

## 11. Idempotencia y Mitigación de Errores de Red
- La transacción envuelve `INSERT INTO match_reports ... ON CONFLICT (fixture_id) DO NOTHING`. Si ya existe el registro, la consulta devuelve el existente sin volver a ejecutar los updates de finanzas ni de moral.

## 12. Concurrencia
- La transacción de cierre utiliza `SELECT id FROM fixtures WHERE id = :id FOR UPDATE`, impidiendo que el cliente y un worker de timeout procesen el mismo post-partido al mismo tiempo.

## 13. Persistencia y Ciclo de Vida
- Los datos de `player_match_stats` son inmutables tras su creación y alimentan el historial de carrera del jugador (goles de por vida, media histórica de rendimiento).

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de Resumen Post-Partido.
- **¿Qué puedo hacer?:** Analizar las notas individuales, ver quién fue el MVP, revisar los ingresos de entradas y atender a la prensa si aplica.
- **¿Qué cuesta?:** Sin coste.
- **¿Qué puede pasar?:** Al pulsar "Volver al Dashboard", el juego avanzará al día posterior al partido.
- **¿Qué ocurrió?:** Vista ordenada sin desbordamientos en móvil (`pb-24`), números destacados y chips de color según la calificación (Verde >= 7.0, Amarillo 6.0-6.9, Rojo < 6.0).

## 15. Casos Extremos
- **Partido sin público (sanción de estadio):** Asistencia = 0, recaudación = $0, coste operativo mínimo fijo descontado de finanzas.
- **Lesión grave del arquero titular sin arquero suplente en cancha:** La calificación del jugador de campo que asumió el arco refleja la dificultad del puesto.

## 16. Anti-Exploits
- **Multi-reclamación de taquilla:** Imposible gracias a la clave foránea única `fixture_id` en `match_reports` y transacciones cerradas.
- **Modificación client-side de las calificaciones:** El cliente no calcula las notas; se reciben empaquetadas desde el servidor.

## 17. Observabilidad y Métricas
- Distribución de notas medias de los jugadores en la liga (debe promediar 6.4 ± 0.5).
- Recaudación promedio por partido según capacidad del estadio.
- Tiempo medio de permanencia en la pantalla de post-partido.

## 18. Matriz de Pruebas
1. Procesamiento post-partido local -> Taquilla acreditada en finanzas del club local.
2. Procesamiento post-partido visitante -> 0 taquilla acreditada al club visitante.
3. Jugador que anota 2 goles -> Calificación final >= 8.4 puntos.
4. Doble invocación del endpoint de post-partido -> La segunda llamada es un no-op idempotente.
5. Verificación de actualización de `fitness` y `morale` en la tabla `players`.

## 19. Criterios de Aceptación
- [x] Modelo de datos de informe post-partido y notas individuales formalizado.
- [x] Máquina de estados y persistencia atómica de consecuencias cerrada.
- [x] Backend como autoridad absoluta de calificaciones y liquidación de taquilla.
- [x] 4 secciones de interfaz claramente estructuradas y adaptadas a móvil.
- [x] Impacto de fatiga y moral simétrico para clubes humanos y de IA.
- [x] Eventos y auditoría financiera/deportiva registrados.
- [x] Idempotencia estricta contra duplicaciones de ingresos de taquilla.
- [x] Concurrencia con bloqueo pesimista en fixture resuelta.
- [x] Fórmulas de calificación y desgaste parametrizadas en JSON.
- [x] Casos de partidos a puertas cerradas y lesiones contemplados.
- [x] Anti-exploits de repetición de recompensas bloqueados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `PostMatchOrchestrator`, `PlayerRatingCalculator`, `GateReceiptsService`, `MatchReportRepository`.
- **Comandos:** `ProcessPostMatchCommand`, `GenerateMatchReportCommand`.
- **Queries:** `GetMatchReportQuery`, `GetPlayerMatchStatsQuery`.
- **Políticas DB:** `CREATE UNIQUE INDEX uq_match_report_fixture ON match_reports(fixture_id)`.
