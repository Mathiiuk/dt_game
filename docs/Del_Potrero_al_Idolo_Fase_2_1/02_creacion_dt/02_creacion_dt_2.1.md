# FASE 2 — CREACIÓN DEL DIRECTOR TÉCNICO
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Definir exhaustivamente el contrato funcional del asistente de creación del Director Técnico humano. Garantizar que la asignación de atributos iniciales, trasfondo profesional, filosofía táctica y especialización sea estrictamente validada y calculada en el backend, imposibilitando la inyección arbitraria de estadísticas o desbalances de puntos desde el cliente.

## 2. Alcance específico
- Asistente guiado (Wizard) de creación de identidad del DT (nombre, nacionalidad, fecha de nacimiento, apariencia).
- Selección de trasfondo profesional / experiencia previa (Ej: Exfutbolista internacional, Entrenador de potrero, Académico táctico, Preparador físico).
- Sistema de puntos de habilidad iniciales (Budget System) con validación estricta de suma cero.
- Especializaciones primarias y secundarias (Táctica, Motivación, Cantera, Negociación, Disciplina).
- Determinación de filosofía de juego base (Ofensiva, Posesión, Contraataque, Equilibrio, Presión Alta).
- Creación atómica del perfil y vinculación al usuario autenticado.

## 3. Entidades y Modelo de Datos de Dominio
1. **ManagerProfile (`managers`)**:
   - `id` (UUID, PK): Identificador inmutable del DT.
   - `user_id` (UUID, FK -> `users.id`): Usuario propietario.
   - `career_id` (UUID, FK -> `careers.id`): Carrera a la que pertenece.
   - `first_name` (String, 2 a 30 caracteres): Nombre de pila.
   - `last_name` (String, 2 a 30 caracteres): Apellido.
   - `nationality` (String, ISO 3166-1 alpha-2, ej: "AR", "ES", "BR").
   - `birth_date` (Date): Fecha de nacimiento (edad calculada entre 25 y 70 años).
   - `background` (Enum: `STREET_COACH`, `EX_PRO_PLAYER`, `TACTICAL_ANALYST`, `ACADEMY_MENTOR`).
   - `philosophy` (Enum: `TIKI_TAKA`, `GEGENPRESSING`, `CATENACCIO`, `DIRECT_ATTACK`, `BALANCED`).
   - `specialization` (Enum: `YOUTH_DEVELOPMENT`, `TACTICAL_GENIUS`, `MAN_MANAGEMENT`, `FINANCIAL_HAWK`, `FITNESS_GURU`).
   - `level` (Integer, Default 1): Nivel inicial inmutable en creación.
   - `experience_xp` (Integer, Default 0): Puntos de experiencia acumulados.
   - `status` (Enum: `UNEMPLOYED`, `EMPLOYED`, `RETIRED`): Estado laboral inicial.
   - `attributes` (JSONB):
     - `tactics` (Int, 1-20): Conocimiento táctico y adaptabilidad.
     - `motivation` (Int, 1-20): Capacidad de levantar la moral del plantel.
     - `youth_insight` (Int, 1-20): Ojo para descubrir y potenciar juveniles.
     - `discipline` (Int, 1-20): Control de vestuario y manejo de egos.
     - `negotiation` (Int, 1-20): Eficiencia en renovaciones y salarios.
   - `reputation` (Integer, 1-100): Puntuación de prestigio inicial según trasfondo.
   - `created_at`, `updated_at` (Timestamp UTC).

2. **CreationPresetConfig (`manager_creation_presets`)**:
   - `background_type` (Enum): Identificador del trasfondo.
   - `base_attributes` (JSONB): Mínimos y bonificaciones por defecto.
   - `free_points_pool` (Integer): Cantidad exacta de puntos libres a repartir (ej: 15).
   - `initial_reputation` (Integer): Reputación otorgada.
   - `starting_budget_modifier` (Float): Modificador económico si aplica.

3. **ManagerCreationAudit (`manager_audit_log`)**:
   - `event_id` (UUID, PK).
   - `career_id` (UUID).
   - `manager_id` (UUID).
   - `action` (String: `MANAGER_CREATED`).
   - `raw_input_payload` (JSONB): Payload recibido para auditoría anti-cheat.
   - `calculated_attributes` (JSONB): Atributos validados y persistidos.
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados
```
[SIN_DT] ──(Command: CreateManager)──► [VALIDANDO_PRESET] ──► [DT_CREADO_DESOCUPADO]
                                               │
                                               └── (Fallo validación) ──► [ERROR_CREACION]
```

### Transición Principal: Creación de DT
- **Actor:** Usuario autenticado con sesión válida y carrera sin DT asignado.
- **Precondiciones:**
  1. El usuario no posee un DT activo en la carrera actual (`COUNT(managers WHERE career_id = :id) == 0`).
  2. Nombre y apellido contienen únicamente caracteres alfabéticos, espacios y tildes (2-30 chars).
  3. La suma total de puntos distribuidos coincide EXACTAMENTE con:
     `total_atribs = base_attributes(background) + free_points_pool`.
  4. Ningún atributo individual supera el límite inicial permitido (ej: máximo 14 para DT nivel 1).
