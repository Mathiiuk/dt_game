# FASE 3 — CREACIÓN Y FUNDACIÓN DEL CLUB
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Definir el contrato funcional de dominio para la fundación del club de fútbol gestionado por el usuario, su identidad institucional, estética representativa, estadio inicial, economía inicial y su inserción autoritativa en la estructura de liga del mundo de juego.

## 2. Alcance específico
- Fundación institucional (Nombre del club, apodo, ciudad de origen, año de fundación).
- Identidad visual (Colores primario, secundario y alternativo, diseño de camiseta, selección de escudo vectorial).
- Asignación de estadio base (Nombre de la cancha, capacidad inicial, estado del césped).
- Configuración financiera inicial (Presupuesto salarial, caja operativa, deudas iniciales según categoría).
- Vinculación obligatoria del club con el DT creado y la división de inicio (Liga Regional / Primera D).

## 3. Entidades y Modelo de Datos de Dominio
1. **Club (`clubs`)**:
   - `id` (UUID, PK): Identificador inmutable del club.
   - `career_id` (UUID, FK -> `careers.id`): Carrera a la que pertenece.
   - `manager_id` (UUID, Nullable, FK -> `managers.id`): DT actualmente al mando.
   - `name` (String, 3 a 40 caracteres, Unique por carrera): Nombre oficial (ej: "Club Atlético Potrero").
   - `short_name` (String, 3 a 4 letras, ej: "CAP").
   - `nickname` (String, ej: "El Fortín del Barrio").
   - `city` (String): Ciudad o localidad.
   - `foundation_year` (Integer): Año de fundación del club (ej: 2026).
   - `primary_color` (String, Hex ej: "#0B2545").
   - `secondary_color` (String, Hex ej: "#FFFFFF").
   - `accent_color` (String, Hex ej: "#C59B27").
   - `badge_id` (String): Identificador del modelo de escudo seleccionado.
   - `stadium_name` (String, 3 a 40 caracteres): Nombre del estadio inicial.
   - `stadium_capacity` (Integer, Default 1500): Capacidad inicial autorizada.
   - `pitch_condition` (Integer, 1-100, Default 60): Estado del césped.
   - `reputation` (Integer, 1-100, Default 15): Prestigio del club en el fútbol nacional.
   - `division_tier` (Integer, Default 5): Nivel de categoría inicial (5 = Regional / Potrero).
   - `is_user_club` (Boolean, Default true): Distingue el club del jugador de clubes IA.
   - `created_at`, `updated_at` (Timestamp UTC).

2. **ClubFinances (`club_finances`)**:
   - `id` (UUID, PK).
   - `club_id` (UUID, FK -> `clubs.id`, Unique).
   - `balance` (Numeric 12,2): Caja actual en moneda del juego.
   - `wage_budget_weekly` (Numeric 10,2): Presupuesto semanal asignado a sueldos.
   - `transfer_budget` (Numeric 12,2): Presupuesto disponible para compras.
   - `ticket_price` (Numeric 6,2): Precio promedio de entrada general.

3. **ClubCreationAudit (`club_audit_log`)**:
   - `event_id` (UUID, PK).
   - `career_id` (UUID).
   - `club_id` (UUID).
   - `action` (String: `CLUB_FOUNDED`).
   - `initial_config` (JSONB): Respaldo completo de la configuración inicial.
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados
```
[DT_SIN_CLUB] ──(Command: FoundClub)──► [VALIDANDO_IDENTIDAD] ──► [CLUB_ACTIVO_EN_LIGA]
                                                │
                                                └── (Conflicto / Invalidez) ──► [ERROR_FUNDACION]
```

### Transición Principal: Fundación del Club
- **Actor:** Usuario autenticado con DT activo y sin club asignado.
- **Precondiciones:**
  1. El DT asociado en `managers` existe y tiene `club_id IS NULL`.
  2. El nombre del club no coincide con ningún otro club activo en la misma carrera (Case-Insensitive).
  3. Los códigos HEX de color son formatos válidos `#RRGGBB`.
  4. La capacidad del estadio y presupuestos se asignan exclusivamente desde los parámetros de balance del backend según la división inicial.
