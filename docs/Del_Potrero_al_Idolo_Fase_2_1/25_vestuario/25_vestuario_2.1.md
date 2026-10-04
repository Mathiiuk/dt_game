# FASE 25 — VESTUARIO, COHESIÓN Y JERARQUÍA DE LIDERAZGO
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Definir el contrato funcional de dominio para la química interna del vestuario, la jerarquía de liderazgos, los grupos sociales (clanes) y el índice general de cohesión de equipo (**Team Cohesion**) en *Del Potrero al Ídolo*. De acuerdo con las **Reglas Maestras 1, 2, 4 y 13**, el servidor es la autoridad absoluta de la dinámica social del plantel: la cohesión impacta directamente en la fluidez del juego colectivo, la efectividad defensiva en momentos de crisis y la retención del talento frente a cantos de sirena de otros clubes.

## 2. Alcance específico
- Jerarquía Social de Vestuario en 4 Estratos:
  - **Líderes de Equipo / Capitanes:** Máxima influencia en el vestuario (ej: Capitán y Subcapitán). Su apoyo al DT arrastra a todo el grupo; su enemistad fractura el equipo.
  - **Jugadores Muy Influyentes:** Veteranos con años en la institución o figuras de alto OVR.
  - **Jugadores Influyentes:** Titulares habituales integrados a la dinámica del club.
  - **Otros / Recién Llegados / Juveniles:** Baja influencia individual, adoptan la moral colectiva predominante.
- Índice de Cohesión Colectiva (`team_cohesion_score` de 0 a 100): Determina el entendimiento táctico en cancha (+pases acertados, menor desconcentración en balones parados).
- Gestión de Conflictos Internos: Reclamos por falta de minutos de juego, celos salariales cuando un recién llegado cobra el triple que el goleador histórico, o disputas por el brazalete de capitán.
- Reuniones de Equipo (Team Meetings): Herramienta del DT para levantar el ánimo ante una final o descomprimir la tensión tras 3 derrotas seguidas.

## 3. Entidades y Modelo de Datos de Dominio
1. **ClubLockerRoomState (`club_locker_room`)**:
   - `id` (UUID, PK).
   - `club_id` (UUID, FK -> `clubs.id`, Unique).
   - `team_cohesion_score` (Integer, 0-100, Default 60): Nivel de unión colectiva.
   - `captain_player_id` (UUID, FK -> `players.id`, Nullable).
   - `vice_captain_player_id` (UUID, FK -> `players.id`, Nullable).
   - `manager_support_level` (Enum: `COMMITTED`, `FAVORABLE`, `DIVIDED`, `SKEPTICAL`, `MUTINOUS`).
   - `last_team_meeting_week` (Integer, Default 0).
   - `updated_at` (Timestamp UTC).

2. **PlayerSocialProfile (`player_social_status`)**:
   - `id` (UUID, PK).
   - `player_id` (UUID, FK -> `players.id`, Unique).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `hierarchy_tier` (Enum: `TEAM_LEADER`, `HIGHLY_INFLUENTIAL`, `INFLUENTIAL`, `FRINGE_PLAYER`).
   - `social_group` (Enum: `HOMEGROWN_CORE`, `EXPERIENCED_VETS`, `FOREIGN_NEWCOMERS`, `NEUTRAL`).
   - `satisfaction_with_manager` (Integer, 0-100, Default 70).
   - `satisfaction_playing_time` (Integer, 0-100, Default 75).
   - `satisfaction_wage` (Integer, 0-100, Default 70).
   - `is_demanding_talk` (Boolean, Default false): Bandera de conflicto que exige reunión privada con el DT.

3. **LockerRoomEventAudit (`locker_room_events_log`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID).
   - `club_id` (UUID).
   - `event_type` (Enum: `CAPTAIN_APPOINTED`, `TEAM_MEETING_HELD`, `PLAYER_REVOLT_DEFUSED`, `PROMISE_BROKEN`, `CLIQUE_CONFLICT`).
   - `cohesion_delta` (Integer).
   - `details` (String).
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados del Vestuario
```
[COHESION_ESTABLE (50-70)]
       │
       ├── (Victorias consecutivas / Victorias en clásicos / Buena rotación) ──► [VESTUARIO_BLINDADO (Score > 80)]
       │                                                                                │
       │                                                                                ├── +10% entendimiento táctico
       │                                                                                └── Respaldan al DT ante la directiva
       │
       └── (Mala racha + Capitán disconforme + Promesas rotas) ─────────────────► [MOTIN_EN_EL_VESTUARIO (Score < 35)]
                                                                                        │
                                                                                        ├── Huelga de brazos caídos en cancha
                                                                                        └── La dirigencia exige reunión de crisis
```

