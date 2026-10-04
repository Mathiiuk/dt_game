# FASE 36 — HISTORIA DEL CLUB, PALMARÉS Y RÉCORDS INSTITUCIONALES
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Definir el contrato funcional de dominio para el archivo histórico, la sala de trofeos oficial y el registro perpetuo de marcas y récords del club en *Del Potrero al Ídolo*. De acuerdo con la **Regla Maestra 14**, los hechos históricos críticos son inmutables: cada título obtenido, ascenso conquistado, goleada legendaria o récord superado queda grabado a fuego en el servidor de forma irreversible, construyendo la mística y el patrimonio de la institución a través de los años.

## 2. Alcance específico
- Vitrina y Palmarés Oficial del Club: Trofeos de Liga de cada división (Tier 5 a Tier 1), Copas Nacionales, Copas Continentales y medallas de subcampeón o ascensos.
- Muro de Récords Históricos Institucionales:
  - Mayor goleada histórica a favor (ej: "8 - 0 vs Deportivo Rincón, 2027").
  - Máximo goleador en una sola temporada (ej: "Carlos Silva - 32 goles, 2026/27").
  - Máximo goleador de todos los tiempos del club.
  - Jugador con mayor cantidad de presencias oficiales con la camiseta del club.
  - Racha de partidos invicto más prolongada (ej: "19 partidos invicto").
  - Récord de recaudación y asistencia en el estadio.
  - Venta más cara de la historia del club (Fase 14).
- Cronología Anual de Temporadas (Temporada por temporada con puesto en tabla, puntos, DT a cargo y balance).
- Efemérides y Fechas Patrias del Club (Aniversario de fundación, aniversario del primer ascenso).

## 3. Entidades y Modelo de Datos de Dominio
1. **ClubTrophyCabinet (`club_trophies`)**:
   - `id` (UUID, PK).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `competition_name` (String, ej: "Torneo Regional Tier 5", "Copa Continental").
   - `season_year` (Integer).
   - `trophy_type` (Enum: `CHAMPION`, `RUNNER_UP`, `PROMOTION_PLAYOFF`, `FAIR_PLAY`).
   - `manager_id_at_time` (UUID, FK -> `managers.id`).
   - `created_at` (Timestamp UTC).

2. **ClubAllTimeRecord (`club_records`)**:
   - `id` (UUID, PK).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `record_type` (Enum: `BIGGEST_WIN`, `HEAVIEST_DEFEAT`, `LONGEST_UNBEATEN_STREAK`, `MOST_GOALS_SEASON_PLAYER`, `ALL_TIME_TOP_SCORER`, `MOST_APPEARANCES`, `RECORD_TRANSFER_SALE`, `RECORD_ATTENDANCE`).
   - `record_value_numeric` (Numeric 12,2): Valor cuantitativo (goles, partidos, dinero o espectadores).
   - `record_holder_name` (String): Futbolista, rival o protagonista de la marca.
   - `record_holder_player_id` (UUID, Nullable, FK -> `players.id`).
   - `season_year` (Integer).
   - `match_description` (String, Nullable).
   - `updated_at` (Timestamp UTC).
   - **Restricción Unívoca:** `UNIQUE (club_id, record_type)`.

3. **ClubChronologyEntry (`club_history_timeline`)**:
   - `id` (UUID, PK).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `season_year` (Integer).
   - `division_tier` (Integer).
   - `final_position` (Integer).
   - `points` (Integer).
   - `manager_name` (String).
   - `notable_milestone` (String): Hito destacado del año.
   - `created_at` (Timestamp UTC).

## 4. Máquina de Estados del Archivo Histórico
```
[PARTIDO_O_TORNEO_FINALIZADO] ──► [EVALUANDO_RECORDS_Y_PALMARES]
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
    (¿Se coronó campeón / subcampeón?)                            (¿Superó alguna marca histórica?)
                 │                                                             │
                 ▼                                                             ▼
    [INMORTALIZAR_TROFEO_EN_VITRINA]                              [ACTUALIZAR_MURO_DE_RECORDS]
    (club_trophies INSERT inmutable)                              (club_records UPDATE autoritativo)
                 │                                                             │
                 └──────────────────────────────┬──────────────────────────────┘
                                                ▼
                                   [NOTIFICACION_HISTORICA_AL_DT]
```

