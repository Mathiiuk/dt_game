# FASE 27 — LESIONES, ENFERMERÍA Y GESTIÓN MÉDICA
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Establecer el contrato funcional y formal de dominio para el sistema de lesiones deportivas, enfermería médica, factores de riesgo por sobrecarga física y secuelas a largo plazo en *Del Potrero al Ídolo*. De acuerdo con las **Reglas Maestras 1, 2, 7 y 9**, las lesiones se generan y resuelven de forma estricta y autoritativa en el backend: el cliente no puede alterar los plazos de recuperación ni forzar altas médicas milagrosas sin pasar por los protocolos médicos y de calendario.

## 2. Alcance específico
- Tipología y Gravedad de Lesiones:
  - **Leves (1 a 2 semanas):** Sobrecarga muscular, contractura leve, contusión por golpe.
  - **Moderadas (3 a 6 semanas):** Desgarro muscular, esguince de tobillo, distensión de ligamento lateral.
  - **Graves (7 a 16 semanas):** Fractura de peroné, pubalgia crónica, desgarro fascial complejo.
  - **Catastróficas (17 a 36 semanas):** Rotura de ligamentos cruzados anteriores (LCA), rotura del tendón de Aquiles.
- Motor de Riesgo de Lesión: Multiplicador exponencial cuando un jugador disputa partidos con `fitness < 70%` o sobre terrenos de juego en mal estado (`pitch_quality < 50`).
- Tendencia Oculta a Lesionarse (`injury_proneness` de 1 a 20): Atributo genético oculto del futbolista que modula la probabilidad de sufrir recaídas.
- Infiltración Médica / Forzar Jugador: Opción de riesgo del DT para jugar una final con un futbolista tocado, arriesgando un 50% de probabilidad de lesión agravada con secuela permanente de atributos.
- Reducción de Plazos por Fisioterapeuta: Bonificación activa según la calidad del cuerpo médico del club (Fase 19).

## 3. Entidades y Modelo de Datos de Dominio
1. **PlayerInjuryRecord (`player_injuries`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID, FK -> `careers.id`).
   - `player_id` (UUID, FK -> `players.id`).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `injury_type` (String, ej: "Rotura de Ligamento Cruzado Anterior", "Desgarro de Isquiotibiales", "Sobrecarga en Gemelo").
   - `severity_tier` (Enum: `MINOR`, `MODERATE`, `SEVERE`, `CATASTROPHIC`).
   - `occurred_in_context` (Enum: `MATCH`, `TRAINING`, `INFILTRATION_RELAPSE`).
   - `weeks_total`: Duración inicial fijada por el cuerpo médico.
   - `weeks_remaining`: Semanas de baja pendientes.
   - `is_cleared` (Boolean, Default false): True al recibir el alta médica definitiva.
   - `permanent_attribute_loss` (JSONB, Nullable): Pérdida definitiva de atributos físicos si aplica (ej: `{ pace: -2, agility: -1 }`).
   - `created_at`, `cleared_at` (Timestamp UTC).

2. **MedicalInfiltrationLog (`medical_infiltrations`)**:
   - `id` (UUID, PK).
   - `player_id` (UUID, FK -> `players.id`).
   - `fixture_id` (UUID, FK -> `fixtures.id`).
   - `was_successful` (Boolean): True si terminó el partido sin recaer; False si se rompió.
   - `resulting_injury_id` (UUID, Nullable, FK -> `player_injuries.id`).
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados de la Salud del Jugador
```
[JUGADOR_SANO] ──(Tirada de riesgo en Partido o Práctica)──► [JUGADOR_LESIONADO (is_injured=true)]
                                                                       │
                                                                       ▼
                                                          [EN_TRATAMIENTO_ENFERMERIA]
                                                                       │
                                                (Avance semanal descontando semanas con bono de fisio)
                                                                       │
                               ┌───────────────────────────────────────┴───────────────────────────────────────┐
                               ▼                                                                               ▼
                   (weeks_remaining llega a 0)                                                    (DT decide Infiltrar en final)
                               │                                                                               │
                               ▼                                                                               ▼
                      [ALTA_MEDICA_OFICIAL]                                                           [TIRADA_DE_INFILTRACION]
                      (is_injured=false)                                                                       │
                                                                                 ┌─────────────────────────────┴─────────────────────────────┐
                                                                                 ▼                                                           ▼
                                                                        (50%: Juega y sobrevive)                            (50%: Lesión catastrófica)
```

