# FASE 23 — DIRIGENCIA, CONFIANZA Y CONDICIÓN DE DESPIDO
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Definir el contrato funcional de dominio para la relación entre el Director Técnico y la Comisión Directiva (Junta Directiva / Presidencia del Club), la medición de la confianza institucional (**Board Confidence**), la evaluación de objetivos de temporada y la ejecución autoritativa de la condición de despido laboral. De acuerdo con las **Reglas Maestras 1, 2, 7 y 8**, el servidor es la única autoridad capaz de despedir al DT o ratificarlo en su cargo: la destitución ocurre de forma automática, atómica y determinista cuando la paciencia dirigencial se extingue.

## 2. Alcance específico
- Índice de Confianza de la Dirigencia (`board_confidence_score` de 0 a 100):
  - Rendimiento Deportivo (peso 50%): Posición en tabla vs objetivo de temporada.
  - Salud Financiera (peso 30%): Respeto del presupuesto salarial y evitar déficit crónico.
  - Gestión de Plantel y Cantera (peso 20%): Cumplimiento de minutos a juveniles y armonía de vestuario.
- Objetivos Anuales Institucionales fijados al inicio de la temporada (`AVOID_RELEGATION`, `MID_TABLE_STABILITY`, `PROMOTION_FIGHT`, `CHAMPION_TITLE`).
- Estados de Relación Dirigencial: Plena Confianza (80-100), Estable (55-79), En Observación (40-54), Ultimátum Crítico (20-39), Destitución Inminente (< 20).
- Reunión de Crisis y Cláusula de Ultimátum: La directiva exige conseguir X puntos en los próximos N partidos. Si no se cumple la meta, se ejecuta el cese de funciones.
- Proceso Formal de Despido: Rescisión de contrato, liquidación de haberes, desvinculación de `managers.club_id` y transición del usuario al estado de Desempleado / Búsqueda de nuevo club (Fase 31).

## 3. Entidades y Modelo de Datos de Dominio
1. **BoardConfidenceState (`club_board_confidence`)**:
   - `id` (UUID, PK).
   - `club_id` (UUID, FK -> `clubs.id`, Unique).
   - `manager_id` (UUID, FK -> `managers.id`).
   - `season_year` (Integer).
   - `confidence_score` (Integer, 0-100, Default 70): Puntuación global.
   - `sports_satisfaction` (Integer, 0-100, Default 70).
   - `financial_satisfaction` (Integer, 0-100, Default 70).
   - `squad_satisfaction` (Integer, 0-100, Default 70).
   - `season_objective` (Enum: `AVOID_RELEGATION`, `MID_TABLE`, `TOP_HALF`, `PLAYOFFS`, `AUTOMATIC_PROMOTION`, `CHAMPION`).
   - `is_under_ultimatum` (Boolean, Default false): Bandera de riesgo de despido inmediato.
   - `ultimatum_points_required` (Integer, Default 0): Puntos obligatorios a conseguir.
   - `ultimatum_matches_remaining` (Integer, Default 0): Partidos restantes de plazo.
   - `ultimatum_points_gathered` (Integer, Default 0): Puntos conseguidos durante el plazo.
   - `updated_at` (Timestamp UTC).

2. **BoardMeetingDialogue (`board_meetings_log`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID).
   - `club_id` (UUID).
   - `manager_id` (UUID).
   - `meeting_reason` (Enum: `SEASON_OBJECTIVES_SET`, `CRISIS_WARNING`, `ULTIMATUM_ISSUED`, `ULTIMATUM_SURVIVED`, `DISMISSAL_EXECUTED`).
   - `board_statement` (String): Palabras del presidente del club.
   - `manager_response` (String, Nullable): Postura elegida por el DT.
   - `created_at` (Timestamp UTC).

3. **DismissalAuditLedger (`manager_dismissals_log`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID).
   - `club_id` (UUID).
   - `manager_id` (UUID).
   - `dismissal_reason` (Enum: `POOR_SPORTS_RESULTS`, `FINANCIAL_COLLAPSE`, `ULTIMATUM_FAILED`, `LOCKER_ROOM_REVOLT`).
   - `final_confidence_score` (Integer).
   - `matches_managed` (Integer).
   - `severance_compensation_paid` (Numeric 10,2): Liquidación económica pagada al DT despedido.
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados de la Confianza Dirigencial
```
[CONFIANZA_ESTABLE (55-79)]
       │
       ├── (Racha negativa sostenida / Puesto de descenso) ──► [EN_OBSERVACION (40-54)]
       │                                                              │
       │                                                              ├── (Derrota clave)
       │                                                              ▼
       │                                                     [ULTIMATUM_CRITICO (20-39)]
       │                                                              │
       │                                   ┌──────────────────────────┴──────────────────────────┐
       │                                   ▼                                                     ▼
       │                          (Cumple los puntos exigidos)                        (Falla en conseguir la meta)
       │                                   │                                                     │
       │                                   ▼                                                     ▼
       │                       [ULTIMATUM_SUPERADO (+20 Score)]                        [DESTITUCION_EJECUTADA]
       │                                   │                                           (DT queda desempleado)
       └───────────────────────────────────┴─────────────────────────────────────────────────────┘
```

