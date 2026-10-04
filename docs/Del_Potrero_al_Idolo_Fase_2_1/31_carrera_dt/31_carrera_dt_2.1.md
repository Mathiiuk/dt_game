# FASE 31 — CARRERA DEL DIRECTOR TÉCNICO, OFERTAS DE TRABAJO Y RENUNCIAS
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Establecer el contrato funcional y formal de dominio para la trayectoria profesional del Director Técnico a través de múltiples clubes, la postulación a banquillos vacantes, la recepción de ofertas laborales formales y el proceso de renuncia o cambio de institución. De acuerdo con las **Reglas Maestras 1, 4, 8 y 10**, el DT posee una identidad profesional persistente e independiente del club: si decide cambiar de institución, el nuevo contrato se firma atómicamente en el servidor sin corromper el universo de la liga ni las relaciones contractuales del club anterior.

## 2. Alcance específico
- Hoja de Vida y Currículum Vitae del DT: Registro histórico acumulado de partidos dirigidos, victorias, empates, derrotas, efectividad (Win Rate %), títulos conquistados y clubes en su carrera.
- Ofertas de Trabajo Entrantes (Job Offers): Generación autoritativa en el backend por parte de clubes rivales con banquillo vacante, condicionada a la reputación (`reputation`) y nivel del DT (Fase 05 / 32).
- Notificaciones de la Aplicación (In-App Bottom Sheet): Prohibición estricta de modales o alerts nativos del navegador (`window.confirm`). Toda propuesta laboral o confirmación de firma se presenta mediante un Bottom Sheet elegante que emerge desde el borde inferior de la pantalla hacia arriba.
- Postulación Voluntaria a Puestos Vacantes (Job Applications) en clubes que han cesado a sus entrenadores.
- Renuncia Voluntaria (Resign): Desvinculación unilateral del DT sin cobro de indemnización, pasando al estado de Desempleado.

## 3. Entidades y Modelo de Datos de Dominio
1. **ManagerEmploymentState (`managers` extension)**:
   - `status` (Enum: `EMPLOYED`, `UNEMPLOYED`, `RETIRED`).
   - `club_id` (UUID, Nullable, FK -> `clubs.id`).
   - `current_contract_wage` (Numeric 10,2): Salario profesional percibido.
   - `current_contract_expires_at` (Date, Nullable).
   - `personal_savings` (Numeric 12,2, Default 0): Fortuna personal acumulada del DT.

2. **JobOffer (`manager_job_offers`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID, FK -> `careers.id`).
   - `manager_id` (UUID, FK -> `managers.id`).
   - `offering_club_id` (UUID, FK -> `clubs.id`).
   - `wage_offered` (Numeric 10,2): Salario ofrecido al DT.
   - `transfer_budget_promised` (Numeric 12,2).
   - `season_objective_expected` (Enum: `AVOID_RELEGATION`, `MID_TABLE`, `TOP_HALF`, `PROMOTION`, `CHAMPION`).
   - `contract_years` (Integer, 1-3).
   - `status` (Enum: `PENDING`, `ACCEPTED`, `REJECTED`, `EXPIRED`).
   - `expires_at_week` (Integer): Semana límite de vigencia de la oferta.
   - `created_at` (Timestamp UTC).

3. **CareerStintRecord (`manager_career_stints`)**:
   - `id` (UUID, PK).
   - `manager_id` (UUID, FK -> `managers.id`).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `started_at` (Date).
   - `ended_at` (Date, Nullable): Null si es el club actual.
   - `matches_managed` (Integer, Default 0).
   - `matches_won` (Integer, Default 0).
   - `matches_drawn` (Integer, Default 0).
   - `matches_lost` (Integer, Default 0).
   - `trophies_won` (Array de String, Default []).
   - `departure_reason` (Enum, Nullable: `RESIGNED`, `SACKED`, `RETIRED`, `MOVED_TO_ANOTHER_CLUB`).

## 4. Máquina de Estados de la Carrera
```
[DESEMPLEADO (status='UNEMPLOYED')] ──(Command: AcceptJobOffer)──► [EN_FUNCIONES_EN_CLUB]
                                                                            │
                                     ┌──────────────────────────────────────┼──────────────────────────────────────┐
                                     ▼                                      ▼                                      ▼
                        (Command: ResignFromClub)            (Oferta de club superior)               (Despido por directiva Fase 23)
                                     │                                      │                                      │
                                     ▼                                      ▼                                      ▼
                        [DESEMPLEADO_VOLUNTARIO]               [TRASPASO_DIRECTO_A_NUEVO_CLUB]         [DESEMPLEADO_FORZOSO]
```

