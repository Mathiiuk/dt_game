# bugs-mejoras-v3

Rama: `fix/bugs-mejoras-v3` (parte de la rama de auth/PWA, todavía sin mergear).

## Cambios
1. **Menú inferior roto en iOS**: `AppShell` pasa a columna de alto fijo (`h-dvh`); el contenido scrollea adentro y la barra inferior es parte del flujo (ya no `fixed`). Se anula el padding de zona segura del body para no duplicarlo. Mismo criterio en `MatchScreen`/`MatchActions` (controles anclados abajo, fuera del scroll). Se vuelve arriba al cambiar de pantalla.
2. **Resumen del partido con menú**: `/post-match` ahora vive dentro de `AppShell`.
3. **Entrenamiento**: botón "Confirmar plan de trabajo" fijo (sticky) con resumen del plan y aviso de cambios sin confirmar.
4. **Opciones de eventos**: sin desborde del margen derecho (texto parte línea, descripción visible, costos en línea aparte). Historias: barra de capítulos, letra por opción y tarjeta de resultado.
5. **Táctica**: al tocar una ficha, bandeja de suplentes pegada abajo (no modal) en móvil; barra "Cambios sin guardar" sticky en el flujo.
6. **Momento crítico en desktop**: diálogo centrado de ancho acotado (antes ocupaba todo el ancho) y tipografía más legible.

## Verificación
- `vitest`: 1318/1319 en la corrida completa; el único fallo (`tacticsScreen`) se corrigió y `tests/ui` quedó 258/258.
- `eslint` sin errores nuevos.
- `vite build` no corre en este entorno (falta el binario nativo de `@swc/core`); no se pudo probar en navegador sin sesión.

## Segunda tanda (partido)
- Abrir Cambios o Gritos pausa el partido.
- Bug: el botón de fin de partido en móvil miraba el estado `'ended'` pero el partido termina en `'finished'`; nunca aparecía (y el encabezado no decía "Final"). Ahora hay un botón fijo abajo "Siguiente: resumen y prensa".
- Momento crítico: hoja compacta desde abajo en móvil (ya no página completa), diálogo angosto en desktop, sin cierre accidental. Penal en contra: arco con tres zonas tocables y arquero animado.
