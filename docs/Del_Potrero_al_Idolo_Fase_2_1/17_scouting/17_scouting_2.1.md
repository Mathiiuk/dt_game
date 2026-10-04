# FASE 17 — SCOUTING, OJEO Y NIEBLA DE GUERRA
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Definir el contrato funcional de dominio para el sistema de ojeo de futbolistas, la red de observadores del club y el mecanismo estricto de **Niebla de Guerra (Fog of War)** en los atributos. De acuerdo con las **Reglas Maestras 5 y 12**, la información oculta JAMÁS debe enviarse al cliente: si un futbolista rival no ha sido completamente ojeado, el backend debe enmascarar o entregar rangos probabilísticos (ej: "Velocidad: 52-68"), imposibilitando que el usuario inspeccione las respuestas JSON de red para descubrir atributos reales o potenciales ocultos.

## 2. Alcance específico
- 4 Niveles Canónicos de Conocimiento del Jugador:
  - Nivel 0 (Desconocido - 0%): Solo se conoce nombre, edad, club, posición y media aproximada con margen de ±12 puntos. Atributos ocultos con interrogantes (`?`).
  - Nivel 1 (Básico - 25%): Se conocen posiciones secundarias y rangos amplios de atributos (margen ±8).
  - Nivel 2 (Avanzado - 70%): Rangos estrechos de atributos (margen ±3) y estimación cualitativa de potencial ("Potencial Destacado").
  - Nivel 3 (Completo - 100%): Atributos exactos visibles, historial de lesiones y reporte técnico de fortalezas/debilidades.
- Red de Ojeadores del Club: Asignación de observadores a misiones de seguimiento temporal (1 a 3 semanas de calendario).
- Costes operativos del ojeo: Gasto semanal de viáticos e informes imputado a finanzas.
- Corrección de bugs de UI: Eliminación de errores de contexto no definido (`cant find variable refreshContext`) garantizando un estado de ojeo reactivo y robusto.

## 3. Entidades y Modelo de Datos de Dominio
1. **ClubScout (`club_scouts`)**:
   - `id` (UUID, PK).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `name` (String): Nombre del ojeador.
   - `judging_ability` (Integer, 1-20): Capacidad para estimar la habilidad actual con precisión.
   - `judging_potential` (Integer, 1-20): Ojo clínico para detectar el techo de desarrollo.
   - `wage_weekly` (Numeric 8,2): Sueldo del empleado.
   - `current_assignment_player_id` (UUID, Nullable, FK -> `players.id`).
   - `weeks_remaining_on_task` (Integer, Default 0).

2. **PlayerScoutReport (`scout_reports`)**:
   - `id` (UUID, PK).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `player_id` (UUID, FK -> `players.id`).
   - `knowledge_level` (Integer, 0-3, Default 0).
   - `perceived_ovr_min` (Integer, 1-99).
   - `perceived_ovr_max` (Integer, 1-99).
   - `perceived_potential_tier` (Enum: `LOW`, `DECENT`, `EXCELLENT`, `WORLD_CLASS`, `UNKNOWN`).
   - `pros` (Array de String, ej: ["Gran remate de cabeza", "Velocidad explosiva"]).
   - `cons` (Array de String, ej: ["Propenso a lesiones", "Poca resistencia"]).
   - `recommended_action` (Enum: `SIGN_URGENTLY`, `CONSIDER`, `DISCARD`).
   - `last_scouted_at` (Date).
   - **Restricción Unívoca:** `UNIQUE (club_id, player_id)`.

