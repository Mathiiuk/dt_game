# FASE 40 — ENDGAME, EPÍLOGO DE CARRERA Y LEGADO DINÁSTICO
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Definir el contrato funcional de dominio para el Endgame, el epílogo de la trayectoria profesional del Director Técnico, la crónica periodística de despedida, la inmortalización definitiva de la foto de carrera en un snapshot inmutable y la arquitectura dinástica de sucesión en *Del Potrero al Ídolo*. De acuerdo con las **Reglas Maestras 4, 7, 8, 10, 11 y 14**, el retiro es una acción solemne e irreversible: el DT concluye su ciclo activo y es inducido al Salón de la Fama, permitiendo al usuario fundar una nueva dinastía con un sucesor novato sin resetear el mundo de juego ni alterar el linaje histórico de los clubes y trofeos conquistados.

## 2. Alcance específico
- Retiro Voluntario del Director Técnico (comando solemne con advertencia formal de irreversibilidad).
- Cálculo definitivo y autoritativo de Puntos de Legado (`legacy_score`) e inducción inmediata al Salón de la Fama (Fase 38).
- Snapshot Inmutable de Carrera (`career_snapshots`): Archivo definitivo con todos los números finales (partidos, victorias, efectividad, títulos ganados, clubes dirigidos, canteranos formados, fortuna personal).
- Crónica Periodística Histórica (The Golden Newspaper Edition): Generación narrativa periodística en 3 columnas estilo prensa gráfica de oro (*El Gráfico* / *Olé* vintage), con gran titular de portada, copete y crónica redactada en base a la gloria alcanzada.
- Arquitectura Dinástica de Sucesión: Capacidad del usuario de crear un nuevo entrenador heredero (ej: el hijo del DT, un ex-jugador canterano retirado o un nuevo talento de potrero) que asume en el mismo universo de la liga donde el DT fundador ya figura en el Museo y Salón de la Fama.

## 3. Entidades y Modelo de Datos de Dominio
1. **CareerDefinitiveSnapshot (`career_snapshots`)**:
   - `id` (UUID, PK): Identificador inmutable del snapshot de retiro.
   - `career_id` (UUID, FK -> `careers.id`).
   - `manager_id` (UUID, FK -> `managers.id`, Unique).
   - `manager_name` (String, 3 a 50 caracteres).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `club_name` (String).
   - `legacy_score` (Integer, Indexed DESC).
   - `legacy_rank` (Enum: `MYTH`, `IMMORTAL`, `LEGEND`, `CONSECRATED`, `HONORABLE`).
   - `total_matches` (Integer).
   - `total_won` (Integer).
   - `total_drawn` (Integer).
   - `total_lost` (Integer).
   - `win_rate` (Numeric 5,2).
   - `titles_count` (Integer).
   - `trophies` (JSONB): Matriz estructurada con todas las copas y años.
   - `career_headline` (String): Titular periodístico principal de portada.
   - `epilogue_text` (String): Crónica histórica completa en prosa futbolera.
   - `newspaper_edition` (String, ej: "Edición Especial Histórica Nº 1,420").
   - `hall_of_fame_id` (UUID, FK -> `hall_of_fame.id`).
   - `is_retired` (Boolean, Default true).
   - `retired_at` (Timestamp UTC).

2. **DynastySuccessionAudit (`dynasty_successions_log`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID).
   - `retired_manager_id` (UUID).
   - `successor_manager_id` (UUID).
   - `dynasty_generation` (Integer, Default 1): Generación de DTs en la dinastía (1, 2, 3...).
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados del Endgame
```
[DT_EN_ACTIVIDAD] ──(Command: RequestRetirement)──► [ADVERTENCIA_IRREVERSIBILIDAD_UX]
                                                              │
                                      ┌───────────────────────┴───────────────────────┐
                                      ▼                                               ▼
                         (DT cancela y sigue dirigiendo)                   (DT confirma retiro solemne)
                                                                                      │
                                                                                      ▼
                                                                       [CALCULANDO_SNAPSHOT_DEFINITIVO]
                                                                                      │
                                                                                      ├── 1. Marca managers.is_retired = true
                                                                                      ├── 2. Calcula legacy_score y genera crónica
                                                                                      ├── 3. Induce al Salón de la Fama
                                                                                      ├── 4. Libera el banquillo en clubs
                                                                                      ▼
                                                                       [ENDGAME_CONCLUIDO (Página de Prensa)]
                                                                                      │
                                                                                      ▼
                                                                       (Command: StartNewDynasty)
                                                                                      │
                                                                                      ▼
                                                                       [CREANDO_SUCESOR_DINASTICO]
                                                                       (El mundo histórico se preserva)
```

### Transición T-01: Ejecución del Retiro Definitivo
- **Actor:** DT humano en funciones.
- **Precondiciones:**
  1. `managers.is_retired == false`.
  2. Confirmación solemne del usuario.
