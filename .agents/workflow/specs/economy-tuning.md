# Specification — economy-tuning

## 1. Objetivo
Que el margen semanal de un club que se gestiona bien quede dentro del diseño (+$300 a +$900 por semana).

## 2. Medición
Una temporada completa (52 semanas, 10 partidos de local, club campeón de la división 5) dejó: taquilla 90.000, socios 14.560, patrocinio 24.440, tienda 7.800, TV 13.000, ayuda de pretemporada 6.055 contra sueldos 125.944 y mantenimiento 18.720. Resultado: ~+$11.000 antes del premio (~+$210 semanales), debajo del diseño.

## 3. Cambio
Derechos de televisión 250 -> 330 y patrocinio base 350 -> 400 (+8 por punto de reputación): ~+$130 por semana, ~+$6.800 por año. Nuevo margen estimado ~+$340 semanales (+$17.800 al año) antes del premio (de $1.000 a $12.000).

## 4. Alcance
Migración `migration_economy_tuning.sql` (aplicada y probada en la base con un bloque que se deshace), `ECONOMY` en `src/domain/finances.js`, tests de paridad con valores fijos.
No incluido: taquilla (depende de la hinchada, la entrada y el estadio, que son decisiones del jugador) y sueldos.

## 5. Criterios de aceptación
- [x] AC-01: la base y el código dan el mismo patrocinio y TV (520 y 330 con reputación 15).
- [x] AC-02: los tests de paridad usan los valores nuevos.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/economy-tuning.yml`
