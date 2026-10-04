# FASE 38 — SALÓN DE LA FAMA Y RÉCORDS HISTÓRICOS GLOBALES
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Definir el contrato funcional de dominio para el Salón de la Fama global (**Hall of Fame**), el ranking ecuménico de entrenadores históricos, el algoritmo autoritativo de puntos de legado (**Legacy Score**) y la inducción perpetua de directores técnicos retirados en *Del Potrero al Ídolo*. De acuerdo con las **Reglas Maestras 1, 3, 11 y 14**, el Salón de la Fama es una estructura inmutable: preserva snapshots definitivos de carreras cerradas, permitiendo al usuario comparar su huella frente a los mitos legendarios del fútbol mundial.

## 2. Alcance específico
- Fórmula Algorítmica de Puntos de Legado (`legacy_score`):
  - +2 puntos por partido oficial dirigido.
  - +5 puntos por partido ganado.
  - +(Efectividad % × 10) puntos de bonificación por consistencia.
  - +150 puntos por cada Ascenso de División conseguido.
  - +200 puntos por cada Copa Nacional ganada.
  - +400 puntos por cada Título de Primera División (Tier 1).
  - +800 puntos por cada Copa Continental (Libertadores).
  - +1,500 puntos por ganar la Copa del Mundo de Selecciones (Fase 33).
  - +100 puntos por cada canterano formado que alcanzó la Selección Nacional.
- Podio de Honor y Ranking Global Multicarrera: Posiciones históricas absolutas indexadas en el servidor (`legacy_score DESC`).
- Tabla de Leyendas Canónicas Pre-cargadas (Benchmarks Históricos): Carlos Bianchi, Marcelo Gallardo, Pep Guardiola, Sir Alex Ferguson, Helenio Herrera, Marcelo Bielsa.
- Herramienta de Comparación Directa de Carrera (Cara a Cara / Head-to-Head): Comparador cuantitativo de títulos, victorias, efectividad y longevidad entre el DT humano y cualquier entrenador del Salón de la Fama.
- Inducción Oficial al Retiro: Snapshot final inmutable transferido a `hall_of_fame` al colgar el silbato (Fase 40).

## 3. Entidades y Modelo de Datos de Dominio
1. **HallOfFameMember (`hall_of_fame`)**:
   - `id` (UUID, PK): Identificador inmutable en el panteón de los grandes.
   - `career_id` (UUID, Nullable, FK -> `careers.id`): Null si es un mito histórico precargado.
   - `manager_id` (UUID, Nullable, FK -> `managers.id`).
   - `manager_name` (String, 3 a 50 caracteres): Nombre inmortalizado.
   - `nationality` (String, ISO-2).
   - `legacy_score` (Integer, Indexed DESC): Puntaje total acumulado.
   - `legacy_rank` (Enum: `MYTH`, `IMMORTAL`, `LEGEND`, `CONSECRATED`, `HONORABLE`).
   - `total_matches` (Integer).
   - `total_won` (Integer).
   - `total_drawn` (Integer).
   - `total_lost` (Integer).
   - `win_rate_percentage` (Numeric 5,2).
   - `titles_count` (Integer).
   - `trophies_summary` (JSONB): Desglose estructurado de copas ganadas.
   - `promotions_count` (Integer).
   - `primary_club_name` (String): Club con el que construyó su dinastía.
   - `is_canonical_legend` (Boolean, Default false): True para leyendas reales del fútbol mundial.
   - `inducted_at` (Timestamp UTC).

2. **LegacyAuditRecord (`legacy_audit_log`)**:
   - `id` (UUID, PK).
   - `manager_id` (UUID).
   - `legacy_score_calculated` (Integer).
   - `raw_metrics_snapshot` (JSONB): Auditoría de partidos, copas y deltas de cálculo.
   - `inducted_by_event` (String: `CAREER_RETIREMENT`, `MANUAL_INDUCTION`).
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados del Salón de la Fama
```
[CARRERA_EN_CURSO] ──(Acumula victorias, ascensos y títulos)──► [PROYECTANDO_LEGACY_SCORE]
                                                                          │
                                                      (Command: InductManager / Retiro Fase 40)
                                                                          │
                                                                          ▼
                                                              [CALCULANDO_SCORE_FINAL_EN_BD]
                                                                          │
                                                                          ▼
                                                              [SNAPSHOT_INMUTABLE_INSERTADO]
                                                                          │
                                                                          ▼
                                                              [INDUCCION_OFICIAL_CONFIRMADA]
                                                              (Posición eterna en el Podio)
```

