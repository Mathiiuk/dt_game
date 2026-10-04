# FASE 8 — ENTRENAMIENTO Y PREPARACIÓN FÍSICA
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Establecer el contrato funcional y formal de dominio para el sistema de entrenamiento semanal, acondicionamiento físico y desarrollo de atributos individuales en *Del Potrero al Ídolo*. De acuerdo con las **Reglas Maestras 1 y 2**, el backend es la autoridad absoluta de la evolución de atributos y desgaste físico: el cliente únicamente define el enfoque de la sesión, mientras que el servidor calcula los deltas mediante fórmulas matemáticas parametrizadas, considerando edad, potencial, instalaciones del club y riesgo de lesión.

## 2. Alcance específico
- Enfoque de entrenamiento colectivo semanal (Táctico, Físico, Técnico, Definición, Balón Parado, Regenerativo / Descanso).
- Intensidad de la carga de trabajo (`LOW`, `MEDIUM`, `HIGH`) y su correlación con fatiga y riesgo de lesión.
- Asignación de entrenamiento individualizado para juveniles y promesas (Especialización en atributo o nueva posición).
- Influencia de la infraestructura del club (`training_facilities_level`) y del preparador físico en los resultados.
- Procesamiento semanal autoritativo con retornos decrecientes según edad del jugador.

## 3. Entidades y Modelo de Datos de Dominio
1. **ClubTrainingRegime (`club_training_plans`)**:
   - `id` (UUID, PK).
   - `club_id` (UUID, FK -> `clubs.id`, Unique).
   - `general_focus` (Enum: `BALANCED`, `PHYSICAL_STAMINA`, `TACTICAL_DISCIPLINE`, `TECHNICAL_PASSING`, `ATTACKING_FINISHING`, `DEFENSIVE_STRUCTURE`, `RECOVERY_REST`).
   - `intensity_level` (Enum: `LOW`, `MEDIUM`, `HIGH`).
   - `updated_at` (Timestamp UTC).

2. **PlayerIndividualTraining (`player_training_assignments`)**:
   - `id` (UUID, PK).
   - `player_id` (UUID, FK -> `players.id`, Unique).
   - `focus_attribute` (String, ej: `finishing`, `stamina`, `vision`, `tackling`).
   - `retraining_position` (Enum, Nullable): Nueva posición táctica que está aprendiendo.
   - `familiarity_percentage` (Integer, 0-100, Default 0).

3. **TrainingWeeklyAudit (`training_execution_logs`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID).
   - `club_id` (UUID).
   - `week_number` (Integer).
   - `focus_applied` (String).
   - `intensity_applied` (String).
   - `average_stamina_cost` (Float).
   - `injuries_sustained` (Integer).
   - `attributes_improved_count` (Integer).
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados
```
[PLAN_ACTUAL_CONFIGURADO] ──(Command: UpdateTrainingPlan)──► [VALIDANDO_CONFIGURACION]
                                                                    │
                                                                    ▼
                                                          [NUEVO_PLAN_ACTIVO]
                                                                    │
[AVANCE_SEMANAL_TRIGGER] ──(Event: ProcessWeeklyTraining)──► [CALCULANDO_DESGASTE_Y_MEJORAS]
                                                                    │
                                                                    ├──► 1. Aplica coste de fatiga (Fitness)
                                                                    ├──► 2. Evalúa tirada de lesión en entrenamiento
                                                                    ├──► 3. Suma progreso de atributos a elegibles
                                                                    ▼
                                                          [RESULTADOS_PERSISTIDOS]
```

### Transición T-01: Configuración del Plan de Entrenamiento
- **Actor:** DT humano autenticado.
- **Precondiciones:** Club válido bajo control del DT.
- **Comando:** `SetClubTrainingPlanCommand(clubId, generalFocus, intensityLevel)`.
- **Consecuencias:** Actualiza `club_training_plans`. El nuevo plan entrará en vigencia en el siguiente avance semanal de calendario.
- **Idempotencia:** Enviar el mismo plan es una operación no destructiva e idempotente.

