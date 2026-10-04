# Plan de Implementación — feat-fase-02-dt-creation

## 1. Enfoque General
Adaptar el flujo de creación de DT al estándar de Fase 2.1, incorporando trasfondos históricos del fútbol argentino/latinoamericano, pozo de 15 puntos suma cero y validación estricta en servidor.

## 2. Fases de Trabajo
1. **Modelado y Esquema SQL (`supabase.sql`)**:
   - Agregar columna `background` e índice `uq_active_manager_per_user`.
2. **Capa API de Dominio (`src/api/manager.js`)**:
   - Definir arquetipos y atributos base.
   - Implementar validador de suma cero y límites iniciales.
   - Forzar nivel 1, xp 0 y reputación correspondiente.
3. **Capa de Presentación (`src/features/manager/CreateManagerWizard.jsx`)**:
   - Expandir a 5 pasos (Identidad, Trasfondo, Atributos, Filosofía, Firma).
   - Bloquear avance si restan puntos libres por gastar.
   - Generar carnet/credencial oficial de DT en paso de confirmación.
4. **Quality Gates y Cierre**:
   - Verificar build con `npx agt task:verify`.
   - Sincronizar memoria con `npx agt memory:sync`.
