# Especificación — feat-fase-05-manager-levels

## 1. Objetivo
Implementar el motor autoritativo de experiencia, progresión y niveles del Director Técnico de la Fase 05, incorporando la curva polinómica de niveles 1 al 50, auditoría inmutable en `manager_xp_ledger`, títulos honoríficos y el árbol de ventajas (Perks) canónico.

## 2. Problema actual
La implementación anterior dependía de una tabla estática simple en base de datos sin curva matemática analítica, sin registro inmutable de auditoría contra reintentos de partidos, sin prevención de duplicados ni árbol formal de ventajas.

## 3. Resultado esperado
1. Curva analítica polinómica: `XP(level) = 150 * (level - 1)^1.6` para niveles 1 al 50.
2. Fuentes de XP autoritativas balanceadas: victoria (+150 XP), empate (+50 XP), clásico (+75 XP), valla invicta (+25 XP), títulos (+2,500 XP), ascensos (+1,500 XP).
3. Ledger inmutable `manager_xp_ledger` con restricción única `(manager_id, source_type, source_entity_id)` para garantizar idempotencia estricta.
4. Desbloqueo de puntos de habilidad al subir de nivel y árbol de 5 perks iniciales (`manager_unlocked_perks`).
5. Títulos honoríficos dinámicos según el rango de nivel.

## 4. Alcance

### Incluido
- Módulo `src/api/levels.js` con cálculo polinómico, adjudicación autoritativa, perks y ledger.
- Conexión de `managerApi.addXp` hacia `levelsApi.awardXp`.
- Tablas `manager_xp_ledger` y `manager_unlocked_perks` en `supabase.sql`.

### No incluido
- Asignación de XP por eventos narrativos dinámicos, cubierta en Fase 35.

## 5. Criterios de aceptación
- [x] AC-01: Curva polinómica calcula los umbrales de XP hasta nivel 50.
- [x] AC-02: La adjudicación de XP es idempotente ante el mismo `sourceEntityId`.
- [x] AC-03: Subir de nivel otorga puntos de perk acumulables y actualiza reputación.
- [x] AC-04: Canjear puntos desbloquea perks en `manager_unlocked_perks`.
- [x] AC-05: El build de producción pasa 100% verde.

## 6. Trazabilidad
- Manifiesto: `.agents/workflow/tasks/feat-fase-05-manager-levels.yml`
- Contrato de dominio: `docs/Del_Potrero_al_Idolo_Fase_2_1/05_niveles_dt/05_niveles_dt_2.1.md`