### Transición T-02: Ejecución Semanal de Entrenamiento
- **Actor:** Servidor durante la cascada semanal de tiempo (Fase 07).
- **Precondiciones:** Semana cronológica en avance.
- **Comando:** `ExecuteWeeklyTrainingCommand(clubId, weekNumber)`.
- **Consecuencias:**
  1. Reduce el `fitness` de cada futbolista según la intensidad configurada.
  2. Ejecuta tirada de probabilidad de lesión por sobrecarga.
  3. Acumula micro-puntos de atributo en jugadores con potencial disponible (`potential_rating > overall_rating`).
  4. Registra los cambios en `training_execution_logs`.
- **Idempotencia:** No se puede ejecutar dos veces para el mismo `(club_id, week_number)`.

## 5. Flujo Funcional Paso a Paso
1. **Selección del DT:** En la pantalla de Entrenamiento, el DT selecciona el enfoque de la semana (ej: "Preparación Táctica") con intensidad "Media". Asigna a un juvenil delantero a entrenar "Definición".
2. **Persistencia de la Orden:** El cliente envía el comando; el backend valida que los enums existan y guarda la configuración.
3. **Procesamiento en Avance Semanal:** Al correr el cronómetro del calendario (Fase 07):
   - El motor de entrenamiento itera cada futbolista disponible.
   - **Coste Físico:** Intensidad Media resta 10 puntos de `fitness`.
   - **Tirada de Lesión:** Probabilidad base = 0.5%. Modificada por intensidad (+1.5% en Alta), edad y nivel de preparador físico.
   - **Evolución:** Juveniles (< 22 años) con alto margen de potencial acumulan progreso. Si el acumulador cruza el umbral de 100 puntos de desarrollo, el atributo técnico se incrementa en +1.
4. **Retroalimentación:** En la siguiente carga del Dashboard o pantalla de entrenamiento, se visualiza el resumen: *"Plantel completó sesión táctica. 2 jugadores mejoraron sus estadísticas. 0 lesiones"*.

## 6. Reglas Específicas
- **Regla 8.1 — Rendimientos Decrecientes por Edad:** Jugadores mayores de 29 años no pueden aumentar atributos físicos en entrenamiento; el entrenamiento físico en veteranos solo ralentiza su declive natural.
- **Regla 8.2 — Techo Fijo por Potencial:** Ningún atributo puede aumentar si el jugador ha alcanzado su `potential_rating` oculto en esa categoría.
- **Regla 8.3 — Riesgo Ineludible de la Alta Intensidad:** La intensidad `HIGH` duplica la ganancia de atributos semanales pero triplica el riesgo de lesión muscular y resta 20 puntos de `fitness`, obligando a rotaciones en el partido del fin de semana.
- **Regla 8.4 — Enfoque Regenerativo:** El plan `RECOVERY_REST` no otorga mejoras de atributos, pero incrementa la recuperación física en +30 de `fitness` y reduce a 0.0% el riesgo de lesión semanal.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`training_balance.json`):
- **Impacto de Intensidad en Fitness:**
  - `LOW`: -5 fitness.
  - `MEDIUM`: -10 fitness.
  - `HIGH`: -20 fitness.
  - `RECOVERY_REST`: +15 fitness neto (adicional a la base del calendario).
- **Riesgo Base de Lesión en Entrenamiento:**
  - `LOW`: 0.1%.
  - `MEDIUM`: 0.6%.
  - `HIGH`: 2.2%.
- **Factor de Instalaciones:**
  - `formula_gain = base_gain * (1 + 0.08 * (training_facilities_level - 1))`.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Enfoques disponibles, nivel de intensidad, nivel de instalaciones de entrenamiento del club, reportes cualitativos de progreso ("Evolucionando rápido"), mejoras efectivas de atributos reflejadas en la ficha.
- **Parcial:** Barra de progreso porcentual del jugador hacia el próximo punto de atributo.
- **Oculta al Cliente:** Acumulador de desarrollo numérico exacto en coma flotante, porcentaje exacto de probabilidad de lesión por jugador.

## 9. Inteligencia Artificial / Clubes Rivales
Los clubes de IA aplican automáticamente enfoques de entrenamiento balanceados basados en la personalidad de su DT (ej: un DT ofensivo prioriza definición, un DT defensivo prioriza estructura táctica).

## 10. Eventos y Auditoría
- `TRAINING_PLAN_UPDATED`: Cambio de plan por el DT.
- `PLAYER_ATTRIBUTE_INCREASED`: Incremento oficial de un atributo de un jugador por entrenamiento.
- `TRAINING_INJURY_OCCURRED`: Lesión sufrida en práctica deportiva.

