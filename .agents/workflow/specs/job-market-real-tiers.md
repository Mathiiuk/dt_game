# Specification — job-market-real-tiers

## 1. Objetivo
Que la bolsa de trabajo muestre vacantes alcanzables de todas las divisiones.

## 2. Problema
Los clubes de la IA se creaban sin categoría y quedaban en la 1 (valor por defecto de la base): la bolsa pedía los 15 de menor `league_tier` y todos aparecían como "Primera División, casi imposible". Tras un despido el DT no tenía a dónde ir (hallado corriendo temporadas completas).

## 3. Resultado esperado
- Los clubes rivales nacen con la categoría de su liga (inicial: 5; al armar ligas nuevas: la categoría correspondiente) y los existentes se corrigieron en la base.
- `pickVacancies`: primero lo alcanzable (muy alta, firme, pocas opciones, casi imposible), dentro de eso la categoría más alta, máximo 15 y 5 por categoría.

## 4. Alcance
Incluido: dominio, `getAvailableVacancies`, creación de clubes, migración de corrección. No incluido: negociación de ofertas con trato real (línea de contenido "Carrera del DT").

## 5. Criterios de aceptación
- [x] AC-01: orden por posibilidad y categoría.
- [x] AC-02: máximo 5 por división y 15 en total.
- [x] AC-03: los clubes nuevos tienen `league_tier` de su liga.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/job-market-real-tiers.yml`
