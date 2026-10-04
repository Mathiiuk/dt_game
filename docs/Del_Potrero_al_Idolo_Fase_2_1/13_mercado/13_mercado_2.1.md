# FASE 13 — MERCADO DE PASES, TRANSFERENCIAS Y AGENTES LIBRES
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Definir el contrato funcional de dominio para el mercado de transferencias, las ventanas de fichajes reglamentarias, la valuación algorítmica y autoritativa de futbolistas en el servidor, la contratación de agentes libres y la compraventa entre instituciones. De acuerdo con las **Reglas Maestras 1, 2, 5 y 8**, el cliente nunca determina el valor de mercado ni el resultado de una negociación; toda operación financiera y cambio de club es validado y liquidado atómicamente en el backend.

## 2. Alcance específico
- Ventanas de pases autorizadas: Ventana de Pretemporada (Semanas 1 a 6) y Ventana de Invierno / Mitad de Torneo (Semanas 22 a 25).
- Algoritmo de valuación de mercado autoritativo: Función de OVR, edad, años de contrato restantes, reputación del club vendedor y posición.
- Pool de Agentes Libres (Futbolistas sin contrato, coste de transferencia $0, solo exigen prima de fichaje y salario).
- Mecánica de Oferta de Transferencia a Clubes Rivales (Oferta inicial, evaluación por IA del club vendedor, contraoferta o rechazo).
- Filtros avanzados de búsqueda en cliente: Posición, Rango de Precio, Edad, Situación Contractual (Libre vs Con Contrato).
- Restricción estricta de fair play financiero interno: No permitir compras que superen el `transfer_budget` o comprometan el `wage_budget_weekly`.

## 3. Entidades y Modelo de Datos de Dominio
1. **TransferMarketListing (`transfer_market_listings`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID, FK -> `careers.id`).
   - `player_id` (UUID, FK -> `players.id`, Unique).
   - `selling_club_id` (UUID, Nullable, FK -> `clubs.id`): Null si es Agente Libre.
   - `listing_type` (Enum: `TRANSFER_LISTED`, `FREE_AGENT`, `LOAN_LISTED`).
   - `market_value` (Numeric 12,2): Valoración calculada por el servidor.
   - `asking_price` (Numeric 12,2): Precio pretendido por el club vendedor.
   - `status` (Enum: `AVAILABLE`, `UNDER_NEGOTIATION`, `SOLD`, `DELISTED`).
   - `created_at`, `updated_at` (Timestamp UTC).

2. **TransferBid (`transfer_bids`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID).
   - `player_id` (UUID, FK -> `players.id`).
   - `buying_club_id` (UUID, FK -> `clubs.id`).
   - `selling_club_id` (UUID, Nullable, FK -> `clubs.id`).
   - `fee_offered` (Numeric 12,2): Monto de traspaso ofrecido.
   - `wage_offered` (Numeric 10,2): Salario semanal propuesto al jugador.
   - `contract_years` (Integer, 1-4).
   - `signing_bonus` (Numeric 10,2): Prima de fichaje.
   - `status` (Enum: `PENDING_RESPONSE`, `ACCEPTED`, `REJECTED`, `COUNTER_OFFERED`, `CANCELLED`).
   - `seller_counter_fee` (Numeric 12,2, Nullable): Monto contraofertado por la IA.
   - `expires_at_week` (Integer): Semana límite de vigencia de la oferta.
   - `created_at` (Timestamp UTC).

3. **TransferAuditLedger (`transfer_audit_log`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID).
   - `player_id` (UUID).
   - `from_club_id` (UUID, Nullable).
   - `to_club_id` (UUID).
   - `transfer_fee` (Numeric 12,2).
   - `wage_weekly` (Numeric 10,2).
   - `season_year` (Integer).
   - `week_number` (Integer).
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados de la Transferencia
```
[JUGADOR_EN_LISTA] ──(Command: SubmitTransferBid)──► [OFERTA_EN_EVALUACION]
                                                             │
                              ┌──────────────────────────────┼──────────────────────────────┐
                              ▼                              ▼                              ▼
                         [RECHAZADA]                 [CONTRAOFERTA_IA]                  [ACEPTADA]
                                                             │                              │
                                                             └──(Aceptar Contraoferta)──────┤
                                                                                            ▼
                                                                                [NEGOCIANDO_CONTRATO_JUGADOR]
                                                                                            │
                                                                                            ▼
                                                                                [TRANSFERENCIA_EJECUTADA]
                                                                                (Dinero debitado y jugador transferido)
```

### Transición T-01: Envío de Oferta de Traspaso
- **Actor:** DT humano o club de IA comprador.
- **Precondiciones:**
  1. El libro de pases está abierto (`career_calendar.transfer_window_open == true`).
  2. El club comprador dispone de saldo suficiente: `club_finances.transfer_budget >= fee_offered`.
  3. El club comprador tiene margen salarial proyectado.
