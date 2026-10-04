# FASE 20 — ECONOMÍA INTEGRAL, BALANCE SEMANAL Y FINANZAS DEL CLUB
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Establecer el contrato funcional de dominio para el motor económico integral, el balance de ingresos y egresos, el devengo semanal de costos operativos y el control de quiebra financiera en *Del Potrero al Ídolo*. De acuerdo con las **Reglas Maestras 1, 2, 4, 8 y 14**, el servidor es la única entidad autorizada a modificar balances, liquidar salarios y devengar premios: el dinero jamás se genera desde el cliente y toda alteración presupuestaria queda registrada inmutablemente en el libro mayor contable (`financial_transactions_ledger`).

## 2. Alcance específico
- Flujo de Caja Semanal y Categorización Contable:
  - **Ingresos Recurrentes:** Cuotas de socios/afiliados, patrocinador principal de camiseta, derechos de televisación local de la división.
  - **Ingresos Variables:** Taquilla por venta de entradas en partidos como local (Fase 11), premios por victoria/empate federativos, premios por avanzar rondas de copa, venta de futbolistas (Fase 14).
  - **Egresos Recurrentes:** Nómina salarial del primer plantel, salarios del cuerpo técnico y empleados (Fase 19), mantenimiento del estadio (Fase 21), mantenimiento de la cantera (Fase 18).
  - **Egresos Variables:** Fichajes y compras de jugadores (Fase 13), primas de firma y comisiones de agentes (Fase 16), indemnizaciones por despidos, mejoras de infraestructura.
- Estado de Salud Financiera: Superávit Sostenible, Equilibrio, Déficit Moderado, Quiebra / Intervención Judicial.
- Consecuencias del Déficit Prolongado: Sanción dirigencial con recorte forzoso de fichajes, quita de puntos federativa (-3 a -6 puntos) o destitución del DT por ruina económica.
- Presentación de Proyección en UI: Desglose de ingresos vs gastos semanales, acumulados de temporada y estimación de semanas de liquidez restante.

## 3. Entidades y Modelo de Datos de Dominio
1. **ClubFinancesState (`club_finances`)**:
   - `id` (UUID, PK): Identificador inmutable.
   - `club_id` (UUID, FK -> `clubs.id`, Unique).
   - `balance` (Numeric 12,2): Saldo total disponible en tesorería (puede ser negativo en caso de deuda).
   - `wage_budget_weekly` (Numeric 10,2): Techo salarial autorizado por la comisión directiva.
   - `transfer_budget` (Numeric 12,2): Dinero asignado exclusivamente para compra de pases.
   - `ticket_price` (Numeric 6,2, Default 10.00): Precio de la entrada general fijado por el DT.
   - `consecutive_deficit_weeks` (Integer, Default 0): Contador de semanas seguidas en saldo negativo.
   - `financial_status` (Enum: `HEALTHY`, `CAUTION`, `CRITICAL`, `INSOLVENT`).
   - `updated_at` (Timestamp UTC).

2. **FinancialTransaction (`financial_transactions_ledger`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID, FK -> `careers.id`).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `season_year` (Integer).
   - `week_number` (Integer).
   - `category` (Enum: `WAGE_PAYMENT`, `STAFF_WAGE`, `STADIUM_MAINTENANCE`, `YOUTH_MAINTENANCE`, `TICKET_SALES`, `SPONSOR_INCOME`, `MEMBER_DUES`, `TRANSFER_SPEND`, `TRANSFER_INCOME`, `FACILITY_UPGRADE`, `PRIZE_MONEY`, `AGENT_COMMISSION`).
   - `amount` (Numeric 12,2): Positivo para ingresos, negativo para egresos.
   - `balance_after` (Numeric 12,2): Foto inmutable del saldo tras la operación.
   - `description` (String): Glosa contable explicativa.
   - `created_at` (Timestamp UTC).

3. **ClubSponsorshipContract (`club_sponsorships`)**:
   - `id` (UUID, PK).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `sponsor_name` (String): Marca patrocinadora (ej: "Pizzería Los Hijos de Pocho").
   - `weekly_fixed_amount` (Numeric 8,2): Dinero fijo depositado cada semana.
   - `win_bonus` (Numeric 8,2): Bono extra por cada partido de liga ganado.
   - `expires_at_season` (Integer): Temporada en la que vence el acuerdo.

## 4. Máquina de Estados del Devengo Semanal
```
[TESORERIA_SEMANA_ACTUAL] ──(Disparo: Cascada Semanal Fase 07)──► [CALCULANDO_DEBITOS_Y_CREDITOS]
                                                                            │
                                     ┌──────────────────────────────────────┴──────────────────────────────────────┐
                                     ▼                                                                             ▼
                        [INGRESOS_RECURRENTES]                                                        [EGRESOS_OPERATIVOS]
                        - Cuotas de socios                                                            - Sueldos de futbolistas
                        - Patrocinio semanal                                                          - Sueldos de cuerpo técnico
                        - Derechos de TV                                                              - Mantenimiento edilicio
                                     │                                                                             │
                                     └──────────────────────────────────────┬──────────────────────────────────────┘
                                                                            ▼
                                                                [BALANCE_NETO_SEMANAL]
                                                                            │
                                              ┌─────────────────────────────┴─────────────────────────────┐
                                              ▼                                                           ▼
                                   (Saldo final >= $0)                                         (Saldo final < $0: Déficit)
                                              │                                                           │
                                   [ESTADO: HEALTHY]                                          [INCREMENTA_DEFICIT_WEEKS]
                                                                                                          │
                                                                                          (Si deficit_weeks >= 4)
                                                                                                          ▼
                                                                                              [ALERTA_CRITICA_DIRIGENCIAL]
```

