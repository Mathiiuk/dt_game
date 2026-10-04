# FASE 24 — PRENSA, CONFERENCIAS Y RELACIÓN CON MEDIOS
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Definir el contrato funcional de dominio para la interacción con los medios de comunicación deportiva, las conferencias de prensa post-partido y la cobertura periodística en *Del Potrero al Ídolo*. De acuerdo con las **Reglas Maestras 1, 2, 7 y 8**, el servidor genera autoritativamente las preguntas periodísticas en base a las incidencias reales del partido disputado (goles polémicos, penales cobrados, cambios acertados o derrotas bochornosas) y evalúa el impacto psicológico de las declaraciones del DT sobre el vestuario, la directiva y la afición.

## 2. Alcance específico
- Ecosistema de Medios: Radio Comunitaria / FM Barrial (Tier 5), Diario Deportivo Regional, Prensa Sensacionalista, Cadenas Televisivas Nacionales.
- Rueda de Prensa Post-Partido obligatoria u optativa: Entre 2 y 4 preguntas generadas contextual y proceduralmente según el resultado y los eventos del encuentro.
- 4 Tonos de Respuesta Canónicos del Entrenador:
  - **Combativo / Confrontativo:** Defiende al equipo atacando al arbitraje o al rival (sube la moral de futbolistas agresivos, pero enfurece a la dirigencia y arriesga multas federativas).
  - **Autocrítico / Exigente:** Asume la culpa de los errores y exige más a sus jugadores (baja la moral de futbolistas sensibles, pero gana el respeto de hinchas veteranos).
  - **Elogioso / Motivador:** Halaga públicamente a la figura del partido o al colectivo (sube la moral general, pero puede generar celos en jugadores suplentes).
  - **Cauteloso / Pragmático:** Respuestas de manual futbolero ("Hay que seguir trabajando paso a paso") con impacto neutro y sin riesgos.
- Opción de "Enviar al Segundo Entrenador": Delega la conferencia al ayudante de campo con impacto atenuado (Fase 19).

## 3. Entidades y Modelo de Datos de Dominio
1. **PressConferenceSession (`press_conferences`)**:
   - `id` (UUID, PK).
   - `fixture_id` (UUID, FK -> `fixtures.id`, Unique).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `manager_id` (UUID, FK -> `managers.id`).
   - `delegated_to_assistant` (Boolean, Default false).
   - `status` (Enum: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `SKIPPED`).
   - `created_at`, `completed_at` (Timestamp UTC).

2. **PressQuestionAnswer (`press_qa_items`)**:
   - `id` (UUID, PK).
   - `conference_id` (UUID, FK -> `press_conferences.id`).
   - `order_index` (Integer, 1-4).
   - `journalist_name` (String): Periodista que formula la pregunta.
   - `media_outlet` (String): Medio de prensa (ej: "FM El Aguante 91.5").
   - `topic_category` (Enum: `REFEREE_CONTROVERSY`, `STAR_PERFORMANCE`, `TACTICAL_CHOICE`, `BAD_RUN_CRISIS`, `NEXT_DERBY_HYPE`).
   - `question_text` (String).
   - `chosen_tone` (Enum, Nullable: `COMBATIVE`, `SELF_CRITICAL`, `PRAISING`, `PRAGMATIC`, `NO_COMMENT`).
   - `manager_answer_text` (String, Nullable).
   - `morale_impact_applied` (Integer, -10 a +10).

3. **PressAuditLedger (`press_audit_log`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID).
   - `manager_id` (UUID).
   - `conference_id` (UUID).
   - `reputation_delta` (Integer).
   - `board_reaction` (String).
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados de la Conferencia
```
[POST_PARTIDO_CONCLUIDO] ──(Command: OpenPressConference)──► [PREGUNTAS_GENERADAS_EN_SERVIDOR]
                                                                        │
                                  ┌─────────────────────────────────────┴─────────────────────────────────────┐
                                  ▼                                                                           ▼
                    (DT responde preguntas 1 a 4)                                            (Delegar a Segundo Entrenador)
                                  │                                                                           │
                                  ▼                                                                           ▼
                    [IMPACTO_APLICADO_EN_VESTUARIO]                                             [IMPACTO_ATENUADO]
                                  │                                                                           │
                                  └─────────────────────────────────────┬─────────────────────────────────────┘
                                                                        ▼
                                                         [CONFERENCIA_COMPLETADA]
                                                         (Estado persistido inmutable)
```

