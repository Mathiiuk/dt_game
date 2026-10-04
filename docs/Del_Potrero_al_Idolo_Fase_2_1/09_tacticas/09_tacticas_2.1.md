# FASE 9 — TÁCTICAS, FORMACIONES Y SISTEMA DE JUEGO
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Establecer el contrato funcional y formal de dominio para la pizarra táctica, esquemas de juego, roles individuales, instrucciones colectivas y química posicional en *Del Potrero al Ídolo*. Garantizar que el guardado y mutación de tácticas sea estrictamente idempotente en el backend (previniendo errores de clave duplicada `tactics_pkey`), validando alineaciones legales de 11 titulares y calculando la compatibilidad táctica de manera autoritativa.

## 2. Alcance específico
- Formaciones tácticas soportadas (4-4-2, 4-3-3, 4-2-3-1, 3-5-2, 5-3-2, 4-1-4-1, 3-4-3).
- Alineación de 11 futbolistas titulares y banco de suplentes (hasta 7 sustitutos).
- Roles específicos por posición (ej: Arquero Líbero, Marcador Central Clásico, Lateral con Proyección, Pivote Defensivo, Organizador Adelantado, Extremo Vertical, Segundo Delantero, Hombre Objetivo).
- Instrucciones colectivas de equipo (Mentalidad, Ritmo de Juego, Ancho de Cancha, Altura de la Línea Defensiva, Intensidad de Presión, Tipo de Salida).
- Penalización por fuera de posición (Cálculo autoritativo de afinidad de posición: 100% natural, 75% secundaria, 40% inadecuada).
- Guardado persistente e idempotente de la táctica activa y slots secundarios.

## 3. Entidades y Modelo de Datos de Dominio
1. **ClubTactic (`tactics`)**:
   - `id` (UUID, PK): Identificador inmutable del esquema.
   - `club_id` (UUID, FK -> `clubs.id`): Club propietario.
   - `slot_number` (Integer, 1-3, Default 1): Slot de preset táctico.
   - `formation` (String, ej: "4-4-2", "4-3-3", "4-2-3-1").
   - `mentality` (Enum: `VERY_DEFENSIVE`, `DEFENSIVE`, `BALANCED`, `ATTACKING`, `ALL_OUT_ATTACK`).
   - `passing_style` (Enum: `SHORT_TIKI`, `DIRECT`, `LONG_BALL`, `MIXED`).
   - `tempo` (Enum: `SLOW`, `NORMAL`, `FAST`).
   - `defensive_line` (Enum: `DEEP`, `STANDARD`, `HIGH_PRESS`).
   - `width` (Enum: `NARROW`, `BALANCED`, `WIDE`).
   - `pressing_intensity` (Enum: `STAND_OFF`, `BALANCED`, `AGGRESSIVE`).
   - `is_active` (Boolean, Default true): Indica si es la táctica titular para los partidos.
   - `updated_at` (Timestamp UTC).

2. **TacticalLineupSlot (`tactic_lineup_slots`)**:
   - `id` (UUID, PK).
   - `tactic_id` (UUID, FK -> `tactics.id`, On Delete Cascade).
   - `player_id` (UUID, FK -> `players.id`).
   - `pitch_position` (String, ej: "GK", "LCB", "RCB", "LB", "RB", "CM_L", "CM_R", "LW", "RW", "ST").
   - `player_role` (String, ej: "TARGET_MAN", "BALL_PLAYING_DEFENDER", "BOX_TO_BOX").
   - `is_starter` (Boolean): True = Titular (11), False = Suplente (máximo 7).
   - `order_index` (Integer): Orden de visualización en el banquillo.

3. **TacticAuditLog (`tactics_audit_log`)**:
   - `id` (UUID, PK).
   - `club_id` (UUID).
   - `tactic_id` (UUID).
   - `formation_applied` (String).
   - `lineup_snapshot` (JSONB): Lista de los 11 titulares con sus posiciones y penalizaciones calculadas.
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados
```
[TACTICA_ACTUAL_EN_BD] ──(Command: SaveTactic)──► [VALIDANDO_LINEUP (Exactamente 11 titulares)]
                                                          │
                                                          ├──► [VERIFICANDO_REGLAS_POSICION]
                                                          │                 │
                                                          │                 ├── (Existe registro) ──► [UPSERT_ATÓMICO (ON CONFLICT)]
                                                          │                 │
                                                          │                 ▼
                                                          │       [TACTICA_GUARDADA_EXITOSA]
                                                          │
                                                          └── (Fallo) ──► [ERROR_LINEUP_INVALIDO]
```

### Transición Principal: Guardado de Táctica
- **Actor:** DT humano autenticado.
- **Precondiciones:**
  1. El club pertenece a la carrera activa del DT.
  2. La alineación titular contiene EXACTAMENTE 11 futbolistas distintos (`COUNT(DISTINCT player_id) == 11`).
  3. Hay exactamente 1 arquero (`GK`) en el 11 titular.
  4. Ningún titular está suspendido por expulsión o lesionado de gravedad.
  5. El banquillo contiene entre 0 y 7 jugadores suplentes no repetidos con los titulares.
