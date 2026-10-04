# FASE 19 — CUERPO TÉCNICO, STAFF Y ESPECIALISTAS
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Definir el contrato funcional de dominio para el cuerpo técnico auxiliar, los preparadores y especialistas multidisciplinarios del club en *Del Potrero al Ídolo*. De acuerdo con las **Reglas Maestras 1, 2, 6 y 13**, el servidor es la autoridad de contratación, devengo de salarios y aplicación de bonificaciones operativas pasivas: cada empleado contratado potencia subsistemas específicos (recuperación de lesiones, calidad de entrenamientos, precisión de ojeo y consejos tácticos en vivo).

## 2. Alcance específico
- 5 Roles Esenciales de Staff Técnico:
  - **Segundo Entrenador (Ayudante de Campo):** Aporta consejos tácticos durante el partido, asume la dirección interina en caso de sanción del DT y mejora la disciplina de vestuario (+cohesión).
  - **Preparador Físico:** Aumenta la velocidad de recuperación semanal de `fitness` (+15% a +35%) y reduce lesiones por fatiga.
  - **Fisioterapeuta / Médico:** Reduce el tiempo de baja médica de jugadores lesionados (hasta un 40% de reducción en semanas de convalecencia).
  - **Jefe de Ojeadores (Scout Principal):** Reduce el margen de error en reportes de scouting y acelera el tiempo de entrega de informes.
  - **Entrenador de Porteros:** Aumenta en un 25% el desarrollo de atributos específicos de arqueros en entrenamientos.
- Pool de Empleados Disponibles: Generación de candidatos con niveles de habilidad (1 a 20) y pretensiones salariales.
- Gestión Contractual del Staff: Contratación, salario semanal deducido en el presupuesto operativo del club y despido con indemnización.
- Límite de Estructura: Exactamente 1 empleado por cada rol especializado.

## 3. Entidades y Modelo de Datos de Dominio
1. **ClubStaffMember (`club_staff`)**:
   - `id` (UUID, PK): Identificador inmutable del empleado.
   - `club_id` (UUID, FK -> `clubs.id`).
   - `first_name` (String): Nombre.
   - `last_name` (String): Apellido.
   - `role` (Enum: `ASSISTANT_MANAGER`, `FITNESS_COACH`, `PHYSIO`, `HEAD_SCOUT`, `GOALKEEPER_COACH`).
   - `skill_rating` (Integer, 1-20): Calidad profesional en su especialidad.
   - `wage_weekly` (Numeric 8,2): Salario semanal devengado.
   - `contract_expires_at` (Date): Vigencia del contrato de trabajo.
   - `created_at`, `updated_at` (Timestamp UTC).
   - **Restricción Unívoca:** `UNIQUE (club_id, role)`.

2. **StaffCandidatePool (`staff_candidates`)**:
   - `id` (UUID, PK).
   - `career_id` (UUID, FK -> `careers.id`).
   - `first_name` (String).
   - `last_name` (String).
   - `role` (Enum).
   - `skill_rating` (Integer, 1-20).
   - `wage_demanded` (Numeric 8,2).
   - `status` (Enum: `AVAILABLE`, `HIRED`).

3. **StaffAuditLog (`staff_audit_log`)**:
   - `id` (UUID, PK).
   - `club_id` (UUID).
   - `staff_id` (UUID).
   - `role` (Enum).
   - `action` (String: `STAFF_HIRED`, `STAFF_DISMISSED`, `WAGE_PAID`).
   - `severance_cost` (Numeric 8,2, Default 0).
   - `timestamp` (Timestamp UTC).

## 4. Máquina de Estados del Staff
```
[ROL_VACANTE] ──(Command: HireStaffCandidate)──► [VALIDANDO_PRESUPUESTO_Y_ROL]
                                                           │
                                                           ▼
                                                [EMPLEADO_EN_FUNCIONES]
                                                           │
                               (Command: DismissStaffMember / Reemplazo directo)
                                                           │
                                                           ▼
                                                [INDEMNIZACION_DEBITADA]
                                                           │
                                                           ▼
                                                 [ROL_VACANTE_O_NUEVO]
```

### Transición T-01: Contratación de Especialista
- **Actor:** DT humano en representación del club.
- **Precondiciones:**
  1. El club tiene saldo operativo para afrontar el nuevo salario semanal en `club_finances`.
  2. El candidato está en estado `AVAILABLE`.