- **Comando:** `CreateManagerCommand(name, nationality, birthDate, background, philosophy, specialization, distributedPoints)`.
- **Consecuencias:**
  1. Inserción atómica en `managers`.
  2. Emisión de evento de dominio `MANAGER_CREATED`.
  3. La sesión de carrera queda actualizada con `active_manager_id`.
- **Idempotencia:** Si se reintenta con el mismo requestId o hash de creación, se retorna el DT ya creado sin generar duplicados.
- **Errores:** `ERR_MANAGER_ALREADY_EXISTS`, `ERR_INVALID_POINTS_SUM`, `ERR_ATTRIBUTE_OUT_OF_BOUNDS`, `ERR_PROFANITY_DETECTED`.

## 5. Flujo Funcional Paso a Paso
1. **Presentación de Opciones:** El cliente solicita los presets disponibles (`GET /api/v1/manager/creation-presets`). El servidor responde con los arquetipos, puntos base y descripciones.
2. **Personalización del Usuario:** El usuario introduce sus datos personales y distribuye los puntos libres en un slider interactivo que muestra las fortalezas de cada combinación.
3. **Envío del Formulario:** El cliente envía el comando de creación con los puntos asignados.
4. **Verificación Estricta en Servidor:**
   - Verifica existencia previa de DT en la carrera.
   - Consulta el preset del `background` seleccionado desde la base de datos de balance (no confía en lo enviado por el frontend).
   - Calcula: `expected_pool = preset.free_points_pool`.
   - Comprueba: `sum(points_sent - preset.base_points) == expected_pool`.
   - Valida que `min_allowed <= attribute <= max_initial_allowed` (por ej: mínimo 5, máximo 14).
5. **Persistencia Atómica:** Guarda en `managers`, genera el log de auditoría en `manager_audit_log` y vincula la carrera.
6. **Respuesta:** Retorna el perfil oficial generado con código HTTP 201 Created.

## 6. Reglas Específicas
- **Regla 2.1 — El Servidor Calcula los Atributos Finales:** El cliente únicamente puede enviar la delta de puntos a distribuir (`{ tactics: +3, motivation: +4, ... }`). El servidor aplica las bonificaciones del trasfondo y valida la integridad matemática.
- **Regla 2.2 — Cero Caracteres Prohibidos:** Se aplica un filtro de sanitización y detección de vocabulario inapropiado u ofensivo sobre `first_name` y `last_name`.
- **Regla 2.3 — Límites de Edad:** La edad calculada a partir de `birth_date` respecto al año base de la simulación (2026) debe estar en el rango `[25, 70]`.
- **Regla 2.4 — Un Solo DT Activo por Carrera:** Cada carrera tiene una relación 1:1 estricta con el DT principal. No es posible crear múltiples DTs simultáneos en el mismo contexto de mundo.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`manager_creation_rules.json`):
- `free_points_pool`: 15 puntos.
- `attribute_min_floor`: 4.
- `attribute_max_initial_cap`: 14 (los niveles superiores 15-20 se desbloquean progresando de nivel en la carrera).
- **Presets de Trasfondo:**
  - `STREET_COACH` (DT de Potrero): Base { tactics: 6, motivation: 9, youth_insight: 8, discipline: 6, negotiation: 5 }, Reputación inicial: 20.
  - `EX_PRO_PLAYER` (Exfutbolista): Base { tactics: 7, motivation: 8, youth_insight: 6, discipline: 8, negotiation: 7 }, Reputación inicial: 35.
  - `TACTICAL_ANALYST` (Analista Táctico): Base { tactics: 10, motivation: 5, youth_insight: 7, discipline: 5, negotiation: 6 }, Reputación inicial: 25.
  - `ACADEMY_MENTOR` (Formador de Cantera): Base { tactics: 6, motivation: 7, youth_insight: 10, discipline: 7, negotiation: 5 }, Reputación inicial: 25.

## 8. Política de Información (Visible / Oculta)
- **Visible al Cliente:** Todos los atributos primarios visibles del DT (`tactics`, `motivation`, etc.), nombre, edad, reputación numérica, nivel, especialización y filosofía.
- **Parcial:** Ninguna.
- **Oculta al Cliente:** ID de correlación interna de seeds de IA para generación de clubes rivales, modificadores de dificultad ocultos del motor.

## 9. Inteligencia Artificial / DTs Rivales
Los entrenadores controlados por IA en clubes contrarios se generan en el servidor usando una distribución gaussiana basada en la reputación de la división, sin utilizar este wizard de usuario humano.

## 10. Eventos y Auditoría
- `MANAGER_CREATION_INITIATED`: Usuario abre el wizard de creación.
- `MANAGER_CREATED`: Creación exitosa del DT con todos sus atributos finales.
- `MANAGER_CREATION_REJECTED`: Intento fallido por alteración de puntos o datos inválidos (registra discrepancia matemática).

