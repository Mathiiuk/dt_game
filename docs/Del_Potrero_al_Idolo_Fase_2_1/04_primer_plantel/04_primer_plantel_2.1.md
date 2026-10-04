# FASE 4 — GENERACIÓN DEL PRIMER PLANTEL
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Definir el contrato funcional de dominio para la generación algorítmica, balanceada y autoritativa en el backend del primer plantel de futbolistas del club recién fundado. Garantizar que cada jugador generado tenga atributos coherentes con la división regional, contratos válidos y roles tácticos cubiertos, sin intervención ni manipulación de estadísticas por parte del cliente.

## 2. Alcance específico
- Generación procedural de entre 18 y 22 futbolistas en el servidor.
- Cobertura posicional obligatoria (mínimo 2 arqueros, 6 defensores, 6 mediocampistas, 4 delanteros).
- Generación de atributos técnicos, físicos y mentales acordes a la categoría inicial (Tier 5, OVR medio 45-55).
- Creación de identidad futbolística (Nombres y apellidos de cantera regional, edad, pierna hábil, dorsales asignados).
- Generación de contratos iniciales (Duración 1 a 3 años, salarios ajustados al presupuesto semanal del club).
- Estado físico (Fitness 100%) y moral inicial (Neutral / Positiva).

## 3. Entidades y Modelo de Datos de Dominio
1. **Player (`players`)**:
   - `id` (UUID, PK): Identificador inmutable del futbolista.
   - `career_id` (UUID, FK -> `careers.id`): Aislamiento por carrera.
   - `club_id` (UUID, FK -> `clubs.id`): Club actual al que pertenece.
   - `first_name` (String): Nombre de pila.
   - `last_name` (String): Apellido.
   - `birth_date` (Date): Fecha de nacimiento (edades entre 17 y 34 años).
   - `nationality` (String, ISO-2, ej: "AR").
   - `position` (Enum: `GK`, `CB`, `LB`, `RB`, `CDM`, `CM`, `CAM`, `LM`, `RM`, `ST`, `RW`, `LW`).
   - `secondary_positions` (Array de Enum): Posiciones secundarias adaptables.
   - `preferred_foot` (Enum: `LEFT`, `RIGHT`, `BOTH`).
   - `jersey_number` (Integer, 1-99, Unique por club).
   - `overall_rating` (Integer, 1-99): Media ponderada autoritativa.
   - `potential_rating` (Integer, 1-99): Techo de evolución (oculto).
   - `fitness` (Integer, 0-100, Default 100): Condición física.
   - `morale` (Integer, 0-100, Default 75): Estado anímico.
   - `is_injured` (Boolean, Default false): Bandera de lesión.
   - `attributes` (JSONB):
     - Técnicos: `finishing`, `passing`, `dribbling`, `tackling`, `heading`.
     - Físicos: `pace`, `stamina`, `strength`, `agility`.
     - Mentales: `vision`, `composure`, `work_rate`, `positioning`.
     - Portero (si aplica): `reflexes`, `handling`, `gk_positioning`, `diving`.
   - `created_at`, `updated_at` (Timestamp UTC).

2. **Contract (`contracts`)**:
   - `id` (UUID, PK).
   - `player_id` (UUID, FK -> `players.id`, Unique).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `wage_weekly` (Numeric 10,2): Salario semanal devengado.
   - `starts_at` (Date): Fecha de inicio del vínculo.
   - `expires_at` (Date): Fecha de expiración (fin de temporada).
   - `release_clause` (Numeric 12,2, Nullable): Cláusula de rescisión.
   - `status` (Enum: `ACTIVE`, `EXPIRING`, `TERMINATED`).

3. **SquadGenerationAudit (`squad_generation_logs`)**:
   - `event_id` (UUID, PK).
   - `club_id` (UUID).
   - `players_count` (Integer).
   - `total_wage_bill` (Numeric 10,2).
   - `average_ovr` (Float).
   - `seed_used` (String).
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados
```
[CLUB_SIN_PLANTEL] ──(Command: GenerateInitialSquad)──► [CALCULANDO_DISTRIBUCION_POSICIONAL]
                                                                  │
                                                                  ├──► [PERSISTIENDO_JUGADORES_Y_CONTRATOS]
                                                                  │                 │
                                                                  │                 ▼
                                                                  │      [PLANTEL_OFICIAL_ACTIVO]
                                                                  │
                                                                  └── (Fallo validación) ──► [ERROR_GENERACION]
```

