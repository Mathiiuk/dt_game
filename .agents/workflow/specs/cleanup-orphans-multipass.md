# Specification — cleanup-orphans-multipass

## 1. Objetivo
Dejar en el repositorio el script de limpieza de filas sin dueño en la versión que funcionó, y registrar la corrida.

## 2. Hecho
Autorizada por el usuario el 7/10/2026. Conteo previo: 1.132 filas sin dueño (60 clubes, 60 jugadores, 570 partidos y dependientes). La primera versión del script falló por una clave foránea (clubs antes que players); se reescribió con pasadas y reintentos. Se probó primero con una corrida que se deshace y después en firme: 0 filas sin dueño al final y 145 clubes vivos.

## 5. Criterios de aceptación
- [x] AC-01: ninguna tabla con `owner_user_id` conserva filas nulas.
- [x] AC-02: las cuentas con datos propios no se tocaron.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/cleanup-orphans-multipass.yml`
