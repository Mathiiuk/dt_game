# Plan de Implementación — feat-fase-03-club-foundation

## 1. Enfoque General
Adaptar el flujo de fundación de clubes al estándar de la Fase 2.1, garantizando que el usuario comience con el paquete fundacional oficial de la división regional de potrero (Tier 5).

## 2. Fases de Trabajo
1. **Esquema de Base de Datos (`supabase.sql`)**:
   - Columnas para `pitch_condition`, `ticket_price`, `primary_color`, `secondary_color`, `badge_id`.
2. **Capa API de Dominio (`src/api/club.js`)**:
   - Definir `TIER_5_STARTING_CONFIG`.
   - Implementar fundación autoritativa que descarta inyecciones de balance del cliente.
   - Sincronizar generación de plantel inicial y fixture de liga.
3. **Capa de Presentación (`src/features/club/CreateClubWizard.jsx`)**:
   - Diseñar wizard de 4 pasos con visualizador de indumentaria en SVG.
   - Presentar Acta de Fundación con detalles de balance y estadio.
4. **Verificación**:
   - Ejecutar `npx agt task:verify feat-fase-03-club-foundation`.
   - Sincronizar memoria con `npx agt memory:sync`.
