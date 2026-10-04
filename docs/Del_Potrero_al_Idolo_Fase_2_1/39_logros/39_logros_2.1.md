# FASE 39 — SISTEMA DE LOGROS, DESAFÍOS Y CONDECORACIONES DE CARRERA
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Establecer el contrato funcional y formal de dominio para el motor de logros institucionales, desafíos de dificultad y condecoraciones profesionales (**Achievements Engine**) en *Del Potrero al Ídolo*. De acuerdo con las **Reglas Maestras 1, 2, 7 y 8**, el cliente nunca desbloquea logros por sí mismo: el backend evalúa autoritativamente las condiciones deportivas de cada hito tras cada partido o cierre de temporada, acreditando las recompensas de experiencia (XP) de forma idempotente e inmutable en el ledger de carrera.

## 2. Alcance específico
- Catálogo de Logros Estructurado en 4 Categorías:
  - **Iniciación y Fundamentos:** "El Primer Silbatazo" (dirigir primer partido oficial), "Bautismo de Red" (primer gol oficial anotado), "Tres Puntos de Oro" (primer triunfo oficial).
  - **Ascenso y Gloria Deportiva:** "Del Potrero al Ascenso" (conseguir primer ascenso de división), "El Matagigantes" (eliminar a un club de Primera División en Copa Nacional), "Invictos de Fierro" (15 partidos consecutivos sin perder).
  - **Identidad de Cantera y Potrero:** "El Semillero del Barrio" (hacer debutar a 5 canteranos en el primer equipo), "La Joya Descubierta" (formar a un juvenil con potencial superior a 75), "Poder Propio" (alinear 8 canteranos titulares en un partido oficial).
  - **Maestría Económica y Gestión:** "Tesorería de Hierro" (acumular $100,000 en caja sin deudas), "Ojo Clínico" (vender a un futbolista por 5 veces su valor de compra).
- Niveles de Rareza de Condecoración: Bronce (+100 XP), Plata (+250 XP), Oro (+500 XP), Platino / Diamante (+1,500 XP).
- Seguimiento de Progreso Porcentual (Progress Tracker): Atributos acumuladores en el backend (ej: 3 de 5 canteranos debutados).
- Recompensas Autoritativas: Cada logro desbloqueado inyecta XP directamente en el motor de progresión del DT (Fase 05) de forma idempotente.

## 3. Entidades y Modelo de Datos de Dominio
1. **AchievementDefinition (`achievement_definitions`)**:
   - `code` (String, PK, ej: `ACH_FIRST_WIN`, `ACH_FIRST_PROMOTION`, `ACH_YOUTH_DEBUTS_5`).
   - `title` (String): Título épico del logro.
   - `description` (String): Condición requerida para el desbloqueo.
   - `category` (Enum: `FOUNDATIONS`, `GLORY`, `ACADEMY`, `ECONOMY`, `TACTICS`).
   - `tier` (Enum: `BRONZE`, `SILVER`, `GOLD`, `PLATINUM`).
   - `xp_reward` (Integer): Experiencia otorgada al DT.
   - `target_count` (Integer, Default 1): Meta requerida para completitud.

2. **ManagerAchievementProgress (`manager_achievements`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID, FK -> `careers.id`).
   - `manager_id` (UUID, FK -> `managers.id`).
   - `achievement_code` (String, FK -> `achievement_definitions.code`).
   - `current_progress` (Integer, Default 0).
   - `is_unlocked` (Boolean, Default false).
   - `unlocked_at` (Timestamp UTC, Nullable).
   - **Restricción Unívoca:** `UNIQUE (manager_id, achievement_code)`.

3. **AchievementAuditLog (`achievement_unlock_log`)**:
   - `id` (UUID, PK).
   - `manager_id` (UUID).
   - `achievement_code` (String).
   - `xp_granted` (Integer).
   - `unlocked_in_fixture_id` (UUID, Nullable).
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados del Desbloqueo de Logros
```
[LOGRO_BLOQUEADO (Progreso: 0/N)] ──(Evento deportivo / Hito de gestión)──► [EVALUANDO_CONDICIONES_EN_BD]
                                                                                      │
                                                 ┌────────────────────────────────────┴────────────────────────────────────┐
                                                 ▼                                                                         ▼
                                   (Progreso < target_count)                                                  (Progreso >= target_count)
                                                 │                                                                         │
                                                 ▼                                                                         ▼
                                     [ACTUALIZA_CURRENT_PROGRESS]                                                [LOGRO_DESBLOQUEADO_EXITOSO]
                                                                                                                           │
                                                                                                                           ├── 1. Marca is_unlocked = true
                                                                                                                           ├── 2. Acredita XP en Fase 05
                                                                                                                           ├── 3. Emite evento de condecoración
                                                                                                                           ▼
                                                                                                                [RECOMPENSA_PERSISTIDA]
```