### Transición T-01: Registro de Lesión
- **Actor:** Servidor durante la simulación de partido o sesión semanal de entrenamiento (Fases 08 y 10).
- **Precondiciones:** Jugador activo y no lesionado.
- **Comando:** `RegisterPlayerInjuryCommand(playerId, injuryType, severityTier, weeks, context)`.
- **Consecuencias:**
  1. Inserta la fila en `player_injuries`.
  2. Modifica `players.is_injured = true` y ajusta `fitness = 30`.
  3. Si el jugador figuraba en la alineación titular táctica (`tactic_lineup_slots`), queda inhabilitado.
  4. Emite alerta médica al Dashboard (Fase 06).

### Transición T-02: Recuperación Médica Semanal
- **Actor:** Servidor en la cascada de tiempo semanal (Fase 07).
- **Precondiciones:** `players.is_injured == true`.
- **Consecuencias:**
  1. Aplica el multiplicador de velocidad del fisioterapeuta contratado (Fase 19).
  2. Reduce `weeks_remaining`.
  3. Si `weeks_remaining <= 0`, marca `is_cleared = true`, `players.is_injured = false`, restaura `fitness = 70` (apto para entrenar progresivamente) y emite evento `PLAYER_MEDICAL_CLEARANCE`.

### Transición T-03: Infiltración Médica para un Partido
- **Actor:** DT humano en partido decisivo.
- **Precondiciones:** Jugador con lesión de grado `MINOR` o `MODERATE` y `weeks_remaining <= 2`.
- **Comando:** `InfiltratePlayerForMatchCommand(playerId, fixtureId)`.
- **Consecuencias:**
  1. Habilita temporalmente al jugador para disputar el encuentro con dolor.
  2. Al término del partido, el servidor evalúa la tirada de recaída (probabilidad base = 50%).
  3. Si fracasa: La lesión pasa a grado `SEVERE` (+10 semanas) con secuela de -2 en aceleración permanente.
  4. Inserta en `medical_infiltrations`.

## 5. Flujo Funcional Paso a Paso
1. **Accidente en la Cancha:** En el minuto 72 de un partido de liga, un mediocampista sufre una entrada violenta.
2. **Diagnóstico Inmediato:** El médico del club examina la zona: *"Esguince severo de ligamentos de rodilla. Tiempo estimado de recuperación: 5 semanas"*.
3. **Paso a Enfermería:** El futbolista es sustituido de inmediato y su estado pasa a `is_injured = true`.
4. **Tratamiento Semanal:**
   - Semana 1: Baja a 4 semanas.
   - Gracias al fisioterapeuta de calidad contratado (Fase 19), en la Semana 2 se descuenta 1.5 semanas.
   - En la Semana 4, el jugador recibe el alta médica oficial con 1 semana de anticipación al pronóstico original.
5. **Reincorporación Gradual:** El jugador reaparece en el banco de suplentes con un 75% de fitness físico para ir sumando minutos poco a poco.

## 6. Reglas Específicas
- **Regla 27.1 — Alineación Prohibida de Lesionados:** El motor de partido rechaza de plano cualquier alineación titular que contenga un futbolista con `is_injured = true` salvo que medie una orden formal y riesgosa de infiltración médica.
- **Regla 27.2 — Secuelas Físicas Permanentes:** Lesiones catastróficas (rotura de cruzados en veteranos mayores de 30 años) aplican una reducción permanente e irreversible de -2 a -4 puntos en los atributos físicos de `pace`, `stamina` y `agility`.
- **Regla 27.3 — Fatiga Acumulada como Detonante:** Un jugador con `fitness < 60%` tiene 5 veces más probabilidad de sufrir desgarros musculares en una práctica o partido que uno con condición óptima (90%+).
- **Regla 27.4 — Inmutabilidad del Historial Clínico:** El historial de lesiones de un futbolista es público para los ojeadores del club y no se borra al cambiar de institución.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`injuries_balance.json`):
- **Distribución de Probabilidades de Lesión en Partido:**
  - `MINOR`: 65% de los incidentes.
  - `MODERATE`: 25% de los incidentes.
  - `SEVERE`: 8% de los incidentes.
  - `CATASTROPHIC`: 2% de los incidentes.
- `fitness_fatigue_injury_multiplier`: 5.0× cuando fitness < 60%.
- `bad_pitch_injury_multiplier`: 1.8× cuando el césped < 50 puntos.
- `infiltration_relapse_chance`: 50%.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Diagnóstico médico de la lesión, semanas de recuperación restantes estimadas ("Aprox. 3 semanas"), historial de lesiones pasadas del jugador y aptitud física actual.
- **Parcial:** Rango de regreso a las canchas ("Entre 2 y 4 semanas").
- **Oculta al Cliente (Estrictamente privada):** Valor entero exacto de `injury_proneness` (propensión oculta de 1 a 20) del futbolista.

