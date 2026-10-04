# FASE 35 — EVENTOS DINÁMICOS NARRATIVOS Y DILEMAS DEL DT
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Establecer el contrato funcional y formal de dominio para el motor de eventos dinámicos narrativos (**Dynamic Events Engine**) y toma de decisiones éticas, deportivas y económicas en *Del Potrero al Ídolo*. De acuerdo con las **Reglas Maestras 3, 7 y 8**, los eventos son persistentes e inmutables: el servidor despacha situaciones contextuales aleatorias con memoria histórica, y cada opción elegida por el DT desencadena consecuencias atómicas autoritativas tanto inmediatas como diferidas en el tiempo.

## 2. Alcance específico
- Motor de Disparo de Eventos Contextuales: Evaluación semanal de detonantes (Rachas, saldo económico, fecha de clásico, edad de jugadores, indisciplinas).
- 4 Categorías Temáticas de Eventos:
  - **Barrio y Comunidad:** Fiestas patronales, conflicto barrial por ruidos del estadio, donaciones comunitarias, apoyo a canchas de potrero locales.
  - **Vestuario e Indisciplina:** Jugador que sale de fiesta antes de un partido importante, pelea a golpes en el entrenamiento, descontento con el cuerpo técnico.
  - **Presión Mediática y Dirigencial:** Presidente que quiere imponer a su sobrino en el 11 titular, filtración de audios comprometedores, patrocinador que exige victoria.
  - **Economía y Crisis:** Rotura imprevista de la caldera de los vestuarios, oferta de soborno de apostadores ilegales, donación anónima de un socio veterano.
- Estructura de Decisión Ramificada: 2 a 3 opciones de respuesta por dilema con compensaciones claras (Trade-offs: ej: dinero vs moral, disciplina vs rendimiento deportivo).
- Memoria de Consecuencias Diferidas (Delayed Impact): Decisiones tomadas en la Semana 12 que detonan un evento de repercusión en la Semana 24.

