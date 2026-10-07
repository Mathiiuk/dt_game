# Especificación: Pantallas compactas (Fase 3)

## Objetivos
Mejorar la usabilidad y reducir el "ruido" visual en varias pantallas, especialmente para dispositivos móviles y resoluciones intermedias.
Implementar M4 y M8 que agilizan procesos repetitivos (el calendario y las ruedas de prensa).

## Alcance

### 1. Auth Compacto y sin logo reCAPTCHA (B13)
- Retirar el logo flotante de reCAPTCHA que tapa botones en móviles.
- Compactar visualmente la pantalla de Auth para evitar el scroll innecesario.

### 2. Títulos que generan scroll (B11)
- Ajustar el truncamiento (`truncate`) o envolver (`break-words`) los títulos largos que rompen el layout en escritorio y generan scroll horizontal o vertical indeseado.

### 3. Botones fijos del asistente (B12)
- En resoluciones medias (640px a 1024px), asegurar que los botones de los Wizards (Crear Manager, Crear Club) queden fijos abajo como ocurre en móvil (<640px), o ajustar su layout para que no queden fuera de pantalla.

### 4. Selector de Dificultad (B9)
- Reubicar y explicar correctamente el selector de dificultad (motor de consecuencias) para que el jugador entienda qué cambia al seleccionarlo.

### 5. Nuevo Calendario Compacto (M4)
- **Vista por Defecto**: Mostrar "Próximos partidos" (los siguientes 5, indicando fecha y RIVAL explícito) y "Resultados" (ya jugados).
- **Vista "Temporada"**: Grilla por mes, muy compacta, omitiendo/compactando las semanas libres.
- **Filtros**: Mantener los existentes, sumar "Local" y "Visitante".

### 6. Prensa Post-Partido Ultra Rápida (M8)
- **Reducción a 2 preguntas** por conferencia.
- **Reacción integrada**: La reacción de la sala aparece en la misma pantalla y avanza sola (auto-timeout o transición).
- **1 Minijuego**: Rotar para que sólo aparezca UN minijuego por conferencia.
- **Bingo discreto**: El Bingo se muestra como una línea de progreso/avance, plegable, para no estorbar.
- **Transcripción plegable**: Ocultar el muro de texto por defecto.
- **Objetivo**: Completar en <40s, sin scroll en 375x667.

## Decisiones Técnicas
- **Tailwind**: Uso intensivo de utilidades `hidden`, `md:block`, `sticky bottom-0`, `line-clamp` para B11 y B12.
- **Componentes**: Refactor de `CalendarScreen.jsx` y `PressRoom.jsx` para M4 y M8 respectivamente.
