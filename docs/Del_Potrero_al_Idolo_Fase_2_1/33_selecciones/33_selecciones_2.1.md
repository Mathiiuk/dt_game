# FASE 33 — SELECCIONES NACIONALES Y MODALIDAD DE DOBLE CARRERA
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Establecer el contrato funcional de dominio para la dirección técnica de selecciones nacionales de fútbol, las convocatorias internacionales de futbolistas y la modalidad de **Doble Carrera** (conducción simultánea de un club y una selección patria, o exclusividad internacional) en *Del Potrero al Ídolo*. De acuerdo con las **Reglas Maestras 1, 4, 8 y 10**, el calendario internacional coexiste armónicamente con la liga local en el servidor, validando convocatorias legales y liquidando torneos de naciones con rigor autoritativo.

## 2. Alcance específico
- Ofertas de Selecciones Nacionales: Despachadas cuando el DT alcanza reputación de nivel Elite (`reputation >= 75`) o tras ganar un título de Primera División.
- Modalidad de Doble Carrera: El DT puede aceptar dirigir a su país de origen (ej: Argentina) manteniendo su cargo en su club, o renunciar a su club para dedicarse exclusivamente al combinado nacional.
- Mecánica de Convocatorias Internacionales:
  - Lista preliminar de 35 futbolistas y lista definitiva de 23 futbolistas elegibles por nacionalidad.
  - Convocatoria de jugadores de la liga local y del exterior.
- Fechas FIFA y Competiciones Internacionales de Naciones: Eliminatorias Continentales, Copa América / Eurocopa y Copa del Mundo de la FIFA (cada 4 años de calendario).
- Impacto en Clubes: Jugadores convocados viajan con su selección, no están disponibles para partidos de liga si hay solapamiento y regresan con fatiga de viaje acumulada (`-15 fitness`).

## 3. Entidades y Modelo de Datos de Dominio
1. **NationalTeam (`national_teams`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID, FK -> `careers.id`).
   - `country_code` (String, ISO-2, ej: "AR", "BR", "UY", "ES").
   - `country_name` (String, ej: "Argentina").
   - `manager_id` (UUID, Nullable, FK -> `managers.id`): Seleccionador actual.
   - `world_ranking` (Integer, 1-200): Puesto en el Ranking FIFA.
   - `federation` (Enum: `CONMEBOL`, `UEFA`, `CONCACAF`, `CAF`, `AFC`).
   - `reputation` (Integer, 1-100).
   - `created_at` (Timestamp UTC).

2. **NationalCallUpSquad (`national_callups`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID).
   - `national_team_id` (UUID, FK -> `national_teams.id`).
   - `tournament_id` (UUID, Nullable).
   - `season_year` (Integer).
   - `callup_window` (Enum: `MARCH_FIFA`, `JUNE_TOURNAMENT`, `SEPT_FIFA`, `NOV_FIFA`).
   - `player_ids` (Array de UUID): Lista cerrada de 23 convocados.
   - `is_finalized` (Boolean, Default false).
   - `created_at` (Timestamp UTC).

3. **NationalTournamentFixture (`national_fixtures`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID).
   - `competition_name` (String, ej: "Eliminatorias Sudamericanas", "Copa del Mundo").
   - `home_team_id` (UUID, FK -> `national_teams.id`).
   - `away_team_id` (UUID, FK -> `national_teams.id`).
   - `home_score` (Integer, Default 0).
   - `away_score` (Integer, Default 0).
   - `status` (Enum: `SCHEDULED`, `FINISHED`).
   - `match_date` (Date).

## 4. Máquina de Estados de la Selección
```
[DT_SOLO_EN_CLUB] ──(Llega oferta de Selección / Acepta)──► [MODALIDAD_DOBLE_CARRERA]
                                                                     │
                                  ┌──────────────────────────────────┴──────────────────────────────────┐
                                  ▼                                                                     ▼
                    (Llega Fecha FIFA / Semana 36)                                        (Command: Renunciar a Club)
                                  │                                                                     │
                                  ▼                                                                     ▼
                    [PERIODO_DE_CONVOCATORIAS]                                             [DT_EXCLUSIVO_DE_SELECCION]
                                  │
                                  ├── Selecciona 23 convocados patrios
                                  ├── Disputa partidos de Selección
                                  ▼
                    [FIN_DE_VENTANA_FIFA]
                    (Jugadores regresan a sus clubes con fatiga)
```