### Transición Principal: Evaluación y Registro de Récord
- **Actor:** Servidor tras un partido o venta millonaria (Fase 11 / 14 / 29).
- **Precondiciones:** Evento verificado y finalizado en base de datos.
- **Comando:** `CheckAndRecordClubMilestonesCommand(clubId, eventContext)`.
- **Consecuencias:**
  1. Compara el valor actual con el récord persistido en `club_records`.
  2. Si el nuevo valor supera la marca previa:
     - Actualiza `record_value_numeric`, el nombre del poseedor y el año.
     - Emite evento `CLUB_RECORD_BROKEN`.
     - Otorga puntos de XP al DT (Fase 05).
- **Idempotencia:** La comparación usa operadores lógicos estrictos (`>`); si no supera el récord existente, no realiza cambios.

## 5. Flujo Funcional Paso a Paso
1. **La Goleada:** En la Fecha 14, el club derrota a un rival por 7 a 0.
2. **Detección Automática:** El servidor consulta el récord actual de `BIGGEST_WIN` del club (que era un 5-0 de la temporada anterior).
3. **Inscripción en el Muro:**
   - La nueva marca histórica de 7-0 se guarda en `club_records`.
   - Se inmortaliza la fecha, los goleadores y el resultado.
4. **Visita a la Sala de Trofeos:** El DT abre la pestaña "Historia del Club":
   - En la vitrina brillan las copas ganadas con sus años grabados en las placas.
   - En el muro de récords figura la reciente goleada 7-0 y el máximo artillero del club.
   - La cronología muestra año por año la escalada desde el potrero hacia la elite.

## 6. Reglas Específicas
- **Regla 36.1 — Inmutabilidad de Trofeos:** Los trofeos conquistados jamás pueden ser eliminados ni transferidos a otros clubes; pertenecen de forma perpetua al patrimonio de la institución.
- **Regla 36.2 — Criterio Estricto de Superación de Récords:** Para batir un récord cuantitativo existente, el nuevo valor debe ser estrictamente mayor (`newValue > recordValue`). En caso de empate, se conserva al poseedor histórico original (criterio de antigüedad).
- **Regla 36.3 — Registro de Ventas Récord en Divisa Real:** El récord de venta más cara (`RECORD_TRANSFER_SALE`) solo computa el dinero limpio recibido en tesorería, excluyendo comisiones de agentes o deducciones dirigenciales.
- **Regla 36.4 — Identidad de Cantera:** El récord de presencias oficiales prioriza futbolistas formados en la institución (`is_homegrown = true`) para condecoraciones de ídolos (Fase 37).

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`club_history_rules.json`):
- `xp_bonus_per_broken_record`: 250 XP al DT.
- `reputation_boost_per_broken_record`: +2 puntos de reputación al club.
- `anniversary_moral_boost`: +5 a jugadores canteranos en el partido de aniversario del club.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Vitrina virtual en 3D/2D con todos los trofeos, lista completa de récords institucionales vigentes, cronología de temporadas y estadísticas históricas de ex-jugadores.
- **Parcial:** Ninguna.
- **Oculta al Cliente:** Ninguna (la historia de un club de fútbol es patrimonio público de sus hinchas).

## 9. Inteligencia Artificial / Historia de Clubes Rivales
Los 19 clubes rivales también conservan su historia y sus propios trofeos, permitiendo al DT humano consultar las vitrinas de los clubes a los que se enfrenta para conocer su linaje futbolístico.

## 10. Eventos y Auditoría
- `TROPHY_ADDED_TO_CABINET`: Registro oficial de título conquistado.
- `CLUB_RECORD_BROKEN`: Celebración de nueva marca institucional.
- `CHRONOLOGY_SEASON_ARCHIVED`: Cierre anual archivado en la línea de tiempo.

