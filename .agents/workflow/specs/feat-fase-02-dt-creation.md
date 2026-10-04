# Especificación — feat-fase-02-dt-creation

## 1. Objetivo
Implementar el contrato funcional de la Fase 02 para la creación del Director Técnico, garantizando la selección de arquetipos de trasfondo (presets), validación de suma cero de 15 puntos libres en servidor, límites iniciales de atributos (cap en 14) y nivel 1 / XP 0 forzados.

## 2. Problema actual
La implementación anterior permitía distribuir 30 puntos partiendo de bases fijas sin arquetipos, sin validar que todos los puntos fuesen consumidos antes de enviar el formulario y sin validación de suma cero en backend.

## 3. Resultado esperado
1. Catálogo de presets de trasfondo: `STREET_COACH`, `EX_PRO_PLAYER`, `TACTICAL_ANALYST`, `ACADEMY_MENTOR`.
2. Reputación inicial coherente con el trasfondo (20 a 35 pts).
3. Pozo estricto de 15 puntos libres a distribuir con tope inicial de 14 por atributo.
4. Validación matemática autoritativa en backend (`validateManagerPoints`).
5. Credencial oficial de DT en el paso 5 del Wizard de creación.

## 4. Alcance

### Incluido
- Módulo `src/api/manager.js` enriquecido con `MANAGER_BACKGROUND_PRESETS`, `FREE_POINTS_POOL`, `ATTRIBUTE_MAX_INITIAL_CAP` y `validateManagerPoints`.
- Wizard `src/features/manager/CreateManagerWizard.jsx` con 5 pasos estructurados y StepIndicator responsive.
- Esquema SQL en `supabase.sql` con columna `background` e índice `uq_active_manager_per_user`.

### No incluido
- Asignación de club, gestionada en la Fase 03.

## 5. Criterios de aceptación
- [x] AC-01: El wizard presenta los 4 presets con sus descripciones y atributos base.
- [x] AC-02: Se exige distribuir exactamente los 15 puntos libres sin sobrantes ni negativos.
- [x] AC-03: Ningún atributo puede superar los 14 puntos iniciales.
- [x] AC-04: El backend valida y calcula los atributos finales forzando Nivel 1 y XP 0.
- [x] AC-05: El build de producción pasa 100% verde.

## 6. Trazabilidad
- Manifiesto: `.agents/workflow/tasks/feat-fase-02-dt-creation.yml`
- Contrato de dominio: `docs/Del_Potrero_al_Idolo_Fase_2_1/02_creacion_dt/02_creacion_dt_2.1.md`