### Transición Principal: Convocatoria de Futbolistas
- **Actor:** DT humano en funciones de Seleccionador Nacional.
- **Precondiciones:**
  1. Ventana de convocatoria abierta en el calendario.
  2. La lista contiene EXACTAMENTE 23 futbolistas de la nacionalidad correspondiente (`nationality == country_code`).
  3. Al menos 3 arqueros (`GK`) incluidos en la nómina obligatoria.
  4. Ningún convocado tiene lesión grave confirmada.
- **Comando:** `SubmitNationalCallUpCommand(nationalTeamId, playerIdsList)`.
- **Consecuencias:**
  1. Inserta o actualiza `national_callups` con `is_finalized = true`.
  2. Marca a los 23 futbolistas con el flag temporal `on_international_duty = true`.
  3. Los futbolistas convocados reciben un boost anímico patrio (+10 de moral).
  4. Emite evento de dominio `NATIONAL_SQUAD_ANNOUNCED`.
- **Idempotencia:** Solicitudes repetidas detectan la nómina finalizada y devuelven HTTP 200 sin alteraciones.
- **Errores:** `ERR_INVALID_CALLUP_SIZE`, `ERR_INSUFFICIENT_GOALKEEPERS`, `ERR_FOREIGN_PLAYER_CALLUP`.

## 5. Flujo Funcional Paso a Paso
1. **La Llamada de la Patria:** Tras coronarse en Primera División, el DT recibe la oferta formal de la Asociación del Fútbol Argentino (AFA) para asumir la dirección técnica de la Selección.
2. **Aceptación de Doble Rol:** El DT acepta mediante la notificación Bottom Sheet. La interfaz activa una barra superior conmutadora: [Mi Club] / [Selección Argentina].
3. **El Periodo de Convocatorias:** Al llegar la fecha de Eliminatorias:
   - El DT abre la lista de candidatos nacionales (futbolistas argentinos en su club y en clubes rivales del mundo).
   - Arma su nómina de 23 futbolistas con 3 arqueros, 8 defensores, 7 volantes y 5 delanteros.
4. **Disputa del Partido Internacional:**
   - La Selección juega contra Uruguay en el Estadio Monumental.
   - El DT prepara la táctica patria y dirige el encuentro con el motor 2D de partido (Fase 10).
5. **Cierre y Retorno:** Victoria 2-1. El DT suma +500 XP y prestigio internacional. Los futbolistas regresan a sus clubes con un -15 de fitness por el desgaste del viaje pero con la moral por las nubes.

## 6. Reglas Específicas
- **Regla 33.1 — Elegibilidad Estricta por Pasaporte:** Solo futbolistas cuya columna `nationality` coincida exactamente con el `country_code` de la selección pueden ser convocados. El backend rechaza cualquier futbolista no naturalizado.
- **Regla 33.2 — Cuota Obligatoria de 3 Porteros:** Toda lista de 23 futbolistas debe contener de forma ineludible al menos 3 arqueros habilitados por reglamento de la FIFA.
- **Regla 33.3 — Simultaneidad de Funciones:** El salario del DT por dirigir la selección es independiente del salario que cobra en su club y ambos se acumulan en su cuenta personal de ahorros (`personal_savings`).
- **Regla 33.4 — Clima de Mundial:** La Copa del Mundo se disputa cada 4 años de calendario en la Semana 48 a 52; ganar la Copa del Mundo otorga la máxima condecoración histórica del juego (+5,000 XP y pase directo a Rango 6 de leyenda).

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`national_teams_balance.json`):
- `reputation_required_tier_1_nation`: 80 puntos de reputación de DT.
- `reputation_required_tier_2_nation`: 65 puntos de reputación de DT.
- `fifa_callup_size`: 23 futbolistas.
- `travel_fatigue_penalty`: -15 puntos de fitness al retornar.
- `world_cup_championship_xp`: 5,000 XP.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Ranking FIFA oficial de naciones, nómina completa de futbolistas elegibles por nacionalidad en el universo del juego, calendario de partidos internacionales y tabla de posiciones de eliminatorias.
- **Parcial:** Ninguna.
- **Oculta al Cliente:** Tácticas secretas preparadas por los seleccionadores rivales.

## 9. Inteligencia Artificial / Selecciones Rivales
Las demás selecciones nacionales son dirigidas por técnicos de IA que convocan automáticamente a los 23 futbolistas con mejor OVR y rendimiento de su país en cada fecha FIFA.

