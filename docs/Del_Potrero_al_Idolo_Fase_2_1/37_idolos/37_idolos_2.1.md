# FASE 37 — ÍDOLOS, LEYENDAS Y MEMORIA POPULAR DEL CLUB
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Establecer el contrato funcional de dominio para el estatus de ídolos, leyendas vivientes y figuras consagradas del club en *Del Potrero al Ídolo*. De acuerdo con las **Reglas Maestras 1, 4, 11 y 14**, el estatus de ídolo no se asigna arbitrariamente ni por simple deseo del usuario: se calcula de forma autoritativa en el backend mediante un baremo acumulativo de méritos (partidos jugados, goles decisivos en clásicos, títulos ganados y lealtad demostrada al rechazar ofertas millonarias), permitiendo homenajes institucionales inmutables como el retiro de dorsales o el bautismo de tribunas del estadio.

## 2. Alcance específico
- Baremo Cuantitativo de Idolatría (`idol_points_score`):
  - +1 punto por cada partido oficial disputado con la camiseta del club.
  - +3 puntos por cada gol convertido (+5 si fue en un clásico barrial o final).
  - +25 puntos por cada título de liga conquistado.
  - +15 puntos por ascenso de categoría.
  - +20 puntos por lealtad demostrada (rechazar una oferta de club superior para quedarse en el club).
- 3 Escalafones de Veneración Popular:
  - **Favorito de la Hinchada (150 a 349 pts):** Aplaudido en cada partido; la hinchada corea su nombre.
  - **Ídolo Contemporáneo (350 a 699 pts):** Camisetas vendidas masivamente; intocable en el vestuario.
  - **Leyenda Inmortal del Club (700+ pts):** Se gana un lugar eterno en la historia de la institución.
- Homenajes Institucionales Disponibles para el DT y la Directiva:
  - **Retirar el Dorsal de Camiseta:** El número queda bloqueado para siempre en honor al futbolista.
  - **Bautizar una Tribuna del Estadio:** La cabecera o platea adopta su nombre oficial (Fase 21).
  - **Estatua en el Hall del Club:** Aumenta permanentemente la reputación del club en +3 puntos.
- Cláusula de Respeto: Despedir o vender a un Ídolo por la puerta trasera destruye la moral del vestuario y desata protestas de la hinchada (Fase 22 / 25).

## 3. Entidades y Modelo de Datos de Dominio
1. **ClubLegendaryStatus (`club_idols`)**:
   - `id` (UUID, PK).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `player_id` (UUID, FK -> `players.id`).
   - `player_name` (String): Nombre del futbolista.
   - `idol_tier` (Enum: `FAVORITE`, `IDOL`, `IMMORTAL_LEGEND`).
   - `idol_points_accumulated` (Integer, Default 0).
   - `matches_played_for_club` (Integer, Default 0).
   - `goals_scored_for_club` (Integer, Default 0).
   - `titles_won_with_club` (Integer, Default 0).
   - `is_retired` (Boolean, Default false): True si ya colgó las botas.
   - `retired_jersey_number` (Integer, Nullable): Dorsal inmortalizado.
   - `named_stand_after_him` (String, Nullable): Tribuna bautizada en el estadio.
   - `updated_at` (Timestamp UTC).
   - **Restricción Unívoca:** `UNIQUE (club_id, player_id)`.

2. **LegendHonorsAudit (`club_legend_honors_log`)**:
   - `id` (UUID, PK).
   - `club_id` (UUID).
   - `player_id` (UUID).
   - `honor_type` (Enum: `JERSEY_RETIRED`, `STAND_NAMED`, `STATUE_BUILT`, `HALL_OF_FAME_INDUCTED`).
   - `honor_details` (String).
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados de la Idolatría
```
[JUGADOR_ORDINARIO] ──(Acumula partidos, goles y títulos)──► [FAVORITO_DE_LA_HINCHADA (150-349 pts)]
                                                                        │
                                                               (Años de lealtad y copas)
                                                                        │
                                                                        ▼
                                                             [IDOLO_DEL_CLUB (350-699 pts)]
                                                                        │
                                                               (Hazaña histórica / Retiro)
                                                                        │
                                                                        ▼
                                                             [LEYENDA_INMORTAL (700+ pts)]
                                                                        │
                                   ┌────────────────────────────────────┼────────────────────────────────────┐
                                   ▼                                    ▼                                    ▼
                         [RETIRAR_DORSAL]                       [BAUTIZAR_TRIBUNA]                     [ERIGIR_ESTATUA]
```

