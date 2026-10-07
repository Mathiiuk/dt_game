# Specification — economy-by-tier

## 1. Objetivo
Que ascender no deje al club sin caja: los ingresos fijos crecen con la categoría igual que el presupuesto salarial.

## 2. Problema
Al ascender el presupuesto salarial sube 80% pero socios, patrocinio y TV eran fijos: un club de Primera B con el plantel que su presupuesto permite perdía plata todas las semanas.

## 3. Cambio
Factor `tierIncomeFactor`: 1, 1.5, 2, 2.5, 3 (de la quinta a la primera categoría) sobre socios, patrocinio y TV. La tienda no cambia. Migración `migration_economy_by_tier.sql` aplicada y probada en la base (categoría 2: socios 700, TV 825, patrocinio 1.300), mismo cálculo en `weeklyBudget`.

## 4. Alcance
No incluido: taquilla (depende de capacidad, entrada y hinchada: decisiones del jugador) ni sueldos de mercado por categoría.

## 5. Criterios de aceptación
- [x] AC-01: la base y el código dan los mismos ingresos por categoría.
- [x] AC-02: la categoría base (5) no cambia ningún valor anterior.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/economy-by-tier.yml`
