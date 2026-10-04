# FASE 5 — NIVELES Y PROGRESIÓN DEL DIRECTOR TÉCNICO
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Establecer el contrato funcional y formal de dominio para la progresión del Director Técnico mediante experiencia (XP), curva de niveles, desbloqueo de puntos de desarrollo y árbol de habilidades (Perks). Garantizar que la adjudicación de XP provenga única y exclusivamente de eventos autoritativos del backend (partidos ganados, objetivos cumplidos, hitos de gestión), bloqueando cualquier intento de manipulación client-side de nivel o experiencia.

## 2. Alcance específico
- Motor de experiencia del DT: Fuentes válidas de XP y reglas de cálculo.
- Curva de nivel matemática (Niveles 1 al 50) parametrizada en backend.
- Asignación de puntos de desarrollo (Skill Points) al subir de nivel.
- Árbol de ventajas y especializaciones (Táctica, Liderazgo, Ojeo, Finanzas, Preparación física).
- Auditoría histórica de fuentes de XP para reproducibilidad y prevención de exploits.

## 3. Entidades y Modelo de Datos de Dominio
1. **ManagerProgression (`managers` extension)**:
   - `level` (Integer, 1-50): Nivel actual alcanzado por el DT.
   - `current_xp` (Integer): Experiencia acumulada en el nivel actual.
   - `total_career_xp` (Integer): Total histórico de XP ganado en la carrera.
   - `unallocated_perk_points` (Integer, Default 0): Puntos disponibles para gastar.
   - `reputation` (Integer, 1-100): Reputación del DT.

2. **ManagerPerkNode (`manager_unlocked_perks`)**:
   - `id` (UUID, PK).
   - `manager_id` (UUID, FK -> `managers.id`).
   - `perk_code` (String, ej: `TACTIC_PRESET_SLOT_2`, `MOTIVATION_BOOST_HALF_TIME`, `YOUTH_POTENTIAL_DETECTOR`).
   - `acquired_at_level` (Integer): Nivel en el que fue adquirido.
   - `created_at` (Timestamp UTC).

3. **LevelThresholdConfig (`level_config`)**:
   - `level` (Integer, PK): Nivel meta.
   - `xp_required` (Integer): XP necesario para alcanzar dicho nivel.
   - `title` (String): Título honorífico (ej: "DT de Barrio", "Táctico Promesa", "Estratega Consagrado", "Leyenda del Banco").
   - `reward_perk_points` (Integer, Default 1).
   - `reputation_bonus` (Integer).

4. **XpAuditEvent (`manager_xp_ledger`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID).
   - `manager_id` (UUID, FK -> `managers.id`).
   - `source_type` (Enum: `MATCH_WON`, `MATCH_DRAW`, `DERBY_BONUS`, `TROPHY_WON`, `PROMOTION`, `BOARD_OBJECTIVE_MET`, `PLAYER_SOLD_PROFIT`).
   - `source_entity_id` (UUID): ID del partido, torneo u objetivo que generó la recompensa.
   - `xp_awarded` (Integer): Puntos otorgados.
   - `level_before` (Integer).
   - `level_after` (Integer).
   - `created_at` (Timestamp UTC).

## 4. Máquina de Estados
```
[NIVEL_ACTUAL] ──(Event: Otorgar XP de Servidor)──► [CALCULANDO_NUEVO_XP]
                                                               │
                                  ┌────────────────────────────┴───────────────────────────┐
                                  ▼                                                        ▼
                        [XP_INSUFICIENTE_PARA_NIVEL]                              [SUBIDA_DE_NIVEL_ACTIVADA]
                                  │                                                        │
                        [ACTUALIZA_CURRENT_XP]                                   [INCREMENTA_NIVEL_Y_PUNTOS]
                                                                                           │
                                                                                 [EMITE_EVENT_LEVEL_UP]
```

### Transición T-01: Adjudicación de XP
- **Actor:** Servidor / Worker de simulación tras finalizar un evento deportivo o hito.
- **Precondiciones:**
  1. La fuente del evento es autoritativa (resultado de partido cerrado o hito completado).
  2. No existe un registro previo en `manager_xp_ledger` con la misma combinación `(manager_id, source_type, source_entity_id)` (idempotencia estricta).
- **Comando:** `AwardManagerXpCommand(managerId, sourceType, sourceEntityId, xpAmount)`.
- **Consecuencias:**
  1. Incremento de `current_xp` y `total_career_xp`.
  2. Evaluación contra `level_config.xp_required`.
  3. Si `current_xp >= xp_required`, se ejecuta un bucle de level-up (puede subir múltiples niveles si el XP fue masivo).
  4. Inserción inmutable en `manager_xp_ledger`.