### Transición Principal: Concesión de Homenaje Institucional
- **Actor:** DT humano o presidente del club al retirarse un futbolista consagrado.
- **Precondiciones:**
  1. El futbolista tiene `idol_tier == 'IMMORTAL_LEGEND'` o `idol_points_accumulated >= 500`.
  2. El dorsal a retirar no está asignado actualmente a otro jugador del plantel.
- **Comando:** `BestowClubLegendHonorCommand(clubId, playerId, honorType, tributeDetails)`.
- **Consecuencias:**
  1. Si `JERSEY_RETIRED`: Bloquea el `jersey_number` en `club_idols` impidiendo que vuelva a asignarse en el primer equipo.
  2. Si `STAND_NAMED`: Bautiza la tribuna en `club_stadiums` y suma +5 de fervor a la hinchada.
  3. Inserta auditoría en `club_legend_honors_log`.
  4. Emite evento de dominio `CLUB_LEGEND_HONORED`.
- **Idempotencia:** No se puede retirar el mismo dorsal dos veces ni rebautizar la misma tribuna sin orden explícita.

## 5. Flujo Funcional Paso a Paso
1. **La Vida de un Canterano:** Un delantero surgido de las inferiores del club (Fase 18) juega 12 temporadas ininterrumpidas, disputa 340 partidos oficiales, anota 142 goles y conquista 2 ascensos y 1 copa continental.
2. **Consagración Popular:**
   - Su puntaje de idolatría alcanza los 890 puntos.
   - La afición lo declara oficialmente **Leyenda Inmortal del Club**.
3. **El Partido de Despedida:** En su último partido antes de retirarse a los 35 años, el estadio se llena para ovacionarlo.
4. **Homenaje Institucional:**
   - El DT y la directiva votan retirar para siempre su histórica camiseta #9.
   - La cabecera popular del estadio es rebautizada como "Tribuna Popular [Nombre del Ídolo]".
5. **Legado Perpetuo:** El jugador cuelga las botas. Su nombre queda grabado para siempre en el Museo del Club (Fase 36) y en la memoria afectiva de los hinchas.

## 6. Reglas Específicas
- **Regla 37.1 — Dorsal Inmortal Intocable:** Si un dorsal es retirado (ej: #9), ningún nuevo fichaje ni canterano promovido puede elegir ese número. El generador procedural de dorsales salta automáticamente los números retirados.
- **Regla 37.2 — Maltrato a un Ídolo:** Si el DT rescinde unilateralmente el contrato de un futbolista con rango `IDOL` o `IMMORTAL_LEGEND`:
  - La afición organiza protestas masivas (`fan_support_score` cae -25 puntos).
  - La moral del vestuario se desmorona (-20 puntos en todo el plantel).
  - La directiva reduce la confianza en el DT en -15 puntos por dañar la imagen institucional.
- **Regla 37.3 — Ídolos Extranjeros vs Canteranos:** Los futbolistas formados en la cantera (`is_homegrown = true`) acumulan puntos de idolatría un 25% más rápido por la afinidad identitaria del barrio.
- **Regla 37.4 — Inmutabilidad del Estatus de Leyenda:** Un futbolista que alcanzó el estatus de Ídolo Inmortal jamás pierde su condición en el club, incluso si tras su retiro decide trabajar en otro equipo.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`club_idols_rules.json`):
- `favorite_tier_threshold`: 150 puntos.
- `idol_tier_threshold`: 350 puntos.
- `legend_tier_threshold`: 700 puntos.
- `homegrown_points_bonus_multiplier`: 1.25.
- `jersey_retirement_min_points`: 500 puntos.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Lista de ídolos activos y retirados del club, puntos de idolatría acumulados por cada jugador, honores institucionales concedidos (dorsales retirados, tribunas con nombre), estatuas en el club.
- **Parcial:** Nivel de devoción de la hinchada hacia un futbolista ("El jugador más querido de la platea").
- **Oculta al Cliente:** Ninguna (el amor de una hinchada es transparente y apasionado).

## 9. Inteligencia Artificial / Leyendas de Rivales
Los clubes rivales también rinden culto a sus propios ídolos históricos, reconociéndose sus dorsales retirados al enfrentarlos en la liga.

