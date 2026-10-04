# FASE 14 — VENTAS DE JUGADORES, LISTA DE TRANSFERIBLES Y OFERTAS DE IA
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Establecer el contrato funcional y formal de dominio para la gestión de salida de futbolistas del club humano: colocación en la lista de transferibles, recepción y evaluación de ofertas de compra entrantes generadas por clubes de IA, dinámicas de contraoferta y regateo, rescisiones contractuales de mutuo acuerdo y liquidación bancaria de traspasos en el backend.

## 2. Alcance específico
- Estado de transferibilidad del futbolista (`TRANSFER_LISTED`, `NOT_FOR_SALE`, `LOAN_LISTED`).
- Generador de interés y ofertas entrantes de la IA según rendimiento, edad y estatus de lista.
- Opciones de respuesta del DT: Aceptar oferta, Rechazar oferta, Formular contraoferta económica.
- Rescisión contractual unilateral (Despido con indemnización por salarios restantes) o acuerdo mutuo.
- Impacto en el vestuario: vender a un referente/capitán reduce la moral de la plantilla; vender a un jugador descontento descomprime el vestuario.
- Porcentaje de reinversión de venta: Porción del dinero ingresado que la dirigencia autoriza sumar al presupuesto de fichajes.

## 3. Entidades y Modelo de Datos de Dominio
1. **PlayerTransferStatus (`players` extension)**:
   - `transfer_status` (Enum: `NOT_FOR_SALE`, `TRANSFER_LISTED`, `LOAN_LISTED`, `UNAVAILABLE`).
   - `asking_price` (Numeric 12,2, Nullable): Precio sugerido fijado por el DT.
   - `morale_unhappy_transfer_blocked` (Boolean, Default false): Bandera de conflicto si el DT rechazó una oferta millonaria.

2. **IncomingTransferOffer (`transfer_offers`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID, FK -> `careers.id`).
   - `player_id` (UUID, FK -> `players.id`).
   - `offering_club_id` (UUID, FK -> `clubs.id`).
   - `target_club_id` (UUID, FK -> `clubs.id`): Club del usuario.
   - `fee_offered` (Numeric 12,2): Suma de dinero ofrecida.
   - `sell_on_fee_percentage` (Integer, 0-50, Default 0): Cláusula de futura venta.
   - `status` (Enum: `PENDING_REVIEW`, `ACCEPTED`, `REJECTED`, `COUNTER_OFFERED`, `EXPIRED`).
   - `expires_at_week` (Integer): Semana límite para responder.
   - `created_at` (Timestamp UTC).

3. **ContractTerminationAudit (`contract_terminations_log`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID).
   - `club_id` (UUID).
   - `player_id` (UUID).
   - `termination_type` (Enum: `MUTUAL_CONSENT`, `UNILATERAL_BUYOUT`, `TRANSFER_EXIT`).
   - `severance_paid` (Numeric 10,2): Indemnización pagada al futbolista.
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados
```
[JUGADOR_EN_PLANTEL] ──(Command: SetTransferStatus)──► [TRANSFERIBLE_EN_LISTA]
                                                              │
                                            (IA genera oferta entrante)
                                                              │
                                                              ▼
                                                   [OFERTA_ENTRANTE_PENDIENTE]
                                                              │
                              ┌──────────────────────────────┼──────────────────────────────┐
                              ▼                              ▼                              ▼
                         [RECHAZADA]                 [CONTRAOFERTA_DT]                  [ACEPTADA]
                              │                              │                              │
                    (Jugador descontento)         (IA evalúa contraoferta)                  │
                                                             │                              ▼
                                                             └──────────────────► [VENTA_LIQUIDADA_EN_BANCO]
```

### Transición T-01: Respuesta a Oferta Entrante
- **Actor:** DT humano propietario del pase del jugador.
- **Precondiciones:** Oferta en estado `PENDING_REVIEW` y no expirada por calendario.
- **Comando:** `ResolveTransferOfferCommand(offerId, decision: 'ACCEPT'|'REJECT'|'COUNTER', counterAmount)`.
- **Consecuencias:**
  1. Si `ACCEPT`: Se cierra el traspaso. Se transfiere el pase a `offering_club_id`, se suma el dinero a la tesorería del club y se libera la masa salarial.
  2. Si `REJECT`: La oferta pasa a `REJECTED`. Si la oferta era de una división superior y de valor elevado, el jugador sufre -20 de moral por truncar su carrera.
  3. Si `COUNTER`: La oferta pasa a `COUNTER_OFFERED` y la IA responderá en el siguiente avance de semana.