- **Comando:** `ProcessRetirementCommand(managerId, clubId)`.
- **Consecuencias:**
  1. Calcula la puntuación definitiva de legado (`legacy_score`) mediante `hallOfFameApi.calculateLegacyScore`.
  2. Induce al DT al Salón de la Fama (`hallOfFameApi.inductManager`).
  3. Genera la crónica periodística con titular de gloria (`generateNewspaperChronicle`).
  4. Inserta el registro inmutable en `career_snapshots`.
  5. Actualiza `managers.is_retired = true` y `managers.status = 'RETIRED'`.
  6. Libera el puesto de entrenador en `clubs.manager_id = NULL`.
  7. Inserta auditoría en `security_audit_log` con tipo `ENDGAME_MANAGER_RETIRED`.
  8. Redirige a la pantalla ceremonial `/endgame`.
- **Idempotencia:** Si ya está retirado, devuelve el snapshot existente sin recalcular.

### Transición T-02: Fundación de Nueva Dinastía Sucesoria
- **Actor:** Usuario autenticado con DT retirado.
- **Precondiciones:** `career_snapshots` existente para el DT activo del usuario.
- **Comando:** `StartNewDynastyCommand(userId, oldManagerId)`.
- **Consecuencias:**
  1. Desvincula la ranura activa de DT del usuario sin eliminar al DT jubilado de la base de datos ni alterar trofeos ni tablas de temporadas pasadas.
  2. Inserta la sucesión en `dynasty_successions_log` incrementando `dynasty_generation = generation + 1`.
  3. Redirige al asistente de Creación de DT (Fase 02) para dar a luz al sucesor de la dinastía.
- **Idempotencia:** No borra datos históricos del mundo de juego.

## 5. Flujo Funcional Paso a Paso
1. **La Decisión de Decir Adiós:** Tras 18 temporadas de gloria, habiendo llevado al club desde el potrero regional hasta ser Campeón de América y del Mundo, el DT decide retirarse en la cima a los 62 años.
2. **Advertencia Solemne:** Al pulsar "Retirarse del Fútbol", la aplicación despliega un Bottom Sheet solemne:
   - *"¿Estás seguro de colgar el silbato? Esta acción sellará para siempre tu carrera deportiva e inmortalizará tu nombre en el Salón de la Fama. No podrás volver a dirigir con este perfil"*.
3. **El Cierre Histórico:** El DT confirma la decisión.
4. **La Portada del Diario del Día:**
   - La pantalla se transforma en la portada histórica de una revista deportiva de oro (*Edición Especial de Homenaje*):
   - Titular en grandes letras de molde: **"SE RETIRA UN PRÓCER: ADIÓS AL MAESTRO QUE CAMBIÓ LA HISTORIA"**.
   - Tres columnas periodísticas narran sus inicios en el barro, la gesta de los ascensos y la consagración internacional.
   - Vitrina con los 8 títulos conquistados, porcentaje de efectividad (68.4%) y 2,890 puntos de legado.
   - Medalla de Rango: **Leyenda Inmortal**.
5. **La Nueva Dinastía:** Al pie de la portada, dos caminos claros:
   - [Visitar el Salón de la Fama]: Para admirar su puesto en el podio entre las leyendas ecuménicas.
   - [Fundar Nueva Dinastía]: Para crear un nuevo joven entrenador y asumir el mando del club que su mentor dejó en la cima.

## 6. Reglas Específicas
- **Regla 40.1 — Inmutabilidad Absoluta del Snapshot:** La fila de `career_snapshots` es inmutable y de solo lectura; jamás puede editarse ni actualizarse.
- **Regla 40.2 — Preservación del Universo del Juego (Master Rule 4 y 10):** El retiro del entrenador NO resetea la liga, no borra los clubes, no elimina a los futbolistas ni reinicia los años calendario. El mundo sigue girando orgánicamente en el año alcanzado.
- **Regla 40.3 — Liberación Inmediata de Banquillos:** Al retirarse el DT, el club queda con `manager_id = NULL`. Un DT interino de IA asume la conducción hasta que el usuario u otro entrenador firme contrato.
- **Regla 40.4 — Estética de Prensa Clásica sin Emojis:** La pantalla de Endgame debe utilizar exclusivamente tipografías editoriales de prestigio, bordes de papel vintage, texturas doradas y componentes de iconos Lucide vectoriales (`Trophy`, `Newspaper`, `Crown`, `Award`), prohibiendo emojis en crudo.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`endgame_balance.json`):
- **Generador de Titulares según Rango de Legado:**
  - `MYTH`: "EL MITO VIVIENTE DICE ADIÓS: EL FÚTBOL MUNDIAL A SUS PIES".
  - `IMMORTAL`: "SE RETIRA UN PRÓCER: ADIÓS AL MAESTRO QUE CAMBIÓ LA HISTORIA".
  - `LEGEND`: "GRACIAS POR LA GLORIA: EL RETIRO DE UNA LEYENDA ETERNA".
  - `CONSECRATED`: "MISIÓN CUMPLIDA: EL ESTRATEGA DEJA EL BANQUILLO CON LA FRENTE EN ALTO".
  - `HONORABLE`: "HONOR Y CORAZÓN: EL GUERRERO DEL POTRERO CUELGA EL SILBATO".

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Crónica periodística completa, tarjeta de honor con puntuación definitiva, vitrina histórica de trofeos con año y división, récord final de partidos y acceso al Salón de la Fama.
- **Parcial:** Ninguna.
- **Oculta al Cliente:** Ninguna (el epílogo es la revelación total y transparente de toda la carrera).