3. **ScoutingMissionAudit (`scouting_missions_log`)**:
   - `id` (UUID, PK).
   - `club_id` (UUID).
   - `scout_id` (UUID).
   - `player_id` (UUID).
   - `cost_incurred` (Numeric 8,2).
   - `status` (Enum: `STARTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados del Ojeo
```
[SIN_INFORME (Nivel 0: Niebla Total)] ──(Command: AssignScoutToPlayer)──► [OJEO_EN_CURSO (1 a 3 semanas)]
                                                                                  │
                                                               (Avance de calendario semanal)
                                                                                  │
                                                                                  ▼
                                                                     [NIVEL_1_BASICO (25%)]
                                                                                  │
                                                                                  ▼
                                                                     [NIVEL_2_AVANZADO (70%)]
                                                                                  │
                                                                                  ▼
                                                                     [INFORME_100%_COMPLETO]
                                                                     (Atributos exactos desbloqueados)
```

### Transición T-01: Asignación de Ojeador
- **Actor:** DT humano.
- **Precondiciones:**
  1. El club dispone de al menos un ojeador libre (`current_assignment_player_id IS NULL`).
  2. El jugador seleccionado no pertenece al club propio y tiene `knowledge_level < 3`.
  3. El club tiene saldo suficiente para cubrir los viáticos iniciales ($200).
- **Comando:** `AssignScoutCommand(clubId, scoutId, playerId, requestedDepth: 'QUICK'|'FULL')`.
- **Consecuencias:**
  1. Vincula al ojeador con el jugador y fija `weeks_remaining_on_task = (requestedDepth == 'QUICK' ? 1 : 3)`.
  2. Debita viáticos de `club_finances.balance`.
  3. Inserta registro en `scouting_missions_log`.
- **Idempotencia:** No se permite asignar múltiples ojeadores al mismo futbolista al mismo tiempo.

### Transición T-02: Entrega de Informe en Avance Semanal
- **Actor:** Servidor durante la cascada de tiempo semanal (Fase 07).
- **Precondiciones:** `weeks_remaining_on_task > 0`.
- **Consecuencias:**
  1. Resta 1 a `weeks_remaining_on_task`.
  2. Si llega a 0, el ojeador queda libre (`current_assignment_player_id = NULL`).
  3. Se genera o actualiza la fila en `scout_reports`: `knowledge_level = (requestedDepth == 'QUICK' ? 1 : 3)`.
  4. Se computan los rangos o valores definitivos en base a la `judging_ability` del empleado.
  5. Se emite notificación de informe listo en el Dashboard.

## 5. Flujo Funcional Paso a Paso
1. **Detección de Interés:** El DT busca un lateral derecho en el Mercado de Pases. Los jugadores rivales muestran atributos con niebla de guerra: `Ritmo: 50-70`, `Defensa: ??`.
2. **Envío del Ojeador:** El DT presiona el botón "Ojear Jugador" -> "Informe Completo (3 semanas)".
3. **Validación Autoritaria:** El servidor valida disponibilidad del ojeador y viáticos. El cliente recibe HTTP 200 y actualiza la tarjeta con el badge: *"Ojeando... Listo en 3 semanas"*.
4. **Procesamiento en Calendario:** Durante 3 avances de semana, el ojeador sigue al futbolista en sus partidos de liga.
5. **Resultado del Informe:** Al finalizar la 3ª semana, el DT abre la notificación:
   - Atributos reales revelados con exactitud: Ritmo 64, Entrada 58, Pase 61.
   - Diagnóstico: *"Jugador cumplidor para la categoría regional, pero sin potencial de ascenso"*.
   - Recomendación: `CONSIDER`.

## 6. Reglas Específicas
- **Regla 17.1 — Cero Fugas de Información Oculta (Master Rule 12):** El serializer de la API de jugadores rivales (`/api/v1/players/:id`) NUNCA debe incluir el objeto `attributes` numérico real si `knowledge_level < 3`. Debe retornar un objeto `masked_attributes` con los rangos calculados por el servidor.
- **Regla 17.2 — Jugadores Propios 100% Conocidos:** Todos los futbolistas pertenecientes al club del usuario tienen `knowledge_level = 3` por defecto (su DT conoce sus estadísticas exactas).
- **Regla 17.3 — Precisión según Calidad del Ojeador:**
  - Un ojeador de elite (`judging_ability >= 15`) entrega rangos muy estrechos (ej: 62-65).
  - Un ojeador mediocre de potrero (`judging_ability = 5`) entrega rangos muy dispersos (ej: 50-75) y puede equivocarse en la valoración del potencial.
- **Regla 17.4 — Caducidad del Ojeo:** Los informes completos pierden precisión tras 52 semanas (1 temporada). Si un jugador no vuelve a ser ojeado en un año, su nivel de conocimiento desciende de Nivel 3 a Nivel 1 ("Informe Desactualizado").

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`scouting_balance.json`):
- `scout_mission_cost_quick`: $100.
- `scout_mission_cost_full`: $300.
- `quick_scout_weeks`: 1 semana.
- `full_scout_weeks`: 3 semanas.
- `scout_report_expiry_weeks`: 52 semanas.
- `scout_error_margin_base`: 14 puntos de OVR.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Nivel de conocimiento actual (0 a 3 estrellas), rangos estimados de atributos, pros y contras descubiertos, coste semanal del cuerpo de ojeadores.
- **Parcial:** Rangos proyectados (ej: "Potencial percibido: 65 a 78").
- **Oculta al Cliente (Estrictamente privada):** Atributos reales en crudo de jugadores ajenos no ojeados, valor exacto del `potential_rating`.

## 9. Inteligencia Artificial / Redes de Rivales
Los clubes de IA también utilizan ojeadores para descubrir juveniles libres antes de ofertar, evitando que compren a ciegas jugadores inadecuados.

## 10. Eventos y Auditoría
- `SCOUTING_MISSION_STARTED`: Inicio del seguimiento a un futbolista.
- `SCOUT_REPORT_READY`: Notificación de entrega de informe completado.
- `SCOUT_MISSION_CANCELLED`: Cancelación prematura de la misión.

## 11. Idempotencia y Mitigación de Errores de Red
- La creación de la misión valida contra `scout_reports` y el estado del ojeador. Si el usuario presiona dos veces "Ojear", la segunda llamada retorna el informe en curso sin cobrar viáticos dobles.

## 12. Concurrencia
- La asignación de ojeador bloquea la fila del ojeador en `club_scouts` (`FOR UPDATE`), evitando que el mismo empleado sea enviado a dos destinos distintos simultáneamente.

## 13. Persistencia y Ciclo de Vida
- Los informes de ojeo persisten en `scout_reports` y permanecen asociados al club del usuario de forma permanente o hasta su degradación anual.

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de Scouting / Ficha de Jugador Rival.
- **¿Qué puedo hacer?:** Enviar a un ojeador a analizar al futbolista o ver informes completados recientemente.
- **¿Qué cuesta?:** Viáticos de misión ($100 a $300) y ocupa a 1 ojeador durante 1 a 3 semanas.
- **¿Qué puede pasar?:** Al ojeado se le revelarán sus puntos débiles y si vale la pena comprarlo.
- **¿Qué ocurrió?:** Notificación de tarjeta con resumen ejecutivo y botón directo: *"Fichar según recomendación del ojeador"*.

## 15. Casos Extremos
- **Ojeador despedido a mitad de una misión:** La misión en curso se cancela automáticamente y el jugador conserva el nivel de conocimiento alcanzado hasta el momento.
- **Jugador que es transferido a otro club mientras era ojeado:** El informe se actualiza con su nuevo club sin perder los datos ya recabados.

## 16. Anti-Exploits
- **Inspección de API / Red en navegador (Network Tab):** Al abrir la herramienta de desarrollador, el payload HTTP devuelto solo contiene los valores enmascarados `min_val` y `max_val`, impidiendo que trampas en el cliente lean las estadísticas reales.

## 17. Observabilidad y Métricas
- Cantidad promedio de futbolistas ojeados por club por temporada.
- Distribución de informes completos vs informes rápidos.
- Tasa de efectividad de fichajes recomendados por ojeadores.

## 18. Matriz de Pruebas
1. Consulta de jugador rival sin ojear -> La API devuelve rangos con margen de error amplio y sin `potential_rating`.
2. Asignación de ojeador -> Fondos debitados y ojeador en estado ocupado.
3. Transcurso de 3 semanas -> Ojeador libre y reporte actualizado a `knowledge_level = 3`.
4. Consulta de jugador con reporte completo -> API devuelve atributos numéricos exactos.
5. Intento de enviar ojeador ya ocupado -> HTTP 400 `ERR_SCOUT_ALREADY_ASSIGNED`.

## 19. Criterios de Aceptación
- [x] Modelo de ojeador, informes y niebla de guerra formalizado.
- [x] Máquina de estados de los 4 niveles de conocimiento cerrada.
- [x] Backend como autoridad absoluta de enmascaramiento de datos (Master Rule 12).
- [x] Corrección de bugs de UI (`refreshContext`) garantizada por contrato.
- [x] Caducidad anual de informes de scouting contemplada.
- [x] Eventos y auditoría de misiones implementados.
- [x] Idempotencia estricta en la asignación de ojeadores.
- [x] Concurrencia con bloqueo en empleados del club resuelta.
- [x] Factores de precisión y costes parametrizados en JSON.
- [x] Casos de despidos y traspasos simultáneos cubiertos.
- [x] Anti-exploits de inspección de red blindados en backend.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `ScoutingService`, `FogOfWarDataMasker`, `ScoutRepository`, `ScoutReportRepository`.
- **Comandos:** `AssignScoutMissionCommand`, `CancelScoutMissionCommand`, `ProcessWeeklyScoutingCommand`.
- **Queries:** `GetMaskedPlayerProfileQuery`, `GetClubScoutReportsQuery`.
- **Políticas DB:** `ALTER TABLE scout_reports ADD CONSTRAINT uq_club_scouted_player UNIQUE (club_id, player_id)`.