- **Idempotencia:** Responder a una oferta ya resuelta arroja un código HTTP 409 sin duplicar dinero.

### Transición T-02: Rescisión Unilateral de Contrato (Despido)
- **Actor:** DT humano.
- **Precondiciones:** Jugador perteneciente al club. Tesorería suficiente para abonar el finiquito.
- **Comando:** `TerminatePlayerContractCommand(clubId, playerId)`.
- **Consecuencias:**
  1. Se calcula la indemnización: `finiquito = semanas_restantes_contrato * wage_weekly * 0.65`.
  2. Se descuenta `finiquito` de `club_finances.balance`.
  3. El jugador pasa a ser `FREE_AGENT` (`club_id = NULL`).
  4. Se inserta en `contract_terminations_log`.
- **Errores:** `ERR_INSUFFICIENT_FUNDS_FOR_SEVERANCE`.

## 5. Flujo Funcional Paso a Paso
1. **Poner en Venta:** El DT accede a la ficha de un delantero veterano que no encaja en su esquema. Presiona "Poner en lista de transferibles" y fija un precio pedido de $8,000.
2. **Generación de Interés de la IA:** Durante el avance de semana (Fase 07), el motor de mercado de IA detecta al jugador listado. El club rival "Atlético Bella Vista", que necesita un delantero, formula una oferta formal por $7,500.
3. **Notificación al DT:** El Dashboard (Fase 06) muestra una alerta crítica: *"Oferta recibida por Carlos Silva ($7,500 de Atlético Bella Vista)"*.
4. **Decisión del DT:** El DT decide aceptar la oferta.
5. **Liquidación:**
   - La tesorería recibe +$7,500 en `club_finances.balance`.
   - Se libera el salario semanal de $180.
   - El jugador se traslada inmediatamente a su nuevo club.
   - Notificación de confirmación en la app.

## 6. Reglas Específicas
- **Regla 14.1 — Reparto Dirigencial de la Venta:** En clubes de categoría regional (Tier 5), la dirigencia solo autoriza transferir el 80% del valor de la venta al presupuesto de fichajes (`transfer_budget`); el 20% restante se destina a gastos operativos y reservas de tesorería institucional.
- **Regla 14.2 — Descontento por Venta Bloqueada:** Si el DT rechaza una oferta superior al 120% del valor de mercado de un futbolista con ambición alta, el jugador solicita una reunión tensa con el DT y su moral baja a estado "En Rebeldía" (`morale = 30`).
- **Regla 14.3 — Finiquito Obligatorio en Rescisiones:** No se puede expulsar a un futbolista sin abonar al menos el 65% de los sueldos firmados hasta la finalización de su contrato vigente.
- **Regla 14.4 — Expiración de Ofertas:** Las ofertas entrantes tienen una vigencia estricta de 2 semanas de calendario. Si el DT no responde, la oferta se marca como `EXPIRED` automáticamente y el club rival retira su propuesta.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`sales_balance.json`):
- `transfer_budget_reinvestment_ratio`: 0.80 (80%).
- `severance_cost_factor`: 0.65 (65% del contrato pendiente).
- `offer_validity_weeks`: 2 semanas.
- `ai_counter_tolerance_threshold`: 1.25 (la IA tolera hasta un 25% más en el regateo del DT humano).

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Ofertas formales recibidas, monto ofertado, club emisor, fecha de vencimiento de la oferta, coste de rescisión calculado de antemano antes de confirmar un despido.
- **Parcial:** Ninguna.
- **Oculta al Cliente:** Presupuesto total máximo que el club comprador de IA estaría dispuesto a pagar en última instancia.

## 9. Inteligencia Artificial / Mercado Activo
Los clubes de IA no ofertan al azar; analizan el OVR medio de sus líneas y emiten ofertas preferentes por jugadores en lista de transferibles que mejoren su 11 titular.

## 10. Eventos y Auditoría
- `PLAYER_TRANSFER_LISTED`: Jugador colocado en la lista de ventas.
- `INCOMING_OFFER_RECEIVED`: Recepción de propuesta formal de la IA.
- `PLAYER_SOLD`: Venta concretada e ingreso financiero auditado.
- `CONTRACT_TERMINATED`: Despido y pago de liquidación laboral.

