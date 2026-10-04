# FASE 22 — HINCHADA, AFICIÓN Y MASA SOCIAL
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Establecer el contrato funcional y formal de dominio para la masa social, la afición y la hinchada popular en *Del Potrero al Ídolo*. De acuerdo con las **Reglas Maestras 1, 2, 5 y 6**, el servidor es la autoridad absoluta de cálculo de la asistencia al estadio, la fidelidad de la masa de socios y el índice de fervor popular (`fan_support_score`): la afición reacciona dinámicamente a los resultados deportivos, la identidad barrial, el precio de las entradas y la mística de los clásicos, generando un factor ambiental real sobre el rendimiento del equipo en la cancha.

## 2. Alcance específico
- Segmentación de la Masa de Seguidores: Socios Fieles (núcleo duro incondicional), Hinchas Genuinos de Barrio y Simpatizantes Ocasionales (se suman en rachas victoriosas o partidos definitorios).
- Índice de Fervor y Apoyo Popular (`fan_support_score` de 0 a 100): Determina el clima en las tribunas y la paciencia con el DT.
- Algoritmo de Cálculo de Asistencia al Estadio: Función autoritativa de la capacidad del estadio, reputación del club, posición en la tabla, racha reciente (últimos 5 partidos), relevancia del partido (Clásico barrial = +40% demanda) y elasticidad de precio de la entrada.
- Efecto Presión Ambiental / Factor Caldera: Un estadio lleno con fervor alto otorga hasta un +8% de bonificación en duelos individuales de local y presiona al árbitro en jugadas divididas.
- Manifestaciones Populares: Banderazos de apoyo antes de clásicos vs banderazos de protesta con cánticos exigiendo la renuncia del DT tras 4 derrotas consecutivas.

## 3. Entidades y Modelo de Datos de Dominio
1. **ClubFanbaseState (`club_fanbase`)**:
   - `id` (UUID, PK).
   - `club_id` (UUID, FK -> `clubs.id`, Unique).
   - `loyal_members_count` (Integer, Default 350): Socios activos con cuota al día.
   - `casual_fanbase_potential` (Integer, Default 2500): Simpatizantes en la ciudad.
   - `fan_support_score` (Integer, 0-100, Default 65): Índice de satisfacción de la hinchada.
   - `stadium_atmosphere_status` (Enum: `HOSTILE_PROTEST`, `DISAPPOINTED`, `NEUTRAL`, `PASSIONATE`, `EUPHORIC_FORTRESS`).
   - `derby_rival_club_id` (UUID, Nullable, FK -> `clubs.id`): Clásico rival histórico.
   - `updated_at` (Timestamp UTC).

2. **MatchAtmosphereReport (`match_attendance_records`)**:
   - `id` (UUID, PK).
   - `fixture_id` (UUID, FK -> `fixtures.id`, Unique).
   - `home_club_id` (UUID, FK -> `clubs.id`).
   - `attendance` (Integer): Total de espectadores presentes.
   - `capacity_fill_percentage` (Float): % de ocupación del aforo.
   - `home_advantage_bonus` (Float, 1.0 a 1.08): Bonificación efectiva en el motor de partido.
   - `ticket_price_applied` (Numeric 6,2).
   - `fan_mood_after_match` (Integer, 0-100).
   - `created_at` (Timestamp UTC).

3. **FanbaseEventLog (`fanbase_events_log`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID).
   - `club_id` (UUID).
   - `event_type` (Enum: `DERBY_BANDERAZO`, `FAN_PROTEST`, `MEMBERSHIP_BOOM`, `BOOING_AT_HALF_TIME`, `STANDING_OVATION`).
   - `impact_on_morale` (Integer, -15 a +15).
   - `details` (String).
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados del Clima Popular
```
[CLIMA_NEUTRAL (Score 50-65)]
       │
       ├── (Racha 3+ victorias o triunfo en el clásico) ──► [EUPHORIC_FORTRESS (Score > 80)]
       │                                                          │
       │                                                          ├── +8% ventaja de localía
       │                                                          └── +20% demanda de entradas
       │
       └── (Racha 3+ derrotas consecutivas) ──────────────► [HOSTILE_PROTEST (Score < 35)]
                                                                  │
                                                                  ├── Banderazo de repudio en la sede
                                                                  └── -10 moral al DT y jugadores
```