- **Comando:** `SubmitTransferBidCommand(buyingClubId, playerId, feeOffered, wageOffered, contractYears, signingBonus)`.
- **Consecuencias:**
  1. Inserta registro en `transfer_bids` en estado `PENDING_RESPONSE`.
  2. Bloquea preventivamente el monto `fee_offered` en el presupuesto de compras del club.
  3. Programa la respuesta de la IA vendedora para el siguiente tick de simulación (máximo 48 horas de juego).
- **Idempotencia:** No se permite enviar una segunda oferta activa al mismo jugador mientras la anterior esté pendiente (`UNIQUE (player_id, buying_club_id) WHERE status = 'PENDING_RESPONSE'`).

### Transición T-02: Liquidación de Fichaje Aceptado
- **Actor:** Servidor tras acuerdo tripartito (Club comprador, Club vendedor, Jugador).
- **Precondiciones:** Oferta en estado `ACCEPTED`. Fondos disponibles confirmados.
- **Consecuencias:**
  1. Transfiere `fee_offered` de `club_finances.balance` del comprador al vendedor.
  2. Modifica `players.club_id = buying_club_id`.
  3. Cancela el contrato anterior en `contracts` y crea el nuevo vínculo con el nuevo salario y duración.
  4. Marca la oferta como `EXECUTED`.
  5. Inserta registro formal en `transfer_audit_log`.
  6. Emite evento de dominio `PLAYER_TRANSFERRED`.

## 5. Flujo Funcional Paso a Paso
1. **Exploración del Mercado:** El DT abre la pantalla de Mercado. Filtra por "Mediocampistas", edad máxima 24 años, valor hasta $15,000.
2. **Evaluación de Jugador:** Inspecciona la ficha del futbolista. El sistema muestra la valuación de mercado oficial calculada por el servidor ($12,500) y si el club está dispuesto a vender.
3. **Oferta Económica:** El DT formula una oferta de $13,000 de traspaso y $250 semanales de sueldo al jugador con contrato por 2 años.
4. **Evaluación de la IA Vendedora:**
   - La IA del club vendedor evalúa si el jugador es prescindible o titular clave.
   - Fórmula de aceptación: `Score = (fee_offered / market_value) * importancia_plantel`.
   - Si `Score >= 1.15`, la IA acepta la oferta de inmediato.
   - Si `0.90 <= Score < 1.15`, la IA emite una contraoferta (ej: "Aceptamos por $14,200").
   - Si `Score < 0.90`, la IA rechaza la oferta de plano ("Oferta insuficiente considerada ofensiva").
5. **Cierre de Operación:** Si la oferta es aceptada, el dinero se descuenta de la cuenta del club humano, el jugador firma y aparece inmediatamente disponible en la nómina del Plantel (Fase 04 / 06).

## 6. Reglas Específicas
- **Regla 13.1 — Fórmula de Valuación de Servidor:**
  `Valor = Base(tier) * (OVR / 50)^2.5 * FactorEdad(edad) * FactorContrato(meses_restantes)`.
  - Juvenil prometedor (19 años, 55 OVR): Multiplicador ×1.6.
  - Veterano (33 años, 55 OVR): Multiplicador ×0.4.
- **Regla 13.2 — Ventana Cerrada:** Fuera de las semanas reglamentarias de mercado, no se pueden inscribir jugadores nuevos ni enviar ofertas formales entre clubes (solo se permite explorar y ojear en Fase 17).
- **Regla 13.3 — Agentes Libres y Coste Cero:** Los agentes libres no requieren pago a terceros clubes; solo exigen una prima de fichaje inicial proporcional a su reputación y un salario competitivo.
- **Regla 13.4 — Cero Salarios Impagables:** El servidor rechaza cualquier contrato cuyo salario semanal supere el presupuesto salarial no comprometido del club.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`transfer_market_balance.json`):
- `base_transfer_value_tier_5`: $2,000.
- `youth_premium_multiplier`: 1.65 (menores de 21 años).
- `veteran_discount_multiplier`: 0.35 (mayores de 32 años).
- `free_agent_signing_bonus_factor`: 4 semanas de salario como prima.
- `ai_bid_response_delay_days`: 2 días de calendario.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Nombre, edad, posición, club actual, valor de mercado estimado, años de contrato restantes, salario actual aproximado, estadísticas de partidos disputados.
- **Parcial:** Rango de atributos en jugadores de clubes rivales no scouteados (Niebla de Guerra de Fase 17, ej: "Ritmo: 60-75").
- **Oculta al Cliente:** Umbral mínimo exacto que aceptaría la IA vendedora en la contraoferta.

## 9. Inteligencia Artificial / Mercado Autónomo
Los clubes de IA compiten activamente en el mercado: buscan reforzar posiciones débiles de su alineación, compran jugadores entre sí y pueden emitir ofertas por futbolistas del usuario (Fase 14).