- **Comando:** `SaveTacticCommand(clubId, slotNumber, formation, teamInstructions, startersList, benchList)`.
- **Consecuencias:**
  1. Ejecuta una operación de `UPSERT` en `tactics` sobre la clave natural `(club_id, slot_number)` (impidiendo duplicados de clave primaria).
  2. Reemplaza atómicamente los slots en `tactic_lineup_slots`.
  3. Calcula y almacena el índice de familiaridad táctica y penalizaciones por fuera de puesto.
  4. Invalida la entrada en caché `tactics:${clubId}`.
- **Idempotencia:** Si se envían 5 clics seguidos a "Guardar Táctica", la operación usa `ON CONFLICT (club_id, slot_number) DO UPDATE`, garantizando que jamás se arroje `duplicate key value violates unique constraint tactics_pkey`.
- **Errores:** `ERR_INVALID_STARTERS_COUNT`, `ERR_NO_GOALKEEPER`, `ERR_DUPLICATE_PLAYER_IN_LINEUP`.

## 5. Flujo Funcional Paso a Paso
1. **Configuración en la Pizarra:** El DT arrastra o selecciona futbolistas en la cancha interactiva, elige el dibujo (ej: 4-3-3) y ajusta sliders de mentalidad ("Ofensiva") y presión ("Agresiva").
2. **Previsualización de Química:** El cliente muestra indicadores visuales de afinidad (Verde = Posición natural; Amarillo = Adaptada; Rojo = Fuera de puesto).
3. **Envío del Comando:** Al presionar "Guardar Táctica", el cliente envía el DTO con el `slot_number = 1`.
4. **Validación en Backend:**
   - Verifica existencia de los 11 jugadores en el club.
   - Comprueba que ningún jugador esté repetido en el 11 titular.
   - Verifica que el slot de portería esté cubierto por un jugador habilitado.
5. **Persistencia Transaccional:**
   - `INSERT INTO tactics ... ON CONFLICT (club_id, slot_number) DO UPDATE ... RETURNING id`
   - Borra slots antiguos del `tactic_id` e inserta los 11 titulares + suplentes en una sola transacción (`BEGIN ... COMMIT`).
6. **Confirmación:** Devuelve HTTP 200 con la táctica consolidada y notifica al usuario con un toast de la app (no alertas del sistema operativo).

## 6. Reglas Específicas
- **Regla 9.1 — Cero Duplicados en BD (Anti tactics_pkey duplicate):** Toda mutación de táctica debe implementarse mediante semántica de UPSERT o actualización del registro existente; nunca mediante un simple `INSERT` que pueda chocar con una clave primaria preexistente.
- **Regla 9.2 — Unicidad Estricta de Portero:** El 11 titular debe tener exactamente 1 puesto de arquero. No se permite jugar con 0 arqueros ni con 2 arqueros de campo.
- **Regla 9.3 — Penalización Matemática por Fuera de Puesto:**
  - Posición Natural: 100% de efectividad en atributos.
  - Posición Secundaria: 85% de efectividad.
  - Misma línea (ej: Lateral jugando de Central): 70% de efectividad.
  - Línea ajena (ej: Delantero jugando de Defensor Central): 40% de efectividad y -25% de moral durante el partido.
- **Regla 9.4 — Cero Titulares No Habilitados:** Si un jugador titular recibe una tarjeta roja o lesión en la semana, el sistema emite una alerta crítica en el Dashboard y exige un reemplazo antes de disputar el encuentro.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`tactical_rules.json`):
- `max_starters`: 11.
- `max_bench_players`: 7.
- `position_familiarity_multipliers`:
  - `NATURAL`: 1.00.
  - `COMPATIBLE`: 0.85.
  - `UNFAMILIAR`: 0.65.
  - `OUT_OF_POSITION`: 0.40.
- `tactic_preset_slots_available`: 3 slots (Slot 1 desbloqueado por defecto; Slots 2 y 3 requieren perks de DT de Fase 05).

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Esquema táctico propio, roles de cada futbolista, afinidad posicional calculada, instrucciones colectivas, estado físico y moral de los jugadores en la pizarra.
- **Parcial:** Esquema probable que presentará el rival (ej: "Suele jugar 4-4-2").
- **Oculta al Cliente:** Ajustes tácticos reactivos específicos programados en la IA del DT rival durante la simulación.

## 9. Inteligencia Artificial / Estrategia de Rivales
Cada club de IA tiene asignado un esquema base acorde a la filosofía de su DT. La IA adapta su táctica durante el entretiempo si va perdiendo (ej: pasa de 4-4-2 equilibrado a 4-3-3 ofensivo con presión alta).