### Transición Principal: Aceptación de Oferta Laboral
- **Actor:** DT humano autenticado.
- **Precondiciones:**
  1. `manager_job_offers.status == 'PENDING'`.
  2. La oferta no ha caducado por semanas de calendario.
- **Comando:** `AcceptJobOfferCommand(managerId, offerId)`.
- **Consecuencias:**
  1. Si estaba empleado: Cierra el ciclo en `manager_career_stints` con `departure_reason = 'MOVED_TO_ANOTHER_CLUB'` y libera `club_id` del club antiguo.
  2. Abre nuevo registro en `manager_career_stints` con el nuevo `offering_club_id`.
  3. Actualiza `managers.club_id = offering_club_id` y su nuevo salario.
  4. Actualiza `clubs.manager_id = managerId` en el nuevo club.
  5. Marca la oferta como `ACCEPTED` y las demás ofertas pendientes como `REJECTED`.
  6. Emite evento de dominio `MANAGER_SIGNED_WITH_NEW_CLUB`.
  7. Invalida todas las cachés locales del club.
- **Idempotencia:** No se puede aceptar dos veces la misma oferta; solicitudes concurrentes son rechazadas.

## 5. Flujo Funcional Paso a Paso
1. **Llegada de Oferta:** Tras una brillante campaña en Tier 5, el club de Tier 4 "Club Social y Deportivo Italiano" despide a su DT y le envía una propuesta formal al DT humano.
2. **Notificación en la App (Bottom Sheet):** En la parte inferior de la pantalla emerge suavemente un panel nativo con animación slide-up:
   - Escudo del club oferente y nombre: "Deportivo Italiano (Tier 4)".
   - Presupuesto de fichajes prometido: $45,000.
   - Salario ofrecido al DT: $850/sem (duplica su sueldo actual).
   - Objetivo: "Pelear los puestos de playoff".
   - Botones táctiles claros: [Firmar Contrato] y [Desestimar Oferta].
3. **Decisión del DT:** El DT decide dar el salto de categoría y presiona [Firmar Contrato].
4. **Ejecución Transaccional en Servidor:**
   - Se concluye su ciclo en el club fundador (dejándolo en manos de un DT interino).
   - Se vincula al DT al Deportivo Italiano.
5. **Bienvenida Institucional:** Pantalla de asunción formal en la sala de prensa del nuevo club, recibiendo la bienvenida del nuevo presidente y conociendo al nuevo plantel.

## 6. Reglas Específicas
- **Regla 31.1 — Prohibición de Alertas Nativas del Navegador (Master Rule de UI/UX):** Queda terminantemente prohibido el uso de `window.alert()`, `window.confirm()` o `window.prompt()` en la experiencia de ofertas de trabajo o decisiones de carrera. Todo diálogo debe renderizarse como un componente nativo de la app (Bottom Sheet / Drawer móvil accesible).
- **Regla 31.2 — Expiración de Ofertas a las 2 Semanas:** Los clubes que emiten ofertas no esperan eternamente: si el DT avanza 2 semanas de calendario sin responder, la oferta expira y el club rival contrata a otro entrenador.
- **Regla 31.3 — Salario del DT y Ahorros Personales:** El sueldo semanal pactado en el contrato del DT se deposita semanalmente en su cuenta de ahorros personales (`personal_savings`), acumulando fondos que inciden en su legado final (Fase 40).
- **Regla 31.4 — Renuncia sin Indemnización:** Si el DT renuncia voluntariamente, no percibe indemnización de finiquito y su reputación puede sufrir un ligero descuento (-5 puntos) por falta de compromiso.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`career_progression_rules.json`):
- `reputation_required_tier_4`: 30 puntos de reputación.
- `reputation_required_tier_3`: 50 puntos de reputación.
- `reputation_required_tier_2`: 70 puntos de reputación.
- `reputation_required_tier_1`: 85 puntos de reputación.
- `job_offer_expiry_weeks`: 2 semanas.
- `resignation_reputation_penalty`: -5 puntos.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Historial de su carrera, ofertas de trabajo vigentes con condiciones económicas, vacantes disponibles en la federación, ahorros personales acumulados.
- **Parcial:** Probabilidad de ser contratado al postularse a un club vacante ("Candidato firme" vs "Pocas opciones").
- **Oculta al Cliente:** Lista de entrenadores de IA competidores que también se postulan a la misma vacante.

