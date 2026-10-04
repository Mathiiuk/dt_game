# FASE 15 — CONTRATOS, RENOVACIONES Y CLÁUSULAS
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Definir el contrato funcional de dominio para la negociación, renovación y administración de contratos profesionales de futbolistas en *Del Potrero al Ídolo*. De acuerdo con las **Reglas Maestras 1, 6, 8 y 13**, el servidor es la autoridad de validación salarial, exigencias del jugador y cálculo de cláusulas de rescisión: el frontend presenta la propuesta, y el backend evalúa atómicamente la viabilidad económica y la satisfacción del jugador, blindando las finanzas institucionales contra compromisos salariales impagables.

## 2. Alcance específico
- Renovación anticipada de contratos para futbolistas del plantel propio.
- Estructura formal del contrato: Salario semanal base (`wage_weekly`), duración en años (1 a 4 temporadas), cláusula de rescisión obligatoria u optativa, prima de firma (`signing_bonus`), bonificaciones por gol o valla invicta.
- Estatus y rol pactado en el plantel (`KEY_PLAYER`, `FIRST_TEAM_REGULAR`, `ROTATION`, `BACKUP`, `FUTURE_PROSPECT`).
- Algoritmo de exigencias salariales del futbolista (basado en OVR, edad, rendimiento reciente, reputación del club y ofertas externas).
- Gestión de contratos en último año: Riesgo de salida libre bajo Ley Bosman (pre-contrato con rivales a falta de 6 meses).
- Descontento salarial: Jugadores con salarios desfasados respecto a su rendimiento exigen aumentos o bajan su moral.

## 3. Entidades y Modelo de Datos de Dominio
1. **PlayerContract (`contracts`)**:
   - `id` (UUID, PK): Identificador inmutable del vínculo contractual.
   - `player_id` (UUID, FK -> `players.id`, Unique).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `wage_weekly` (Numeric 10,2): Salario semanal acordado.
   - `starts_at` (Date): Fecha de inicio del contrato.
   - `expires_at` (Date): Fecha de expiración (fin de temporada).
   - `contract_years_total` (Integer, 1-4).
   - `release_clause` (Numeric 12,2, Nullable): Monto de rescisión unilateral.
   - `squad_role` (Enum: `KEY_PLAYER`, `FIRST_TEAM`, `ROTATION`, `BACKUP`, `PROSPECT`).
   - `goal_bonus` (Numeric 8,2, Default 0): Bono por gol convertido.
   - `clean_sheet_bonus` (Numeric 8,2, Default 0): Bono por partido sin recibir goles.
   - `status` (Enum: `ACTIVE`, `EXPIRING_SOON`, `TERMINATED`).
   - `updated_at` (Timestamp UTC).

2. **ContractNegotiationDraft (`contract_negotiations`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID).
   - `player_id` (UUID, FK -> `players.id`).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `wage_offered` (Numeric 10,2).
   - `years_offered` (Integer).
   - `release_clause_offered` (Numeric 12,2, Nullable).
   - `squad_role_offered` (Enum).
   - `rounds_completed` (Integer, Default 1): Conteo de rondas de regateo (máximo 3).
   - `negotiation_status` (Enum: `OPEN`, `ACCEPTED`, `REJECTED`, `COLLAPSED`).
   - `player_demands_snapshot` (JSONB): Exigencias mínimas del futbolista.
   - `created_at` (Timestamp UTC).

3. **ContractAuditLog (`contracts_audit_log`)**:
   - `id` (UUID, PK).
   - `player_id` (UUID).
   - `club_id` (UUID).
   - `action` (String: `CONTRACT_RENEWED`, `CONTRACT_EXPIRED`, `RELEASE_CLAUSE_TRIGGERED`).
   - `previous_wage` (Numeric 10,2).
   - `new_wage` (Numeric 10,2).
   - `previous_expiry` (Date).
   - `new_expiry` (Date).
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados de la Negociación
```
[CONTRATO_VIGENTE] ──(Command: StartContractRenewal)──► [CALCULANDO_PRETENSIONES_DEL_JUGADOR]
                                                                  │
                                                                  ▼
                                                      [NEGOCIACION_ABIERTA (Ronda 1)]
                                                                  │
                              ┌───────────────────────────────────┼───────────────────────────────────┐
                              ▼                                   ▼                                   ▼
                   [PROPUESTA_ACEPTADA]                 [RECHAZO_CON_CONTRAPROPUESTA]          [RUPTURA_TOTAL]
                              │                                   │                                   │
                              ▼                                   └──(Reintento: Ronda 2 y 3)─────────┤
                    [CONTRATO_RENOVADO_EN_BD]                                                         ▼
                    (Invalida cachés de plantel)                                           [BLOQUEO_POR_4_SEMANAS]
```

