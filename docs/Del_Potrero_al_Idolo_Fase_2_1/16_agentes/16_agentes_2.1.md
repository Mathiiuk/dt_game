# FASE 16 — AGENTES, REPRESENTANTES E INTERMEDIARIOS
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Establecer el contrato funcional y formal de dominio para el ecosistema de agentes e intermediarios deportivos que representan a los futbolistas en *Del Potrero al Ídolo*. De acuerdo con las **Reglas Maestras 1, 5, 8 y 10**, el agente actúa como un actor intermediario autónomo con personalidad parametrizada, agenda propia y relación afectiva con el DT humano: influye directamente en las negociaciones salariales, cobra comisiones reglamentarias y puede filtrar rumores a la prensa deportiva para presionar mejoras contractuales o traspasos.

## 2. Alcance específico
- Asignación de representantes a los futbolistas (Agente establecido, Pariente/Padre, Agencia internacional, Sin representante).
- Arquetipos de personalidad de agentes: `GREEDY` (Codicioso, exige alta comisión), `FAIR` (Razonable / Negociador), `PROTECTIVE` (Protector, prioriza minutos de juego para jóvenes), `AGGRESSIVE` (Hostil, exige cláusulas bajas y amenaza con huelgas).
- Comisión de intermediación del agente: Porcentaje fijo (5% al 15%) sobre el valor de traspaso o prima de fichaje, debitado autoritativamente en servidor.
- Medidor de relación DT-Agente (`relationship_score` de 0 a 100): Tratar bien al agente abarata futuras negociaciones de su cartera de futbolistas.
- Acciones de presión del agente: Filtraciones a la prensa, ofertas falsas para subir salarios y peticiones de rescisión.

## 3. Entidades y Modelo de Datos de Dominio
1. **AgentProfile (`agents`)**:
   - `id` (UUID, PK): Identificador inmutable del representante.
   - `career_id` (UUID, FK -> `careers.id`): Aislamiento por carrera.
   - `name` (String, 3 a 50 caracteres): Nombre del agente o agencia (ej: "Guillermo Cóppola", "Mendes & Partners").
   - `personality` (Enum: `GREEDY`, `FAIR`, `PROTECTIVE`, `AGGRESSIVE`).
   - `influence_rating` (Integer, 1-100): Poder de lobby y llegada a clubes grandes.
   - `patience_rating` (Integer, 1-100): Tolerancia a rondas de regateo antes de romper el diálogo.
   - `base_commission_rate` (Float, 0.05 a 0.15): Porcentaje habitual pretendido.
   - `created_at` (Timestamp UTC).

2. **AgentPlayerRepresentation (`agent_clients`)**:
   - `id` (UUID, PK).
   - `agent_id` (UUID, FK -> `agents.id`).
   - `player_id` (UUID, FK -> `players.id`, Unique): Cada jugador tiene como máximo 1 agente activo.
   - `contract_expiry` (Date): Vigencia del poder de representación.

3. **ManagerAgentAffinity (`manager_agent_relations`)**:
   - `id` (UUID, PK).
   - `manager_id` (UUID, FK -> `managers.id`).
   - `agent_id` (UUID, FK -> `agents.id`).
   - `relationship_score` (Integer, 0-100, Default 50): Afinidad profesional con el DT.
   - `last_interaction_week` (Integer).
   - **Restricción Unívoca:** `UNIQUE (manager_id, agent_id)`.

4. **AgentActionAudit (`agent_action_log`)**:
   - `id` (UUID, PK).
   - `agent_id` (UUID).
   - `player_id` (UUID).
   - `action_type` (Enum: `COMMISSION_PAID`, `PRESS_LEAK_TRIGGERED`, `DEMAND_RAISE_SENT`, `NEGOTIATION_INTERRUPTED`).
   - `financial_impact` (Numeric 10,2, Default 0).
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados de la Relación con el Agente
```
[RELACION_NEUTRAL (Score 50)] ──(Acción: Pago de comisión justa / Cumplir promesa)──► [AFINIDAD_ALTA (Score > 75)]
                                                                                               │
                                                                                 (Descuento 20% en comisiones)
                                                                                               │
[RELACION_NEUTRAL (Score 50)] ──(Acción: Romper negociación / Trato hostil)────────► [AFINIDAD_BAJA (Score < 30)]
                                                                                               │
                                                                                 (Exige 15% comisión y filtra a prensa)
```

