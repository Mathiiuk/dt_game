# FASE 18 — CANTERA, DIVISIONES INFERIORES Y CAPTACIÓN DE POTRERO
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Definir el contrato funcional de dominio para la cantera, la captación de talentos barriales, el evento anual de nueva camada de juveniles (**Youth Intake**) y la promoción de futbolistas al primer equipo. De acuerdo con las **Reglas Maestras 1, 3, 6 y 12**, la generación de juveniles es autoritativa y determinista en el servidor: la calidad y el potencial de los jóvenes dependen de la inversión institucional en infraestructura de inferiores (`youth_academy_level`) y del azar acotado, sin permitir manipulación de estadísticas desde el cliente.

## 2. Alcance específico
- Infraestructura de Cantera: Niveles 1 al 5 de la academia juvenil y coste de mantenimiento semanal.
- Evento anual de camada (Youth Intake): Generación autoritativa en la Semana 35 de cada temporada de entre 4 y 8 jóvenes promesas (15 a 17 años).
- Partido de prueba de los juveniles (Youth Trial Match) para evaluar su desempeño antes de ficharlos.
- Mecánica de Promoción al Primer Equipo: Firma de primer contrato profesional (salario juvenil base, duración 3 años).
- Descarte de juveniles no seleccionados (pasan a la bolsa de agentes libres regionales).
- Detección de la "Joya del Potrero": Probabilidad baja de generar un talento generacional (Potencial > 80 en división regional).

## 3. Entidades y Modelo de Datos de Dominio
1. **ClubYouthAcademy (`club_academies`)**:
   - `id` (UUID, PK).
   - `club_id` (UUID, FK -> `clubs.id`, Unique).
   - `academy_level` (Integer, 1-5, Default 1): Nivel de las instalaciones de cantera.
   - `scouting_network_tier` (Integer, 1-5, Default 1): Alcance territorial de captación.
   - `weekly_maintenance_cost` (Numeric 8,2): Mantenimiento deducido en economía.
   - `last_intake_year` (Integer, Nullable): Temporada de la última camada generada.
   - `updated_at` (Timestamp UTC).

2. **YouthCandidate (`youth_candidates`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID, FK -> `careers.id`).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `first_name` (String).
   - `last_name` (String).
   - `birth_date` (Date): Edad entre 15 y 17 años.
   - `position` (Enum: `GK`, `CB`, `LB`, `RB`, `CDM`, `CM`, `CAM`, `ST`, `RW`, `LW`).
   - `overall_rating` (Integer, 1-99): Media inicial (típicamente 35 a 48 en Tier 5).
   - `potential_rating` (Integer, 1-99): Techo oculto.
   - `potential_stars_perceived` (Numeric 2,1, 1.0 a 5.0): Estimación visual del cuerpo técnico.
   - `attributes` (JSONB): Estadísticas individuales.
   - `status` (Enum: `TRIAL`, `SIGNED_TO_FIRST_TEAM`, `RELEASED`).
   - `created_at` (Timestamp UTC).

3. **YouthIntakeAudit (`youth_intake_audit_log`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID).
   - `club_id` (UUID).
   - `season_year` (Integer).
   - `candidates_generated_count` (Integer).
   - `top_potential_rating` (Integer): Para métricas internas de balance.
   - `seed_used` (String).
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados de la Cantera
```
[CANTERA_EN_DESARROLLO] ──(Calendario alcanza Semana 35)──► [GENERANDO_YOUTH_INTAKE_EN_SERVIDOR]
                                                                        │
                                                                        ▼
                                                             [CAMADA_DE_PRUEBA_ACTIVA (Trial)]
                                                                        │
                                  ┌─────────────────────────────────────┴─────────────────────────────────────┐
                                  ▼                                                                           ▼
                    (Command: PromoteYouthPlayer)                                                (Command: ReleaseCandidate)
                                  │                                                                           │
                                  ▼                                                                           ▼
                     [JUGADOR_EN_PRIMER_PLANTEL]                                                      [LIBERADO_COMO_AGENTE_LIBRE]
                     (Contrato profesional firmado)
```

### Transición T-01: Generación de la Camada Anual
- **Actor:** Servidor durante la cascada semanal de la Semana 35.
- **Precondiciones:** `club_academies.last_intake_year != current_season_year`.
- **Comando:** `GenerateAnnualYouthIntakeCommand(clubId, careerId, seasonYear)`.
- **Consecuencias:**
  1. Genera entre 4 y 8 futbolistas en `youth_candidates` con estado `TRIAL`.
  2. Distribuye atributos basados en el `academy_level` del club.
  3. Fija `last_intake_year = current_season_year`.
  4. Inserta auditoría en `youth_intake_audit_log`.
  5. Emite notificación de alerta destacada: *"¡Ha llegado la nueva camada de juveniles del potrero!"*.