## 11. Idempotencia y Mitigación de Errores de Red
- El endpoint `POST /api/v1/squad/offers/:id/resolve` valida el estado actual de la oferta antes de operar. Si ya fue aceptada, rechaza segundas peticiones evitando duplicar acreditaciones bancarias.

## 12. Concurrencia
- La aceptación de oferta ejecuta un bloqueo en las finanzas del club y en el estado del jugador mediante `FOR UPDATE`, impidiendo que el jugador sea vendido y rescindido simultáneamente.

## 13. Persistencia y Ciclo de Vida
- Todas las ofertas resueltas (aceptadas o rechazadas) se conservan en `transfer_offers` para alimentar el historial de negociaciones del club.

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de Plantel / Pestaña "Ventas y Negociaciones".
- **¿Qué puedo hacer?:** Ver ofertas pendientes, negociar precios o rescindir contratos de descartes.
- **¿Qué cuesta?:** Vender otorga dinero; despedir cuesta la indemnización calculada en pantalla.
- **¿Qué puede pasar?:** Si pides demasiado en la contraoferta, la IA romperá las negociaciones.
- **¿Qué ocurrió?:** Alerta tipo toast nativo: *"Traspaso completado: $7,500 acreditados en la cuenta del club"*.

## 15. Casos Extremos
- **Club con saldo insuficiente para pagar indemnización de despido:** El botón de rescisión se desactiva mostrando un mensaje claro: *"Saldo insuficiente en caja para abonar el finiquito de $2,400"*.
- **Jugador que se lesiona de gravedad mientras tiene una oferta pendiente:** El club comprador retira inmediatamente su oferta alegando no superar el reconocimiento médico.

## 16. Anti-Exploits
- **Venta a clubes imaginarios:** Las ofertas solo pueden provenir de clubes legalmente registrados en la misma carrera con presupuestos autorizados.
- **Alteración del monto aceptado:** El frontend solo envía la decisión (`ACCEPT`); el monto acreditado es el que ya estaba persistido en la fila de `transfer_offers` en la base de datos.

## 17. Observabilidad y Métricas
- Ratio de ofertas aceptadas vs rechazadas por los usuarios.
- Ganancia neta media obtenida por ventas de futbolistas por temporada.
- Cantidad de rescisiones unilaterales ejecutadas.

## 18. Matriz de Pruebas
1. Aceptar oferta de $10,000 -> Tesorería del club suma $10,000, $8,000 añadidos al presupuesto de fichajes, jugador transferido.
2. Rechazar oferta -> Oferta marcada como `REJECTED`, moral del jugador ajustada según contexto.
3. Rescisión unilateral con saldo suficiente -> Finiquito debitado de `club_finances.balance` y jugador liberado.
4. Intento de rescindir sin fondos suficientes -> HTTP 400 `ERR_INSUFFICIENT_FUNDS_FOR_SEVERANCE`.
5. Doble clic en botón aceptar -> Procesamiento idempotente, 0 duplicación de dinero.

## 19. Criterios de Aceptación
- [x] Modelo de transferibilidad, ofertas de compra y rescisiones formalizado.
- [x] Máquina de estados de venta y regateo cerrada.
- [x] Backend como autoridad absoluta de transferencias bancarias y finiquitos.
- [x] Reglas de reinversión dirigencial y moral de vestuario definidas.
- [x] Comportamiento de IA en ofertas y contraofertas parametrizado.
- [x] Eventos y auditoría de transferencias implementados.
- [x] Idempotencia estricta en la resolución de ofertas.
- [x] Concurrencia con bloqueo pesimista resuelta.
- [x] Factores de indemnización y límites parametrizados en JSON.
- [x] Casos de lesiones y quiebras mitigados.
- [x] Anti-exploits de manipulación de cifras de venta neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `TransferSalesService`, `AiOfferGenerator`, `ContractTerminationManager`, `TransferOfferRepository`.
- **Comandos:** `SetTransferStatusCommand`, `ResolveTransferOfferCommand`, `TerminateContractCommand`.
- **Queries:** `GetIncomingOffersQuery`, `CalculateSeveranceCostQuery`.
- **Políticas DB:** `CREATE INDEX idx_transfer_offers_target_status ON transfer_offers(target_club_id, status)`.
