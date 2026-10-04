# Plan de Implementación — feat-fase-04-initial-squad

## 1. Enfoque General
Construir el generador procedural autoritativo para asegurar que cada club fundado nazca con una plantilla deportiva equilibrada, posicionalmente completa y económicamente viable.

## 2. Fases de Trabajo
1. **Esquema de Base de Datos (`supabase.sql`)**:
   - Índice de unicidad `uq_club_jersey_number` sobre `players(club_id, shirt_number)`.
2. **Capa API de Dominio (`src/api/player.js`)**:
   - Crear matriz canónica `INITIAL_SQUAD_STRUCTURE` con 20 roles y dorsales 1 al 20.
   - Implementar generador de atributos y salarios con ponderación Tier 5.
   - Incorporar verificación de idempotencia y log de auditoría.
3. **Verificación y Quality Gates**:
   - Ejecutar `npx agt task:verify feat-fase-04-initial-squad`.
   - Sincronizar memoria con `npx agt memory:sync`.