### Transición Principal: Cálculo de Asistencia y Clima de Partido
- **Actor:** Servidor al despachar la simulación de partido de local (Fase 10 / 11).
- **Precondiciones:** Club juega en condición de local.
- **Comando:** `ComputeMatchAttendanceCommand(fixtureId, homeClubId, awayClubId)`.
- **Consecuencias:**
  1. Calcula la demanda:
     `demanda = socios_fieles + (casual_potential * factor_racha * factor_clasico * elasticidad_precio)`.
  2. Determina la asistencia final: `asistencia = clamp(round(demanda), socios_fieles, stadium_capacity)`.
  3. Fija el bono de localía en base al porcentaje de aforo completado y `fan_support_score`.
  4. Inserta el registro en `match_attendance_records`.
- **Idempotencia:** La asistencia de un partido cerrado queda inmutable; no se puede recalcular.

## 5. Flujo Funcional Paso a Paso
1. **La Semana Previa al Clásico:** El calendario marca que el próximo partido de local es contra el eterno rival barrial.
2. **Reacción Popular:**
   - La hinchada organiza un "Banderazo Histórico" en el entrenamiento.
   - El evento impacta positivamente la moral de los jugadores canteranos (+10 de moral).
   - La demanda de entradas se dispara al 180% de la capacidad del estadio.
3. **El Día del Partido:**
   - Estadio lleno a reventar (1,500 / 1,500 espectadores, 100% de ocupación).
   - Clima de las tribunas: `PASSIONATE` (+7% de bonificación en los duelos de campo).
   - El rival sufre una ligera penalización de -5% de efectividad de pase por intimidación acústica.
4. **Consecuencia Deportiva:** El club gana 1-0. El `fan_support_score` escala a 92/100 ("Euforia Total"). La dirigencia aumenta su índice de respaldo al DT (Fase 23).

## 6. Reglas Específicas
- **Regla 22.1 — Piso Mínimo de Socios Fieles:** La asistencia nunca puede caer por debajo del número de socios fieles registrados (`loyal_members_count`), quienes asisten al estadio sin importar las inclemencias del tiempo o malas rachas.
- **Regla 22.2 — Elasticidad de Precio:** Si el precio de la entrada supera el valor recomendado de la división en más de un 50%, la asistencia de simpatizantes casuales cae exponencialmente (`asistencia_casual *= (precio_recomendado / precio_fijado)^2.2`).
- **Regla 22.3 — Clásico Barrial Ineludible:** Si el partido enfrenta al club contra su `derby_rival_club_id`, el factor de rivalidad se fija en 1.45×, asegurando taquillas récord y máxima tensión en las gradas.
- **Regla 22.4 — Descontento Tóxico:** Si el `fan_support_score` cae por debajo de 25 puntos, los hinchas comienzan a silbar a los futbolistas en el entretiempo si el equipo va perdiendo, reduciendo su `composure` en el segundo tiempo.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`fanbase_rules.json`):
- `support_gain_per_win`: +4 puntos.
- `support_loss_per_loss`: -5 puntos.
- `derby_multiplier_demand`: 1.45.
- `max_home_advantage_bonus`: 1.08 (+8%).
- `protest_trigger_loss_streak`: 4 derrotas consecutivas.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Índice de apoyo popular (barra 0-100), estado de ánimo del público (Euforia, Calma, Tensión, Bronca), número de socios al día, informe de asistencia tras cada partido.
- **Parcial:** Estimación de demanda previa al partido ("Se espera estadio colmado").
- **Oculta al Cliente:** Descuentos matemáticos exactos en las tiradas de dados de intimidación del árbitro.

## 9. Inteligencia Artificial / Hinchadas de Rivales
Todos los clubes de la liga poseen su propia masa social y clásico rival, llenando sus canchas cuando reciben al usuario si están en los primeros puestos.