- **Comando:** `HireStaffCommand(clubId, candidateId)`.
- **Consecuencias:**
  1. Si el rol ya tenía un empleado, se despide al anterior abonando su finiquito y se reemplaza en `club_staff`.
  2. Se inserta o actualiza la fila en `club_staff` con el nuevo empleado.
  3. Se marca al candidato como `HIRED`.
  4. Se actualizan las bonificaciones pasivas del club en tiempo real.
  5. Inserta registro en `staff_audit_log`.
- **Idempotencia:** Solicitudes repetidas detectan al empleado ya contratado y devuelven HTTP 200 sin dobles contrataciones.
- **Errores:** `ERR_INSUFFICIENT_BUDGET_FOR_STAFF_WAGE`.

### Transición T-02: Despido de Especialista
- **Actor:** DT humano.
- **Precondiciones:** El empleado pertenece al club en el rol especificado.
- **Comando:** `DismissStaffCommand(clubId, staffRole)`.
- **Consecuencias:**
  1. Se calcula la indemnización: `severance = staff.wage_weekly * 8 semanas`.
  2. Se debita `severance` de `club_finances.balance`.
  3. Se elimina la fila de `club_staff` (el rol vuelve a estar vacante).
  4. Las bonificaciones pasivas del rol vuelven al valor base sin staff (1.0×).

## 5. Flujo Funcional Paso a Paso
1. **Auditoría de Staff:** El DT accede a "Cuerpo Técnico". Nota que el puesto de Fisioterapeuta está vacante y sus jugadores lesionados tardan semanas extras en recuperarse.
2. **Exploración de Candidatos:** Revisa la lista de fisioterapeutas desempleados:
   - Candidato A: Habilidad 8/20, Salario $120/sem.
   - Candidato B: Habilidad 14/20, Salario $280/sem.
3. **Decisión y Contratación:** Elige al Candidato B por su alta habilidad en fisioterapia.
4. **Validación Autoritaria:** El backend verifica que la tesorería pueda solventar $280 semanales.
5. **Impacto Inmediato:**
   - Se crea el registro de contratación.
   - El multiplicador de recuperación de lesiones del club pasa de 1.0× a 0.70× (reducción del 30% en tiempos de baja médica).
   - Los jugadores en enfermería ven reducidos sus plazos de recuperación en el siguiente avance de semana.

## 6. Reglas Específicas
- **Regla 19.1 — Unicidad por Rol:** No es posible contratar dos empleados para el mismo puesto (ej: no se permiten dos ayudantes de campo). Cada contratación sobre un rol ocupado rescinde automáticamente al anterior.
- **Regla 19.2 — Fórmulas de Bonificación Pasiva:**
  - `Fisioterapeuta`: `factor_reduccion_lesion = 1.0 - (0.02 * skill_rating)`. (Un fisio de 15 puntos reduce un 30% la convalecencia).
  - `Preparador Físico`: `bono_recuperacion_fitness = round(0.5 * skill_rating)`. (Hasta +10 puntos extra de fitness semanal).
  - `Jefe de Ojeadores`: `margen_error_scout = clamp(14 - floor(skill_rating * 0.6), 2, 14)`.
- **Regla 19.3 — Coste de Despido (8 semanas de indemnización):** Despedir a un empleado exige abonar 8 semanas de sueldo como liquidación legal obligatoria.
- **Regla 19.4 — Cero Bonificaciones sin Empleado:** Si un rol está vacante, el club opera con los valores mínimos de defecto del sistema (sin penalizaciones destructivas, pero sin ventajas competitivas).

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`staff_roles_balance.json`):
- `severance_weeks_penalty`: 8 semanas.
- `base_staff_wage_tier_5`: $100.00.
- `skill_wage_multiplier`: 1.25 por punto de habilidad sobre 5.
- `max_staff_members_per_club`: 5 (uno por cada rol).

## 8. Política de Información (Visible / Oculta)
- **Visible al DT:** Lista de empleados activos, habilidad numérica visible (1-20), salario semanal devengado, impacto cuantificado de su bonificación en pantalla (ej: "+30% velocidad de recuperación médica").
- **Parcial:** Ninguna.
- **Oculta al Cliente:** Ninguna (los contratos laborales de empleados son transparentes para el DT).

## 9. Inteligencia Artificial / Staff de Clubes Rivales
Los clubes de IA contratan automáticamente preparadores físicos y ayudantes según la solvencia económica de su categoría de liga.