- **Comando:** `FoundClubCommand(name, shortName, nickname, city, colors, badgeId, stadiumName)`.
- **Consecuencias:**
  1. Inserción de la fila en `clubs`.
  2. Inicialización de `club_finances` con los valores de balance autoritativos del nivel 5.
  3. Actualización de `managers.club_id` con el nuevo `club_id`.
  4. Emisión del evento de dominio `CLUB_FOUNDED`.
- **Idempotencia:** Solicitudes repetidas con el mismo `client_mutation_id` devuelven el club existente sin crear duplicados ni alterar fondos.
- **Errores:** `ERR_CLUB_NAME_TAKEN`, `ERR_INVALID_COLOR_HEX`, `ERR_MANAGER_ALREADY_HAS_CLUB`.

## 5. Flujo Funcional Paso a Paso
1. **Configuración Visual e Institucional:** El jugador ingresa al Wizard de Club. Ingresa el nombre institucional, elige la paleta de colores y selecciona el blasón del club.
2. **Bautismo del Estadio:** Define el nombre de su estadio barrial / comunitario.
3. **Envío de Fundación:** El cliente envía el comando de creación sin parámetros económicos.
4. **Verificación y Asignación de Recursos en Backend:**
   - Valida unicidad de nombre en la carrera.
   - Carga el balance económico oficial para la división inicial: `balance = $25,000`, `wage_budget_weekly = $3,500`, `stadium_capacity = 1,500`.
   - Ignora y descarta cualquier cifra de dinero enviada por el cliente.
5. **Transacción Atómica:**
   - `INSERT INTO clubs ...`
   - `INSERT INTO club_finances ...`
   - `UPDATE managers SET club_id = :newClubId ...`
   - `INSERT INTO club_audit_log ...`
6. **Confirmación:** Devuelve la ficha completa del club fundado y redirige a la generación del primer plantel (Fase 04).

## 6. Reglas Específicas
- **Regla 3.1 — Presupuesto Autoritativo del Servidor:** El usuario NUNCA puede elegir su dinero inicial en el formulario. La caja inicial es fijada por la regla de balance de la categoría de partida.
- **Regla 3.2 — Colores Distinguibles:** El color primario y secundario no pueden ser idénticos (la distancia de color Delta-E debe ser superior a 20 para garantizar legibilidad de dorsales y camiseta en 2D).
- **Regla 3.3 — Capacidad Proporcional al Nivel:** El estadio inicial de un club de potrero tiene una capacidad fija de 1,500 espectadores y césped con calidad inicial de 60/100 (tierra y parches verdes).
- **Regla 3.4 — Aislamiento de Nombre por Carrera:** Dos clubes en distintas carreras pueden llamarse igual; en la misma carrera, el nombre es estrictamente único.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`tier_starting_config.json`):
- **Tier 5 (División de Origen / Potrero):**
  - `initial_cash_balance`: $25,000.
  - `initial_weekly_wage_cap`: $3,500.
  - `initial_transfer_budget`: $5,000.
  - `stadium_capacity`: 1,500 espectadores.
  - `ticket_price`: $10.00.
  - `initial_club_reputation`: 15 / 100.
  - `youth_academy_level`: 1.
  - `training_facilities_level`: 1.

## 8. Política de Información (Visible / Oculta)
- **Visible al Cliente:** Nombre institucional, escudo, colores, nombre y capacidad del estadio, balance económico, presupuesto salarial semanal, reputación del club.
- **Parcial:** Estimación de masa social e hinchas potenciales en la ciudad.
- **Oculta al Cliente:** Umbral de paciencia inicial de la dirigencia ficticia, coeficientes de patrocinadores ocultos del motor económico.

## 9. Inteligencia Artificial / Clubes Rivales
Los 19 clubes rivales que completan la liga son generados en el servidor utilizando un banco de datos regional de nombres y escudos predeterminados, asegurando que ninguno coincida con el nombre elegido por el usuario.