### Transición Principal: Inducción al Salón de la Fama
- **Actor:** Servidor durante el proceso de retiro oficial del DT (Fase 40).
- **Precondiciones:**
  1. `managers.is_retired == true` o retiro confirmado.
  2. No existe una entrada previa en `hall_of_fame` para el `manager_id` (idempotencia estricta).
- **Comando:** `InductManagerToHallOfFameCommand(managerId)`.
- **Consecuencias:**
  1. Ejecuta la fórmula matemática oficial de `legacy_score` en el backend leyendo el historial íntegro de partidos y títulos en `manager_career_stints`.
  2. Asigna el rango de gloria correspondiente.
  3. Inserta la fila inmutable en `hall_of_fame`.
  4. Inserta el log en `legacy_audit_log`.
  5. Emite evento de dominio `MANAGER_INDUCTED_TO_HALL_OF_FAME`.
- **Idempotencia:** Si ya existe en el Salón de la Fama, el comando retorna el registro existente sin alterar la puntuación ni crear duplicados.

## 5. Flujo Funcional Paso a Paso
1. **Consulta del Olimpo Futbolero:** El DT accede a la sección "Salón de la Fama" desde el menú de Carrera.
2. **Presentación del Ranking:**
   - La pantalla muestra el ranking histórico liderado por Sir Alex Ferguson (4,250 pts) y Carlos Bianchi (3,890 pts).
   - El DT humano observa su posición proyectada actual (ej: Puesto 14 con 1,420 pts, rango "Consagrado").
3. **Comparador Cara a Cara (Head-to-Head):**
   - El DT selecciona "Comparar con Carlos Bianchi".
   - La interfaz dibuja gráficos comparativos: Partidos dirigidos, Efectividad (%), Títulos locales y Copas Libertadores.
4. **Inducción Definitiva:** Al momento del retiro voluntario (Fase 40), el servidor congela su foto final:
   - 620 partidos, 385 victorias, 62% efectividad, 3 ascensos, 2 ligas y 1 Copa Continental.
   - Puntuación de Legado Definitiva: 2,740 puntos.
   - El DT supera a mitos contemporáneos e ingresa al Top 5 histórico con rango "Leyenda Inmortal".

## 6. Reglas Específicas
- **Regla 38.1 — Inmutabilidad de Miembros Inducidos (Master Rule 14):** Una vez que un entrenador es inducido al Salón de la Fama, su fila en `hall_of_fame` queda sellada contra mutaciones. Ninguna simulación posterior puede alterar su `legacy_score`.
- **Regla 38.2 — Aislamiento de Carreras con Benchmark Canónico:** Las leyendas canónicas pre-cargadas (Bianchi, Ferguson, etc.) están presentes como faros de comparación en todas las carreras; los DTs humanos creados por el usuario solo se incorporan al Salón de la Fama de su propia carrera.
- **Regla 38.3 — Cero Manipulación de Puntos:** El `legacy_score` es calculado exclusivamente por una función pura determinista en el servidor. El cliente no envía puntos de legado en ningún DTO.
- **Regla 38.4 — Indexación de Alto Rendimiento:** La tabla `hall_of_fame` debe estar indexada por un índice B-Tree descendente `legacy_score DESC` para garantizar que la consulta del Top 100 responda en menos de 20ms.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`hall_of_fame_rules.json`):
- `points_per_match_managed`: 2.
- `points_per_match_won`: 5.
- `points_per_promotion`: 150.
- `points_tier_1_title`: 400.
- `points_continental_cup`: 800.
- `points_world_cup`: 1,500.
- **Escala de Rangos:**
  - `MYTH`: >= 3,500 pts.
  - `IMMORTAL`: 2,500 a 3,499 pts.
  - `LEGEND`: 1,500 a 2,499 pts.
  - `CONSECRATED`: 800 a 1,499 pts.
  - `HONORABLE`: < 800 pts.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Ranking histórico global completo, desglose detallado de puntos de legado de cada miembro, vitrina de copas de las leyendas y comparador estadístico cara a cara.
- **Parcial:** Ninguna.
- **Oculta al Cliente:** Ninguna (el Salón de la Fama es el monumento público definitivo del fútbol).