## 3. Entidades y Modelo de Datos de Dominio
1. **DynamicEventInstance (`dynamic_events`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID, FK -> `careers.id`).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `template_code` (String, ej: `EVT_BOILER_BROKEN`, `EVT_NIGHTCLUB_OUTING`, `EVT_PRESIDENT_NEPOTISM`).
   - `title` (String): Titular dramático del evento.
   - `description` (String): Relato narrativo inmersivo.
   - `category` (Enum: `COMMUNITY`, `LOCKER_ROOM`, `BOARD_PRESS`, `FINANCIAL_CRISIS`).
   - `severity` (Enum: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
   - `options_payload` (JSONB): Opciones disponibles con sus descripciones y costes.
   - `status` (Enum: `PENDING`, `RESOLVED`, `EXPIRED`).
   - `created_at_week` (Integer).
   - `resolved_option_id` (String, Nullable): Opción elegida por el DT.
   - `resolved_at` (Timestamp UTC, Nullable).

2. **EventConsequenceAudit (`event_consequences_log`)**:
   - `id` (UUID, PK).
   - `event_id` (UUID, FK -> `dynamic_events.id`).
   - `career_id` (UUID).
   - `club_id` (UUID).
   - `money_delta` (Numeric 10,2, Default 0).
   - `morale_delta` (Integer, Default 0).
   - `reputation_delta` (Integer, Default 0).
   - `board_confidence_delta` (Integer, Default 0).
   - `delayed_trigger_event_code` (String, Nullable): Evento secundario programado.
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados del Evento Dinámico
```
[EVENTO_GENERADO_EN_CASCADA] ──► [ESTADO_PENDIENTE (status='PENDING')]
                                             │
                               (Bloquea avance si es de severidad CRITICAL)
                                             │
                                             ▼
                                 [DT_ELIGE_OPCION (A, B o C)]
                                             │
                                             ▼
                               [APLICANDO_CONSECUENCIAS_EN_BD]
                               - Modifica finanzas, moral o confianza
                               - Programa repercusión diferida si aplica
                                             │
                                             ▼
                                  [EVENTO_RESUELTO (status='RESOLVED')]
```

### Transición Principal: Resolución de Dilema
- **Actor:** DT humano a través del cliente.
- **Precondiciones:**
  1. `dynamic_events.status == 'PENDING'`.
  2. La opción elegida existe en `options_payload`.
  3. Si la opción cuesta dinero, `club_finances.balance >= cost`.
- **Comando:** `ResolveDynamicEventCommand(eventId, chosenOptionId)`.
- **Consecuencias:**
  1. Aplica las consecuencias financieras en `club_finances`.
  2. Ajusta la moral del plantel o del futbolista implicado.
  3. Ajusta la confianza de la dirigencia o la relación con los hinchas.
  4. Marca `status = 'RESOLVED'` y guarda `resolved_option_id`.
  5. Inserta auditoría en `event_consequences_log`.
  6. Invalida la caché `events:pending:${clubId}`.
- **Idempotencia:** Si se envía la resolución dos veces, la segunda es ignorada sin aplicar dobles cobros ni dobles penalizaciones.
- **Errores:** `ERR_EVENT_ALREADY_RESOLVED`, `ERR_INSUFFICIENT_FUNDS_FOR_OPTION`.

## 5. Flujo Funcional Paso a Paso
1. **El Incidente:** Al avanzar a la Semana 18, surge una alerta crítica en el Dashboard.
2. **Presentación Narrativa:**
   - Titular: *"Escándalo en la Noche: El Goleador Visto en un Boliche a las 4 AM"*.
   - Descripción: *"A menos de 48 horas del trascendental partido contra el puntero, vecinos del barrio fotografiaron a tu delantero estrella en un boliche bailable. El vestuario está conmocionado y la prensa exige una respuesta"*.
3. **Opciones Disponibles para el DT:**
   - **Opción A (Mano Dura):** Separar al jugador del plantel por 2 partidos y aplicarle una multa salarial (-$300 al jugador). Consecuencia: Sube la disciplina del vestuario (+10 cohesión), pero no podrás contar con tu goleador en el partido clave.
   - **Opción B (Mirar hacia otro lado):** Hacer la vista gorda y alinearlo de titular de todos modos. Consecuencia: Conservas al goleador en cancha, pero el capitán y los referentes veteranos reducen su moral (-15) por considerar injusto el trato de privilegio.
   - **Opción C (Charla Paternal y Advertencia Privada):** Sanción económica interna sin apartarlo del 11 titular. Consecuencia: Impacto moderado equilibrado.
4. **Decisión del DT:** El DT elige la Opción A (Mano Dura).
5. **Consecuencia Inmediata:** La disciplina se impone. La directiva aplaude la firmeza moral del DT y la noticia se archiva en la memoria del club.

## 6. Reglas Específicas
- **Regla 35.1 — Prohibición de Cancelación sin Respuesta (Eventos Críticos):** Eventos de severidad `CRITICAL` impiden avanzar la semana en el calendario hasta que el DT tome una decisión obligatoria.
- **Regla 35.2 — Rechazo Absoluto a Sobornos:** Si se genera un evento de intento de soborno de apuestas clandestinas, aceptar el soborno otorga dinero negro pero activa una investigación penal con un 80% de riesgo de destitución y suspensión del DT de por vida.
- **Regla 35.3 — Memoria Causal (Efecto Mariposa):** Las decisiones tomadas en eventos dinámicos quedan registradas con flags persistentes en la carrera; un jugador perdonado por indisciplina tiene el triple de probabilidad de cometer otra falta 10 semanas después.
- **Regla 35.4 — Cero Reseteo por F5:** El evento reside en la base de datos de servidor. Recargar la web no cambia el dilema ni borra sus opciones.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`dynamic_events_catalog.json`):
- `event_frequency_rate_weekly`: 25% de probabilidad por semana regular.
- `max_pending_events_queue`: 3 eventos activos simultáneos.
- `boiler_repair_cost`: $1,500.
- `player_fine_max_wage_percentage`: 50% de una semana de salario.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Título, narrativa de la situación, opciones de respuesta con indicación de costes monetarios directos y advertencias de riesgo generales.
- **Parcial:** Consecuencias a largo plazo insinuadas en el texto ("Esto podría no caer bien en los veteranos").
- **Oculta al Cliente (Estrictamente privada):** Probabilidad porcentual exacta de que se active un evento derivado en el futuro.

## 9. Inteligencia Artificial / Contexto del Mundo
Los clubes de IA también sufren eventos simulados en segundo plano (lesiones en fiestas, crisis dirigenciales) que debilitan transitoriamente su rendimiento deportivo.

