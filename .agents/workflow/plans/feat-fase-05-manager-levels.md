# Plan de Implementación — feat-fase-05-manager-levels

## 1. Enfoque General
Evolucionar la progresión del DT hacia un motor RPG autoritativo y matemáticamente riguroso donde el XP acumulado se audite de forma inmutable y premie al jugador con ventajas tácticas reales.

## 2. Fases de Trabajo
1. **Esquema de Base de Datos (`supabase.sql`)**:
   - Crear `manager_xp_ledger` con índice único anti-duplicados.
   - Crear `manager_unlocked_perks` y columna `unallocated_perk_points`.
2. **Capa API de Dominio (`src/api/levels.js`)**:
   - Implementar función matemática `calculateXpForLevel`.
   - Implementar catálogo de perks y títulos honoríficos.
   - Implementar `awardXp` con validación de idempotencia y resolución de level-ups múltiples.
   - Implementar `unlockPerk` y `getUnlockedPerks`.
3. **Integración con `managerApi`**:
   - Conectar `managerApi.addXp` hacia `levelsApi.awardXp`.
4. **Verificación y Quality Gates**:
   - Ejecutar `npx agt task:verify feat-fase-05-manager-levels`.
   - Sincronizar memoria con `npx agt memory:sync`.