## 11. Idempotencia y Mitigación de Errores de Red
- La actualización del plan `POST /api/v1/training/plan` reemplaza el registro actual sin crear historiales infinitos.
- La ejecución semanal de entrenamiento valida contra `training_execution_logs(club_id, week_number)` para evitar dobles desgastes físicos en caso de reintentos del worker.

## 12. Concurrencia
- La transacción de actualización de plan utiliza bloqueo pesimista en `club_training_plans` para evitar estados contradictorios si el usuario interactúa desde varios clientes a la vez.

## 13. Persistencia y Ciclo de Vida
- Las asignaciones de entrenamiento individual persisten a lo largo de las semanas hasta que el DT las reasigne manualmente o el jugador sea transferido.

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de Entrenamiento del Club.
- **¿Qué puedo hacer?:** Elegir el enfoque táctico/físico de la semana y asignar tutores o focos individuales a jóvenes promesas.
- **¿Qué cuesta?:** Entrenar fuerte cuesta energía física (`fitness`) y aumenta el riesgo de lesiones.
- **¿Qué puede pasar?:** Si entrenas al máximo antes de un partido definitorio, tus titulares llegarán agotados al fin de semana.
- **¿Qué ocurrió?:** Notificación de reporte semanal de preparador físico con flechas verdes en los atributos potenciados.

## 15. Casos Extremos
- **Plantel con media de fitness crítica (< 50%):** Si el DT mantiene intensidad `HIGH`, el juego emite un aviso de advertencia del cuerpo médico: *"El plantel está al borde del colapso físico. Considera una semana regenerativa"*.
- **Jugador lesionado asignado a entrenamiento individual:** El entrenamiento individual se pausa automáticamente mientras el jugador permanezca en enfermería.

## 16. Anti-Exploits
- **Inyección directa de atributos:** No existe API para subir atributos directamente; todo incremento de atributo requiere el cálculo progresivo y acumulativo del worker del servidor.
- **Bypass de fatiga:** El cliente no puede enviar valores de `fitness = 100` para sus futbolistas; el servidor sobreescribe y persiste la condición física real.

## 17. Observabilidad y Métricas
- Distribución de enfoques de entrenamiento seleccionados por los usuarios.
- Tasa de lesiones en entrenamiento por cada 1,000 jugadores.
- Promedio de tiempo para que un juvenil suba 1 punto de OVR.

## 18. Matriz de Pruebas
1. Selección de nuevo plan de entrenamiento -> HTTP 200 y registro actualizado en base de datos.
2. Procesamiento semanal con intensidad ALTA -> `fitness` de jugadores decrementa exactamente 20 puntos.
3. Jugador juvenil con potencial alto -> Acumula desarrollo y sube atributo técnico al alcanzar 100%.
4. Jugador veterano de 32 años en entrenamiento físico -> No sufre incremento de ritmo/velocidad.
5. Doble ejecución accidental del entrenamiento en la misma semana -> Rechazado por idempotencia, 0 duplicación.

## 19. Criterios de Aceptación
- [x] Modelo de plan general y entrenamiento individual formalizado.
- [x] Máquina de estados y eventos de progreso semanal cerrados.
- [x] Backend como autoridad absoluta de cálculo de fatiga y atributos.
- [x] Información visible y oculta (acumuladores) delimitada.
- [x] Enfoques de IA parametrizados según filosofía del DT rival.
- [x] Logs de auditoría de entrenamiento por semana implementados.
- [x] Idempotencia estricta en el avance semanal de entrenamiento.
- [x] Concurrencia de configuración y bloqueos resuelta.
- [x] Balance de costes físicos y probabilidades versionado en JSON.
- [x] Casos de jugadores lesionados y fatiga extrema cubiertos.
- [x] Anti-exploits de inyección de estadísticas neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `TrainingEngineService`, `TrainingPlanRepository`, `PlayerDevelopmentCalculator`, `FitnessFatigueService`.
- **Comandos:** `UpdateTrainingPlanCommand`, `AssignIndividualTrainingCommand`, `ProcessWeeklyTrainingBatchCommand`.
- **Queries:** `GetClubTrainingPlanQuery`, `GetSquadDevelopmentReportQuery`.
- **Políticas DB:** `CREATE INDEX idx_training_club_week ON training_execution_logs(club_id, week_number)`.
