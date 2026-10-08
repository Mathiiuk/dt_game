# Hallazgos y mejoras pendientes (detectados al resolver bugs v3)

Cosas que se vieron mientras se arreglaba `bugs_mejoras_v3.md` y quedaron para una próxima tanda.

## Verificación pendiente
- [ ] Probar en iPhone (PWA instalada) el menú inferior nuevo, Entrenamiento, Táctica y el resumen del partido. No se pudo verificar en navegador: el entorno local no tiene sesión y `vite build` falla acá por el binario nativo de `@swc/core` (problema del entorno, no del código).

## Bugs / riesgos
- `src/components/ui/wizard.jsx`: la barra de pasos usa `fixed bottom-0`; puede descolocarse en iOS igual que el menú. Pasarla a `sticky`.
- `src/components/ReloadPrompt.jsx`: aviso `fixed bottom-0 right-0` queda arriba del menú inferior en móvil y lo tapa. Subirlo (`bottom-20` en móvil).
- `src/features/events/EventScreen.jsx` y la tarjeta de eventos de `Dashboard.jsx` duplican lógica (categorías, historias, opciones). Unificar en un componente compartido. Además `EventScreen` importa `AppShell` sin usarlo.
- `src/index.css`: el `body` aplica `padding` de zona segura y además `pt-safe` / `pb-safe` en barras: se duplica el margen. Sacar el padding del body cuando todas las pantallas usen AppShell.
- `src/GameApp.jsx`: el contenedor usa colores `zinc` sueltos en vez de los tokens del sistema (`bg-bg`, `text-fg`).
- El relato del partido muestra "Jugador Rival #1/#3": usar nombres reales del plantel rival.
- Textos del resumen como "¡VICTORIA VICTORIOSA!" suenan raros; revisar tono.
- Comentarios con caracteres rotos ("dA3vil", "decisiA3n") en `MatchScreen.jsx`: corregir codificación.
- `MatchHeader.jsx` recibe `homeClub` / `awayClub` pero `MatchScreen` no se los pasa (los escudos salen genéricos).
- Hay 13 advertencias de ESLint heredadas (`react-hooks/exhaustive-deps`), entre ellas `Dashboard.jsx` y `MatchScreen.jsx`.

## Mejoras de producto
- Historias: agregar un recap del capítulo anterior y una pequeña animación al elegir (hoy hay barra de capítulos y tarjeta de resultado).
- Táctica: botón "Banco" que muestre los suplentes ordenados por rendimiento aun sin elegir una ficha.
- Entrenamiento: mostrar el efecto esperado de la semana (qué atributos suben) antes de confirmar.
- Partido: el panel de decisiones del DT en desktop podría mostrar el cronómetro de enfriamiento de los gritos como barra.

## Minijuego de penales (idea siguiente)
- Hoy el penal en contra se juega tocando una zona del arco (misma mecánica de antes). El penal a favor sigue eligiendo quién patea: el motor no recibe la dirección del remate, así que un "apuntá y pateá" sería solo estético. Para hacerlo real hay que sumar la dirección/potencia al motor de partido (`matchEngine`) y que la chance de gol dependa de eso.