- **Idempotencia:** Si ya se generó para esa temporada, la operación es un no-op.

### Transición T-02: Promoción al Primer Equipo
- **Actor:** DT humano.
- **Precondiciones:**
  1. El candidato está en estado `TRIAL`.
  2. El club tiene menos de 30 futbolistas en el primer plantel.
  3. El club tiene margen en `wage_budget_weekly` para el salario juvenil base ($60/sem).
- **Comando:** `PromoteYouthPlayerCommand(clubId, candidateId, jerseyNumber)`.
- **Consecuencias:**
  1. Crea la fila en la tabla principal `players` con los datos del juvenil.
  2. Crea un contrato en `contracts` por 3 temporadas al salario mínimo de cantera.
  3. Marca al candidato como `SIGNED_TO_FIRST_TEAM`.
  4. Otorga +100 XP al DT por promocionar un canterano (Fase 05).
  5. Invalida la caché `squad:${clubId}`.
- **Errores:** `ERR_MAX_SQUAD_SIZE_REACHED`, `ERR_DUPLICATE_JERSEY_NUMBER`.

## 5. Flujo Funcional Paso a Paso
1. **Llegada de la Camada:** Al avanzar a la Semana 35, el DT recibe un informe especial del Coordinador de Inferiores.
2. **Revisión de Candidatos:** En la sección "Cantera", el DT examina a los 6 aspirantes:
   - Se muestra nombre, edad (16 años), posición (ej: Extremo Izquierdo), media inicial (44 OVR) y potencial proyectado (4.5 estrellas ★★★★☆).
3. **Partido de Prueba:** El DT puede organizar un partido informal entre el primer equipo y los juveniles para verlos en acción sobre la cancha 2D.
4. **Toma de Decisiones:**
   - El DT decide ascender a la joya de 4.5 estrellas y a un defensor central de 4 estrellas.
   - Descarta a los otros 4 aspirantes, que quedan libres.
5. **Firma y Dorsal:** El DT asigna los dorsales #27 y #28. Los dos jóvenes quedan formalmente incorporados a la plantilla profesional.

## 6. Reglas Específicas
- **Regla 18.1 — Ventaja Proporcional de Instalaciones:**
  - Nivel 1 (Potrero barrial): OVR medio de camada = 38-44. Probabilidad de Joya (> 75 Potencial) = 3%.
  - Nivel 3 (Predio deportivo municipal): OVR medio = 45-50. Probabilidad de Joya = 10%.
  - Nivel 5 (Centro de Alto Rendimiento moderno): OVR medio = 52-58. Probabilidad de Joya = 25%.
- **Regla 18.2 — Contrato Juvenil Protegido:** El primer contrato de un canterano promovido tiene una duración fija de 3 temporadas con salario mínimo reglamentario ($60/sem) y sin cláusula de rescisión, protegiendo al club formador contra compras predatorias inmediatas.
- **Regla 18.3 — Ocultamiento Estricto de Potencial:** El valor numérico exacto de `potential_rating` permanece oculto en el servidor; el cliente únicamente recibe el valor discreto de estrellas visuales (`potential_stars_perceived`).
- **Regla 18.4 — Ventana de Decisión de 4 Semanas:** Los aspirantes de la camada permanecen a prueba durante 4 semanas. Si no son promovidos antes de la Semana 39, son desvinculados automáticamente.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`youth_academy_balance.json`):
- `intake_calendar_week`: Semana 35.
- `intake_candidates_count_min`: 4.
- `intake_candidates_count_max`: 8.
- `base_youth_weekly_wage`: $60.00.
- `trial_duration_weeks`: 4 semanas.
- `upgrade_cost_academy_level_2`: $15,000.
- `upgrade_cost_academy_level_3`: $45,000.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Nombre, posición, pie hábil, media actual OVR, estrellas de potencial estimado (1 a 5 estrellas), reporte del coordinador de cantera.
- **Parcial:** Estrellas de potencial (tienen un margen de error de ±0.5 estrellas según la habilidad del jefe de juveniles).
- **Oculta al Cliente (Estrictamente privada):** `potential_rating` numérico exacto (ej: 79), consistencia oculta, predisposición a lesiones.

## 9. Inteligencia Artificial / Canteras de Rivales
Todos los clubes de IA de la liga reciben su camada de juveniles en la misma Semana 35 y promueven automáticamente a sus mejores 1 o 2 prospectos para renovar sus planteles.