## 10. Eventos y Auditoría
- `FAN_SUPPORT_UPDATED`: Ajuste periódico del índice de afición.
- `DERBY_MATCH_ENGAGED`: Activación del factor clásico en taquilla y tribunas.
- `FAN_PROTEST_STAGED`: Protesta formal de hinchas registrada en el historial del club.

## 11. Idempotencia y Mitigación de Errores de Red
- El cómputo de asistencia se genera de manera determinista al iniciar el encuentro y se almacena en `match_attendance_records`. Consultas repetidas de lectura no alteran los números de concurrencia.

## 12. Concurrencia
- La actualización de la masa social en la cascada semanal ejecuta `UPDATE club_fanbase SET fan_support_score = ... WHERE club_id = :id` en una sola sentencia atómica.

## 13. Persistencia y Ciclo de Vida
- Los registros de récords de asistencia en clásicos se conservan de forma permanente en la tabla de récords históricos del club (Fase 36).

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pestaña de Afición / Pantalla de Club.
- **¿Qué puedo hacer?:** Conocer el humor de los hinchas, verificar la cantidad de socios y planificar el precio de entradas.
- **¿Qué cuesta?:** Sin coste.
- **¿Qué puede pasar?:** Si enfadas a la hinchada, la comisión directiva sentirá la presión popular para despedirte.
- **¿Qué ocurrió?:** Mensaje en el resumen de partido: *"1,420 hinchas colmaron las gradas e hicieron vibrar el estadio en la victoria"*.

## 15. Casos Extremos
- **Lluvia torrencial o clima hostil:** Reduce la asistencia de simpatizantes casuales en un 30% (pero los socios fieles asisten con paraguas y pilotos).
- **Rival en puesto de descenso:** Partidos contra colistas de la liga registran menor interés público salvo que el club propio pelee el campeonato.

## 16. Anti-Exploits
- **Asistencia superior al aforo del estadio:** El backend impone `LEAST(demanda, stadium_capacity)` impidiendo sobreventa ilegal de entradas.

## 17. Observabilidad y Métricas
- Promedio de ocupación de estadios en toda la división.
- Correlación estadística entre victorias de local y factor cancha.
- Frecuencia de protestas de hinchadas en la liga.

## 18. Matriz de Pruebas
1. Partido de local estándar -> Asistencia calculada entre socios fieles y aforo máximo, taquilla coherente.
2. Clásico barrial -> Demanda supera la capacidad, 100% de asistencia alcanzada y bono ambiental máximo activo.
3. Racha de 4 derrotas -> Se dispara evento `FAN_PROTEST_STAGED`, `fan_support_score` cae por debajo de 35.
4. Entrada con precio abusivo ($45 en potrero) -> Asistencia casual se desploma, recaudación neta disminuye.
5. Intento de forzar asistencia en payload client-side -> El servidor ignora el dato y computa la fórmula oficial.

## 19. Criterios de Aceptación
- [x] Modelo de afición, socios y atmósfera de estadio formalizado.
- [x] Máquina de estados de clima popular y bonificación de localía cerrada.
- [x] Backend como autoridad absoluta de cálculo de concurrencia y demanda.
- [x] Clásico barrial con multiplicadores y rivalidad definidos.
- [x] Efecto caldera y presión sobre árbitros y rivales cuantificado.
- [x] Eventos y auditoría de afición implementados por diseño.
- [x] Idempotencia estricta en el registro de concurrencia.
- [x] Concurrencia atómica resuelta en base de datos.
- [x] Parámetros de elasticidad de precios versionados en JSON.
- [x] Casos extremos de lluvias y sobreventa mitigados.
- [x] Anti-exploits de asistencia irreal neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `FanbaseService`, `AttendanceCalculatorEngine`, `AtmosphereEffectCalculator`, `FanbaseRepository`.
- **Comandos:** `ComputeMatchAttendanceCommand`, `ProcessWeeklyFanbaseMoodCommand`, `TriggerFanEventCommand`.
- **Queries:** `GetClubFanbaseOverviewQuery`, `GetMatchAttendanceReportQuery`.
- **Políticas DB:** `ALTER TABLE club_fanbase ADD CONSTRAINT chk_fan_support_range CHECK (fan_support_score BETWEEN 0 AND 100)`.
