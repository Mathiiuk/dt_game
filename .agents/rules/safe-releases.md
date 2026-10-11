---
name: "safe-releases"
type: "rule"
description: "Reglas para publicar versiones sin romper las partidas de quienes todavía tienen la versión anterior abierta"
activation:
  global: true
---

# Publicar sin romper partidas

La app **nunca obliga a actualizar**: quien tiene una versión vieja abierta (o instalada como PWA) sigue jugando contra la misma base de datos hasta que la actualiza. Por eso:

1. **Cambios de base de datos aditivos (expandir y después contraer).** No borrar ni renombrar columnas, tablas ni funciones que una versión anterior use. Se agrega lo nuevo, el código nuevo lo usa y lo viejo se retira recién cuando ya nadie lo usa (pasadas varias semanas y comprobado en los registros).
   - Si una función cambia de firma, se crea una **función nueva** y la vieja queda (en este proyecto `drop function` además puede colgarse).
   - Las columnas nuevas llevan valor por defecto o aceptan nulo.
2. **Datos guardados en el navegador** (`vestuario-*`): si cambia su formato, se agrega una migración numerada en `src/lib/storageMigrations.js` (corre una vez, en orden, y nunca borra claves que no conoce). Cambiar el nombre de una clave sin migración está prohibido.
3. **Actualizaciones de la app** se instalan solo en un momento seguro (`src/lib/updateGuard.js`): fuera de `/match` y `/post-match` y sin algo a medias. Todo lo que tenga trabajo sin guardar debe marcarlo con `markBusy('nombre')` y liberarlo con `clearBusy('nombre')` (`src/lib/busy.js`).
4. **Novedades:** cada versión visible para el jugador suma una entrada arriba en `src/data/changelog.js` (id nuevo, fecha, frases cortas).
5. **Antes de publicar** una migración de base de datos: probarla con rollback en producción y confirmar que la versión anterior de la app sigue funcionando con ella.