### Transición Principal: Desbloqueo y Acreditación de Logro
- **Actor:** Servidor tras un partido, fichaje o avance de calendario.
- **Precondiciones:**
  1. `manager_achievements.is_unlocked == false`.
  2. La métrica en el servidor cumple o supera `target_count`.
- **Comando:** `UnlockAchievementCommand(managerId, achievementCode, fixtureId)`.
- **Consecuencias:**
  1. Marca `is_unlocked = true` y fija `unlocked_at = NOW()`.
  2. Invoca atómicamente `AwardManagerXpCommand(managerId, 'ACHIEVEMENT_UNLOCKED', achievementCode, xpReward)` de la Fase 05.
  3. Inserta registro en `achievement_unlock_log`.
  4. Emite evento en tiempo real para desplegar el banner de trofeo dorado en el cliente.
- **Idempotencia:** Si ya está `is_unlocked == true`, la operación es un no-op absoluto; jamás se acreditará doble XP por el mismo logro.

## 5. Flujo Funcional Paso a Paso
1. **La Acción Deportiva:** El DT humano vence 1-0 en el clásico barrial y logra su primer triunfo oficial en el juego.
2. **Evaluación de Backend:** Al concluir el post-partido (Fase 11), el evaluador de logros detecta que la victoria cumple la condición de `ACH_FIRST_WIN`.
3. **Desbloqueo Atómico:**
   - La base de datos actualiza `manager_achievements` para `ACH_FIRST_WIN` a `is_unlocked = true`.
   - Se otorgan +100 XP al DT en el ledger oficial (Fase 05).
4. **Notificación en Pantalla:** En la esquina superior de la interfaz emerge un badge animado con sonido metálico de trofeo:
   - *"¡Logro Desbloqueado: Tres Puntos de Oro (+100 XP)!"*.
5. **Consulta de Vitrina de Desafíos:** El DT accede a la pestaña "Logros y Retos":
   - Visualiza los logros completados con sus medallas brillantes.
   - Observa las barras de progreso de los desafíos pendientes (ej: "Canteranos debutados: 3/5").

## 6. Reglas Específicas
- **Regla 39.1 — Cero Inyección de Desbloqueos en Cliente:** El frontend no posee ningún endpoint para activar logros; toda validación se desprende de tablas de verdad en el servidor.
- **Regla 39.2 — Una Sola Concesión de Recompensa de XP:** El XP de cada logro solo se cobra una vez en toda la carrera del entrenador.
- **Regla 39.3 — Progreso No Regresivo:** El progreso numérico de logros acumulativos (ej: cantidad de victorias) nunca puede decrementarse por derrotas posteriores.
- **Regla 39.4 — Desafíos de Extrema Dificultad (Logros Secretos):** Los logros de máxima jerarquía (ej: "Campeón de América con 100% de canteranos") permanecen ocultos con título "Logro Oculto" hasta que el DT cumpla la hazaña.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`achievements_catalog.json`):
- `bronze_achievement_xp`: 100 XP.
- `silver_achievement_xp`: 250 XP.
- `gold_achievement_xp`: 500 XP.
- `platinum_achievement_xp`: 1,500 XP.
- Total de logros implementados: 40 desafíos.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Nombre del logro, descripción del objetivo, recompensa de XP, medalla de rareza, porcentaje de progreso acumulado y fecha de desbloqueo.
- **Parcial:** Ninguna.
- **Oculta al Cliente:** Condiciones exactas de los 5 logros secretos de leyenda (para incentivar el descubrimiento orgánico).

## 9. Inteligencia Artificial / Exclusividad Humana
Los logros y condecoraciones del catálogo de carrera están diseñados para el seguimiento del jugador humano y su evolución en el juego.

