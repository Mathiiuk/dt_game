# FASE 26 — PERSONALIDADES, RASGOS Y PSICOLOGÍA DEL JUGADOR
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Definir el contrato funcional de dominio para el sistema de personalidades, rasgos psicológicos ocultos y arquetipos de comportamiento de los futbolistas en *Del Potrero al Ídolo*. De acuerdo con las **Reglas Maestras 1, 5, 6 y 12**, el motor psicológico se computa autoritativamente en el backend mediante variables latentes (Ambición, Profesionalismo, Determinación, Lealtad, Presión, Temperamento) que definen cómo reacciona cada jugador a las victorias, suplencias, ofertas del mercado y charlas del DT.

## 2. Alcance específico
- 7 Arquetipos de Personalidad Principales:
  - **Líder Nato (`NATURAL_LEADER`):** Alta determinación y liderazgo; empuja a sus compañeros en las derrotas y es el candidato ideal a capitán.
  - **Profesional Ejemplar (`MODEL_PROFESSIONAL`):** Máximo profesionalismo; nunca se queja por entrenar duro, evoluciona rápido y prolonga su carrera hasta edades avanzadas.
  - **Ambicioso Inquieto (`AMBITIOUS`):** Alta ambición pero baja lealtad; exige aumentos salariales rápidos y presiona para ser transferido a divisiones superiores.
  - **Temperamental / Rebelde (`TEMPERAMENTAL`):** Poca tolerancia a la frustración; comete faltas absurdas si el rival le pega y acumula tarjetas rojas directas por agresión.
  - **Resiliente de Potrero (`STREET_RESILIENT`):** Forjado en el barro; rinde mejor en canchas difíciles y partidos calientes, pero le cuesta adaptarse a la disciplina estricta de vestuario.
  - **Indolente / Cómodo (`SLACKER`):** Poco apego al esfuerzo físico; rinde por debajo de su potencial si no se le presiona y se desentrena rápido en vacaciones.
  - **Sensible a la Crítica (`FRAGILE`):** Baja tolerancia a la presión; se desmorona moralmente si el DT lo critica públicamente en prensa o si comete un error en los primeros 10 minutos.
- Rasgos Especiales de Juego (Traits): "Dispara desde lejos", "Líder de la zaga", "Especialista en faltas", "Regateador compulsivo".
- Mecánica de Mentoría / Tutoría: Un veterano `MODEL_PROFESSIONAL` puede apadrinar a un juvenil `SLACKER` para moldear su personalidad hacia el profesionalismo.

## 3. Entidades y Modelo de Datos de Dominio
1. **PlayerPsychology (`player_personalities`)**:
   - `id` (UUID, PK).
   - `player_id` (UUID, FK -> `players.id`, Unique).
   - `primary_archetype` (Enum: `NATURAL_LEADER`, `MODEL_PROFESSIONAL`, `AMBITIOUS`, `TEMPERAMENTAL`, `STREET_RESILIENT`, `SLACKER`, `FRAGILE`).
   - `ambition` (Integer, 1-20): Deseo de títulos, gloria y dinero.
   - `professionalism` (Integer, 1-20): Dedicación al entrenamiento y vida sana.
   - `loyalty` (Integer, 1-20): Apego afectivo a la institución.
   - `pressure_handling` (Integer, 1-20): Temple en finales y clásicos.
   - `temperament` (Integer, 1-20): Control de la agresividad e impulsos.
   - `determination` (Integer, 1-20): Capacidad de reacción ante la adversidad.
   - `special_traits` (Array de String, ej: ["LONG_SHOTS", "DIVES_INTO_TACKLES"]).
   - `mentor_player_id` (UUID, Nullable, FK -> `players.id`): Veterano tutor asignado.

2. **MentorshipGroup (`player_mentorships`)**:
   - `id` (UUID, PK).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `veteran_player_id` (UUID, FK -> `players.id`).
   - `youth_player_id` (UUID, FK -> `players.id`).
   - `progress_percentage` (Integer, 0-100, Default 0).
   - `status` (Enum: `ACTIVE`, `COMPLETED`, `INCOMPATIBLE_CANCELLED`).
   - `started_at_season` (Integer).

