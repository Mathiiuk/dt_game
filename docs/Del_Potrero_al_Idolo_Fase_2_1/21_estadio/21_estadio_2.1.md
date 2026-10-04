# FASE 21 — ESTADIO, INFRAESTRUCTURA Y MEJORAS EDILICIAS
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Definir el contrato funcional de dominio para la gestión del estadio, ampliación de tribunas, mantenimiento del terreno de juego, torres de iluminación e instalaciones del club en *Del Potrero al Ídolo*. De acuerdo con las **Reglas Maestras 1, 2, 7 y 8**, el servidor es la autoridad de validación financiera y temporal de las obras: cada ampliación consume fondos autorizados de tesorería, requiere un plazo de semanas de construcción en el calendario y aumenta permanentemente la capacidad de recaudación por boletería.

## 2. Alcance específico
- Capacidad y Graderías del Estadio: Gradas populares de tablones (Nivel 1), Tribunas de cemento (Nivel 2), Plateas con butacas (Nivel 3), Palcos VIP techados (Nivel 4).
- Calidad y Mantenimiento del Césped (0 a 100): Terreno de tierra/pozos (Nivel 1), Césped natural rústico (Nivel 2), Césped profesional resembrado (Nivel 3), Césped híbrido con drenaje moderno (Nivel 4). Impacta directamente en el riesgo de lesiones y en el estilo de juego (fase 09).
- Iluminación Artificial: Focos halógenos para habilitación de partidos nocturnos por TV (mejora los ingresos de televisación).
- Proyectos de Obras en Construcción: Plazos de entrega en semanas de calendario y bloqueo de sectores durante remodelaciones.
- Costes fijos de mantenimiento semanal según el aforo y tecnología instalada.

## 3. Entidades y Modelo de Datos de Dominio
1. **ClubStadium (`club_stadiums`)**:
   - `id` (UUID, PK).
   - `club_id` (UUID, FK -> `clubs.id`, Unique).
   - `stadium_name` (String, 3 a 50 caracteres).
   - `capacity` (Integer, 1000 a 80000): Aforo total habilitado.
   - `pitch_quality` (Integer, 1-100, Default 60): Estado del terreno de juego.
   - `stands_tier` (Integer, 1-4, Default 1): Tipo de tribunas.
   - `floodlights_installed` (Boolean, Default false): Luces para partidos nocturnos.
   - `vip_boxes_count` (Integer, Default 0): Palcos corporativos.
   - `weekly_maintenance_cost` (Numeric 8,2): Gasto fijo debitado en economía.
   - `updated_at` (Timestamp UTC).

2. **StadiumConstructionProject (`stadium_projects`)**:
   - `id` (UUID, PK).
   - `club_id` (UUID, FK -> `clubs.id`).
   - `project_type` (Enum: `EXPAND_CAPACITY`, `RESURFACING_PITCH`, `INSTALL_FLOODLIGHTS`, `BUILD_VIP_BOXES`).
   - `cost_paid` (Numeric 12,2): Inversión desembolsada.
   - `capacity_delta` (Integer, Default 0): Aforo adicional proyectado.
   - `weeks_remaining` (Integer): Semanas de obra restantes.
   - `status` (Enum: `UNDER_CONSTRUCTION`, `COMPLETED`, `CANCELLED`).
   - `created_at` (Timestamp UTC).

3. **StadiumAuditLog (`stadium_audit_log`)**:
   - `id` (UUID, PK).
   - `club_id` (UUID).
   - `action` (String: `CONSTRUCTION_STARTED`, `CONSTRUCTION_COMPLETED`, `PITCH_DEGRADED`).
   - `cost` (Numeric 12,2).
   - `capacity_before` (Integer).
   - `capacity_after` (Integer).
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados de Infraestructura
```
[ESTADIO_EN_OPERACION] ──(Command: StartStadiumUpgrade)──► [VALIDANDO_FONDOS_Y_AUTORIZACION]
                                                                     │
                                                                     ▼
                                                          [FONDOS_DEBITADOS_DE_TESORERIA]
                                                                     │
                                                                     ▼
                                                          [OBRA_EN_CURSO (weeks_remaining > 0)]
                                                                     │
                                                    (Avance de calendario semanal Fase 07)
                                                                     │
                                                                     ▼
                                                          [OBRA_FINALIZADA (weeks = 0)]
                                                                     │
                                                          [AFORO_O_CESPED_ACTUALIZADO]
```