### Transición Principal: Liquidación Contable Semanal
- **Actor:** Servidor durante el avance cronológico semanal (Fase 07).
- **Precondiciones:** Avance de semana activo.
- **Comando:** `ProcessWeeklyFinancesCommand(clubId, weekNumber)`.
- **Consecuencias:**
  1. Suma los ingresos garantizados: Cuotas de socios + Patrocinio base + TV.
  2. Calcula los gastos fijos: Masa salarial de jugadores + Salarios de staff + Mantenimiento de estadio y cantera.
  3. Computa el flujo neto: `delta = total_ingresos - total_gastos`.
  4. Actualiza `club_finances.balance = balance + delta`.
  5. Inserta las líneas contables en `financial_transactions_ledger`.
  6. Si `balance < 0`, suma +1 a `consecutive_deficit_weeks`; si no, resetea a 0.
  7. Invalida la entrada en memoria `finances:${clubId}`.
- **Idempotencia:** Asociado unívocamente a `(club_id, season_year, week_number)`. Si ya se liquidó la semana, no vuelve a debitar.

## 5. Flujo Funcional Paso a Paso
1. **Acceso al Menú Finanzas:** El DT ingresa a "Finanzas". Gracias al sistema de caché SWR (`queryCache`), la pantalla carga en 0ms.
2. **Visualización de Secciones Claras:**
   - **Indicador Principal:** Caja actual ($18,450), Estado: "Finanzas Saludables", Semanas de liquidez estimada (5.2 semanas sin ingresos extras).
   - **Flujo Semanal:**
     - Ingresos Semanales Estimados: +$1,950 (Socios: $800, Sponsor: $750, TV: $400).
     - Gastos Semanales Fijos: -$3,580 (Plantel: $2,800, Staff: $480, Mantenimiento: $300).
     - Balance Neto Semanal Proyectado: -$1,630 (déficit operativo normal en semanas de visitante, compensado por taquilla de local).
   - **Historial de Transacciones:** Tabla con fecha, categoría, monto y saldo resultante con filtros por tipo de movimiento.
3. **Ajuste de Precios:** El DT ajusta el precio de las entradas de $10 a $12 para el próximo partido de local para mejorar la taquilla.
4. **Validación Autoritaria:** El servidor valida que el precio esté dentro del rango legal de la división ($5 a $25) y persiste el cambio.

## 6. Reglas Específicas
- **Regla 20.1 — Prohibición de Modificación Client-Side:** El cliente jamás puede enviar mutaciones directas de saldo (`balance = X`). Toda adición o deducción de dinero ocurre como consecuencia de eventos de dominio tipificados en el backend.
- **Regla 20.2 — Consecuencias del Déficit Prolongado:**
  - 4 semanas consecutivas en negativo: Advertencia formal de la Comisión Directiva y bloqueo total de fichajes (`transfer_budget = 0`).
  - 8 semanas consecutivas en negativo: Intervención federativa con quita de 3 puntos en la tabla de la liga (Fase 12).
  - 12 semanas consecutivas en negativo: Quiebra institucional y destitución inmediata del Director Técnico (Game Over por ruina económica).
- **Regla 20.3 — Inmutabilidad Contable del Libro Mayor:** Las filas de `financial_transactions_ledger` son de solo inserción (INSERT-only); jamás pueden borrarse ni alterarse para asegurar trazabilidad contable total.
- **Regla 20.4 — Rango Autorizado de Entradas:** En la división de potrero (Tier 5), el precio de la entrada debe estar acotado entre $5.00 y $25.00. Un precio demasiado alto vaciará el estadio; un precio muy bajo reducirá los ingresos.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`economy_balance.json`):
- `base_members_count_tier_5`: 350 socios.
- `member_monthly_due`: $10.00 (repartido en $2.50/sem).
- `weekly_tv_rights_tier_5`: $400.00.
- `sponsor_base_weekly_tier_5`: $750.00.
- `stadium_base_maintenance_cost`: $200.00 por semana.
- `max_consecutive_deficit_weeks_before_firing`: 12 semanas.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Saldo en tesorería al centavo, desglose exhaustivo de ingresos y egresos, historial de transacciones pasadas, desglose salarial, precio de entradas y contratos de patrocinio.
- **Parcial:** Proyección de balance para las próximas 4 semanas.
- **Oculta al Cliente:** Multiplicadores ocultos de sponsors futuros y fórmulas de tasación bancaria interna.

