# Especificación — feat-fase-03-club-foundation

## 1. Objetivo
Implementar el contrato de dominio de la Fase 03 para la creación y fundación institucional del club del usuario, fijando los parámetros financieros autoritativos de Tier 5 ($25,000 caja, $3,500 salarios), estadio inicial de potrero (1,500 aforo) e identidad visual completa con previsualización en vivo.

## 2. Problema actual
La implementación anterior calculaba presupuestos dispares según un selector arbitrario de historia de club sin ceñirse a las reglas de balance estricto de la división regional de partida (Tier 5), y carecía de previsualización de camiseta en vivo.

## 3. Resultado esperado
1. Aplicación estricta del balance de Tier 5 en servidor: $25,000 en caja, $3,500 de tope salarial semanal, $5,000 para transferencias, estadio de 1,500 espectadores y césped con estado 60/100.
2. Identidad visual enriquecida: colores primario y secundario con presets tradicionales y selector de blasón.
3. Previsualización dinámica de la camiseta titular en tiempo real.
4. Vinculación bidireccional entre club y DT, disparando la generación del plantel (Fase 04) y fixtures de la liga (Fase 12).
5. Registro de auditoría institucional con `auditApi`.

## 4. Alcance

### Incluido
- Módulo `src/api/club.js` con `TIER_5_STARTING_CONFIG`, validación y creación autoritativa.
- Asistente `src/features/club/CreateClubWizard.jsx` con 4 pasos (Identidad, Colores y Escudo, Estadio, Acta Fundacional).
- Migración en `supabase.sql` para campos de colores, césped e infraestructura.

### No incluido
- Reformas de estadio avanzadas, gestionadas en Fase 21.

## 5. Criterios de aceptación
- [x] AC-01: El club se funda con exactamente $25,000 de caja y $3,500 de tope salarial semanal.
- [x] AC-02: El estadio inicial queda asignado con aforo de 1,500 espectadores y césped en 60/100.
- [x] AC-03: La camiseta se previsualiza dinámicamente con los colores seleccionados.
- [x] AC-04: El build de producción pasa 100% verde.

## 6. Trazabilidad
- Manifiesto: `.agents/workflow/tasks/feat-fase-03-club-foundation.yml`
- Contrato de dominio: `docs/Del_Potrero_al_Idolo_Fase_2_1/03_creacion_club/03_creacion_club_2.1.md`