## 9. Inteligencia Artificial / Sucesión del Club
El club que el DT deja vacante comienza a recibir postulaciones de técnicos de IA del mercado si el usuario no asume de inmediato con un heredero de dinastía.

## 10. Eventos y Auditoría
- `MANAGER_RETIREMENT_CONFIRMED`: Acción formal de retiro registrada.
- `CAREER_SNAPSHOT_SEALED`: Snapshot definitivo guardado inmutablemente.
- `DYNASTY_SUCCESSION_COMMENCED`: Nacimiento de la nueva generación de dinastía.

## 11. Idempotencia y Mitigación de Errores de Red
- El endpoint `POST /api/v1/endgame/retire` valida `managers.is_retired`. Si ya fue procesado, devuelve el snapshot consolidado con código HTTP 200 sin duplicar inducciones al Salón de la Fama.

## 12. Concurrencia
- La transacción ejecuta un bloqueo exclusivo en `managers` y `clubs` (`FOR UPDATE`), cerrando la carrera de forma atómica y segura.

## 13. Persistencia y Ciclo de Vida
- Los snapshots de carrera persisten indefinidamente en la base de datos y son consultables en todo momento desde el Salón de la Fama.

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de Epílogo y Despedida / Portada Histórica de Prensa Deportiva.
- **¿Qué puedo hacer?:** Leer tu crónica periodística personalizada, admirar tus estadísticas eternas y fundar la siguiente generación de tu dinastía.
- **¿Qué cuesta?:** Concluye tu etapa con ese entrenador.
- **¿Qué puede pasar?:** Tu legado inspirará a las futuras generaciones de entrenadores del juego.
- **¿Qué ocurrió?:** Portada de diario vintage de tres columnas con tipografías de prensa dorada y resumen editorial emotivo.

## 15. Casos Extremos
- **DT que se retira en plena mitad de torneo:** El club nombra un interino de IA que finaliza la temporada en curso sin interrumpir el calendario de la liga.
- **Usuario que crea 5 dinastías sucesivas:** El juego preserva a los 5 DTs anteriores en el Salón de la Fama con su respectivo árbol genealógico institucional.

## 16. Anti-Exploits
- **Reactivar un DT retirado:** Una vez marcado `is_retired = true`, no existe método de reactivación; el perfil queda congelado en solo lectura.

## 17. Observabilidad y Métricas
- Distribución de temporadas promedio jugadas por carrera antes del retiro.
- Porcentaje de usuarios que inician una segunda dinastía en el mismo universo.
- Tasa de inducciones al Salón de la Fama completadas con éxito.

## 18. Matriz de Pruebas
1. Retiro solemne confirmado -> Genera `career_snapshots`, marca DT como retirado, libera banquillo del club.
2. Inducción al Salón de la Fama -> Genera la fila en `hall_of_fame` vinculada al snapshot.
3. Generación de crónica periodística -> Genera titular y párrafos de acuerdo al rango alcanzado.
4. Intento de ejecutar retiro repetido -> Idempotente, 0 duplicados creados.
5. Fundación de nueva dinastía -> Redirige a creación de DT manteniendo el historial previo intacto.

## 19. Criterios de Aceptación
- [x] Modelo de snapshot definitivo de carrera y dinastía sucesoria formalizado.
- [x] Máquina de estados de retiro solemne e inducción cerrada.
- [x] Backend como autoridad absoluta de generación de crónica periodística.
- [x] Preservación intacta del universo del juego y clubes (Master Rules 4 y 10).
- [x] Cero emojis en crudo: uso exclusivo de iconos Lucide y tipografías vintage.
- [x] Eventos y auditoría de epílogo registrados inmutablemente (Master Rule 14).
- [x] Idempotencia estricta en el sellado del snapshot.
- [x] Concurrencia con bloqueo pesimista resuelta.
- [x] Titulares y balance de prensa versionados en JSON.
- [x] Casos de dinastías múltiples cubiertos.
- [x] Anti-exploits de resurrección de entrenadores neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `EndgameService`, `NewspaperChronicleGenerator`, `DynastySuccessionManager`, `CareerSnapshotRepository`.
- **Comandos:** `ProcessRetirementCommand`, `StartNewDynastyCommand`.
- **Queries:** `GetEndgameSnapshotQuery`, `GetDynastyHistoryQuery`.
- **Políticas DB:** `CREATE UNIQUE INDEX uq_career_snapshot_manager ON career_snapshots(manager_id)`.