## 10. Eventos y Auditoría
- `NATIONAL_APPOINTMENT_ACCEPTED`: Asunción como seleccionador nacional.
- `NATIONAL_CALLUP_CONFIRMED`: Nómina de 23 futbolistas publicada formalmente.
- `INTERNATIONAL_MATCH_CONCLUDED`: Resultado de partido de selecciones registrado.

## 11. Idempotencia y Mitigación de Errores de Red
- El guardado de la convocatoria valida contra `national_callups` con estado `is_finalized`. Reintentos de red no alteran la lista de convocados una vez oficializada.

## 12. Concurrencia
- La conmutación entre Club y Selección opera sobre contextos de sesión independientes, garantizando que cambios tácticos en la selección no sobreescriban la táctica del club en la base de datos.

## 13. Persistencia y Ciclo de Vida
- Los títulos conquistados con la Selección Nacional se registran en una vitrina patriótica especial en el perfil de carrera del DT (Fase 31 / 38).

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de la Selección Nacional / Centro de Convocatorias.
- **¿Qué puedo hacer?:** Elegir a los 23 representantes del país y dirigir en los torneos más prestigiosos del planeta.
- **¿Qué cuesta?:** Sin coste monetario; es un honor patriótico.
- **¿Qué puede pasar?:** Si clasificas al Mundial, todo el país te aclamará como un prócer del fútbol.
- **¿Qué ocurrió?:** Himno nacional previo al partido e interfaz teñida con los colores patrios de la bandera.

## 15. Casos Extremos
- **DT que convoca a una estrella de su propio club y se lesiona en la Selección:** El jugador regresa lesionado a su club, debiendo afrontar las consecuencias de club como DT de ambas entidades.
- **Eliminación en fase de grupos del Mundial:** La federación puede cesar al DT de su cargo en la selección sin afectar su continuidad en su club privado.

## 16. Anti-Exploits
- **Convocar a futbolistas de otra nacionalidad:** El backend valida `WHERE nationality = :countryCode`, impidiendo adulteraciones client-side del padrón de convocados.

## 17. Observabilidad y Métricas
- Porcentaje de entrenadores que aceptan el desafío de dirigir una selección.
- Desempeño promedio de la Selección Nacional en Eliminatorias y Copas del Mundo.

## 18. Matriz de Pruebas
1. Oferta de Selección Nacional para DT con alta reputación -> Aceptación exitosa e inicio de doble carrera.
2. Convocatoria de 23 futbolistas con 3 arqueros -> Convocatoria oficializada, flag `on_international_duty` activo.
3. Intento de convocar con solo 2 arqueros -> HTTP 400 `ERR_INSUFFICIENT_GOALKEEPERS`.
4. Intento de convocar a un futbolista extranjero -> HTTP 400 `ERR_FOREIGN_PLAYER_CALLUP`.
5. Retorno de futbolistas a sus clubes -> Fatiga de viaje de -15 fitness aplicada autoritativamente.

## 19. Criterios de Aceptación
- [x] Modelo de selección nacional, convocatorias y fixture patriótico formalizado.
- [x] Máquina de estados de doble carrera y fechas FIFA cerrada.
- [x] Backend como autoridad absoluta de elegibilidad y calendarios.
- [x] Cuota obligatoria de 3 arqueros y 23 futbolistas reglamentada.
- [x] Convocatorias activas y automáticas en selecciones de IA.
- [x] Eventos y auditoría de partidos de selecciones implementados.
- [x] Idempotencia estricta en el cierre de listas de convocados.
- [x] Concurrencia de doble rol (club vs selección) resuelta sin colisiones.
- [x] Desgaste de viajes y multiplicadores de prestigio versionados en JSON.
- [x] Casos extremos de lesiones en fecha FIFA cubiertos.
- [x] Anti-exploits de convocatorias ilegales neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `NationalTeamService`, `CallUpValidatorEngine`, `DualCareerOrchestrator`, `NationalFixtureRepository`.
- **Comandos:** `AcceptNationalJobCommand`, `SubmitNationalCallUpCommand`, `PlayNationalFixtureCommand`.
- **Queries:** `GetNationalTeamProfileQuery`, `GetEligibleNationalPlayersQuery`.
- **Políticas DB:** `CREATE INDEX idx_national_callups_team_window ON national_callups(national_team_id, callup_window)`.