## 10. Eventos y Auditoría
- `CLUB_FOUNDED`: Fundación exitosa del club.
- `FINANCES_INITIALIZED`: Dotación inicial de capital registrada.
- `STADIUM_REGISTERED`: Registro del estadio y aforo ante la federación.

## 11. Idempotencia y Mitigación de Errores de Red
- El endpoint de creación soporta `Idempotency-Key`. Ante timeouts de red móvil, el reintento devuelve el club ya persistido y el estado 200 OK en lugar de 500 o fallo de clave duplicada.

## 12. Concurrencia
- La transacción ejecuta un bloqueo de rango o índice único `CREATE UNIQUE INDEX uq_club_name_per_career ON clubs(career_id, lower(name))`, impidiendo la creación concurrente de dos clubes homónimos.

## 13. Persistencia y Ciclo de Vida
- El club persiste de forma indefinida en la carrera. Si el DT es despedido o renuncia más adelante, el club continúa existiendo en el universo del juego bajo la dirección de un DT interino o IA.

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Paso 2 del inicio: Fundación del Club y Bautismo de la Institución.
- **¿Qué puedo hacer?:** Elegir nombre, colores con previsualización en tiempo real de la camiseta, escudo y bautizar el estadio.
- **¿Qué cuesta?:** Sin coste; es el paquete fundacional otorgado por la comunidad.
- **¿Qué puede pasar?:** Al confirmar, el club queda oficialmente federado.
- **¿Qué ocurrió?:** Credencial institucional del club con escudo y colores aplicados inmediatamente a la interfaz general (Tailwind theme tokens).

## 15. Casos Extremos
- **Nombre duplicado con club IA del fixture:** El backend añade un sufijo regional o avisa al jugador: *"Ese nombre ya pertenece a otra institución de la liga. Elige un nombre distintivo"*.
- **Campos en blanco:** Validación estricta con fallback a nombres de estadio por defecto ("Estadio Municipal de [Ciudad]").

## 16. Anti-Exploits
- **Inyección de balance:** Cualquier intento de enviar campos como `{ balance: 999999999 }` es ignorado completamente por el DTO del backend.
- **Sanitización XSS:** El nombre del club y estadio se limpian de etiquetas HTML o caracteres de inyección SQL.

## 17. Observabilidad y Métricas
- Distribución de colores más elegidos por los usuarios.
- Frecuencia de nombres comunes elegidos.
- Tiempo de completitud del paso de fundación.

## 18. Matriz de Pruebas
1. Fundación con datos válidos -> HTTP 201, club creado, finanzas inicializadas en $25,000.
2. Intento de nombrar club con nombre idéntico a otro club de la misma carrera -> HTTP 409 Conflict.
3. Intento de inyectar balance o aforo en el request -> Parámetros ignorados, se persisten los del servidor.
4. Intento de crear club sin DT previo -> HTTP 400 `ERR_NO_ACTIVE_MANAGER`.
5. Verificación de clave foránea `manager.club_id` actualizada correctamente.

## 19. Criterios de Aceptación
- [x] Estados institucionales definidos.
- [x] Transiciones y precondiciones de fundación cerradas.
- [x] Backend como autoridad absoluta de presupuestos e infraestructura.
- [x] Información visible y oculta delimitada.
- [x] Generación de rivales de liga desacoplada en backend.
- [x] Eventos de fundación y finanzas auditados.
- [x] Idempotencia con soporte de claves de mutación.
- [x] Concurrencia protegida con índice único por carrera.
- [x] Balance de categoría regional parametrizable en JSON.
- [x] Casos extremos y nombres duplicados contemplados.
- [x] Anti-exploits de presupuesto e inyección blindados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `ClubService`, `ClubRepository`, `FinancesService`, `LeagueSeederService`.
- **Comandos:** `FoundClubCommand`, `UpdateClubAppearanceCommand`.
- **Queries:** `GetClubProfileQuery`, `CheckClubNameAvailabilityQuery`.
- **Políticas DB:** `ALTER TABLE clubs ADD CONSTRAINT uq_career_club_name UNIQUE (career_id, lower(name))`.