### Transición Principal: Respuesta a Pregunta de Prensa
- **Actor:** DT humano en conferencia de prensa activa.
- **Precondiciones:**
  1. `press_conferences.status == 'IN_PROGRESS'`.
  2. La pregunta corresponde al turno activo (`order_index`).
- **Comando:** `SubmitPressAnswerCommand(conferenceId, questionId, tone)`.
- **Consecuencias:**
  1. Registra el tono elegido y el texto de respuesta en `press_qa_items`.
  2. Aplica el delta de moral correspondiente a los futbolistas involucrados (ej: si se elogia al delantero goleador, su moral sube +8).
  3. Si la respuesta fue la última, marca `press_conferences.status = 'COMPLETED'`.
  4. Inserta auditoría en `press_audit_log`.
- **Idempotencia:** No se puede responder dos veces la misma pregunta; peticiones repetidas retornan el estado ya registrado.

## 5. Flujo Funcional Paso a Paso
1. **Convocatoria a Sala de Prensa:** Tras el pitazo final de una vibrante victoria 3-2 en el clásico barrial, el DT ingresa a la sala de conferencias.
2. **Generación Contextual:** El backend detecta que un juvenil debutante marcó el gol del triunfo en el minuto 89.
3. **Pregunta 1:** El cronista de "La Voz del Potrero" pregunta: *"Mister, ¿el ingreso del pibe Peralta fue una genialidad suya o una jugada desesperada?"*.
4. **Opciones Disponibles para el DT:**
   - **Tono Elogioso:** *"Agustín tiene una pasta de crack bárbara. Lo venimos trabajando en inferiores y se merecía esta gloria"*.
   - **Tono Combativo:** *"A los que decían que no ponía juveniles, ahí tienen la respuesta en la cancha"*.
   - **Tono Cauteloso:** *"Fue una variante táctica para aprovechar los espacios, nada más. Hay que llevarlo con calma"*.
5. **Elección y Repercusión:** El DT elige el Tono Elogioso.
   - El juvenil Peralta recibe +15 de moral y su lealtad al DT aumenta.
   - Los hinchas en redes aplauden las declaraciones del DT.
   - La conferencia concluye y se guarda el historial inmutable.

## 6. Reglas Específicas
- **Regla 24.1 — Prohibición de Respuestas Mágicas:** Ninguna opción de respuesta otorga recursos económicos ni puntos de torneo; solo incide en la moral de los futbolistas, el fervor de la hinchada y la paciencia de la directiva.
- **Regla 24.2 — Sanción por Ataques al Arbitraje:** Si el DT utiliza el tono `COMBATIVE` acusando de robo arbitral en 2 conferencias consecutivas, el tribunal de disciplina de la federación emite una multa económica al club ($500) y suspende al DT por 1 fecha de suspensión en el banco.
- **Regla 24.3 — Coherencia de Personalidad:** Jugadores con personalidad `PROFESSIONAL` valoran la autocrítica, mientras que jugadores con personalidad `TEMPERAMENTAL` se desmotivan fuertemente si el DT los expone públicamente ante los micrófonos.
- **Regla 24.4 — Una Sola Rueda de Prensa por Partido:** El `fixture_id` tiene relación 1:1 estricta con `press_conferences`. No se puede reabrir la rueda de prensa una vez concluida.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`press_conference_rules.json`):
- `questions_per_conference_regular`: 2 preguntas.
- `questions_per_conference_derby`: 4 preguntas.
- `praising_morale_boost`: +8 a titulares destacados.
- `self_critical_morale_penalty_sensitive`: -6 a jugadores con baja determinación.
- `assistant_delegation_impact_factor`: 0.35 (atenúa el 65% de las consecuencias).

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Preguntas de los cronistas, medios representados, 4 opciones de respuesta con indicación clara del tono emocional y titulares de los diarios al día siguiente.
- **Parcial:** Ninguna.
- **Oculta al Cliente:** Reacciones microscópicas de cada futbolista individual hasta que se reflejan en la lista de moral del plantel.

## 9. Inteligencia Artificial / Declaraciones de Rivales
Los entrenadores de IA ofrecen declaraciones simuladas que se publican en el diario del juego: si pierden contra el usuario, pueden felicitarlo o acusar juego brusco, alimentando la rivalidad entre técnicos.

