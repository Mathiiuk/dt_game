# FASE 6 — DASHBOARD Y CENTRO DE MANDO
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Definir el contrato funcional de dominio para el Dashboard principal de *Del Potrero al Ídolo*. Constituye el centro neurálgico de toma de decisiones del Director Técnico, consolidando en una sola vista agregada, performante y autoritativa el estado del club, el próximo compromiso deportivo, alertas críticas y el punto de acceso al bucle de avance temporal del juego.

## 2. Alcance específico
- Consolidación de proyección de estado (Club, DT, Finanzas, Plantel, Liga, Eventos).
- Tarjeta de Próximo Partido (Rival, condición local/visitante, estadio, fecha y pronóstico).
- Sistema de Alertas Críticas (Jugadores lesionados, sanciones disciplinarias, contratos por vencer, deudas).
- Barra de estado institucional (Balance financiero, nivel y XP del DT, moral media, condición física media).
- Micro-widget de tabla de posiciones (Puesto actual, puntos, diferencia de gol, zona de ascenso/descenso).
- Comando principal de acción: "Avanzar Semana" o "Ir al Partido".

## 3. Entidades y Modelo de Proyección de Dominio
1. **DashboardProjection (Vista Agregada / Read Model)**:
   - `manager_summary`: { id, name, level, current_xp, xp_next_level, reputation }.
   - `club_summary`: { id, name, badge_id, primary_color, stadium_name, division_name }.
   - `finances_summary`: { balance, weekly_wage_bill, wage_budget, financial_health_status }.
   - `squad_health`: { average_fitness, average_morale, injured_count, suspended_count }.
   - `standings_snippet`: { rank, points, played, won, drawn, lost, goal_diff, zone }.
   - `next_fixture`: { id, match_day, opponent_id, opponent_name, opponent_badge, is_home, match_date, stadium_name }.
   - `urgent_alerts`: Array de alertas { id, priority: `HIGH`|`MEDIUM`|`LOW`, type, message, action_url }.
   - `pending_events`: Conteo de decisiones narrativas pendientes de resolver.

2. **DashboardAlert (`club_notifications`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID).
   - `club_id` (UUID).
   - `category` (Enum: `CONTRACT_EXPIRING`, `PLAYER_INJURED`, `TRANSFER_OFFER_RECEIVED`, `FINANCIAL_DEFICIT`, `BOARD_UNHAPPY`).
   - `title` (String).
   - `description` (String).
   - `is_read` (Boolean, Default false).
   - `created_at` (Timestamp UTC).

## 4. Máquina de Estados de la Pantalla Principal
```
[CARGANDO_PROYECCION] ──► [DASHBOARD_ACTIVO] 
                               │
                               ├── (Hay Partido Pendiente) ──► [ESTADO: LISTO_PARA_PARTIDO]
                               │                                     │
                               │                                     └── (Command: Jugar Partido) ──► [PANTALLA_PARTIDO]
                               │
                               └── (Semana de Entrenamiento/Libre) ─► [ESTADO: SEMANA_EN_CURSO]
                                                                     │
                                                                     └── (Command: Avanzar Semana) ──► [EJECUTANDO_BUCLE_TIEMPO]
```

### Transiciones Principales
1. **Transición T-01: Consulta de Proyección Agregada**
   - **Actor:** Usuario autenticado con carrera activa.
   - **Precondiciones:** Sesión válida y DT con club activo.
   - **Comando:** `GetDashboardOverviewQuery(careerId, clubId)`.
   - **Consecuencias:** El backend genera la proyección agregada en una sola llamada optimizada (o desde caché SWR) sin emitir mutaciones.
   - **Idempotencia:** Consulta de solo lectura 100% idempotente y segura para peticiones concurrentes.

2. **Transición T-02: Disparo de Avance Temporal desde Dashboard**
   - **Actor:** DT humano.
   - **Precondiciones:** No tener eventos críticos bloqueantes sin responder.
   - **Comando:** `TriggerTimeProgressionCommand(careerId, clubId)`.
   - **Consecuencias:** Invoca el motor de calendario (Fase 07). Si la fecha actual coincide con el día de partido, deriva a la preparación táctica de partido (Fase 09 / 10).

## 5. Flujo Funcional Paso a Paso
1. **Acceso al Dashboard:** Al ingresar a la aplicación o navegar a "Inicio", el cliente consulta `GET /api/v1/dashboard/overview`.
2. **Construcción Agregada en Servidor:**
   - El backend consulta concurrentemente o mediante vista materializada/cache las métricas clave.
   - Identifica el próximo fixture no jugado (`status = 'SCHEDULED'`) de la liga activa.
   - Evalúa contratos que vencen en menos de 4 semanas.
   - Evalúa jugadores con `fitness < 70%` o `is_injured = true`.
   - Identifica eventos dinámicos pendientes de respuesta.
3. **Respuesta Rápida (SWR):** Si los datos están en caché de memoria (`queryCache`), se renderizan en 0ms. La consulta en segundo plano valida frescura sin mostrar spinners disruptivos.
4. **Interacción del Usuario:** El usuario examina sus alertas, ajusta táctica si hay bajas y presiona "Ir al Partido" o "Avanzar Semana".

