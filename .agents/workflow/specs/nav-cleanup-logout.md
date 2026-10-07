# Specification — nav-cleanup-logout (B7 + B10 de docs/roadmap_v2.md)

## 1. Objetivo
Menú más corto, con el nombre real del juego y con la forma de cerrar sesión.

## 3. Cambio
- B7: botón "Cerrar sesión" al pie del menú lateral (escritorio) y al final de "Más" (móvil), con confirmación. Al salir se recarga la app en la portada para que no quede nada del club anterior en memoria (`useLogout`, `lib/redirect.js`).
- B10: Logros y Salón de la Fama salen del menú lateral y de "Más" (se llega desde Carrera del DT); conservan su título en la barra superior móvil.
- B10: el menú lateral dice "VESTUARIO" en lugar de "EL PIZARRÓN".

## 5. Criterios de aceptación
- [x] AC-01: cerrar sesión pide confirmación, cierra la sesión y vuelve a la portada; cancelar no hace nada.
- [x] AC-02: Logros y Salón no están en el menú ni en "Más", y su pantalla muestra su título en móvil.
- [x] AC-03: el menú lateral dice Vestuario.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/nav-cleanup-logout.yml`