## 10. Eventos y Auditoría
- `PRESS_CONFERENCE_OPENED`: Inicio de la rueda de prensa.
- `PRESS_STATEMENT_LOGGED`: Declaración registrada formalmente.
- `PRESS_CONFERENCE_FINISHED`: Conferencia archivada y consecuencias aplicadas.

## 11. Idempotencia y Mitigación de Errores de Red
- La tabla `press_qa_items` cuenta con índice único `(conference_id, order_index)`. Si el usuario envía la respuesta dos veces por micro-lag, la segunda petición devuelve el registro ya guardado sin duplicar efectos en la moral.

## 12. Concurrencia
- La conferencia se asocia a la sesión del DT con bloqueo transaccional para evitar respuestas contradictorias si el usuario tuviera dos pestañas abiertas.

## 13. Persistencia y Ciclo de Vida
- Las declaraciones más polémicas o históricas se conservan en la cronología de eventos del club (Fase 36) para alimentar la memoria periodística de la institución.

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Sala de Prensa / Micrófonos del Estadio.
- **¿Qué puedo hacer?:** Responder las preguntas de los cronistas o delegar la palabra en el ayudante de campo.
- **¿Qué cuesta?:** Sin coste monetario.
- **¿Qué puede pasar?:** Tus palabras pueden encender el vestuario para la próxima fecha o calmar los ánimos tras una dura derrota.
- **¿Qué ocurrió?:** Titular periodístico destacado en pantalla con tipografía de diario: *"El DT bancó a los pibes tras la victoria en el clásico"*.

## 15. Casos Extremos
- **DT que no asiste a la conferencia (Plantón a la prensa):** La prensa publica notas muy críticas atacando la soberbia del entrenador, reduciendo la reputación del DT en -2 puntos.
- **Partido suspendido o sin incidencias:** La rueda de prensa aborda la suspensión climática y la reprogramación del calendario.

## 16. Anti-Exploits
- **Replay de conferencias:** Una vez concluida la conferencia, el endpoint de envío de respuestas queda cerrado (`status = 'COMPLETED'`).

## 17. Observabilidad y Métricas
- Tono de respuesta más utilizado por los jugadores (Combativo vs Autocrítico vs Elogioso).
- Frecuencia de delegación al segundo entrenador.
- Impacto neto en la moral promedio del vestuario a lo largo de la temporada.

## 18. Matriz de Pruebas
1. Conferencia tras victoria -> Genera 2 preguntas coherentes con el resultado.
2. Respuesta con tono elogioso -> Incrementa moral del futbolista citado en +8 puntos.
3. Delegar en segundo entrenador -> Conferencia completada con consecuencias atenuadas al 35%.
4. Intento de responder una conferencia ya finalizada -> HTTP 400 `ERR_CONFERENCE_ALREADY_COMPLETED`.
5. Verificación de unicidad de preguntas: Múltiples clics no duplican registros en `press_qa_items`.

## 19. Criterios de Aceptación
- [x] Modelo de conferencia, preguntas de medios y auditoría formalizado.
- [x] Máquina de estados con 4 tonos y opción de delegación cerrada.
- [x] Backend como autoridad absoluta de generación contextual de preguntas.
- [x] Impacto psicológico en el vestuario cuantificado según personalidad.
- [x] Declaraciones de DTs rivales para alimentar rivalidades deportivas.
- [x] Eventos y auditoría de prensa implementados por diseño.
- [x] Idempotencia estricta en el despacho de respuestas.
- [x] Concurrencia protegida con índice único por turno de pregunta.
- [x] Balance de impactos en moral y sanciones versionado en JSON.
- [x] Casos de plantón a la prensa y clásicos calientes cubiertos.
- [x] Anti-exploits de manipulación de declaraciones neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `PressConferenceService`, `JournalistQuestionGenerator`, `MediaReactionCalculator`, `PressRepository`.
- **Comandos:** `OpenPressConferenceCommand`, `SubmitPressAnswerCommand`, `DelegateConferenceCommand`.
- **Queries:** `GetActiveConferenceQuery`, `GetConferenceArchiveQuery`.
- **Políticas DB:** `ALTER TABLE press_conferences ADD CONSTRAINT uq_fixture_press UNIQUE (fixture_id)`.