## 9. Inteligencia Artificial / Entrenadores Rivales
Los entrenadores de IA destacados que alcancen marcas históricas notables también son inducidos al Salón de la Fama al retirarse, poblando el panteón con los rivales que marcaron la época del usuario.

## 10. Eventos y Auditoría
- `HALL_OF_FAME_INDUCTION_COMPLETED`: Inducción oficial con puntaje auditado.
- `LEGACY_MILESTONE_SURPASSED`: Superación de una leyenda canónica en el ranking.

## 11. Idempotencia y Mitigación de Errores de Red
- El endpoint `POST /api/v1/hall-of-fame/induct` valida contra `hall_of_fame(manager_id)`. Si se invoca repetidamente por fallos de red, devuelve el registro existente sin alterar la tabla ni crear clones en el podio.

## 12. Concurrencia
- La transacción de inducción adquiere bloqueo pesimista en `managers` y `hall_of_fame` con `FOR UPDATE`.

## 13. Persistencia y Ciclo de Vida
- El Salón de la Fama es permanente y constituye el archivo de honor definitivo del juego.

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Salón de la Fama / Panteón de los Inmortales.
- **¿Qué puedo hacer?:** Analizar el ranking ecuménico de directores técnicos y comparar tus números con los grandes del fútbol mundial.
- **¿Qué cuesta?:** Sin coste.
- **¿Qué puede pasar?:** Tu carrera quedará esculpida en mármol y oro para toda la eternidad.
- **¿Qué ocurrió?:** Credencial dorada interactiva con el podio de los 3 mejores y tu puesto destacado en el ranking.

## 15. Casos Extremos
- **DT que se retira sin ganar ningún título:** Es inducido con rango "Honorable" reconociéndose su longevidad y partidos dirigidos con esfuerzo de potrero.
- **Empate exacto de puntos de legado entre dos técnicos:** Se desempata autoritativamente por mayor cantidad de títulos conquistados; si persiste la igualdad, por mejor porcentaje de efectividad de victorias.

## 16. Anti-Exploits
- **Inyección de puntos de legado falsos:** El backend ignora cualquier cifra enviada por el cliente y recalcula los puntos directamente desde el ledger histórico de partidos oficiales.

## 17. Observabilidad y Métricas
- Distribución de rangos de gloria alcanzados por los usuarios al retirarse.
- Porcentaje de jugadores que logran superar a las leyendas canónicas en el ranking.
- Latencia de consulta del Salón de la Fama (< 25ms con índice B-Tree).

## 18. Matriz de Pruebas
1. Cálculo de Legacy Score con 100 victorias, 1 ascenso y 1 título de Tier 1 -> Devuelve puntuación matemáticamente exacta según catálogo de balance.
2. Inducción al Salón de la Fama -> Creado en `hall_of_fame`, datos consistentes con la carrera.
3. Intento de inducir dos veces al mismo DT -> Idempotente, 0 duplicados en base de datos.
4. Consulta de ranking global -> Ordenado estrictamente por `legacy_score DESC`.
5. Comparador Head-to-Head -> Devuelve las diferencias métricas exactas entre ambos entrenadores.

## 19. Criterios de Aceptación
- [x] Modelo de Salón de la Fama, leyendas canónicas y ledger formalizado.
- [x] Máquina de estados de inducción definitiva cerrada.
- [x] Backend como autoridad absoluta de la fórmula matemática de puntos de legado.
- [x] Comparador interactivo cara a cara contra mitos del fútbol delimitado.
- [x] Inducción de entrenadores de IA destacados implementada.
- [x] Eventos y auditoría de inmortales registrados inmutablemente (Master Rule 14).
- [x] Idempotencia estricta en el sellado del snapshot.
- [x] Concurrencia con bloqueo pesimista resuelta.
- [x] Ponderaciones de puntos y rangos versionadas en JSON.
- [x] Casos de empates en el podio cubiertos.
- [x] Anti-exploits de alteración de puntuación neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `HallOfFameService`, `LegacyScoreCalculator`, `HeadToHeadComparatorEngine`, `HallOfFameRepository`.
- **Comandos:** `InductManagerCommand`, `SeedCanonicalLegendsCommand`.
- **Queries:** `GetHallOfFameRankingQuery`, `CompareManagersHeadToHeadQuery`.
- **Políticas DB:** `CREATE INDEX idx_hall_of_fame_score ON hall_of_fame(legacy_score DESC)`.