### Transición Principal: Inicio de Proyecto de Ampliación
- **Actor:** DT humano o presidente del club.
- **Precondiciones:**
  1. No existe otro proyecto de infraestructura simultáneo en construcción (`COUNT(stadium_projects WHERE status = 'UNDER_CONSTRUCTION') == 0`).
  2. `club_finances.balance >= project_cost`.
- **Comando:** `StartStadiumUpgradeCommand(clubId, projectType, targetTier)`.
- **Consecuencias:**
  1. Debita `project_cost` de `club_finances.balance`.
  2. Inserta la fila en `stadium_projects` con `status = 'UNDER_CONSTRUCTION'` y las semanas de obra estipuladas.
  3. Inserta auditoría contable en `financial_transactions_ledger`.
  4. Invalida la caché `club:screen:${clubId}`.
- **Idempotencia:** No se permite iniciar dos obras con la misma clave de mutación.
- **Errores:** `ERR_INSUFFICIENT_FUNDS_FOR_UPGRADE`, `ERR_CONSTRUCTION_ALREADY_IN_PROGRESS`.

## 5. Flujo Funcional Paso a Paso
1. **Inspección del Estadio:** El DT entra a "Club" -> "Estadio". El aforo actual es de 1,500 personas y las entradas se agotan todos los fines de semana (100% de ocupación).
2. **Evaluación de Ampliación:** La opción de "Ampliación de Cabecera Popular (+1,000 personas)" cuesta $20,000 y demora 6 semanas de obra.
3. **Inicio de Obra:** El DT confirma la inversión. El servidor descuenta $20,000 de la caja y programa el proyecto.
4. **Semanas de Construcción:** Durante las 6 semanas de calendario (Fase 07), el estadio opera normalmente con su capacidad actual mientras las semanas de obra se descuentan una a una.
5. **Inauguración:** En la semana 6, la obra concluye. La capacidad pasa oficialmente de 1,500 a 2,500 localidades. En el siguiente partido de local, la recaudación de taquilla aumenta en un 66%.

## 6. Reglas Específicas
- **Regla 21.1 — Impacto del Césped en el Juego:**
  - Césped < 50 puntos (Potrero irregular): Aumenta un 25% la probabilidad de fallos en pases cortos y duplica el riesgo de esguinces de tobillo en jugadores técnicos.
  - Césped >= 85 puntos (Billar profesional): Bonifica el fútbol de posesión (`SHORT_TIKI`) con +10% de efectividad de pase.
- **Regla 21.2 — Desgaste Gradual del Césped:** Cada partido disputado de local desgasta el terreno en -3 puntos de calidad. Se debe contratar mantenimiento periódico para resembrar.
- **Regla 21.3 — Una Sola Obra Simultánea:** Para evitar dispersión de recursos, el club solo puede ejecutar un proyecto de infraestructura mayor a la vez.
- **Regla 21.4 — Coste Proporcional de Mantenimiento:** Cada 1,000 asientos de capacidad adicional incrementa el mantenimiento semanal en +$40.00 fijos.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`stadium_balance.json`):
- **Proyectos de Capacidad:**
  - `+1,000 populares`: Coste $20,000, Duración 6 semanas.
  - `+3,000 tribuna lateral`: Coste $55,000, Duración 12 semanas.
  - `+10,000 estadio provincial`: Coste $180,000, Duración 24 semanas.
- **Mejoras de Césped:**
  - `Resiembra y nivelado`: Coste $3,500, Duración 2 semanas, sube césped a 85/100.
  - `Césped híbrido calefaccionado`: Coste $40,000, Duración 8 semanas, fija césped en 98/100 permanente.
- `floodlights_cost`: $15,000, Duración 4 semanas, habilita +$300 semanales por TV.

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Nombre del estadio, aforo actual, desglose por sectores, calidad del césped (barra 1-100), estado de obras en curso, costes de mantenimiento semanal y retorno de inversión estimado en taquilla.
- **Parcial:** Ninguna.
- **Oculta al Cliente:** Ninguna (la infraestructura es física y visible).

## 9. Inteligencia Artificial / Estadios Rivales
Los clubes de IA amplían sus estadios automáticamente al ascender de división si cuentan con superávit en su tesorería.