3. **PersonalityAuditLog (`personality_events_log`)**:
   - `id` (UUID, PK).
   - `player_id` (UUID).
   - `event_type` (Enum: `MENTORSHIP_INFLUENCE_APPLIED`, `RED_CARD_OUTBURST`, `AMBITION_REVOLT`, `CLUTCH_PERFORMANCE`).
   - `attribute_shifted` (String, Nullable).
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados de la Mentoría
```
[SIN_TUTORIA] ──(Command: AssignMentorToYouth)──► [EVALUANDO_COMPATIBILIDAD]
                                                            │
                                  ┌─────────────────────────┴─────────────────────────┐
                                  ▼                                                   ▼
                     [TUTORIA_ACTIVA (Progreso 0%)]                          [INCOMPATIBLES_RECHAZADO]
                                  │                                          (Egos chocan)
                    (Avance de semanas en temporada)
                                  │
                                  ▼
                     [TUTORIA_COMPLETADA (100%)]
                     (Juvenil adopta rasgos del veterano)
```

### Transición Principal: Asignación de Mentoría
- **Actor:** DT humano.
- **Precondiciones:**
  1. El veterano tiene al menos 28 años y jerarquía `TEAM_LEADER` o `HIGHLY_INFLUENTIAL`.
  2. El protegido tiene 21 años o menos.
  3. Ambos futbolistas juegan en posiciones afines (ej: Defensor Central tutela a Central juvenil).
- **Comando:** `AssignMentorshipCommand(clubId, veteranId, youthId)`.
- **Consecuencias:**
  1. Crea la fila en `player_mentorships`.
  2. Cada semana de calendario incrementa `progress_percentage` en base a la afinidad de ambos.
  3. Al llegar a 100%, los atributos mentales del juvenil (`professionalism`, `determination`) suben hacia los valores del veterano tutor.
- **Idempotencia:** Un veterano solo puede tutelar a un juvenil a la vez.

## 5. Flujo Funcional Paso a Paso
1. **Detección de Talento Indisciplinado:** El DT sube a primera a un extremo de 17 años con enorme talento (OVR 52, Potencial ★★★★★), pero con personalidad `SLACKER` (se desmotiva en entrenamientos y llega tarde).
2. **Asignación de Tutor:** El DT asigna al capitán del equipo (32 años, Mediocampista, `MODEL_PROFESSIONAL`) como su mentor personal.
3. **Proceso de Acompañamiento:**
   - Durante 20 semanas de temporada, el veterano aconseja al juvenil en el día a día.
   - El profesionalismo del joven sube gradualmente de 6 a 12.
4. **Evolución:** La personalidad del juvenil muta de `SLACKER` a `STREET_RESILIENT`. Ahora entrena con el 100% de intensidad y su velocidad de evolución de atributos se duplica (Fase 08 / 28).

## 6. Reglas Específicas
- **Regla 26.1 — Comportamiento en Momentos Críticos (Clutch Factor):**
  - Futbolista con `pressure_handling >= 16`: En finales o minutos 85+ con resultado adverso, suma +10% de efectividad en definición y pases clave.
  - Futbolista con `pressure_handling <= 6` (`FRAGILE`): En tandas de penales o clásicos, la probabilidad de errar el disparo se multiplica por 2.5×.
- **Regla 26.2 — Riesgo Disciplinario del Temperamental:**
  - Futbolistas con `temperament <= 6` tienen un 8% de probabilidad de ser amonestados por reclamar airadamente al árbitro en cada partido caliente.
- **Regla 26.3 — Estabilidad de la Personalidad:** Los arquetipos de personalidad son estables; en adultos mayores de 24 años son casi inmutables, mientras que en menores de 21 años pueden ser moldeados por mentorías o eventos traumáticos.
- **Regla 26.4 — Compatibilidad con la Filosofía del DT:** Si el DT tiene filosofía `TIKI_TAKA` y alinea jugadores con rasgos `LONG_SHOTS` o indisciplinados, el entendimiento del esquema se resiente un 15%.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`psychology_rules.json`):
- `mentorship_duration_weeks`: 20 semanas.
- `mentorship_max_shift_points`: +4 en profesionalismo y determinación.
- `fragile_player_choke_multiplier`: 2.5× en penales decisivos.
- `temperamental_card_chance_boost`: +8% probabilidad de tarjeta por protesta.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Nombre del arquetipo principal del jugador ("Profesional Ejemplar", "Líder Nato"), rasgos especiales de juego ("Especialista en tiros libres"), reporte cualitativo del cuerpo técnico.
- **Parcial:** Rango de atributos mentales (ej: "Determinación: Alta").
- **Oculta al Cliente (Estrictamente privada):** Valores enteros numéricos exactos de `ambition`, `loyalty` y `pressure_handling` (del 1 al 20) para evitar juego deshumanizado por hojas de cálculo.