### Transición Principal: Despido del Director Técnico
- **Actor:** Servidor tras el cierre de partido o balance semanal (Fase 11 / 20).
- **Precondiciones:**
  1. `ultimatum_matches_remaining == 0` Y `ultimatum_points_gathered < ultimatum_points_required`, O
  2. `confidence_score < 15` de forma fulminante.
- **Comando:** `ExecuteManagerDismissalCommand(clubId, managerId, reason)`.
- **Consecuencias:**
  1. Calcula la indemnización debida al DT: 4 semanas de salario base de DT en `club_finances`.
  2. Modifica `managers.club_id = NULL` y `managers.status = 'UNEMPLOYED'`.
  3. Modifica `clubs.manager_id = NULL` (el club nombra interino de IA).
  4. Inserta el registro oficial en `manager_dismissals_log`.
  5. Emite evento de dominio `MANAGER_DISMISSED`.
  6. Invalida todas las cachés del club del usuario.
- **Idempotencia:** No se puede despedir dos veces a un DT; si ya tiene `club_id IS NULL`, la operación es un no-op.

## 5. Flujo Funcional Paso a Paso
1. **La Mala Racha:** El club se ubica en el puesto 19 de 20 (zona de descenso directo) habiendo ganado 1 de los últimos 8 encuentros.
2. **Reunión de Crisis:** El presidente cita al DT a una cumbre dirigencial de urgencia:
   - *"Mister, la situación es insostenible. La directiva ha perdido la paciencia. Le exigimos conseguir al menos 4 puntos en los próximos 3 partidos o deberemos rescindir su contrato"*.
3. **Inicio de Ultimátum:**
   - La base de datos fija: `is_under_ultimatum = true`, `ultimatum_points_required = 4`, `ultimatum_matches_remaining = 3`, `ultimatum_points_gathered = 0`.
   - En el Dashboard aparece un banner rojo permanente: *"ULTIMÁTUM DIRIGENCIAL: Te restan 3 partidos para sumar 4 puntos"*.
4. **Desarrollo:**
   - Partido 1: Empate (1 punto sumado). Quedan 2 partidos para conseguir 3 puntos.
   - Partido 2: Derrota 0-2 (0 puntos). Queda 1 partido y se necesitan 3 puntos obligatorios.
   - Partido 3: Empate 1-1 (1 punto sumado). Total acumulado: 2 de 4 puntos.
5. **Ejecución del Despido:**
   - Al finalizar el post-partido, el backend evalúa el ultimátum y ejecuta la destitución automática.
   - La pantalla muestra una carta formal de despido de la Comisión Directiva agradeciendo los servicios prestados pero anunciando el cese inmediato.
   - El DT cobra su indemnización de ley y es redirigido a la Pantalla de Desempleo (Fase 31).

## 6. Reglas Específicas
- **Regla 23.1 — Backend Autoridad en la Destitución:** El frontend bajo ninguna circunstancia puede cancelar o eludir un despido. La condición de finiquito se evalúa en el servidor y muta la base de datos de manera irreversible.
- **Regla 23.2 — Ponderación de Objetivos:**
  - Objetivo "Evitar el descenso": La directiva tolera puestos 14 al 17 con 60 puntos de satisfacción. Caer a puestos 18-20 resta -6 puntos de satisfacción por semana.
  - Objetivo "Ascenso directo": No alcanzar el top 4 tras la fecha 20 reduce la confianza en -15 puntos automáticamente.
- **Regla 23.3 — Salvavidas de Clásicos:** Ganar el clásico barrial otorga un blindaje dirigencial transitorio: suma +15 puntos de confianza directiva de inmediato, pudiendo desactivar un ultimátum en curso.
- **Regla 23.4 — Indemnización por Despido:** Al ser cesado, el DT humano cobra una liquidación de 4 semanas de su sueldo estipulado, dinero que incrementa sus ahorros personales para su currículum y reputación.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`board_rules.json`):
- `confidence_ultimatum_threshold`: 30 puntos.
- `confidence_firing_threshold`: 15 puntos.
- `ultimatum_default_matches`: 3 partidos.
- `ultimatum_points_target_tier_5`: 4 puntos en 3 partidos.
- `derby_victory_board_boost`: +15 puntos.
- `financial_deficit_penalty_per_week`: -4 puntos.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Barra porcentual de confianza de la comisión directiva (0 a 100), desglose de satisfacción en área deportiva, financiera y vestuario, objetivos de la temporada, estado de ultimátum y puntos faltantes.
- **Parcial:** Rumores de pasillo ("La directiva está dividida sobre tu continuidad").
- **Oculta al Cliente:** Umbral matemático de despido fulminante sin ultimátum previo.