### Transición Principal: Generación de Plantel Inicial
- **Actor:** Servidor / Sistema de backend en respuesta a la fundación del club.
- **Precondiciones:**
  1. El club existe y su conteo actual de futbolistas es exactamente 0.
  2. Las finanzas del club están inicializadas con su presupuesto salarial.
- **Comando:** `GenerateInitialSquadCommand(clubId, careerId, tier)`.
- **Consecuencias:**
  1. Generación de exactamente 20 futbolistas estructurados según cuotas de posición.
  2. Creación de 20 registros en `players`.
  3. Creación de 20 registros en `contracts` asociados al club.
  4. La suma de salarios iniciales (`SUM(wage_weekly)`) queda acotada entre el 70% y el 90% del `wage_budget_weekly` del club.
  5. Asignación de dorsales 1 al 20 sin duplicados.
- **Idempotencia:** Si ya existen jugadores asociados al club, el comando devuelve la lista actual sin regenerar.
- **Errores:** `ERR_SQUAD_ALREADY_EXISTS`, `ERR_CLUB_NOT_FOUND`.

## 5. Flujo Funcional Paso a Paso
1. **Disparo Automático:** Tras completar la fundación del club (Fase 03), el orquestador de backend ejecuta la generación del plantel.
2. **Distribución Posicional:** El algoritmo asigna la matriz de posiciones canónica:
   - 2 Porteros (GK).
   - 6 Defensores (2 CB titulares, 2 CB suplentes, 1 LB, 1 RB).
   - 7 Mediocampistas (2 CDM, 3 CM, 1 CAM, 1 RM/LM).
   - 5 Delanteros (2 ST, 1 RW, 1 LW, 1 ST suplente).
3. **Generación de Atributos:**
   - Para cada jugador, se muestrea una edad siguiendo una curva poblacional (18 a 32 años, con 2-3 juveniles promesas de 17-19 años y 1-2 veteranos referentes de 30-33 años).
   - Se calculan atributos con media Gaussiana en base al Tier 5 (Media OVR = 50 ± 4).
   - Se calcula el `overall_rating` exacto mediante la ponderación posicional oficial.
4. **Cálculo Salarial y Contratos:**
   - Salario individual basado en OVR, edad y rol: `wage = base_wage(tier) * (ovr / 50)^1.8`.
   - Duración de contratos asignada aleatoriamente entre 1 y 3 temporadas.
5. **Transacción Atómica de Base de Datos:**
   - Inserción masiva (`bulk insert`) de los 20 jugadores en `players`.
   - Inserción masiva de los 20 contratos en `contracts`.
   - Registro en `squad_generation_logs`.
6. **Entrega al Cliente:** Se envía la nómina completa al frontend para presentación en la pantalla de Plantel.

## 6. Reglas Específicas
- **Regla 4.1 — Backend Propietario de la Semilla:** El cliente jamás envía nombres, atributos ni medias. Toda la generación ocurre en backend mediante generador pseudoaleatorio criptográfico (CSPRNG).
- **Regla 4.2 — Techo Salarial Inicial:** La masa salarial total generada jamás puede superar el 90% del presupuesto salarial del club para permitir al DT margen de maniobra en el mercado de fichajes.
- **Regla 4.3 — Unicidad de Dorsales:** No pueden existir dos jugadores con el mismo `jersey_number` en el mismo club.
- **Regla 4.4 — Juventud y Potencial:** Al menos 2 futbolistas del plantel deben poseer edad <= 20 años y potencial oculto superior a 68 (+15 de margen de crecimiento).

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`squad_generation_balance.json`):
- `tier_5_mean_ovr`: 50.0.
- `tier_5_std_dev_ovr`: 3.8.
- `min_ovr_cap`: 42.
- `max_ovr_cap`: 62 (jugador estrella del equipo de potrero).
- `initial_squad_size`: 20 jugadores.
- `base_weekly_wage_tier_5`: $120.00.
- `wage_exponent`: 1.85.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Nombre, edad, nacionalidad, posición principal y secundarias, pie hábil, dorsal, atributos visibles (técnicos, físicos, de portero), media general (OVR), salario semanal y fecha de vencimiento de contrato.
- **Parcial:** Reporte preliminar de potencial percibido ("Tiene margen de mejora", "Ha alcanzado su techo").
- **Oculta al Cliente (Estrictamente privada):** Atributo numérico exacto de `potential_rating`, predisposición a lesiones (`injury_proneness`), consistencia mental oculta.

## 9. Inteligencia Artificial / Planteles de Rivales
Los 19 clubes rivales generan sus planteles iniciales con exactamente el mismo generador procedural de servidor, garantizando paridad competitiva estricta en el inicio de la liga.