- **Idempotencia:** Ante reintentos del worker de partido, la clave única compuesta impide duplicar el XP.

### Transición T-02: Canje de Puntos de Habilidad (Perks)
- **Actor:** DT humano autenticado.
- **Precondiciones:**
  1. `unallocated_perk_points >= 1`.
  2. El perk seleccionado no fue adquirido previamente.
  3. Cumple los prerrequisitos del árbol de habilidades.
- **Comando:** `UnlockPerkCommand(managerId, perkCode)`.
- **Consecuencias:**
  1. Descuenta 1 punto de `unallocated_perk_points`.
  2. Inserta el perk en `manager_unlocked_perks`.
  3. Activa los modificadores de juego correspondientes en tiempo real.
- **Errores:** `ERR_INSUFFICIENT_PERK_POINTS`, `ERR_PERK_ALREADY_UNLOCKED`, `ERR_PREREQUISITE_NOT_MET`.

## 5. Flujo Funcional Paso a Paso
1. **Disparo de Evento:** El partido de liga culmina con victoria 2-1 del club del DT.
2. **Evaluación de Recompensa en Backend:** El servicio de post-partido calcula:
   - XP Base por victoria: +150 XP.
   - Bonus de clásico barrial (si aplica): +50 XP.
   - Total a otorgar: +200 XP.
3. **Ejecución Atómica de XP:**
   - Consulta `manager_xp_ledger` para verificar que el partido no fue ya procesado para XP.
   - Suma el XP y evalúa la tabla de niveles.
   - Si pasa de Nivel 2 (umbral 400 XP) a Nivel 3 (umbral 800 XP):
     - `level` pasa a 3.
     - `unallocated_perk_points` incrementa en +1.
     - `reputation` sube +2.
     - Emite evento `MANAGER_LEVEL_UP`.
4. **Registro:** Persiste en ledger y guarda el nuevo estado del DT.
5. **Notificación al Cliente:** El cliente recibe la respuesta de fin de partido con el XP ganado y una notificación especial si subió de nivel.

## 6. Reglas Específicas
- **Regla 5.1 — Prohibición de Inyección de XP:** El frontend no posee ningún endpoint ni parámetro para sumar XP directamente. La experiencia es una consecuencia secundaria exclusiva de acciones de servidor.
- **Regla 5.2 — Curva Progresiva no Lineal:** La curva de XP sigue una progresión polinómica: `XP(nivel) = 150 * (nivel)^1.6`, evitando estancamiento temprano pero exigiendo mayor mérito en niveles avanzados.
- **Regla 5.3 — Inmutabilidad del Historial:** Las entradas en `manager_xp_ledger` son de solo inserción (INSERT-only); jamás pueden ser modificadas o eliminadas.
- **Regla 5.4 — Límite Máximo de Nivel:** El nivel máximo alcanzable es 50 (Nivel Maestro / Ídolo Supremo). Cualquier XP ganado posterior al nivel 50 acumula `total_career_xp` pero no genera nuevos perks.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`manager_xp_balance.json`):
- `xp_match_won`: 150 XP.
- `xp_match_drawn`: 50 XP.
- `xp_derby_victory_bonus`: 75 XP.
- `xp_clean_sheet_bonus`: 25 XP.
- `xp_league_title_won`: 2,500 XP.
- `xp_promotion_achieved`: 1,500 XP.
- `xp_board_objective_completed`: 500 XP.
- `xp_youth_player_debut`: 100 XP.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Nivel actual, barra de progreso porcentual, XP actual vs XP necesario para el próximo nivel, historial de puntos de habilidad desbloqueados, árbol de perks.
- **Parcial:** Ninguna.
- **Oculta al Cliente:** Multiplicadores ocultos de calibración de dificultad de la IA.

## 9. Inteligencia Artificial / DTs Rivales
Los entrenadores rivales poseen niveles estáticos o dinámicos que progresan al cierre de temporada según la posición en la tabla de su equipo, sin necesidad de auditoría de ledger granular.

## 10. Eventos y Auditoría
- `XP_AWARDED`: Registro de cada punto de XP con origen y entidad.
- `MANAGER_LEVEL_UP`: Emisión formal de subida de nivel, recompensas y desbloqueos.
- `PERK_UNLOCKED`: Registro de activación de habilidad en el árbol.