## 10. Eventos y Auditoría
- `PLAYER_REACHED_IDOL_TIER`: Ascenso de futbolista al cuadro de ídolos.
- `CLUB_LEGEND_HONORED`: Retiro de dorsal o inauguración de tribuna.
- `IDOL_MISTREATMENT_OUTRAGE`: Escándalo institucional por maltratar a una leyenda.

## 11. Idempotencia y Mitigación de Errores de Red
- El endpoint `POST /api/v1/club/legends/:id/honor` valida que el honor no haya sido ya otorgado a esa entidad, impidiendo dobles bautismos de tribunas o colisiones en dorsales.

## 12. Concurrencia
- La transacción de retiro de camiseta bloquea `club_idols` y `players` con `FOR UPDATE`, garantizando que ningún jugador sea asignado a ese dorsal en el mismo instante.

## 13. Persistencia y Ciclo de Vida
- Los ídolos e inmortalizaciones persisten para siempre en la base de datos de la carrera.

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de Ídolos y Leyendas / Galería de Honor.
- **¿Qué puedo hacer?:** Conocer a los máximos referentes históricos del club y conceder homenajes póstumos a quienes lo dejaron todo en la cancha.
- **¿Qué cuesta?:** Sin coste monetario.
- **¿Qué puede pasar?:** Si cuidas a tus ídolos, el vestuario te respetará ciegamente.
- **¿Qué ocurrió?:** Placa conmemorativa en la interfaz: *"Dorsal #10 retirado en honor a la Leyenda Inmortal del Club"*.

## 15. Casos Extremos
- **Ídolo que se marcha a jugar al clásico rival:** Traición histórica. Pierde el 80% de sus puntos de idolatría y pasa al libro negro del club como persona no grata.
- **DT que se convierte en ídolo institucional:** El DT humano también acumula puntos de idolatría; al ganar 3 títulos, una tribuna del estadio puede ser bautizada con el nombre del propio DT.

## 16. Anti-Exploits
- **Retirar todos los números del 1 al 99:** Solo se permite retirar números para futbolistas que hayan alcanzado al menos 500 puntos de idolatría legítimos en partidos oficiales.

## 17. Observabilidad y Métricas
- Cantidad promedio de ídolos generados por club en 15 temporadas.
- Frecuencia de dorsales retirados.
- Impacto de los ídolos en la venta comercial de camisetas del club.

## 18. Matriz de Pruebas
1. Futbolista alcanza 350 puntos de idolatría -> Estatus actualizado automáticamente a `IDOL`.
2. Retiro formal de dorsal #10 -> Bloqueado en `club_idols`, el generador de dorsales no permite volver a usarlo.
3. Despido injustificado de un Ídolo -> Detona `IDOL_MISTREATMENT_OUTRAGE`, caída masiva de moral y apoyo popular.
4. Intento de retirar camiseta a jugador con solo 50 puntos -> HTTP 400 `ERR_NOT_ELIGIBLE_FOR_RETIREMENT`.
5. Bautismo de tribuna -> Tribuna registrada en `club_stadiums` y bonus de fervor aplicado.

## 19. Criterios de Aceptación
- [x] Modelo de ídolos, baremo de puntos y honores formalizado.
- [x] Máquina de estados de los 3 escalafones de veneración cerrada.
- [x] Backend como autoridad absoluta de cálculo de méritos y lealtad.
- [x] Consecuencias de maltrato a referentes cuantificadas.
- [x] Retiro de dorsales y estatuas implementados por diseño.
- [x] Eventos y auditoría de leyendas registrados inmutablemente.
- [x] Idempotencia estricta en la concesión de homenajes.
- [x] Concurrencia con bloqueo pesimista en dorsales resuelta.
- [x] Baremo de puntos de idolatría versionado en JSON.
- [x] Casos extremos de traiciones a clásicos rivales cubiertos.
- [x] Anti-exploits de retiro masivo de números neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `ClubIdolsService`, `IdolPointsCalculator`, `LegendHonorManager`, `IdolRepository`.
- **Comandos:** `UpdateIdolPointsAfterMatchCommand`, `BestowClubLegendHonorCommand`, `HandleIdolDepartureCommand`.
- **Queries:** `GetClubIdolsQuery`, `GetRetiredJerseysQuery`.
- **Políticas DB:** `ALTER TABLE club_idols ADD CONSTRAINT uq_club_retired_number UNIQUE (club_id, retired_jersey_number)`.
