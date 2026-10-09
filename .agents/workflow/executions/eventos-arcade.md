# eventos-arcade

Las decisiones sueltas del club (Comunidad y barrio, Vestuario, Dirigencia y prensa, Crisis de plata) pasan al escenario arcade.

- **Antes:** solo los capítulos de las historias (`ARC_`) se abrían a pantalla completa con lectura de a momentos, modos de decisión y desafíos de pista; el resto de los eventos (por ejemplo "La tribuna te canta el nombre") eran una tarjeta plana del inicio con las opciones a la vista.
- **Ahora:** todos los eventos pendientes se abren solos a pantalla completa, de a uno: se lee de a momentos tocando, algunos traen un desafío de pista (memoria, insistencia, verdadero o falso, reflejos o billetes en las crisis de plata) y se decide con una mecánica distinta (mantener apretado, moneda, reloj o puntería). "Decidir más tarde" los deja en el inicio como tarjeta, como antes.
- **Identidad:** la cabecera muestra el tipo del evento (Comunidad y barrio, Vestuario, Dirigencia y prensa, Crisis de plata) en lugar de "Historia" y, si es una decisión urgente, el aviso "Urgente".
- **Decisiones urgentes:** nunca se dejan a la moneda ni al reloj (modos `HOLD` o `TARGET`), porque el narrador no debería decidir por vos algo crítico.
- **Dónde:** `src/domain/storyStage.js` (`EVENT_KIND_LABEL`, `CRITICAL_STAGE_MODES`, `stageModeFor`), `StoryStage.jsx` y `Dashboard.jsx`.
- **TDD:** 3 pruebas de dominio (urgentes sin moneda ni reloj, las comunes siguen con los 4 modos, nombres por categoría) y 3 de interfaz (evento común, urgente, categoría desconocida).
- **Quality gates:** unitarias y BDD en verde, ESLint sin avisos.
