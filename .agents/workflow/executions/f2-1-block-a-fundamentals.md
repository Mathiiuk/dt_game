# Reporte de Ejecución: f2-1-block-a-fundamentals

- **ID de Tarea**: `f2-1-block-a-fundamentals`
- **Título**: Fase 2.1: Bloque A - Contratos de Dominio Fundamentos (Fases 01 a 10)
- **Tipo**: `fix`
- **Rama**: `fix/f2-1-block-a-fundamentals-fase-2-1-bloque-a-contratos-de-dominio-fundamentos-fases-01-a-10`
- **Estado**: `DONE`
- **Quality Gates**: `[PASS] build -> npm run build` (100% verde)

---

## 1. Resumen de Implementación
Se redactaron y formalizaron en su totalidad los contratos de dominio de las primeras 10 fases correspondientes al **Bloque A (Fundamentos)** en `docs/Del_Potrero_al_Idolo_Fase_2_1/`, bajo estricto cumplimiento de las **15 Master Rules 3.0**:

1. **Fase 01 — Inicio de Sesión (`01_inicio_sesion_2.1.md`)**:
   - Aislamiento estricto de carreras por `career_id` con políticas RLS en base de datos.
   - Servidor como autoridad en expiración de sesiones (Access Token 15 min, Refresh Token 7 días).
   - Rate limiting por IP/cuenta y prevención de enumeración de usuarios.
   - Modelo de auditoría de seguridad `security_audit_log`.

2. **Fase 02 — Creación del DT (`02_creacion_dt_2.1.md`)**:
   - Budget system de suma cero con pozo fijo de 15 puntos iniciales validado en servidor.
   - Curva de arquetipos por trasfondo (`STREET_COACH`, `EX_PRO_PLAYER`, `TACTICAL_ANALYST`, `ACADEMY_MENTOR`).
   - Bloqueo contra manipulación client-side de atributos iniciales o niveles superiores a 1.
   - Auditoría anti-cheat `manager_audit_log`.

3. **Fase 03 — Creación y Fundación del Club (`03_creacion_club_2.1.md`)**:
   - Presupuesto económico inicial asignado autoritativamente por nivel de división (Tier 5: $25,000 iniciales, $3,500 presupuesto salarial semanal, estadio 1,500 personas).
   - Blindaje de unicidad de nombre de club por carrera con índice único `uq_career_club_name`.
   - Paleta de colores con distancia cromática obligatoria y selección de escudo vectorial.

4. **Fase 04 — Generación del Primer Plantel (`04_primer_plantel_2.1.md`)**:
   - Generador procedural estricto en backend de 20 futbolistas con cuotas posicionales cerradas (2 GK, 6 DEF, 7 MED, 5 DEL).
   - Masa salarial inicial acotada entre el 70% y 90% del presupuesto semanal.
   - Distribución Gaussiana de atributos acorde al Tier 5 (Media 50 ± 4 OVR).
   - Ocultamiento absoluto del `potential_rating` al cliente web.

5. **Fase 05 — Niveles y Progresión del DT (`05_niveles_dt_2.1.md`)**:
   - Servidor como única fuente otorgante de XP mediante eventos deportivos e hitos de gestión.
   - Curva polinómica de 50 niveles: `XP(nivel) = 150 * (nivel)^1.6`.
   - Ledger inmutable de transacciones de experiencia `manager_xp_ledger` con restricción de unicidad para garantizar idempotencia y evitar re-computación de partidos.
   - Árbol de perks y puntos de desarrollo.

6. **Fase 06 — Dashboard y Centro de Mando (`06_dashboard_2.1.md`)**:
   - Read model agregado de alto rendimiento con renderizado instantáneo (0ms) mediante caché de memoria SWR.
   - Clasificación de alertas críticas bloqueantes vs informativas.
   - Protección de datos ocultos de rivales.

7. **Fase 07 — Calendario y Motor de Tiempo (`07_calendario_2.1.md`)**:
   - Cumplimiento de la Master Rule 9: el tiempo pertenece exclusivamente al servidor PostgreSQL.
   - Transición semanal en cascada atómica (Finanzas, Salud física, Simulación de liga IA, Eventos).
   - Mutex y optimistic lock `is_advancing` que impide saltos dobles de tiempo ante doble clic o lag de red.

8. **Fase 08 — Entrenamiento y Preparación Física (`08_entrenamiento_2.1.md`)**:
   - Fórmulas de balance entre ganancia de atributos, fatiga de `fitness` y riesgo de lesión.
   - Rendimientos decrecientes en veteranos (> 29 años) y techo infranqueable por potencial oculto.
   - Enfoque regenerativo con recuperación de energía física.

9. **Fase 09 — Tácticas, Formaciones y Sistema de Juego (`09_tacticas_2.1.md`)**:
   - Validación obligatoria de 11 titulares exactos con 1 solo portero y hasta 7 suplentes.
   - Solución definitiva al error `duplicate key value violates unique constraint tactics_pkey` mediante UPSERT sobre la clave `(club_id, slot_number)`.
   - Penalizaciones matemáticas por fuera de posición.

10. **Fase 10 — Motor de Simulación de Partidos y Dirección en Vivo (`10_motor_partido_2.1.md`)**:
    - Simulación minuto a minuto reproducible mediante semilla determinista en servidor.
    - Persistencia en tiempo real: prohibición de reseteo (anti-save scumming) al recargar el navegador (F5), permitiendo reconexión al minuto exacto o auto-completado en segundo plano.
    - Controles de velocidad x1, x2, x4 y resolución rápida.
    - Órdenes reactivas del DT en vivo (arengas/gritos) y sustituciones reglamentarias (máximo 5 cambios en 3 ventanas).

---

## 2. Quality Gates y Verificación
- Manifiesto: `.agents/workflow/tasks/f2-1-block-a-fundamentals.yml`
- Verificación: `npx agt task:verify f2-1-block-a-fundamentals`
- Resultado: `[PASS] build -> npm run build` (100% verde)