## 9. Inteligencia Artificial / Gestión de Bajas en Rivales
Los clubes de IA no alinean a jugadores lesionados y rotan a sus figuras si su fitness cae por debajo del 75% para evitar bajas por fatiga.

## 10. Eventos y Auditoría
- `PLAYER_INJURED`: Notificación formal de lesión y semanas de baja.
- `PLAYER_MEDICAL_CLEARANCE`: Notificación de alta médica y retorno al plantel.
- `INFILTRATION_DISASTER`: Lesión agravada por infiltración médica arriesgada.

## 11. Idempotencia y Mitigación de Errores de Red
- El descuento de semanas de baja se ejecuta con un flag de control por avance semanal; reintentos del worker de calendario no descuentan semanas duplicadas.

## 12. Concurrencia
- La transacción de alta médica actualiza atómicamente la fila en `players` y `player_injuries` con bloqueo `FOR UPDATE`.

## 13. Persistencia y Ciclo de Vida
- Todas las lesiones sufridas quedan registradas de por vida en `player_injuries` formando la ficha médica histórica del futbolista.

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de Enfermería / Ficha Médica del Club.
- **¿Qué puedo hacer?:** Revisar qué jugadores están de baja, cuándo vuelven y evaluar si vale la pena infiltrar a un tocado para un partido clave.
- **¿Qué cuesta?:** Infiltrar no cuesta dinero pero arriesga la carrera del jugador.
- **¿Qué puede pasar?:** Si fuerzas a tu estrella lesionada, podría romperse los ligamentos y perderse toda la temporada.
- **¿Qué ocurrió?:** Notificación médica: *"Parte Médico: Juan Gómez ha recibido el alta médica y ya puede entrenar con el grupo"*.

## 15. Casos Extremos
- **Plaga de lesiones que deja al equipo con 9 futbolistas sanos:** El sistema obliga a convocar juveniles de la cantera (Fase 18) de emergencia para completar el 11 titular reglamentario.
- **Jugador que se lesiona en su partido de despedida antes del retiro:** El jugador completa su retiro en enfermería sin alterar su snapshot de legado (Fase 40).

## 16. Anti-Exploits
- **Curaciones instantáneas enviando `is_injured: false` desde cliente:** El backend rechaza cualquier modificación de la bandera de lesión que no provenga del workflow de servidor.

## 17. Observabilidad y Métricas
- Frecuencia media de lesiones por partido en la liga (debe ser aprox. 0.08 lesiones por equipo por partido).
- Porcentaje de lesiones catastróficas sobre el total.
- Tasa de recaídas por infiltraciones arriesgadas.

## 18. Matriz de Pruebas
1. Sufrir lesión en partido -> Creada en `player_injuries`, `is_injured = true`, plazos asignados correctamente.
2. Avance semanal de tiempo -> Se resta 1 semana de baja médica.
3. Llegada a 0 semanas restantes -> `is_injured = false`, `is_cleared = true`, jugador habilitado.
4. Intento de alinear jugador lesionado sin infiltración -> HTTP 400 `ERR_PLAYER_INJURED_CANNOT_PLAY`.
5. Infiltración con recaída -> Lesión agravada a grado `SEVERE` y penalización física aplicada.

## 19. Criterios de Aceptación
- [x] Modelo de lesiones, enfermería y registros de infiltración formalizado.
- [x] Máquina de estados de baja médica y alta deportiva cerrada.
- [x] Backend como autoridad absoluta de plazos de recuperación y secuelas.
- [x] 4 grados de lesión con factores de riesgo por fatiga y césped cuantificados.
- [x] Rotación médica equilibrada en clubes de IA.
- [x] Eventos y auditoría de enfermería implementados por diseño.
- [x] Idempotencia estricta en el avance semanal de convalecencia.
- [x] Concurrencia protegida en ficha de jugador resuelta.
- [x] Probabilidades y duraciones médicas versionadas en JSON.
- [x] Casos de plagas de lesiones y convocatorias de emergencia cubiertos.
- [x] Anti-exploits de curación mágica client-side neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `MedicalDepartmentService`, `InjuryRiskCalculatorEngine`, `RecoveryTracker`, `InjuryRepository`.
- **Comandos:** `RegisterInjuryCommand`, `ProcessWeeklyRecoveryCommand`, `AuthorizeInfiltrationCommand`.
- **Queries:** `GetClubInfirmaryReportQuery`, `GetPlayerMedicalHistoryQuery`.
- **Políticas DB:** `CREATE INDEX idx_injuries_player_active ON player_injuries(player_id, is_cleared)`.