## 10. Eventos y Auditoría
- `STADIUM_UPGRADE_STARTED`: Inicio de obras y desembolso.
- `STADIUM_UPGRADE_COMPLETED`: Inauguración oficial del nuevo aforo.
- `PITCH_RESURFACED`: Renovación del césped.

## 11. Idempotencia y Mitigación de Errores de Red
- El endpoint `POST /api/v1/club/stadium/upgrade` valida que no exista un proyecto en curso con la misma clave de idempotencia, impidiendo débitos dobles de tesorería.

## 12. Concurrencia
- La operación bloquea la fila en `club_finances` y `club_stadiums` con `FOR UPDATE`, evitando que se gaste el dinero dos veces en acciones simultáneas de mercado y estadio.

## 13. Persistencia y Ciclo de Vida
- Las mejoras edilicias son permanentes e inmutables. El aforo alcanzado nunca se pierde y conforma el patrimonio histórico del club a través de las décadas.

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla del Estadio e Infraestructura del Club.
- **¿Qué puedo hacer?:** Administrar tribunas, reparar el césped o planificar la gran ampliación.
- **¿Qué cuesta?:** Desembolso de capital inmediato y semanas de obras.
- **¿Qué puede pasar?:** Si juegas en un terreno en pésimo estado, tus mejores delanteros se lesionarán con mayor frecuencia.
- **¿Qué ocurrió?:** Vista renderizada del estadio con indicador de progreso de obras (ej: "3 semanas restantes").

## 15. Casos Extremos
- **Descenso de división con estadio gigante:** El coste de mantenimiento fijo puede asfixiar las finanzas si no se ajustan los salarios del plantel a la nueva categoría.
- **Bancarrota durante la obra:** Las obras en curso no se detienen, pero el club queda en déficit extremo con sanciones dirigenciales (Fase 20 / 23).

## 16. Anti-Exploits
- **Ampliaciones gratuitas:** Todo incremento de capacidad requiere el cobro autoritativo en base de datos.
- **Estadios con aforo negativo o infinito:** Restricción `CHECK (capacity BETWEEN 500 AND 120000)`.

## 17. Observabilidad y Métricas
- Distribución de capacidades de estadios en cada división.
- Retorno de inversión promedio de las ampliaciones (cuántas fechas tarda en amortizarse).
- Frecuencia de obras ejecutadas por temporada.

## 18. Matriz de Pruebas
1. Iniciar ampliación con saldo suficiente -> Fondos debitados, proyecto en `UNDER_CONSTRUCTION`.
2. Intento de iniciar obra sin dinero suficiente -> HTTP 400 `ERR_INSUFFICIENT_FUNDS_FOR_UPGRADE`.
3. Intento de iniciar segunda obra mientras una está en curso -> HTTP 409 `ERR_CONSTRUCTION_ALREADY_IN_PROGRESS`.
4. Transcurso de semanas de obra -> Capacidad actualizada en base de datos al llegar a 0 semanas.
5. Verificación de degradación del césped tras disputar partido de local.

## 19. Criterios de Aceptación
- [x] Modelo de estadio, proyectos de obras y auditoría formalizado.
- [x] Máquina de estados de construcción y finalización cerrada.
- [x] Backend como autoridad absoluta de costes y entrega de aforo.
- [x] Impacto físico y táctico de la calidad del césped cuantificado.
- [x] Unicidad de proyecto activo y control de finanzas resuelto.
- [x] Eventos y auditoría de infraestructura implementados.
- [x] Idempotencia estricta en el inicio de remodelaciones.
- [x] Concurrencia con bloqueo pesimista resuelta.
- [x] Balance de costes y plazos de obra versionado en JSON.
- [x] Casos de césped en ruinas y descensos cubiertos.
- [x] Anti-exploits de aforos imposibles neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `StadiumManagementService`, `PitchQualityEngine`, `StadiumRepository`, `ConstructionProjectTracker`.
- **Comandos:** `StartStadiumUpgradeCommand`, `ResurfacePitchCommand`, `AdvanceConstructionWeeksCommand`.
- **Queries:** `GetStadiumDetailsQuery`, `GetActiveConstructionProjectQuery`.
- **Políticas DB:** `ALTER TABLE club_stadiums ADD CONSTRAINT chk_capacity_range CHECK (capacity BETWEEN 500 AND 120000)`.