## 10. Eventos y Auditoría
- `STAFF_MEMBER_HIRED`: Empleado contratado con salario y habilidad registrados.
- `STAFF_MEMBER_DISMISSED`: Rescisión laboral y pago de finiquito.
- `STAFF_WAGE_PROCESSED`: Débito de nómina de empleados en la cascada semanal.

## 11. Idempotencia y Mitigación de Errores de Red
- El endpoint `POST /api/v1/club/staff/hire` comprueba que el candidato no haya sido ya contratado. Múltiples envíos simultáneos dan lugar a una única contratación confirmada.

## 12. Concurrencia
- La operación utiliza la restricción única `UNIQUE (club_id, role)` con cláusula `ON CONFLICT (club_id, role) DO UPDATE`, garantizando atomicidad y cero errores de duplicados.

## 13. Persistencia y Ciclo de Vida
- Los empleados del staff permanecen contratados por temporadas consecutivas hasta que el DT decida reemplazarlos o desvincularse del club.

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de Cuerpo Técnico y Especialistas.
- **¿Qué puedo hacer?:** Ver quiénes integran el staff, despedir empleados y contratar especialistas del mercado laboral.
- **¿Qué cuesta?:** Suma un gasto fijo a la nómina salarial semanal del club.
- **¿Qué puede pasar?:** Un mejor preparador físico mantendrá a tus estrellas listas para jugar todos los fines de semana.
- **¿Qué ocurrió?:** Notificación en pantalla: *"Bienvenido al club: Marcos Paz ha asumido como Preparador Físico"*.

## 15. Casos Extremos
- **Club sin dinero para pagar el finiquito de despido:** El botón de rescindir se desactiva y advierte: *"Saldo insuficiente en cuenta para abonar la indemnización de $960"*.
- **DT despedido del club:** El staff técnico permanece en el club sirviendo al nuevo entrenador entrante.

## 16. Anti-Exploits
- **Contratar a 10 preparadores físicos para sumar +100 de fitness:** Bloqueado a nivel de base de datos con la restricción unívoca de 1 solo empleado por rol.

## 17. Observabilidad y Métricas
- Porcentaje de clubes que tienen el staff técnico completo de 5 miembros.
- Distribución de habilidades promedio de staff contratados en cada división.
- Reducción promedio de semanas de baja médica en la liga gracias a fisioterapeutas.

## 18. Matriz de Pruebas
1. Contratación de Fisioterapeuta -> Insertado en `club_staff`, nómina salarial incrementada, bonificación médica activa.
2. Contratación de un segundo Fisioterapeuta -> Reemplaza al anterior, abona indemnización de 8 semanas del empleado previo y actualiza el puesto.
3. Intento de contratar sin fondos -> HTTP 400 `ERR_INSUFFICIENT_BUDGET_FOR_STAFF_WAGE`.
4. Doble clic en contratar -> Idempotente, 0 registros duplicados.
5. Verificación de cálculo de reducción de lesión con Fisioterapeuta de 15 puntos -> Comprueba reducción matemática del 30%.

## 19. Criterios de Aceptación
- [x] Modelo de staff, candidatos y auditoría laboral formalizado.
- [x] Máquina de estados de contratación y reemplazo cerrada.
- [x] Backend como autoridad absoluta de bonificaciones y devengo de nómina.
- [x] 5 roles esenciales con impactos pasivos claramente calculados.
- [x] Regla unívoca de 1 especialista por puesto protegida en BD.
- [x] Eventos y auditoría de contrataciones implementados.
- [x] Idempotencia estricta en la contratación y finiquito.
- [x] Concurrencia con restricción única `(club_id, role)` resuelta.
- [x] Factores de indemnización y salarios versionados en JSON.
- [x] Casos de insolvencia y despidos cubiertos.
- [x] Anti-exploits de apilamiento ilegal de empleados neutralizados.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `StaffManagementService`, `StaffBonusCalculator`, `StaffRepository`, `StaffCandidateCatalog`.
- **Comandos:** `HireStaffCommand`, `DismissStaffCommand`.
- **Queries:** `GetClubStaffQuery`, `GetAvailableCandidatesQuery`.
- **Políticas DB:** `ALTER TABLE club_staff ADD CONSTRAINT uq_club_staff_role UNIQUE (club_id, role)`.