## 11. Idempotencia y Mitigación de Errores de Red
- La creación utiliza un `client_mutation_id` único enviado en cabecera HTTP. Si la petición se repite por micro-desconexión, el servidor detecta el hash previo y responde con el DT ya insertado sin arrojar error de duplicado `managers_pkey`.

## 12. Concurrencia
- La transacción ejecuta un `INSERT INTO managers ...` protegido por una restricción de unicidad parcial: `UNIQUE (career_id, user_id) WHERE status != 'RETIRED'`. Cualquier intento de doble clic simultáneo genera un conflicto de índice capturado limpiamente.

## 13. Persistencia y Ciclo de Vida
- La entidad `ManagerProfile` persiste durante toda la carrera del usuario.
- En caso de retiro voluntario o despido y nueva dinastía (Fase 40), el estado muta a `RETIRED`, pero el registro histórico permanece inmutable en la base de datos para preservar la genealogía del club y el Salón de la Fama.

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Paso 1 del flujo de inicio: Creación de la Ficha Profesional del Entrenador.
- **¿Qué puedo hacer?:** Configurar nombre, biografía, trasfondo y balancear sliders de habilidades.
- **¿Qué cuesta?:** Consume los 15 puntos del pozo inicial. Los puntos no gastados no se acumulan.
- **¿Qué puede pasar?:** Si se gastan más o menos puntos de los requeridos, el botón de confirmación permanece bloqueado y avisa con claridad: *"Distribuye los 3 puntos restantes para continuar"*.
- **¿Qué ocurrió?:** Al confirmar, animación de bienvenida con credencial oficial de DT expedida por la Asociación y redirección fluida al Paso 2: Creación/Selección de Club.

## 15. Casos Extremos
- **Puntos negativos:** Intentar enviar valores de puntos inferiores al piso mínimo o valores negativos es rechazado en servidor con código HTTP 400.
- **Fechas futuras:** Enviar fecha de nacimiento posterior a la fecha actual o que implique edad menor a 25 años es rechazado con `ERR_INVALID_AGE`.
- **Emojis o caracteres invisibles en nombre:** Se remueven mediante sanitización estricta (`\p{L}+`).

## 16. Anti-Exploits
- **Inspección de elementos / Tampering:** Si un usuario altera el código JS en el navegador para enviar `{ tactics: 99, motivation: 99 }`, el backend recalcula la suma matemática contra el catálogo de configuración de la versión y deniega la transacción con registro de auditoría sospechosa.
- **Envío de nivel superior a 1:** El backend fuerza `level = 1` y `experience_xp = 0` ignorando cualquier parámetro de nivel enviado en el payload.

## 17. Observabilidad y Métricas
- Porcentaje de DTs creados por trasfondo (para balancear popularidad de arquetipos).
- Tiempo medio de permanencia en el wizard de creación.
- Tasa de rechazos por validación de suma de atributos (debe ser < 0.1% en clientes legítimos).

## 18. Matriz de Pruebas
1. Creación válida con 15 puntos distribuidos exactamente -> HTTP 201 y DT persistido.
2. Intento de creación con 16 puntos distribuidos -> HTTP 400 `ERR_INVALID_POINTS_SUM`.
3. Intento de creación con 14 puntos distribuidos -> HTTP 400 `ERR_INCOMPLETE_POINTS_POOL`.
4. Intento con atributo individual superior al cap inicial (ej: 15) -> HTTP 400 `ERR_ATTRIBUTE_OUT_OF_BOUNDS`.
5. Intento de crear un segundo DT en la misma carrera sin retiro previo -> HTTP 409 `ERR_MANAGER_ALREADY_EXISTS`.
6. Idempotencia ante doble POST simultáneo -> Solo 1 registro creado en base de datos.

## 19. Criterios de Aceptación
- [x] Estados definidos formalmente.
- [x] Transiciones documentadas con precondiciones y consecuencias.
- [x] Reglas de backend autoritativo para atributos y nivel inicial cerradas.
- [x] Información visible y oculta categorizada.
- [x] Generación de DTs IA aislada en workers de servidor.
- [x] Eventos y auditoría anti-cheat tipificados.
- [x] Idempotencia y claves de mutación especificadas.
- [x] Concurrencia y restricciones de unicidad resueltas.
- [x] Balance de puntos y arquetipos parametrizable.
- [x] Casos extremos y sanitización previstos.
- [x] Anti-exploits de manipulación de clientes implementados por diseño.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `ManagerService`, `ManagerRepository`, `CreationValidator`, `PresetCatalogService`.
- **Comandos:** `CreateManagerCommand`, `ValidateManagerDraftCommand`.
- **Queries:** `GetCreationPresetsQuery`, `GetManagerProfileQuery`.
- **Políticas DB:** `CREATE UNIQUE INDEX uq_active_manager_per_career ON managers(career_id) WHERE is_retired = false`.