## 10. Eventos y Auditoría
- `ACHIEVEMENT_PROGRESS_UPDATED`: Incremento en la barra de progreso.
- `ACHIEVEMENT_UNLOCKED`: Conquista de trofeo y acreditación de XP.

## 11. Idempotencia y Mitigación de Errores de Red
- La tabla `manager_achievements` tiene restricción `UNIQUE (manager_id, achievement_code)`. Reintentos de eventos no generan dobles entradas ni dobles condecoraciones.

## 12. Concurrencia
- La actualización de progreso se realiza de forma atómica dentro de la transacción de cierre de partido con cláusula `ON CONFLICT DO UPDATE`.

## 13. Persistencia y Ciclo de Vida
- Los logros desbloqueados perduran durante toda la carrera del DT y se reflejan en su biografía final (Fase 40).

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de Logros y Desafíos de Carrera.
- **¿Qué puedo hacer?:** Revisar tus trofeos obtenidos, ver el progreso de los desafíos pendientes y motivarte para alcanzar las metas más difíciles.
- **¿Qué cuesta?:** Sin coste; premia tu habilidad táctica.
- **¿Qué puede pasar?:** Cada logro completado te acerca más a subir de nivel y desbloquear perks tácticos.
- **¿Qué ocurrió?:** Banner animado estilo gaming moderno con iconografía deportiva dorada y partículas festivas.

## 15. Casos Extremos
- **Cumplimiento simultáneo de 3 logros en un solo partido:** El evaluador procesa los 3 desbloqueos en serie, otorgando la suma total de XP sin solapamientos ni desbordamientos de buffer.
- **Logro de racha interrumpido en el último partido:** Si el objetivo pedía 10 victorias seguidas y el equipo empata en el partido 9, el contador de racha se resetea limpiamente a 0.

## 16. Anti-Exploits
- **Llamadas forzadas a `unlockAchievement` vía consola:** Rechazadas por autenticación de backend; la evaluación es un listener interno de eventos de servidor no expuesto a peticiones REST arbitrarias.

## 17. Observabilidad y Métricas
- Logros con mayor y menor tasa de completitud en la comunidad.
- Distribución de logros promedio completados por usuario antes del retiro.

## 18. Matriz de Pruebas
1. Primera victoria en partido -> Desbloqueo de `ACH_FIRST_WIN`, +100 XP otorgados en `manager_xp_ledger`.
2. Segunda victoria -> No otorga nuevo desbloqueo ni nuevo XP (idempotencia estricta).
3. Debut de 5 canteranos -> Progreso acumulado 1/5, 2/5... hasta 5/5, momento en que se desbloquea `ACH_YOUTH_DEBUTS_5`.
4. Intento de desbloquear logro secreto vía API externa -> HTTP 403 Forbidden.
5. Verificación de renderizado en UI sin emojis: Uso estricto de iconos Lucide (`Trophy`, `Award`, `Star`).

## 19. Criterios de Aceptación
- [x] Modelo de logros, seguimiento de progreso y auditoría formalizado.
- [x] Máquina de estados de desbloqueo y entrega de XP cerrada.
- [x] Backend como autoridad absoluta de evaluación de condiciones deportivas.
- [x] 4 categorías de desafíos y 4 niveles de rareza cuantificados.
- [x] Integración atómica e idempotente con el motor de XP de Fase 05.
- [x] Eventos y auditoría de condecoraciones implementados por diseño.
- [x] Idempotencia estricta en el otorgamiento de recompensas.
- [x] Concurrencia con bloqueo pesimista en progreso resuelta.
- [x] Catálogo de 40 logros y recompensas versionado en JSON.
- [x] Casos de desbloqueos múltiples simultáneos cubiertos.
- [x] Anti-exploits de hackeo de medallas neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `AchievementEvaluationService`, `ProgressTrackingEngine`, `AchievementRewardDistributor`, `AchievementRepository`.
- **Comandos:** `EvaluateAchievementsCommand`, `UnlockAchievementCommand`.
- **Queries:** `GetManagerAchievementsQuery`, `GetAchievementCatalogQuery`.
- **Políticas DB:** `ALTER TABLE manager_achievements ADD CONSTRAINT uq_manager_achievement UNIQUE (manager_id, achievement_code)`.