## 9. Inteligencia Artificial / Personalidad en Rivales
Los clubes de IA evalúan la personalidad antes de fichar: clubes grandes evitan contratar a jugadores conflictivos (`TEMPERAMENTAL`), mientras que clubes de ascenso buscan perfiles `STREET_RESILIENT` para batallar en terrenos difíciles.

## 10. Eventos y Auditoría
- `MENTORSHIP_STARTED`: Inicio de tutoría formal.
- `MENTORSHIP_COMPLETED`: Transformación de mentalidad juvenil completada.
- `PLAYER_OUTBURST_RECORDED`: Falta disciplinaria grave registrada en el historial.

## 11. Idempotencia y Mitigación de Errores de Red
- El endpoint de asignación de tutor valida `UNIQUE (youth_player_id) WHERE status = 'ACTIVE'`, garantizando que múltiples llamadas no creen grupos de tutoría paralelos para el mismo canterano.

## 12. Concurrencia
- La actualización de variables psicológicas se realiza de forma atómica en la cascada semanal junto a la evolución física.

## 13. Persistencia y Ciclo de Vida
- La personalidad acompaña al futbolista durante toda su carrera deportiva y determina si al retirarse se convertirá en Director Técnico, Preparador Físico o abandonará el fútbol (Fase 40).

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Ficha del Jugador / Pestaña "Personalidad y Rasgos".
- **¿Qué puedo hacer?:** Conocer el carácter de tus dirigidos y armar parejas de mentoría entre referentes y promesas.
- **¿Qué cuesta?:** Sin coste económico.
- **¿Qué puede pasar?:** Si juntas a dos jugadores de egos incompatibles, la tutoría fracasará y se generará tensión en el vestuario.
- **¿Qué ocurrió?:** Notificación de logro: *"El joven Agustín Peralta ha completado su tutoría con el Capitán y ha mejorado su profesionalismo"*.

## 15. Casos Extremos
- **Mentor transferido a mitad del programa:** La tutoría se cancela de forma prematura conservando los puntos de mejora parciales acumulados hasta ese momento.
- **Jugador con talento descomunal pero personalidad tóxica:** El DT debe sopesar si vale la pena aguantar sus desplantes por sus goles o venderlo para preservar la paz del grupo.

## 16. Anti-Exploits
- **Hack de atributos mentales en cliente:** Las variables psicológicas residen exclusivamente en la base de datos de servidor y no tienen endpoints de edición directa.

## 17. Observabilidad y Métricas
- Distribución de los 7 arquetipos en la población de futbolistas generados.
- Tasa de éxito de los programas de mentoría en la liga.
- Porcentaje de expulsiones provocadas por futbolistas temperamentales.

## 18. Matriz de Pruebas
1. Asignar tutor válido -> Registro activo en `player_mentorships` con progreso 0%.
2. Transcurso de 20 semanas -> Tutoría completada y atributos mentales del protegido incrementados.
3. Intento de asignar como mentor a un jugador de 20 años -> HTTP 400 `ERR_MENTOR_TOO_YOUNG`.
4. Jugador con temple bajo en final decisiva -> Evalúa penalización estadística en el cálculo de tiros clave.
5. Intento de asignar segundo tutor a un protegido ya asignado -> Rechazado por unicidad.

## 19. Criterios de Aceptación
- [x] Modelo de arquetipos psicológicos y mentorías formalizado.
- [x] Máquina de estados de tutoría y compatibilidad cerrada.
- [x] Backend como autoridad absoluta de variables latentes ocultas.
- [x] 7 arquetipos claramente diferenciados con impactos en cancha y vestuario.
- [x] Simulación psicológica equitativa en futbolistas de IA.
- [x] Eventos y auditoría de conducta implementados por diseño.
- [x] Idempotencia estricta en el emparejamiento de mentores.
- [x] Concurrencia atómica resuelta en base de datos.
- [x] Factores de temple y penalizaciones versionados en JSON.
- [x] Casos extremos de cancelaciones de tutoría cubiertos.
- [x] Anti-exploits de manipulación de mente de jugador neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `PlayerPsychologyService`, `MentorshipEngine`, `ClutchFactorCalculator`, `PersonalityRepository`.
- **Comandos:** `AssignMentorshipCommand`, `CancelMentorshipCommand`, `ProcessWeeklyMentorshipCommand`.
- **Queries:** `GetPlayerPsychologyOverviewQuery`, `GetClubMentorshipGroupsQuery`.
- **Políticas DB:** `CREATE UNIQUE INDEX uq_active_mentorship_youth ON player_mentorships(youth_player_id) WHERE status = 'ACTIVE'`.
