# Especificación — feat-fase-04-initial-squad

## 1. Objetivo
Implementar el contrato de dominio de la Fase 04 para la generación algorítmica, balanceada y autoritativa en servidor del primer plantel (exactamente 20 futbolistas), cumpliendo cuotas posicionales estrictas, dorsales únicos del 1 al 20, salarios ajustados al presupuesto semanal e idempotencia ante dobles peticiones.

## 2. Problema actual
La generación procedural previa generaba 18 jugadores con atributos aleatorios sin respetar la distribución canónica de posiciones de 20 futbolistas, sin dorsales únicos del 1 al 20 ni garantía de promesas juveniles con alto potencial oculto.

## 3. Resultado esperado
1. Plantel oficial de 20 jugadores: 2 Arqueros (GK), 6 Defensores (CB, LB, RB), 7 Mediocampistas (DM, CM, AM, LM/RM), 5 Delanteros (ST, RW, LW).
2. Medias ponderadas de Tier 5 (media OVR 50 ± 4, con 2+ juveniles con potencial > 68 y estrella de hasta 62 OVR).
3. Dorsales 1 al 20 sin duplicados por club (`uq_club_jersey_number`).
4. Masa salarial semanal acotada entre $2,500 y $3,000 (respetando el presupuesto semanal de $3,500).
5. Idempotencia: no regenerar si el club ya posee jugadores.

## 4. Alcance

### Incluido
- Módulo `src/api/player.js` con matriz canónica de 20 posiciones `INITIAL_SQUAD_STRUCTURE`, generador de atributos adaptados y cálculo salarial.
- Idempotencia estricta en `generateInitialSquad`.
- Índice de unicidad de dorsal por club en `supabase.sql`.

### No incluido
- Traspasos y fichajes libres, gestionados en Fase 13.

## 5. Criterios de aceptación
- [x] AC-01: Generación de exactamente 20 futbolistas con todas las posiciones cubiertas.
- [x] AC-02: Dorsales únicos del 1 al 20 asignados por club.
- [x] AC-03: Al menos 2 futbolistas jóvenes con potencial oculto superior a 68.
- [x] AC-04: Masa salarial total dentro del límite de $3,500 semanal del club.
- [x] AC-05: El build de producción pasa 100% verde.

## 6. Trazabilidad
- Manifiesto: `.agents/workflow/tasks/feat-fase-04-initial-squad.yml`
- Contrato de dominio: `docs/Del_Potrero_al_Idolo_Fase_2_1/04_primer_plantel/04_primer_plantel_2.1.md`