### Transición Principal: Firma y Renovación de Contrato
- **Actor:** DT humano en representación del club.
- **Precondiciones:**
  1. El jugador pertenece al club y no está en huelga ni en estado de ruptura de negociaciones.
  2. El salario ofrecido no sobrepasa el presupuesto salarial semanal disponible:
     `club_finances.wage_budget_weekly - current_total_wages + old_wage >= wage_offered`.
  3. La propuesta económica cumple o supera las pretensiones mínimas del jugador calculadas por el backend.
- **Comando:** `SignContractRenewalCommand(clubId, playerId, wageOffered, yearsOffered, squadRole, releaseClause)`.
- **Consecuencias:**
  1. Actualiza `contracts` con el nuevo salario, vigencia y rol.
  2. Ajusta la fecha de expiración sumando los años pactados al fin de temporada.
  3. Aumenta la moral del jugador en +15 puntos por seguridad laboral.
  4. Inserta auditoría en `contracts_audit_log`.
  5. Invalida selectivamente las cachés en memoria `squad:${clubId}` y `finances:${clubId}`.
- **Idempotencia:** Solicitudes repetidas detectan el contrato ya actualizado y devuelven HTTP 200 sin extender años repetidamente.
- **Errores:** `ERR_WAGE_EXCEEDS_BUDGET`, `ERR_DEMANDS_NOT_MET`, `ERR_NEGOTIATION_LOCKED`.

## 5. Flujo Funcional Paso a Paso
1. **Detección de Vencimiento:** El DT nota en el Dashboard que a su mediocampista estrella le quedan 10 semanas de contrato.
2. **Apertura de Mesa:** Presiona "Renovar Contrato". El backend calcula las pretensiones salariales del jugador:
   - Salario actual: $140/sem.
   - Pretensión salarial: $210/sem (por su alto OVR y buen rendimiento).
   - Rol exigido: `FIRST_TEAM`.
   - Años pedidos: 2 temporadas.
3. **Oferta del DT:** El DT ofrece $200/sem, 2 temporadas, rol `FIRST_TEAM` y una prima de firma de $800.
4. **Evaluación de Aceptación en Servidor:**
   - La oferta cubre el 95.2% del salario pretendido, pero la prima de firma compensa la pequeña diferencia.
   - Puntuación de aceptación = 102/100 (Aceptado).
5. **Transacción y Firma:** El backend persiste el nuevo contrato, debita la prima de firma de la tesorería y extiende el vínculo por 2 años más.
6. **Notificación:** Modal de felicitaciones con foto de la firma del contrato y actualización inmediata de la masa salarial del club.

## 6. Reglas Específicas
- **Regla 15.1 — Autoridad Presupuestaria Infranqueable:** Ningún contrato puede firmarse si el club no dispone de margen en `wage_budget_weekly`. El frontend no puede puentear esta restricción financiera.
- **Regla 15.2 — Cláusula de Rescisión Proporcional:** En divisiones bajas, si el DT fija una cláusula de rescisión ridículamente alta (ej: $1,000,000 para un jugador de 50 OVR), el jugador exigirá un salario un 40% más alto a cambio de aceptar la cláusula abusiva.
- **Regla 15.3 — Ley Bosman (Precontratos a 6 meses):** Si a un futbolista le quedan menos de 24 semanas de contrato (6 meses) y no ha renovado, los clubes rivales pueden iniciar negociaciones directas para ficharlo gratis al finalizar la temporada.
- **Regla 15.4 — Límite de 3 Intentos de Negociación:** Si el DT presenta 3 ofertas consecutivas inaceptables, el jugador y su representante abandonan la mesa de negociación enfadados, bloqueando cualquier nuevo intento durante 4 semanas de calendario.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`contract_negotiation_rules.json`):
- `wage_expectation_exponent`: 2.1 (crecimiento exponencial según OVR).
- `max_negotiation_rounds`: 3 rondas.
- `lockout_duration_on_collapse_weeks`: 4 semanas.
- `release_clause_minimum_multiple`: 3.0× el valor de mercado.
- `signing_bonus_weight_in_evaluation`: 0.35.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Salario actual, fecha de expiración exacta, pretensiones salariales declaradas por el jugador ("Espera un salario cercano a $210/sem"), rol pretendido y duración deseada.
- **Parcial:** Flexibilidad del jugador ante ofertas más bajas ("Está dispuesto a negociar por el club de sus amores").
- **Oculta al Cliente:** Umbral matemático de rechazo inflexible (el valor exacto donde la IA se levanta de la mesa).

## 9. Inteligencia Artificial / Renovaciones de Rivales
Los clubes de IA renuevan preventivamente a sus titulares con contratos de menos de 1 año de duración si su rendimiento promedio de la temporada supera 6.5 puntos.