## 11. Idempotencia y Mitigación de Errores de Red
- La tabla `manager_xp_ledger` cuenta con una restricción de unicidad:
  `UNIQUE (manager_id, source_type, source_entity_id)`.
  Si un worker de partido reintenta la notificación tras un fallo de red transitorio, la base de datos rechaza limpiamente el duplicado con `ON CONFLICT DO NOTHING`.

## 12. Concurrencia
- La actualización de XP se ejecuta mediante incremento atómico a nivel de motor de base de datos (`UPDATE managers SET current_xp = current_xp + :amount WHERE id = :id`), garantizando que eventos simultáneos no sufran condiciones de carrera ni pérdidas de XP.

## 13. Persistencia y Ciclo de Vida
- El nivel y XP persisten durante toda la vida útil del DT.
- En caso de cambio de club, el nivel de DT se conserva intacto ya que es un atributo intrínseco del entrenador, no del club.

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de Perfil de Carrera / Menú de DT.
- **¿Qué puedo hacer?:** Inspeccionar el nivel, ver los logros recientes que otorgaron XP y acceder al Árbol de Habilidades para gastar puntos pendientes.
- **¿Qué cuesta?:** Desbloquear un perk consume 1 punto de habilidad.
- **¿Qué puede pasar?:** Al subir de nivel, se desbloquean nuevas herramientas tácticas o bonificaciones de vestuario.
- **¿Qué ocurrió?:** Banner animado estilo RPG con sonido de victoria y modal celebratorio con el nuevo título profesional obtenido.

## 15. Casos Extremos
- **Subida de múltiples niveles en una sola recompensa (ej: Campeón de Torneo):** El algoritmo resuelve el bucle de nivelación en una sola pasada y otorga la suma total de puntos de habilidad acumulados sin perder remanentes de XP.
- **Desconexión del usuario durante la pantalla de subida de nivel:** Los puntos y el nuevo nivel ya están persistidos en el servidor; al volver a conectar, la interfaz muestra el badge de notificación con los puntos pendientes de asignar.

## 16. Anti-Exploits
- **Inyección de XP vía API:** Ningún parámetro de XP enviado por el cliente es aceptado; no existen rutas públicas de modificación de XP.
- **Replay de partidos:** Un partido finalizado no puede otorgar XP dos veces gracias a la restricción única en el ledger.

## 17. Observabilidad y Métricas
- Distribución de niveles de los DTs activos en el juego.
- Tasa de desbloqueo de perks por rama (para detectar ramas infrautilizadas o demasiado rotas).
- Promedio de partidos requeridos por nivel.

## 18. Matriz de Pruebas
1. Victoria en partido -> Otorga exactamente 150 XP y se registra en `manager_xp_ledger`.
2. Victoria repetida con el mismo `match_id` -> Idempotente, 0 XP adicional otorgado.
3. Superar umbral de XP -> Sube de nivel, añade 1 punto de perk y emite evento.
4. Desbloqueo de perk con 1 punto disponible -> Perk adquirido y puntos disponibles decrementados a 0.
5. Intento de desbloquear perk sin puntos -> HTTP 400 `ERR_INSUFFICIENT_PERK_POINTS`.

## 19. Criterios de Aceptación
- [x] Modelo de datos de progresión y ledger de XP formalizado.
- [x] Máquina de estados de experiencia y subida de nivel cerrada.
- [x] Backend como autoridad absoluta e inviolable de XP.
- [x] Árbol de habilidades y perks parametrizado.
- [x] DTs IA sincronizados con curvas de nivel equivalentes.
- [x] Ledger de auditoría de XP inmutable implementado por diseño.
- [x] Idempotencia estricta en la entrega de recompensas.
- [x] Concurrencia atómica resuelta en base de datos.
- [x] Balance de curva de XP parametrizable en JSON.
- [x] Casos de level-up múltiple cubiertos.
- [x] Anti-exploits y prevención de replay attacks verificados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `XpProgressionEngine`, `PerkTreeService`, `XpLedgerRepository`, `ManagerLevelCatalog`.
- **Comandos:** `AwardXpCommand`, `UnlockPerkCommand`.
- **Queries:** `GetManagerProgressionQuery`, `GetPerkTreeStatusQuery`, `GetXpAuditHistoryQuery`.
- **Políticas DB:** `CREATE UNIQUE INDEX uq_manager_xp_source ON manager_xp_ledger(manager_id, source_type, source_entity_id)`.