## 9. Inteligencia Artificial / Movimiento en los Banquillos
Los entrenadores de IA cambian de club activamente: si un DT de IA triunfa, es tentado por clubes de Primera División, dejando vacantes libres para que el usuario humano pueda postularse.

## 10. Eventos y Auditoría
- `JOB_OFFER_RECEIVED`: Recepción de propuesta formal de trabajo.
- `MANAGER_RESIGNED`: Renuncia voluntaria registrada.
- `MANAGER_HIRED_AT_CLUB`: Nuevo contrato firmado y ciclo iniciado.

## 11. Idempotencia y Mitigación de Errores de Red
- El endpoint `POST /api/v1/manager/job-offers/:id/accept` verifica el estado `status == 'PENDING'`. Múltiples clics por micro-lag ejecutan la contratación una sola vez.

## 12. Concurrencia
- La aceptación de contrato bloquea la fila del DT en `managers` y la fila de ambos clubes (`FOR UPDATE`), evitando inconsistencias en los banquillos.

## 13. Persistencia y Ciclo de Vida
- La tabla `manager_career_stints` es inmutable para los ciclos terminados, construyendo la biografía deportiva que coronará el epílogo final (Fase 40).

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de Carrera del DT / Panel de Empleo.
- **¿Qué puedo hacer?:** Analizar ofertas de clubes interesados, postularse a vacantes o presentar la renuncia.
- **¿Qué cuesta?:** Sin coste monetario.
- **¿Qué puede pasar?:** Si aceptas la oferta, dejarás tu club actual para asumir un nuevo desafío con nuevos objetivos.
- **¿Qué ocurrió?:** Notificación Bottom Sheet fluida desde abajo hacia arriba con botón de firma y detalles institucionales.

## 15. Casos Extremos
- **DT que renuncia y no consigue trabajo en 2 años:** El juego permite postularse a clubes amateurs de Tier 5 para reconstruir la reputación desde el barro.
- **Club que desciende y le reduce el sueldo al DT:** El DT tiene derecho a rescindir su contrato sin penalización por cambio de condiciones pactadas.

## 16. Anti-Exploits
- **Firmar en clubes de Primera con reputación de 10:** El backend valida estrictamente que la reputación del DT cumpla el mínimo de la categoría del club antes de autorizar la firma.

## 17. Observabilidad y Métricas
- Promedio de clubes dirigidos por un DT en su carrera (debe rondar entre 2 y 4 clubes).
- Frecuencia de ofertas de trabajo generadas por temporada.
- Tasa de aceptación de ofertas recibidas.

## 18. Matriz de Pruebas
1. Generación de oferta laboral coherente con la reputación del DT -> Registrada en `manager_job_offers`.
2. Aceptación de oferta -> DT desvinculado del club anterior, asignado al nuevo club, histórico actualizado en `manager_career_stints`.
3. Notificación UI -> Se despacha mediante evento de Bottom Sheet en cliente, 0 llamadas a `window.confirm`.
4. Intento de aceptar oferta expirada -> HTTP 400 `ERR_JOB_OFFER_EXPIRED`.
5. Postulación con reputación insuficiente -> Solicitud rechazada amablemente por la directiva rival.

## 19. Criterios de Aceptación
- [x] Modelo de empleo de DT, ofertas laborales y stints formalizado.
- [x] Máquina de estados de carrera y contrataciones cerrada.
- [x] Backend como autoridad absoluta de transferencias entre banquillos.
- [x] Prohibición de alerts nativos y adopción obligatoria de Bottom Sheets de la app.
- [x] Mercado de entrenadores activo en clubes de IA.
- [x] Eventos y auditoría de trayectoria profesional implementados.
- [x] Idempotencia estricta en la aceptación de contratos de DT.
- [x] Concurrencia con bloqueo pesimista resuelta.
- [x] Parámetros de reputación requerida por tier versionados en JSON.
- [x] Casos de desempleo prolongado y descensos cubiertos.
- [x] Anti-exploits de saltos a clubes grandes sin mérito neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `ManagerCareerService`, `JobOfferGeneratorEngine`, `CareerStintRepository`, `InAppNotificationDispatcher`.
- **Comandos:** `AcceptJobOfferCommand`, `RejectJobOfferCommand`, `ResignCommand`, `ApplyForJobCommand`.
- **Queries:** `GetManagerCareerStintsQuery`, `GetPendingJobOffersQuery`.
- **Políticas DB:** `CREATE INDEX idx_job_offers_manager_status ON manager_job_offers(manager_id, status)`.