## 9. Inteligencia Artificial / Economía de Clubes Rivales
Los clubes de IA se rigen por la misma contabilidad semanal: si entran en déficit, venden a sus futbolistas mejor valorados para equilibrar sus cuentas antes de caer en sanciones federativas.

## 10. Eventos y Auditoría
- `WEEKLY_FINANCES_PROCESSED`: Liquidación semanal contable completada.
- `FINANCIAL_WARNING_ISSUED`: Advertencia formal de la dirigencia por déficit.
- `CLUB_BANKRUPTCY_TRIGGERED`: Quiebra y destitución ejecutada.

## 11. Idempotencia y Mitigación de Errores de Red
- El proceso de liquidación semanal utiliza una clave de idempotencia interna `(club_id, season_year, week_number)`. Si el proceso se dispara dos veces por fallo de worker, la base de datos ignora la segunda llamada evitando cobros dobles de sueldos.

## 12. Concurrencia
- Toda mutación financiera ejecuta un bloqueo pesimista en `club_finances` mediante `SELECT balance FROM club_finances WHERE club_id = :id FOR UPDATE`, evitando condiciones de carrera entre la taquilla de un partido y el pago de salarios.

## 13. Persistencia y Ciclo de Vida
- La salud financiera perdura año a año. Los remanentes de saldo al cierre de temporada (Fase 29) se trasladan al ejercicio de la temporada siguiente.

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de Finanzas y Economía del Club.
- **¿Qué puedo hacer?:** Analizar ingresos vs gastos, ajustar precio de boletos y revisar el libro mayor contable.
- **¿Qué cuesta?:** Modificar precios de entradas es gratuito.
- **¿Qué puede pasar?:** Si mantienes masa salarial por encima de los ingresos, el club entrará en cesación de pagos.
- **¿Qué ocurrió?:** Notificación de resumen: *"Salarios de la semana 12 abonados: -$3,580. Saldo actual: $14,870"*.

## 15. Casos Extremos
- **Club en quiebra con taquilla masiva por clásico:** Los ingresos de un partido con estadio lleno pueden salvar al club del déficit justo antes de cumplirse las semanas límite.
- **Patrocinador rescinde por descenso de división:** Al descender, los sponsors reducen sus aportes fijos un 40% en el nuevo contrato anual.

## 16. Anti-Exploits
- **Inyección de balance en API:** No existe endpoint para editar el saldo; solo se despachan transacciones autoritativas desde el motor de simulación.
- **Precios de entrada absurdos ($1,000,000):** Restricción de base de datos `CHECK (ticket_price BETWEEN 5.0 AND 50.0)`.

## 17. Observabilidad y Métricas
- Saldo promedio de tesorería de todos los clubes de la categoría.
- Porcentaje de clubes en déficit operativo.
- Tasa de despidos de entrenadores provocados por quiebra financiera.

## 18. Matriz de Pruebas
1. Liquidación semanal estándar -> Salarios debitados, patrocinio acreditado, saldo actualizado y transacciones registradas.
2. 4 semanas consecutivas en déficit -> Estado financiero pasa a `CRITICAL` y emite alerta de dirigencia.
3. Ajuste de precio de boleto dentro de rango -> HTTP 200 y precio persistido en `club_finances`.
4. Intento de fijar precio de entrada negativo o superior al tope -> HTTP 400 `ERR_INVALID_TICKET_PRICE`.
5. Ejecución concurrente de liquidación -> Resuelta de forma idempotente sin pérdidas monetarias.

## 19. Criterios de Aceptación
- [x] Modelo de estado financiero, libro mayor inmutable y patrocinios formalizado.
- [x] Máquina de estados de devengo semanal y ciclo de déficit cerrada.
- [x] Backend como autoridad absoluta e inviolable de tesorería y saldos.
- [x] Secciones de interfaz de finanzas claras, legibles y adaptadas a móvil.
- [x] Simulación económica equitativa para clubes de IA.
- [x] Eventos y auditoría de todas las transacciones financieras registrados.
- [x] Idempotencia estricta en el devengo semanal de nómina y gastos.
- [x] Concurrencia con bloqueo pesimista en tesorería resuelta.
- [x] Balance de cuotas, sueldos y sponsors parametrizado en JSON.
- [x] Casos extremos de quiebra institucional y salvatajes cubiertos.
- [x] Anti-exploits de manipulación de saldo neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `EconomyEngineService`, `WeeklyPayrollProcessor`, `LedgerAccountingRepository`, `FinancialHealthMonitor`.
- **Comandos:** `ProcessWeeklyFinancesCommand`, `SetTicketPriceCommand`, `RecordFinancialTransactionCommand`.
- **Queries:** `GetClubFinancesOverviewQuery`, `GetFinancialStatementHistoryQuery`.
- **Políticas DB:** `ALTER TABLE club_finances ADD CONSTRAINT chk_ticket_price_range CHECK (ticket_price BETWEEN 5.00 AND 50.00)`.