## 10. Eventos y Auditoría
- `DYNAMIC_EVENT_TRIGGERED`: Despacho de nuevo evento narrativo.
- `DYNAMIC_EVENT_RESOLVED`: Resolución formal de opción elegida.
- `DELAYED_CONSEQUENCE_FIRED`: Activación de consecuencia secundaria semanas después.

## 11. Idempotencia y Mitigación de Errores de Red
- El endpoint `POST /api/v1/events/:id/resolve` comprueba `status == 'PENDING'`. Múltiples solicitudes idénticas en paralelo ejecutan la resolución una sola vez.

## 12. Concurrencia
- La resolución bloquea la fila del evento y la de finanzas del club con `FOR UPDATE`, garantizando atomicidad financiera y de estado.

## 13. Persistencia y Ciclo de Vida
- Los eventos resueltos se conservan de por vida en la bitácora histórica de la carrera para alimentar anécdotas en el epílogo final (Fase 40).

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de Eventos y Decisiones del Club / Notificación emergente.
- **¿Qué puedo hacer?:** Leer la crónica de la situación y elegir la postura ética o estratégica que mejor represente tu estilo de liderazgo.
- **¿Qué cuesta?:** Algunas opciones exigen desembolsos económicos o sacrificios deportivos.
- **¿Qué puede pasar?:** Tus decisiones forjarán la reputación de tu DT: ¿serás un tirano de hierro o un líder comprensivo?
- **¿Qué ocurrió?:** Notificación de consecuencias: *"Decisión aplicada: Se impuso sanción disciplinaria. Cohesión de vestuario +10"*.

## 15. Casos Extremos
- **Opción que requiere dinero y el club está en quiebra:** La opción se muestra deshabilitada con el texto: *"Fondos insuficientes en tesorería para costear esta opción"*.
- **Jugador implicado que es vendido antes de resolver el evento:** El evento se auto-resuelve como anulado por desvinculación de las partes.

## 16. Anti-Exploits
- **Evadir el evento cerrando el juego:** El evento permanece en estado `PENDING` en la base de datos hasta ser respondido formalmente.

## 17. Observabilidad y Métricas
- Distribución de elecciones de los usuarios en cada dilema (para balancear el atractivo de las opciones).
- Tasa de aparición semanal de eventos.
- Correlación de decisiones éticas con la supervivencia del DT en el cargo.

## 18. Matriz de Pruebas
1. Despacho semanal de evento narrativo -> Creado en `dynamic_events` con estado `PENDING`.
2. Resolución con Opción A -> Dinero debitado, moral incrementada, estado muta a `RESOLVED`.
3. Intento de resolver dos veces el mismo evento -> Segunda llamada responde 200 con el estado ya resuelto.
4. Intento de seleccionar opción monetaria sin saldo -> HTTP 400 `ERR_INSUFFICIENT_FUNDS_FOR_OPTION`.
5. Evento crítico pendiente -> Bloquea el avance semanal hasta su resolución.

## 19. Criterios de Aceptación
- [x] Modelo de eventos dinámicos, opciones y consecuencias formalizado.
- [x] Máquina de estados de decisión y repercusiones cerrada.
- [x] Backend como autoridad absoluta de disparadores narrativos y efectos.
- [x] 4 categorías temáticas con dilemas morales y deportivos balanceados.
- [x] Memoria causal diferida implementada por diseño.
- [x] Eventos y auditoría de decisiones registrados inmutablemente.
- [x] Idempotencia estricta en la resolución de dilemas.
- [x] Concurrencia con bloqueo pesimista en finanzas resuelta.
- [x] Catálogo de eventos y probabilidades versionado en JSON.
- [x] Casos extremos de insolvencia y jugadores vendidos cubiertos.
- [x] Anti-exploits de evasión de eventos neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `DynamicEventsService`, `NarrativeTriggerEngine`, `ConsequenceApplier`, `EventRepository`.
- **Comandos:** `TriggerDynamicEventCommand`, `ResolveDynamicEventCommand`.
- **Queries:** `GetPendingClubEventsQuery`, `GetEventHistoryLogQuery`.
- **Políticas DB:** `CREATE INDEX idx_dynamic_events_club_pending ON dynamic_events(club_id, status) WHERE status = 'PENDING'`.
