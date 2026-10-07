# Specification — advance-semaphore-recovery

## 1. Objetivo
Que la partida no quede trabada para siempre si el avance de semana se interrumpe a mitad de camino.

## 2. Problema actual
El avance toma un candado (`career_calendar.is_advancing`) y lo suelta al final. Si la pestaña se cierra o se recarga en el medio, el candado queda puesto y todo avance posterior responde "El motor de tiempo está procesando una semana" para siempre. Hallado corriendo una temporada completa en el navegador (una recarga en caliente interrumpió el avance).

## 3. Resultado esperado
Un candado con más de 90 segundos de antigüedad se considera abandonado y se puede avanzar. Un avance en curso (de hace segundos) sigue bloqueando a un segundo avance simultáneo.

## 4. Alcance
`isAdvanceLocked` (domain/gameWeek.js) y su uso en `advanceWeek`. No incluido: reanudar la semana a medio hacer (los pasos de la cascada son idempotentes por semana: cierre de finanzas ya lo es).

## 5. Criterios de aceptación
- [x] AC-01: candado reciente bloquea.
- [x] AC-02: candado viejo no bloquea.
- [x] AC-03: sin fecha conocida se respeta el candado.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/advance-semaphore-recovery.yml`
