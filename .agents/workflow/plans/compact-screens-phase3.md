# Plan de Implementación: Pantallas Compactas (Fase 3)

## Fases del Desarrollo

### Fase 1: Mejoras de Interfaz Rápidas (B13, B11, B12, B9)
1. **B13 (Auth compacto)**
   - Ocultar badge de reCAPTCHA vía CSS en `index.css` (legalmente se puede si se menciona en el texto).
   - Revisar `AuthScreen.jsx` o similar para compactar paddings/margins.
2. **B11 (Títulos)**
   - Identificar contenedores con títulos largos que rompan layout (ej: Header, AppShell, modales).
   - Aplicar `truncate` o `line-clamp-1` y `break-words` donde sea necesario.
3. **B12 (Botones de asistente)**
   - Editar `CreateManagerWizard.jsx` y `FoundationWizard.jsx`.
   - Modificar la clase que deja el footer sticky para que aplique también a `md` (hasta 1024px, `lg`), o revisar el layout grid.
4. **B9 (Dificultad)**
   - Revisar `FoundationWizard` o pantalla de configuración donde estén los botones de dificultad (Normal, Difícil, etc).
   - Añadir descripciones claras (tooltips o subtítulos) de qué hace cada uno.

### Fase 2: Calendario Compacto (M4)
1. **Refactor de `CalendarScreen.jsx`**
   - Extraer lógica de datos para poder separar en "Próximos" vs "Resultados".
   - Modificar el renderizado de la fila del partido para buscar y mostrar el nombre del rival cruzando con `teams` o `clubs`.
   - Crear sub-componente `CalendarMonthGrid` para la vista de temporada completa.
   - Añadir filtros visuales "De local" / "De visitante".

### Fase 3: Prensa Rápida (M8)
1. **Refactor de API/Domain de Prensa (`press.js`, `pressSituations.js`)**
   - Forzar a devolver sólo 2 preguntas en lugar del array completo.
   - Determinar al azar qué minijuego se juega (frase, titular o bingo) por conferencia.
2. **Refactor de Interfaz (`PressRoom.jsx`, `PostMatchScreen.jsx`)**
   - Remover pantalla intermedia de reacción y meterla como un toast o animación temporal.
   - Hacer el Bingo plegable (disclosure).
   - Hacer transcripción plegable.

### Fase 4: Testing y QA
1. Ejecutar TDD para Calendario y Prensa (ajustando los tests que esperaban más preguntas).
2. Verificación manual responsive.