## 6. Reglas Específicas
- **Regla 6.1 — Cero Cálculos Críticos en Frontend:** El Dashboard es un visor de solo lectura y despacho de comandos. El cálculo de la posición en la tabla, el balance y la condición física se efectúa estrictamente en el backend.
- **Regla 6.2 — Alertas Bloqueantes vs Informativas:** Alertas de tipo `HIGH` (ej: no tener 11 jugadores habilitados para disputar el partido) deshabilitan el botón de avance y exigen resolver el problema antes de continuar.
- **Regla 6.3 — Actualización Inmediata tras Eventos:** Al volver de un partido o tras resolver una venta de jugador, la caché del dashboard se invalida selectivamente para reflejar el nuevo estado al instante.
- **Regla 6.4 — Responsive Mobile-First:** En pantallas móviles, los widgets se reorganizan verticalmente priorizando: (1) Próximo Partido, (2) Alertas Críticas, (3) Finanzas, (4) Tabla y Plantel.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`dashboard_ui_rules.json`):
- `contract_alert_threshold_weeks`: 4 semanas antes de vencimiento.
- `fitness_low_threshold`: 70% de condición física.
- `morale_crisis_threshold`: 40 puntos de moral.
- `financial_warning_deficit_weeks`: 3 semanas de déficit operativo continuo.

## 8. Política de Información (Visible / Oculta)
- **Visible:** Puntos de tabla, estadísticas del rival conocidas públicamente (goles a favor, últimos 5 resultados, esquema táctico preferido), nombres de jugadores disponibles, balance en caja.
- **Parcial:** Pronóstico deportivo ("Rival difícil en racha positiva").
- **Oculta al Cliente:** Atributos ocultos de los jugadores rivales (potencial, atributos precisos de jugadores no scouteados), órdenes tácticas secretas del DT rival.

## 9. Inteligencia Artificial / Entorno
La IA de los clubes rivales actualiza su propio estado semanal en segundo plano; el Dashboard solo proyecta los resultados oficiales y la programación de partidos ya oficializada por la federación.

## 10. Eventos y Auditoría
- `DASHBOARD_ACCESSED`: Métrica de telemetría de navegación.
- `ALERT_DISMISSED`: Cuando el usuario descarta una notificación no crítica.
- `MATCH_DAY_ENGAGED`: Usuario presiona el botón para entrar a la simulación del encuentro.

## 11. Idempotencia y Mitigación de Errores de Red
- El endpoint agregado `/dashboard/overview` es seguro e idempotente. Las llamadas duplicadas por cambios de pestaña devuelven el snapshot cached de inmediato gracias al sistema `MemoryQueryCache`.

## 12. Concurrencia
- Si dos navegadores o pestañas tienen el Dashboard abierto simultáneamente, las consultas son consistentes y concurrentes sin bloqueos de escritura.

## 13. Persistencia y Ciclo de Vida
- Las notificaciones (`club_notifications`) se persisten en base de datos y se auto-archivan tras 60 días o al finalizar la temporada activa.

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Panel de Control del Club (Inicio).
- **¿Qué puedo hacer?:** Revisar el estado general, atender notificaciones urgentes y preparar el próximo partido.
- **¿Qué cuesta?:** Explorar y revisar no consume recursos ni tiempo de juego.
- **¿Qué puede pasar?:** Al pulsar "Avanzar", el tiempo del juego se moverá a la fecha del compromiso.
- **¿Qué ocurrió?:** Retroalimentación visual inmediata con chips de color (verde: victoria/finanzas sanas; rojo: peligro/lesiones).

## 15. Casos Extremos
- **Club sin próximo partido programado (Fin de temporada):** El widget de próximo partido se transforma en un banner de "Pretemporada / Cierre de Temporada" invitando a planificar el mercado.
- **Desconexión temporal:** Si la red se cae, el Dashboard muestra la última copia local cached con un indicador sutil: *"Modo sin conexión — Mostrando últimos datos sincronizados"*.

## 16. Anti-Exploits
- El cliente no puede forzar un partido no agendado ni simular partidos de otros clubes enviando `match_id` ajenos en el comando de inicio de partido.

## 17. Observabilidad y Métricas
- Tiempo de carga percibido (LCP del Dashboard < 300ms gracias a caché SWR).
- Frecuencia de uso del botón "Avanzar Semana" vs "Ir al Partido".
- Ratio de alertas críticas no resueltas antes de avanzar.

## 18. Matriz de Pruebas
1. Carga de Dashboard con club válido -> Devuelve resumen completo con código HTTP 200.
2. Presencia de jugador lesionado -> Genera alerta crítica visible en `urgent_alerts`.
3. Contrato a 3 semanas de expirar -> Genera alerta de renovación.
4. Intento de avanzar con plantel incompleto (< 11 habilitados) -> Retorna error y bloquea el botón con explicación clara.
5. Invarianza de caché: Peticiones consecutivas en ventana de 5 segundos no golpean la base de datos innecesariamente.

## 19. Criterios de Aceptación
- [x] Modelo de datos de proyección y alertas formalizado.
- [x] Máquina de estados de navegación y preparación de partido cerrada.
- [x] Backend como autoridad absoluta de consolidación de métricas.
- [x] Información visible y oculta (datos del rival) protegida.
- [x] Integración con caché SWR e in-flight deduplication especificada.
- [x] Eventos y métricas de navegación tipificados.
- [x] Idempotencia en lecturas y despacho de comandos.
- [x] Concurrencia de múltiples dispositivos contemplada.
- [x] Parámetros de umbrales de alerta versionados en JSON.
- [x] Casos de fin de temporada y fuera de línea resueltos.
- [x] Anti-exploits de falsificación de fixtures mitigados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `DashboardAggregationService`, `AlertManagerService`, `FixtureProjector`, `DashboardCacheHandler`.
- **Comandos:** `DismissAlertCommand`, `PrepareMatchDayCommand`.
- **Queries:** `GetDashboardOverviewQuery`, `GetUnreadNotificationsQuery`.
- **Optimización DB:** Índices compuestos en `fixtures(club_id, status, match_day)` y `players(club_id, is_injured)`.