## 11. Idempotencia y Mitigación de Errores de Red
- La inserción de trofeos está protegida por la clave compuesta `(club_id, competition_name, season_year, trophy_type)` en `club_trophies`. No se pueden duplicar copas en la vitrina por recargas de pantalla.

## 12. Concurrencia
- La actualización de récords utiliza `UPSERT ON CONFLICT (club_id, record_type) DO UPDATE`, garantizando que dos marcas en el mismo fin de semana se resuelvan de forma atómica.

## 13. Persistencia y Ciclo de Vida
- La historia del club persiste de forma indefinida en la base de datos y no se resetea si el DT renuncia o se retira.

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Sala de Trofeos y Museo Histórico del Club.
- **¿Qué puedo hacer?:** Admirar los títulos conquistados, repasar las marcas históricas y revivir campañas de años anteriores.
- **¿Qué cuesta?:** Sin coste.
- **¿Qué puede pasar?:** Si rompes el récord de mayor goleada, la afición recordará tu nombre por décadas.
- **¿Qué ocurrió?:** Renderizado dorado de las copas con placas metálicas interactivas que muestran fecha y DT campeón.

## 15. Casos Extremos
- **Club fundado recientemente sin partidos oficiales:** La sala de trofeos inicia vacía y los récords muestran "Sin registros previos", esperando a que el DT escriba las primeras páginas de oro.
- **Récord batido por un rival (derrota más abultada):** El muro de récords también conserva marcas amargas (ej: "Peor derrota histórica: 0-6") para reflejar la resiliencia del club.

## 16. Anti-Exploits
- **Inyección de trofeos ficticios:** Los trofeos solo pueden insertarse mediante el evento verificado de cierre de competición firmado por el servidor.

## 17. Observabilidad y Métricas
- Cantidad promedio de trofeos conquistados por los usuarios en 10 temporadas.
- Frecuencia de actualización de récords institucionales.

## 18. Matriz de Pruebas
1. Conquista de torneo regional -> Trofeo insertado en `club_trophies` con nombre del DT y año.
2. Victoria por 8-0 que supera el récord de 6-0 -> `club_records` actualizado con nuevo valor y protagonista.
3. Victoria por 4-0 que no supera el récord de 8-0 -> Récord se mantiene intacto.
4. Intento de insertar trofeo duplicado para el mismo año -> Rechazado por clave de unicidad.
5. Consulta de cronología -> Lista ordenada descendentemente por `season_year`.

## 19. Criterios de Aceptación
- [x] Modelo de vitrina de trofeos, récords institucionales y cronología formalizado.
- [x] Máquina de estados de evaluación de marcas y palmarés cerrada.
- [x] Backend como autoridad absoluta de validación de hitos inmutables (Master Rule 14).
- [x] Récords de goleadas, artilleros y ventas cuantificados.
- [x] Vitrinas históricas activas y consultables en clubes de IA.
- [x] Eventos y auditoría de gloria institucional implementados.
- [x] Idempotencia estricta en la adición de copas y medallas.
- [x] Concurrencia con UPSERT atómico en registros de marcas resuelta.
- [x] Parámetros de recompensas y efemérides versionados en JSON.
- [x] Casos de clubes debutantes sin historial cubiertos.
- [x] Anti-exploits de falsificación de palmarés neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `ClubHistoryService`, `RecordEvaluatorEngine`, `TrophyCabinetRepository`, `ChronologyArchiveManager`.
- **Comandos:** `RecordTrophyWonCommand`, `EvaluateMatchRecordsCommand`, `ArchiveSeasonChronologyCommand`.
- **Queries:** `GetClubTrophyCabinetQuery`, `GetClubRecordsQuery`, `GetClubHistoryTimelineQuery`.
- **Políticas DB:** `ALTER TABLE club_trophies ADD CONSTRAINT uq_club_trophy_year UNIQUE (club_id, competition_name, season_year, trophy_type)`.