### Transición Principal: Pago de Comisión de Agencia
- **Actor:** Servidor al concretarse un fichaje o renovación contractual (Fases 13 y 15).
- **Precondiciones:** Jugador cuenta con agente activo en `agent_clients`.
- **Comando:** `DisburseAgentCommissionCommand(clubId, agentId, transferFee, wageAmount)`.
- **Consecuencias:**
  1. Calcula la comisión: `commission = fee * rate * (1.2 - 0.4 * (affinity / 100))`.
  2. Debita `commission` de `club_finances.balance`.
  3. Si la comisión se pagó sin dilaciones, `relationship_score` del agente con el DT sube +5 puntos.
  4. Inserta en `agent_action_log`.
- **Idempotencia:** Asociado unívocamente al `transfer_id` o `contract_id` para impedir dobles cobros de comisión.

## 5. Flujo Funcional Paso a Paso
1. **Contacto Inicial:** Al negociar con un futbolista, el sistema presenta la ficha del representante: *"Representado por Carlos Bianchi Jr. (Personalidad: Protector del Juvenil, Relación con DT: Muy Buena (82/100))"*.
2. **Impacto en la Negociación:**
   - Gracias a la alta afinidad con el DT, el agente modera sus exigencias de comisión al 6% (en lugar del 10% habitual).
   - Si la relación fuera hostil (< 25), el agente rechazaría sentarse a negociar salvo que se le prometa una prima extraordinaria por adelantado.
3. **Pacto y Firma:** Al acordar los términos, el resumen desglosa claramente:
   - Salario al jugador: $180/sem.
   - Prima de firma: $500.
   - Comisión de intermediación al agente: $150 (pago único).
4. **Persistencia:** Todo el paquete se valida en backend en una sola transacción atómica.

## 6. Reglas Específicas
- **Regla 16.1 — Comisión Legal Máxima:** La comisión del agente está acotada por reglamento de federación a un máximo del 15% del valor de la operación. Ningún payload puede fijar una comisión superior al tope legal.
- **Regla 16.2 — Filtraciones a la Prensa:** Si un jugador con agente `AGGRESSIVE` entra en su último año de contrato y el DT no le ofrece renovación, el agente tiene un 60% de probabilidad semanal de filtrar una noticia hostil a la prensa deportiva ("El representante de [Jugador] afirma que el club no valora su talento"), reduciendo la cohesión de vestuario en -5 puntos.
- **Regla 16.3 — Familiares como Representantes:** Jugadores jóvenes de potrero a menudo están representados por sus padres (`personality = 'PROTECTIVE'`, comisión = 0% a 3%, pero muy sensibles al maltrato de minutos de juego de su hijo).
- **Regla 16.4 — Afinidad Persistente:** La relación con el agente perdura a través de los años. Si el DT cambia de club, los agentes recuerdan su reputación histórica y mantienen su trato previo.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`agent_ecosystem_rules.json`):
- `commission_min_rate`: 0.04 (4%).
- `commission_max_rate`: 0.15 (15%).
- `agent_leak_chance_on_stalemate`: 0.45 semanal.
- `affinity_gain_on_successful_signing`: +6 puntos.
- `affinity_loss_on_broken_talks`: -14 puntos.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Nombre del agente, cartera de otros futbolistas que representa, medidor visual de afinidad profesional (De "Hostil" a "Excelente socio"), porcentaje de comisión pretendido.
- **Parcial:** Reporte del carácter del agente ("Se sabe que es muy agresivo en las comisiones").
- **Oculta al Cliente:** Tirada oculta semanal de filtración periodística, contactos secretos del agente con otros clubes de la liga.

## 9. Inteligencia Artificial / Comportamiento de Agentes
Los agentes de IA gestionan de forma dinámica a sus representados: ofrecen a sus jugadores libres a clubes que buscan esa posición y presionan a los DTs de IA con las mismas reglas que al jugador humano.