## 10. Eventos y Auditoría
- `INITIAL_SQUAD_GENERATED`: Notifica que el plantel fue creado con éxito y detalla la media global del equipo.
- `CONTRACTS_ASSIGNED`: Registra la vinculación contractual y salarios iniciales.

## 11. Idempotencia y Mitigación de Errores de Red
- El endpoint `POST /api/v1/club/squad/initialize` verifica primero `SELECT COUNT(*) FROM players WHERE club_id = :id`. Si el resultado es > 0, devuelve inmediatamente la nómina existente con código HTTP 200 sin insertar nuevos jugadores.

## 12. Concurrencia
- La operación corre dentro de una transacción serializable o con bloqueo de fila en `clubs` (`SELECT id FROM clubs WHERE id = :id FOR UPDATE`), evitando carreras críticas si el usuario recarga el navegador durante la inicialización.

## 13. Persistencia y Ciclo de Vida
- Los futbolistas generados tienen ciclo de vida continuo: juegan partidos, se cansan, evolucionan semana a semana, envejecen, renuevan o son transferidos.
- Si un jugador se retira, su registro pasa a inactivo pero no se elimina físicamente para preservar los registros de goleadores y estadísticas de partidos históricos.

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Paso 3 del inicio: Presentación del Plantel Oficial de Primera División.
- **¿Qué puedo hacer?:** Conocer a los 20 futbolistas, identificar al capitán, al jugador estrella y a las promesas jóvenes.
- **¿Qué cuesta?:** Consumió el 75-85% del presupuesto de sueldos semanal del club.
- **¿Qué puede pasar?:** Si el DT no está conforme, podrá reforzarse en el mercado de pases (Fase 13).
- **¿Qué ocurrió?:** Vista de lista y fichas tácticas interactivas con dorsales asignados y estado físico óptimo.

## 15. Casos Extremos
- **Club sin presupuesto salarial suficiente:** Si las finanzas sufren una corrupción de datos, el algoritmo utiliza un fallback de salarios mínimos de subsistencia ($50 semanales) para no bloquear la generación.
- **Duplicidad de nombres en la misma plantilla:** El generador de nombres filtra los apellidos ya presentes en el equipo para evitar confusiones de homónimos.

## 16. Anti-Exploits
- **Inyección de estadísticas en cliente:** El cliente no envía un solo parámetro numérico en el payload.
- **Regeneración infinita (Reroll exploit):** Una vez generado el plantel, la semilla queda consolidada en base de datos. El usuario no puede reiniciar selectivamente jugadores individuales hasta obtener estadísticas más altas.

## 17. Observabilidad y Métricas
- Media OVR real obtenida en todos los planteles generados (verificar que converge en 50.0).
- Desviación estándar de masas salariales iniciales.
- Tiempo de ejecución de la transacción de inserción en base de datos (< 150ms).

## 18. Matriz de Pruebas
1. Generación de plantel -> Exactamente 20 jugadores creados en `players` y 20 en `contracts`.
2. Verificación de cuotas mínimas: Al menos 2 GK, 6 DEF, 6 MED, 4 DEL.
3. Verificación de salarios: `SUM(wage_weekly) <= club.wage_budget_weekly`.
4. Petición duplicada de inicialización -> Responde con el plantel existente, cero registros duplicados.
5. Inmutabilidad de información oculta: La respuesta HTTP al cliente no incluye el campo `potential_rating`.

## 19. Criterios de Aceptación
- [x] Entidades de jugador y contrato formalmente modeladas.
- [x] Máquina de estados de generación y persistencia cerrada.
- [x] Backend como autoridad absoluta de generación procedural.
- [x] Información visible y oculta (potencial) estrictamente separada.
- [x] Planteles de rivales generados bajo las mismas reglas de equidad.
- [x] Eventos y auditoría de plantilla registrados.
- [x] Idempotencia ante dobles invocaciones y recargas de red.
- [x] Transacción serializada con prevención de race conditions.
- [x] Parámetros de distribución estadística parametrizables.
- [x] Casos extremos y homónimos mitigados.
- [x] Anti-exploits de reroll e inyección de medias neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `SquadGeneratorService`, `PlayerRepository`, `ContractRepository`, `NameDatabaseProvider`.
- **Comandos:** `GenerateInitialSquadCommand`, `AssignJerseyNumbersCommand`.
- **Queries:** `GetClubSquadQuery`, `GetPlayerDetailsQuery`.
- **Políticas DB:** `CREATE UNIQUE INDEX uq_club_jersey_number ON players(club_id, jersey_number)`.