## 10. Eventos y Auditoría
- `TRANSFER_BID_SUBMITTED`: Registro de oferta emitida.
- `TRANSFER_BID_ACCEPTED`: Aceptación por el club vendedor.
- `PLAYER_SIGNED`: Firma formal y traspaso de derechos federativos.
- `TRANSFER_FEE_PAID`: Transacción bancaria de egreso/ingreso.

## 11. Idempotencia y Mitigación de Errores de Red
- El endpoint de oferta `POST /api/v1/market/bids` verifica que no exista una oferta abierta para la tupla `(player_id, buying_club_id)`. Múltiples clics del usuario no congelan fondos dobles.

## 12. Concurrencia
- La compra ejecuta `SELECT id, balance, transfer_budget FROM club_finances WHERE club_id = :id FOR UPDATE` y bloquea la fila del jugador en `players`, impidiendo que dos clubes compren al mismo jugador simultáneamente en la misma semana.

## 13. Persistencia y Ciclo de Vida
- Todo traspaso completado se almacena de por vida en `transfer_audit_log`, conformando el historial de transferencias del club y el historial de clubes pasados en la ficha del jugador.

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla del Mercado de Pases / Libro de Transferencias.
- **¿Qué puedo hacer?:** Buscar jugadores con filtros rápidos por posición y precio, ver agentes libres y presentar ofertas de compra o cesión.
- **¿Qué cuesta?:** Consume dinero del presupuesto de transferencias y carga la masa salarial semanal.
- **¿Qué puede pasar?:** El club rival puede contraofertar o el jugador puede rechazar tu salario si es demasiado bajo.
- **¿Qué ocurrió?:** Notificación en la app: *"Oferta por Lautaro Gómez aceptada por Deportivo Sur. El jugador se une a tu plantel"*.

## 15. Casos Extremos
- **Jugador rechaza mudarse a club de división inferior:** Jugadores de categorías altas rechazan ofertas de clubes de potrero salvo que la prima salarial sea extraordinaria (+100%).
- **Límite de cupo de plantel alcanzado (máximo 30 jugadores):** Si el club ya tiene 30 futbolistas registrados, el sistema exige vender o dar de baja a uno antes de fichar un nuevo refuerzo.

## 16. Anti-Exploits
- **Ofertas de valor negativo:** Validado en base de datos con constraint `CHECK (fee_offered >= 0)`.
- **Fichar sin fondos suficientes:** El backend valida el balance bancario real antes de autorizar la firma, no la cifra local del cliente.

## 17. Observabilidad y Métricas
- Volumen total de dinero movilizado en cada ventana de transferencias.
- Distribución de compras (Agentes Libres vs Fichajes entre clubes).
- Tasa de aceptación de ofertas de la IA.

## 18. Matriz de Pruebas
1. Oferta dentro de ventana y con saldo suficiente -> HTTP 201 y oferta en `PENDING_RESPONSE`.
2. Intento de ofertar fuera de la ventana de pases -> HTTP 400 `ERR_TRANSFER_WINDOW_CLOSED`.
3. Oferta por monto superior al `transfer_budget` del club -> HTTP 400 `ERR_INSUFFICIENT_TRANSFER_FUNDS`.
4. Compra exitosa -> Fondos debitados del comprador, acreditados al vendedor y `player.club_id` actualizado.
5. Intento de enviar doble oferta concurrente -> Solo 1 procesada, la segunda responde 409 Conflict.

## 19. Criterios de Aceptación
- [x] Modelo de mercado, ofertas de traspaso y ledger auditado formalizado.
- [x] Máquina de estados de negociación tripartita cerrada.
- [x] Backend como autoridad absoluta de valuaciones y transferencias.
- [x] Filtros de búsqueda, agentes libres y ventanas de pases definidos.
- [x] Comportamiento de IA en evaluación de ofertas parametrizado.
- [x] Eventos y auditoría de mercado implementados.
- [x] Idempotencia estricta en el bloqueo y débito de fondos.
- [x] Concurrencia con bloqueo pesimista en finanzas y jugador resuelta.
- [x] Fórmulas de valuación de mercado parametrizadas en JSON.
- [x] Casos de tope de plantilla y rechazos salariales cubiertos.
- [x] Anti-exploits de ofertas negativas o sin fondos neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `TransferMarketService`, `PlayerValuationEngine`, `AiTransferNegotiator`, `TransferRepository`.
- **Comandos:** `SubmitTransferBidCommand`, `RespondToBidCommand`, `ExecuteTransferCommand`.
- **Queries:** `SearchTransferMarketQuery`, `GetClubPendingBidsQuery`.
- **Políticas DB:** `ALTER TABLE transfer_bids ADD CONSTRAINT chk_positive_bid CHECK (fee_offered >= 0 AND wage_offered > 0)`.