## 10. Eventos y Auditoría
- `CONTRACT_NEGOTIATION_STARTED`: Inicio de conversaciones.
- `CONTRACT_OFFER_EVALUATED`: Evaluación de la propuesta por el motor de servidor.
- `CONTRACT_RENEWED`: Vínculo renovado y firmado.
- `NEGOTIATION_COLLAPSED`: Ruptura de diálogo por ofertas insuficientes.

## 11. Idempotencia y Mitigación de Errores de Red
- El endpoint `POST /api/v1/contracts/:playerId/renew` verifica si el contrato ya tiene la fecha de expiración propuesta. Múltiples clics por ansiedad no descuentan dobles primas de fichaje de la caja.

## 12. Concurrencia
- La operación de renovación bloquea la fila del contrato y las finanzas del club (`SELECT ... FOR UPDATE`), garantizando que la masa salarial se recalcule de forma atómica sin race conditions con partidos u otras renovaciones simultáneas.

## 13. Persistencia y Ciclo de Vida
- Al expirar un contrato sin renovación al término de la temporada, el estado del jugador pasa a `FREE_AGENT` automáticamente y se desvincula de la nómina del club en el cierre de temporada (Fase 29).

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de Negociación Contractual.
- **¿Qué puedo hacer?:** Ajustar salario con un slider que muestra el impacto en el presupuesto del club, seleccionar duración (1 a 4 años) y elegir el rol prometido.
- **¿Qué cuesta?:** Aumenta el compromiso de masa salarial semanal y consume prima de firma de la tesorería.
- **¿Qué puede pasar?:** Si ofreces menos de lo mínimo, el jugador se molestará y bajará su moral; si ofreces una propuesta justa, firmará con entusiasmo.
- **¿Qué ocurrió?:** Feedback inmediato en pantalla: chip verde *"Contrato firmado hasta Junio de 2028"*.

## 15. Casos Extremos
- **Jugador que exige un salario superior al presupuesto total del club:** La interfaz le informa al DT con anticipación: *"Las pretensiones del jugador ($450/sem) superan tu presupuesto salarial disponible ($320/sem). Debes liberar masa salarial vendiendo otros futbolistas"*.
- **Jugador titular con contrato vencido en plena mitad de torneo:** En divisiones regionales, el jugador juega con contrato temporal semana a semana cobrando el doble de prima de partido hasta regularizar su firma.

## 16. Anti-Exploits
- **Renovar por $0 de salario:** Restricción de base de datos `CHECK (wage_weekly >= 50.00)` para impedir contratos de esclavitud.
- **Contratos de 99 años:** Restricción `CHECK (contract_years_total BETWEEN 1 AND 4)`.

## 17. Observabilidad y Métricas
- Distribución de masas salariales respecto al tope de liga.
- Porcentaje de futbolistas que se marchan libres por falta de renovación.
- Tasa de negociaciones fallidas / colapsadas.

## 18. Matriz de Pruebas
1. Renovación exitosa con fondos disponibles -> Contrato actualizado, fecha de vencimiento extendida, prima debitada.
2. Intento de renovar con salario superior al presupuesto salarial -> HTTP 400 `ERR_WAGE_EXCEEDS_BUDGET`.
3. Ofrecer salario inferior al 50% de las pretensiones -> Jugador rechaza de inmediato.
4. Ruptura de negociaciones en 3ª ronda fallida -> Estado `COLLAPSED`, bloqueo de 4 semanas activo.
5. Invocación repetida del endpoint de firma -> Idempotente, 0 primas duplicadas.

## 19. Criterios de Aceptación
- [x] Modelo de datos de contrato, negociaciones y ledger formalizado.
- [x] Máquina de estados de negociación con límite de 3 rondas cerrada.
- [x] Backend como autoridad absoluta de cálculo de exigencias y control salarial.
- [x] Ley Bosman y precontratos a 6 meses contemplados.
- [x] Lógica de IA para renovación preventiva de titulares parametrizada.
- [x] Eventos y auditoría de extensiones contractuales implementados.
- [x] Idempotencia estricta en el cobro de primas y extensiones de fecha.
- [x] Concurrencia con bloqueo pesimista en masa salarial resuelta.
- [x] Balance de pretensiones y multiplicadores parametrizado en JSON.
- [x] Casos de quiebra salarial y contratos vencidos cubiertos.
- [x] Anti-exploits de contratos infinitos o salarios nulos neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `ContractNegotiationService`, `WageExpectationEngine`, `ContractRepository`, `SquadBudgetGuard`.
- **Comandos:** `InitiateNegotiationCommand`, `SubmitContractOfferCommand`, `FinalizeContractRenewalCommand`.
- **Queries:** `GetPlayerContractQuery`, `GetExpiringContractsQuery`.
- **Políticas DB:** `ALTER TABLE contracts ADD CONSTRAINT chk_valid_contract CHECK (wage_weekly >= 50.0 AND expires_at > starts_at)`.