### Transición Principal: Reunión de Equipo (Team Meeting)
- **Actor:** DT humano en representación del club.
- **Precondiciones:**
  1. No se ha realizado otra reunión de equipo en las últimas 4 semanas de calendario (`current_week - last_team_meeting_week >= 4`).
- **Comando:** `HoldTeamMeetingCommand(clubId, meetingTone: 'PRAISE'|'CALM'|'DEMAND_EXCELLENCE')`.
- **Consecuencias:**
  1. Si el tono encaja con el contexto del equipo, la moral del plantel sube +8 a +12 puntos y la cohesión aumenta +5 puntos.
  2. Si el tono es desacertado (ej: exigir excelencia tras una derrota injusta donde el equipo dejó todo), los jugadores reaccionan con frustración (-6 de moral).
  3. Fija `last_team_meeting_week = current_week`.
  4. Inserta auditoría en `locker_room_events_log`.
- **Idempotencia:** Bloqueado por ventana de enfriamiento de 4 semanas.
- **Errores:** `ERR_TEAM_MEETING_COOLDOWN_ACTIVE`.

## 5. Flujo Funcional Paso a Paso
1. **Conflicto Individual:** Un delantero suplente con ambición alta lleva 5 partidos sin ingresar y su satisfacción de minutos cae a 25 puntos.
2. **Reclamo en la Oficina:** El jugador solicita hablar con el DT: *"Mister, me prometió que sería una alternativa importante y no estoy jugando ni los descuentos. Si esto sigue así, pediré que me vendan"*.
3. **Respuesta del Entrenador:**
   - **Opción A:** Prometer minutos como titular en el próximo partido de copa.
   - **Opción B:** Explicar con honestidad que la competencia interna es dura y debe ganarse el puesto en los entrenamientos.
   - **Opción C:** Reprenderlo por indisciplina y apartarlo del grupo.
4. **Consecuencia:**
   - El DT elige la Opción A. Se crea una promesa formal en el backend: *"Jugar al menos 45 minutos en el próximo partido"*.
   - El jugador se calma provisionalmente.
5. **Cumplimiento o Incumplimiento:** Si en el siguiente partido el DT cumple la promesa, la lealtad del jugador se consolida. Si rompe la promesa, el jugador estalla y busca el apoyo de los líderes de su clan, contagiando el descontento al resto del plantel.

## 6. Reglas Específicas
- **Regla 25.1 — El Peso de la Capitanía:** Retirarle el brazalete de capitán a un futbolista de jerarquía `TEAM_LEADER` para dárselo a otro jugador provoca un terremoto en el vestuario: el capitán anterior sufre -30 de moral y todos los jugadores de su clan reducen su moral en -15 puntos de inmediato.
- **Regla 25.2 — Cohesión y Rendimiento Táctico:**
  - Cohesión >= 85 (Familia unida): Aumenta un +8% la tasa de acierto de pases y reduce a la mitad la probabilidad de cometer errores defensivos en los últimos 15 minutos de partido.
  - Cohesión < 40 (Vestuario quebrado): Aumenta las discusiones en cancha, incrementa faltas innecesarias y multiplica las tarjetas amarillas por protestas al árbitro.
- **Regla 25.3 — Desfase Salarial Tóxico:** Si un recién fichado cobra más del doble del salario más alto existente y el club entra en racha negativa, los líderes del vestuario reducen su satisfacción salarial exigiendo equiparación inmediata.
- **Regla 25.4 — Un Solo Capitán Oficial:** El club debe tener exactamente 1 Capitán y 1 Subcapitán designados en todo momento.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`locker_room_rules.json`):
- `team_meeting_cooldown_weeks`: 4 semanas.
- `captain_change_morale_shock`: -30 al capitán cesado, -15 a su clan.
- `cohesion_gain_per_win`: +2 puntos.
- `cohesion_loss_per_heavy_defeat`: -4 puntos.
- `broken_promise_penalty`: -25 de moral y desconfianza permanente.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Nivel general de cohesión grupal (barra 0-100), pirámide de jerarquía de vestuario (Líderes, Influyentes, Jóvenes), grupos sociales/clanes, satisfacción de cada jugador en minutos, salario y relación con el DT.
- **Parcial:** Clima emocional del grupo ("El vestuario está enfocado", "Hay fricciones entre veteranos y recién llegados").
- **Oculta al Cliente:** Conversaciones privadas entre jugadores de IA a espaldas del entrenador.