## 10. Eventos y Auditoría
- `YOUTH_INTAKE_GENERATED`: Registro de la nueva camada con semilla aleatoria auditada.
- `YOUTH_PLAYER_PROMOTED`: Ascenso de canterano al primer equipo con dorsal asignado.
- `YOUTH_CANDIDATE_DISMISSED`: Descarte de aspirante no seleccionado.

## 11. Idempotencia y Mitigación de Errores de Red
- El comando `PromoteYouthPlayerCommand` comprueba que el candidato esté en estado `TRIAL`. Si el usuario hace doble clic en "Ascender", la segunda llamada detecta que ya fue firmado y no genera un segundo jugador idéntico.

## 12. Concurrencia
- La promoción de juveniles bloquea la tabla `players` y `club_academies` con `FOR UPDATE`, asegurando que no se sobrepase el límite máximo de 30 futbolistas del plantel.

## 13. Persistencia y Ciclo de Vida
- Los futbolistas surgidos de la cantera conservan de forma permanente el flag `is_homegrown = true` en su ficha para premios de cantera y cuotas de torneo internacional (Fase 34).

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de Divisiones Inferiores / Cantera del Club.
- **¿Qué puedo hacer?:** Analizar a los candidatos a prueba, comparar estrellas de potencial y decidir a quiénes promover.
- **¿Qué cuesta?:** Promover cuesta un salario juvenil base ($60/sem) y ocupa 1 dorsal.
- **¿Qué puede pasar?:** Si descubres una joya, podrás formarlo para que sea el futuro ídolo del club o venderlo por millones.
- **¿Qué ocurrió?:** Notificación de bienvenida: *"¡Agustín Peralta ha firmado su primer contrato profesional y lucirá la camiseta #28!"*.

## 15. Casos Extremos
- **Club con plantel al máximo de 30 jugadores:** El sistema advierte: *"Plantel completo. Debes vender o rescindir a un jugador antes de ascender a un canterano"*.
- **Generación de camada sin portero:** El generador procedural garantiza que cada camada contenga obligatoriamente al menos 1 arquero (`GK`).

## 16. Anti-Exploits
- **Reroll de camada:** Una vez generada la camada en la Semana 35, queda fijada en base de datos. Recargar el juego o reintentar no regenera los juveniles ni altera sus potenciales.
- **Inyección de potencial 99:** Los potenciales se calculan en el servidor en base a curvas de probabilidad de Dirichlet según el nivel de la academia.

## 17. Observabilidad y Métricas
- Porcentaje de canteranos que llegan a disputar minutos oficiales en primera división.
- Nivel medio de instalaciones de cantera adquirido por los jugadores.
- Frecuencia de aparición de talentos con potencial >= 75.

## 18. Matriz de Pruebas
1. Llegada a Semana 35 -> Se generan entre 4 y 8 candidatos en `youth_candidates`.
2. Promoción de candidato válido -> Creado en `players`, contrato por 3 años generado en `contracts`, XP otorgado al DT.
3. Intento de promover con 30 jugadores en el plantel -> HTTP 400 `ERR_MAX_SQUAD_SIZE_REACHED`.
4. Doble invocación de promoción -> Idempotente, 1 solo jugador creado.
5. Verificación de seguridad: El endpoint público de candidatos no expone el campo `potential_rating`.

## 19. Criterios de Aceptación
- [x] Modelo de academia, candidatos a prueba y auditoría formalizado.
- [x] Máquina de estados de camada anual y promoción cerrada.
- [x] Backend como autoridad absoluta de generación determinista de cantera.
- [x] Flag `is_homegrown` inmutable para identidad formativa.
- [x] Ocultamiento estricto de potencial numérico en JSON.
- [x] Eventos y auditoría de Youth Intake implementados.
- [x] Idempotencia estricta en el ascenso de juveniles.
- [x] Concurrencia y límite de 30 jugadores resuelta.
- [x] Balance de probabilidades de talento versionado en JSON.
- [x] Casos de saturación de plantilla cubiertos.
- [x] Anti-exploits de reroll de camada neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `YouthAcademyService`, `YouthIntakeGenerator`, `YouthPromotionManager`, `AcademyRepository`.
- **Comandos:** `GenerateYouthIntakeCommand`, `PromoteYouthPlayerCommand`, `DismissYouthCandidateCommand`.
- **Queries:** `GetClubAcademyStatusQuery`, `GetTrialCandidatesQuery`.
- **Políticas DB:** `CREATE INDEX idx_youth_candidates_club_status ON youth_candidates(club_id, status)`.
