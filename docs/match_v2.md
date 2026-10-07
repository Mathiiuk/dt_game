# Rediseño de la Pantalla de Partido (Match v2)

Este documento detalla la propuesta para rediseñar la experiencia del partido en vivo (`/match`), resolviendo problemas actuales de usabilidad, legibilidad y accesibilidad, y preparando el terreno para interacciones más ricas.

## 1. Problemas Actuales (Qué hay hoy)

- **Legibilidad y Tap Targets:** `MatchScreen.jsx` usa letra de 10 y 11 px en estadísticas, gritos y panel de cambios. Los botones táctiles en móvil están muy por debajo del mínimo de 48 px.
- **Flujo de Lesiones (B18):** Cuando hay un lesionado, el partido se pausa con una alerta genérica, el panel de cambios se abre pero no indica claramente quién está lesionado, y los botones son minúsculos. No hay un botón explícito de "Que siga jugando (bajo riesgo)".
- **Layout Ineficiente:** El diseño actual no aprovecha bien las pantallas grandes (escritorio) y se siente muy comprimido en pantallas chicas (móvil).
- **Relato de Partido:** La transcripción fluye sin pausas claras y cuesta distinguir eventos clave (goles, tarjetas, lesiones) a simple vista.

## 2. Propuesta de Pantalla (Qué se saca y qué cambia)

Se propone una interfaz adaptable (AppShell-like) que cambia radicalmente entre móvil y escritorio, manteniendo el mismo motor interno.

### 2.1 Vista Móvil (Mobile-First)

- **Cabecera Fija:**
  - Marcador grande y claro en la parte superior, reloj del partido siempre visible.
- **Área Central (Relato):**
  - Ocupa el 70% de la pantalla. Textos más grandes (mínimo 14px).
  - Eventos clave (goles, rojas) resaltados con fondos de color (ej. `bg-danger/10`).
- **Barra Inferior de Acciones (Fixed Bottom):**
  - Barra de herramientas con botones grandes (48x48 px mínimo) para: `Pausa/Play`, `Velocidad (x1, x2, x3)`, `Cambios`, `Gritos/Táctica`.
- **Paneles Emergentes (Bottom Sheets):**
  - **Cambios:** Sube desde abajo ocupando toda la pantalla. Muestra el once inicial en lista, ordenado por posición. Los reservas se muestran agrupados por compatibilidad con el jugador a sustituir.
  - **Decisiones (Lesión/Roja):** Cuando ocurre un evento crítico, el Bottom Sheet sube automáticamente bloqueando el partido. Muestra en grande: "Se lesionó X", seguido de los reemplazos sugeridos o la opción de "Forzar que siga".

### 2.2 Vista Escritorio (Desktop)

Aprovechando el ancho, se divide en 3 columnas:
1. **Izquierda (Tu Equipo):** Formación actual, energía de los jugadores, moral en tiempo real. Botones de cambios rápidos.
2. **Centro (El Partido):** Relato en vivo, marcador gigante y controles de tiempo/velocidad en la parte inferior.
3. **Derecha (Rival y Estadísticas):** Alineación rival, estadísticas del partido (posesión, tiros, faltas).

## 3. Tareas Estimadas (Esfuerzo XL)

1. **Refactorización de Componentes:** Dividir `MatchScreen.jsx` en componentes de presentación separados (`MatchHeader`, `MatchTimeline`, `MatchControls`, `SubstitutionsSheet`).
2. **Implementación de Bottom Sheets:** Crear un componente base para paneles emergentes en móvil usando animaciones CSS (o Framer Motion si está disponible).
3. **Flujo de Lesiones (Resolución de B18):** Crear el interceptor de eventos críticos que pausa el reloj y dispara el panel de decisión con contexto claro.
4. **Accesibilidad (A11y):** Añadir `aria-live="polite"` al feed de relatos y anunciar eventos críticos (goles, lesiones) para lectores de pantalla.
5. **Ajustes de Tipografía y Espaciado:** Reemplazar todas las clases `text-[10px]` y `text-[11px]` por escalas estándar de Tailwind (`text-xs`, `text-sm`, `text-base`), y padding de botones a `p-3` o `p-4`.

## 4. Criterio de Aprobación

Por favor, revisá esta propuesta. Si estás de acuerdo con el enfoque (especialmente el paso a Bottom Sheets en móvil y las 3 columnas en escritorio), procedemos con la implementación técnica en la **Etapa 5**.