## 10. Eventos y Auditoría
- `AGENT_COMMISSION_DISBURSED`: Pago de honorarios profesionales.
- `AGENT_RELATIONSHIP_CHANGED`: Modificación de la afinidad con el DT.
- `AGENT_PRESS_LEAK_EXECUTED`: Noticia hostil plantada en los medios.

## 11. Idempotencia y Mitigación de Errores de Red
- El cobro de honorarios está vinculado a la clave foránea del traspaso (`transfer_id`). No se pueden ejecutar dos pagos de comisión para el mismo traspaso.

## 12. Concurrencia
- La actualización de la afinidad en `manager_agent_relations` utiliza `UPSERT ON CONFLICT (manager_id, agent_id) DO UPDATE`, garantizando que múltiples firmas en el mismo día no generen conflictos de clave primaria.

## 13. Persistencia y Ciclo de Vida
- Los agentes existen durante toda la carrera del juego. Con el tiempo, acumulan más clientes juveniles y aumentan su `influence_rating`.

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Sub-panel del Agente en la mesa de negociación.
- **¿Qué puedo hacer?:** Ver las demandas del agente y ajustar la comisión ofrecida dentro del rango legal.
- **¿Qué cuesta?:** La comisión sale de la tesorería del club en un pago único.
- **¿Qué puede pasar?:** Si maltratas al agente, te cerrará las puertas para fichar a sus otras promesas.
- **¿Qué ocurrió?:** Detalle transparente en la liquidación: *"Comisión de agencia abonada a Guillermo Cóppola: $350"*.

## 15. Casos Extremos
- **Jugador que despide a su representante:** Si un jugador tiene moral muy alta con el club y su agente se niega a firmar una renovación razonable, existe un 10% de probabilidad de que el futbolista despida al agente y negocie directamente con el DT.
- **Club en bancarrota que no puede pagar la comisión:** El fichaje se anula automáticamente si no hay saldo para cubrir la comisión reglamentaria del intermediario.

## 16. Anti-Exploits
- **Sobornos o comisiones en negro:** Toda salida de dinero hacia agentes debe estar formalmente tipificada y registrada en `agent_action_log`.

## 17. Observabilidad y Métricas
- Gasto total promedio en comisiones de agentes por temporada.
- Distribución de afinidades de los DTs con los agentes de su liga.
- Frecuencia de filtraciones a la prensa activadas por agentes.

## 18. Matriz de Pruebas
1. Fichaje con agente -> Comisión calculada y descontada de la caja en una sola transacción.
2. Trato exitoso -> `relationship_score` con el agente incrementa en +5.
3. Intento de fijar comisión del 25% -> Rechazado por validación de tope legal (máx 15%).
4. Doble invocación del pago de comisión -> Idempotente, solo 1 débito bancario.
5. Inserción de relación concurrente -> Resuelta sin colisiones por índice único.

## 19. Criterios de Aceptación
- [x] Modelo de agente, cartera de clientes y afinidad con DT formalizado.
- [x] Máquina de estados de relación y consecuencias de afinidad cerrada.
- [x] Backend como autoridad absoluta de comisiones y límites federativos.
- [x] Personalidades de agentes y filtraciones a la prensa delimitadas.
- [x] IA de agentes activa y transversal a todos los clubes.
- [x] Eventos y auditoría de pagos de intermediación implementados.
- [x] Idempotencia estricta en el débito de comisiones.
- [x] Concurrencia protegida con índice único `(manager_id, agent_id)`.
- [x] Parámetros de comisiones y probabilidades versionados en JSON.
- [x] Casos extremos de despido de agente y bancarrota cubiertos.
- [x] Anti-exploits de comisiones opacas o ilícitas neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `AgentEcosystemService`, `AgentAffinityManager`, `CommissionCalculator`, `AgentRepository`.
- **Comandos:** `DisburseCommissionCommand`, `UpdateAgentAffinityCommand`, `TriggerAgentPressLeakCommand`.
- **Queries:** `GetAgentDetailsQuery`, `GetAgentPortfolioQuery`.
- **Políticas DB:** `ALTER TABLE agents ADD CONSTRAINT chk_commission_range CHECK (base_commission_rate BETWEEN 0.03 AND 0.15)`.