## 10. Eventos y Auditoría
- `TACTIC_SAVED`: Notifica persistencia exitosa de la formación y órdenes.
- `LINEUP_ALTERED`: Modificación de los 11 titulares.
- `TACTICAL_INCONSISTENCY_BLOCKED`: Intento de enviar una formación inválida con menos de 11 jugadores.

## 11. Idempotencia y Mitigación de Errores de Red
- El endpoint `PUT /api/v1/club/tactics/:slot` está garantizado como estrictamente idempotente. Múltiples solicitudes idénticas concurrentes producen exactamente el mismo estado en la base de datos sin errores de colisión.

## 12. Concurrencia
- La transacción ejecuta un bloqueo a nivel de fila (`SELECT id FROM tactics WHERE club_id = :clubId AND slot_number = :slot FOR UPDATE`) para evitar intercalaciones si el usuario arrastra jugadores rápidamente mientras se guarda.

## 13. Persistencia y Ciclo de Vida
- La táctica permanece guardada entre partidos y temporadas. Si un jugador es vendido o finaliza su contrato, es removido automáticamente de la alineación y el slot queda vacante requiriendo asignación del DT.

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de Tácticas y Pizarra Técnica.
- **¿Qué puedo hacer?:** Elegir dibujo táctico, armar el 11 titular y banco, definir mentalidad y estilo de juego.
- **¿Qué cuesta?:** Sin coste monetario ni de energía.
- **¿Qué puede pasar?:** Si alineas jugadores fuera de su puesto natural, su rendimiento en el simulador se degradará significativamente.
- **¿Qué ocurrió?:** Notificación flotante inferior nativa de la app (no alerta nativa del navegador): *"Táctica 4-3-3 guardada correctamente"*.

## 15. Casos Extremos
- **Jugador titular sufre lesión en el calentamiento:** El sistema avisa y solicita al DT introducir al primer suplente de esa posición antes de pulsar "Iniciar Partido".
- **Plantel con menos de 11 jugadores sanos (plaga de lesiones):** El sistema permite convocar jugadores juveniles de emergencia desde las inferiores (Fase 18) para completar los 11.

## 16. Anti-Exploits
- **Alinear más de 11 jugadores:** El backend rechaza cualquier payload donde `startersList.length != 11`.
- **Alinear al mismo jugador en dos puestos a la vez:** El backend rechaza alineaciones con `Set(player_ids).size != 11`.
- **Inyección de IDs de jugadores de otros clubes:** El backend valida que todos los `player_id` pertenezcan efectivamente al `club_id` activo mediante `WHERE club_id = :currentClubId`.

## 17. Observabilidad y Métricas
- Distribución de formaciones más utilizadas (para balancear efectividad de 4-4-2 vs 4-3-3 vs 3-5-2).
- Tasa de errores de validación de tácticas.
- Latencia de guardado transaccional (< 80ms).

## 18. Matriz de Pruebas
1. Guardado de 4-4-2 con 11 jugadores válidos y 1 portero -> HTTP 200 y persistencia exitosa.
2. Guardado repetido inmediato (5 peticiones en paralelo) -> Todas devuelven 200 OK, 0 errores de clave duplicada `tactics_pkey`.
3. Intento de guardar con 10 jugadores titulares -> HTTP 400 `ERR_INVALID_STARTERS_COUNT`.
4. Intento de alinear un jugador en dos posiciones distintas -> HTTP 400 `ERR_DUPLICATE_PLAYER_IN_LINEUP`.
5. Intento de alinear un jugador perteneciente a un club rival -> HTTP 403 `ERR_UNAUTHORIZED_PLAYER_LINEUP`.

## 19. Criterios de Aceptación
- [x] Modelo de datos de táctica e instrucciones de equipo formalizado.
- [x] Máquina de estados con validación de 11 titulares cerrada.
- [x] Backend como autoridad absoluta de cálculo de química y penalizaciones.
- [x] Información visible y oculta (IA rival) delimitada.
- [x] Comportamiento de IA rival en adaptaciones de entretiempo previsto.
- [x] Eventos y auditoría de alineación implementados.
- [x] Idempotencia estricta y eliminación del bug de clave duplicada `tactics_pkey`.
- [x] Concurrencia con bloqueo pesimista en el slot del club resuelta.
- [x] Balance de formaciones y penalizaciones parametrizable en JSON.
- [x] Casos de jugadores inhabilitados y lesiones de último momento cubiertos.
- [x] Anti-exploits de duplicación de jugadores o clubes ajenos neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `TacticsService`, `TacticsRepository`, `LineupValidator`, `TacticalChemistryCalculator`.
- **Comandos:** `SaveTacticCommand`, `SetActiveTacticSlotCommand`, `ClearTacticSlotCommand`.
- **Queries:** `GetActiveClubTacticQuery`, `GetTacticalPresetsQuery`.
- **Políticas DB:** `CREATE UNIQUE INDEX uq_club_tactic_slot ON tactics(club_id, slot_number)`.