## 9. Inteligencia Artificial / Despidos de Rivales
Los entrenadores de IA en clubes rivales están sujetos a las mismas reglas: si un DT de IA fracasa y cae en zona roja, la directiva del club rival lo despide y contrata a un DT libre del mercado, dinamizando el banco de suplentes de la liga.

## 10. Eventos y Auditoría
- `BOARD_CONFIDENCE_UPDATED`: Ajuste semanal de puntuación de respaldo.
- `BOARD_ULTIMATUM_ISSUED`: Emisión de ultimátum deportivo.
- `MANAGER_DISMISSED`: Destitución oficial y cese de vínculo laboral.

## 11. Idempotencia y Mitigación de Errores de Red
- El endpoint de evaluación `POST /api/v1/board/evaluate` comprueba que la fecha no haya sido evaluada previamente en la misma semana de calendario.

## 12. Concurrencia
- La destitución utiliza un bloqueo de fila en `managers` y `clubs` (`SELECT ... FOR UPDATE`), garantizando que el DT no pueda firmar contratos o realizar transferencias en el milisegundo exacto en que está siendo cesado.

## 13. Persistencia y Ciclo de Vida
- El despido no borra la carrera: el DT humano conserva su nivel, perks (Fase 05), reputación e historial de partidos dirigidos para postularse a nuevos clubes en el futuro (Fase 31).

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de Confianza Dirigencial / Menú de Comisión Directiva.
- **¿Qué puedo hacer?:** Monitorear la satisfacción de los dirigentes y solicitar fondos adicionales si la confianza es muy alta.
- **¿Qué cuesta?:** Sin coste.
- **¿Qué puede pasar?:** Si pierdes el partido definitivo del ultimátum, tu ciclo en el club habrá terminado.
- **¿Qué ocurrió?:** Carta de cese formal con membrete del club y música melancólica de vestuario: *"La Comisión Directiva ha resuelto por unanimidad rescindir su contrato"*.

## 15. Casos Extremos
- **DT que gana una copa pero desciende en liga:** La directiva pondera la gloria copera (+30 puntos) amortiguando el golpe del descenso.
- **DT con confianza perfecta (95/100) que entra en bancarrota:** La quiebra financiera anula el éxito deportivo y activa la reunión de crisis obligatoria.

## 16. Anti-Exploits
- **Bypass de despido por recarga de web:** Si el partido que consumió el ultimátum se completó en base de datos, el despido queda persistido en el servidor sin posibilidad de reversión client-side.

## 17. Observabilidad y Métricas
- Cantidad promedio de entrenadores despedidos por temporada en la liga.
- Porcentaje de entrenadores que sobreviven a un ultimátum directivo.
- Causa principal de destituciones (Deportiva vs Financiera).

## 18. Matriz de Pruebas
1. Descenso de confianza por debajo de 30 -> Se activa `is_under_ultimatum = true` y fija meta de 4 puntos en 3 partidos.
2. Cumplimiento de meta de ultimátum -> `is_under_ultimatum = false` y confianza sube a 50 puntos.
3. Fallo en conseguir los puntos del ultimátum -> Se ejecuta `ExecuteManagerDismissalCommand` y DT pasa a `UNEMPLOYED`.
4. Intento de ejecutar acciones de club como DT despedido -> HTTP 403 `ERR_NOT_CLUB_MANAGER`.
5. Verificación de acreditación de indemnización de despido en la tesorería personal.

## 19. Criterios de Aceptación
- [x] Modelo de confianza directiva, reuniones de crisis y despidos formalizado.
- [x] Máquina de estados de ultimátum y destitución cerrada.
- [x] Backend como autoridad absoluta e inviolable del cese de funciones.
- [x] Ponderación de objetivos deportivos y financieros balanceada.
- [x] Despidos y contrataciones equivalentes para clubes de IA.
- [x] Eventos y auditoría de destituciones implementados.
- [x] Idempotencia estricta en el proceso de rescisión directiva.
- [x] Concurrencia con bloqueo pesimista en DT y club resuelta.
- [x] Umbrales de paciencia y plazos parametrizados en JSON.
- [x] Casos extremos de éxitos coperos con descensos cubiertos.
- [x] Anti-exploits de evasión de despido neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `BoardConfidenceService`, `UltimatumManager`, `DismissalProcessor`, `BoardMeetingRepository`.
- **Comandos:** `EvaluateBoardConfidenceCommand`, `IssueUltimatumCommand`, `ExecuteManagerDismissalCommand`.
- **Queries:** `GetBoardConfidenceStatusQuery`, `GetBoardMeetingHistoryQuery`.
- **Políticas DB:** `ALTER TABLE club_board_confidence ADD CONSTRAINT chk_confidence_range CHECK (confidence_score BETWEEN 0 AND 100)`.