## 9. Inteligencia Artificial / Vestuarios de Rivales
Los clubes de IA también experimentan crisis de vestuario si acumulan derrotas, lo cual debilita su cohesión y los hace más vulnerables en sus partidos de liga.

## 10. Eventos y Auditoría
- `TEAM_COHESION_UPDATED`: Ajuste periódico del índice colectivo.
- `LOCKER_ROOM_PROMISE_MADE`: Promesa formal registrada con fecha límite.
- `LOCKER_ROOM_PROMISE_RESOLVED`: Cumplimiento o incumplimiento verificado por el servidor.

## 11. Idempotencia y Mitigación de Errores de Red
- La designación de capitanes y la realización de charlas de equipo están protegidas por claves de mutación y validación de fecha; dobles clics no disparan efectos acumulativos.

## 12. Concurrencia
- La actualización de la moral colectiva se realiza mediante una transacción única que itera a los futbolistas en `player_social_status` con bloqueo pesimista en `club_locker_room`.

## 13. Persistencia y Ciclo de Vida
- La jerarquía social evoluciona con el tiempo: los jóvenes que acumulan temporadas y partidos van escalando de estrato hasta convertirse en los futuros referentes del club.

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de Vestuario y Dinámica de Grupo.
- **¿Qué puedo hacer?:** Designar al capitán del equipo, organizar reuniones de plantel y atender reclamos privados de jugadores suplentes.
- **¿Qué cuesta?:** Sin coste monetario.
- **¿Qué puede pasar?:** Si manejas bien los egos de los líderes, el equipo responderá con el corazón en los momentos más difíciles.
- **¿Qué ocurrió?:** Notificación de vestuario: *"La charla de equipo surtió efecto: la cohesión del plantel aumentó a 78/100"*.

## 15. Casos Extremos
- **Venta del capitán del equipo:** Genera un shock temporal de -10 en la cohesión durante 3 semanas hasta que el nuevo capitán se consolida.
- **Plantel con 100% de jugadores extranjeros/nuevos:** Cohesión inicial de 30 puntos que exige meses de convivencia deportiva para alcanzar niveles óptimos.

## 16. Anti-Exploits
- **Charlas infinitas para tener 100 de moral:** Bloqueado por la restricción de 4 semanas mínimas de enfriamiento.
- **Alterar jerarquías manualmente:** La jerarquía se calcula de forma autoritativa en el servidor según partidos jugados, antigüedad, OVR y atributos mentales.

## 17. Observabilidad y Métricas
- Correlación estadística entre alta cohesión y victorias en liga.
- Porcentaje de reclamos de futbolistas resueltos pacíficamente vs jugadores declarados en rebeldía.
- Distribución de clanes en los clubes del juego.

## 18. Matriz de Pruebas
1. Designar nuevo capitán -> Registrado en `club_locker_room`, impacto de moral aplicado si hubo relevo traumático.
2. Charla de equipo con tono motivador tras victoria -> Cohesión sube +5, moral de futbolistas sube +8.
3. Intento de realizar segunda charla a las 2 semanas -> HTTP 400 `ERR_TEAM_MEETING_COOLDOWN_ACTIVE`.
4. Promesa de minutos cumplida -> Jugador disuelve su queja y su satisfacción sube a 85 puntos.
5. Verificación de cálculo de jerarquía según antigüedad y partidos jugados.

## 19. Criterios de Aceptación
- [x] Modelo de vestuario, estatus social y promesas formalizado.
- [x] Máquina de estados de cohesión y resolución de disputas cerrada.
- [x] Backend como autoridad absoluta de cálculo de química grupal.
- [x] 4 estratos de liderazgo y clanes sociales delimitados.
- [x] Cohesión de vestuario activa en clubes de IA.
- [x] Eventos y auditoría de dinámicas de grupo implementados.
- [x] Idempotencia estricta en reuniones y asignación de capitanes.
- [x] Concurrencia con bloqueo pesimista en vestuario resuelta.
- [x] Parámetros de enfriamiento y penalizaciones versionados en JSON.
- [x] Casos extremos de venta de capitanes cubiertos.
- [x] Anti-exploits de spam de charlas motivadoras neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `LockerRoomService`, `HierarchyCalculatorEngine`, `PromiseTrackingManager`, `LockerRoomRepository`.
- **Comandos:** `AssignCaptainCommand`, `HoldTeamMeetingCommand`, `ResolvePlayerGrievanceCommand`.
- **Queries:** `GetLockerRoomOverviewQuery`, `GetPlayerSocialStatusQuery`.
- **Políticas DB:** `ALTER TABLE club_locker_room ADD CONSTRAINT chk_cohesion_range CHECK (team_cohesion_score BETWEEN 0 AND 100)`.
