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

## Auditoría del día (segunda pasada)
Errores encontrados y corregidos:
- Penal: el texto del relato decía siempre "fallado" porque la dirección del arquero se borraba antes de armar el mensaje. Ahora dice "atajado" cuando el arquero adivina.
- `PenaltyGoal`: el temporizador del arquero no se limpiaba si la hoja se cerraba antes de tiempo.
- El botón de resumen en móvil esperaba el estado `'ended'` (nunca ocurre): ver tanda anterior.

Riesgos que quedan (no se tocaron):
- Al recargar la página a mitad de partido se restaura el resultado, pero no qué momentos ya se decidieron (`firedRef` no se guarda): un momento podría volver a aparecer.
- Saltear el partido ("Saltear") se salta también las jugadas clave y penales: juegan en piloto automático. Es lo esperado, pero conviene avisarlo en el cartel de confirmación.
- `EventScreen` (`/events`) no usa la lectura de historias de a poco: quedó con el diseño viejo.
- Los chistes del relato (`QUIPS` en `matchEngine.js`) son pocos por tipo; en partidos largos se repiten. Ampliar el pool o sumar chistes según el marcador/minuto.
- Las historias ya traen buen humor en `arcCatalog.js`; lo que cambió es cómo se muestran. Falta revisar los eventos "sueltos" (no ARC_) que son más secos.

## Hecho en esta tanda
- Penal a favor: apuntar al arco + frenar la barra (afecta la chance de gol: bien pegado sube, mal pegado baja, malísimo se va a la tribuna).
- Mano a mano ("jugada clave"): nuevo momento, a favor (definir / gambetear / ceder) y en contra (achicar / quedarse / tirarse a los pies). Tiene efecto real en el motor.
- Relato con humor: remates del relator en goles, atajadas, errados, córners, tarjetas y lesiones (azar propio: no cambia el resultado del partido).
- Historias contadas de a poco: momentos, diálogos en globo, opciones al terminar de leer, y al elegir una cargada del narrador con chips de lo que cambió.
