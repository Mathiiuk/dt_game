# eventos-sin-cansar

Los eventos a pantalla completa se juegan sin cansar.

- **Antes:** todos los eventos pendientes se abrían a pantalla completa uno tras otro, los eventos sueltos se leían con varios toques y casi todos traían un desafío de pista.
- **Ahora:**
  - **Uno por visita:** al entrar al inicio se abre solo un evento (lo urgente primero, después los capítulos de historias, después los sueltos). El resto queda en el inicio, y cada tarjeta tiene un botón **Jugar** que lo abre a pantalla completa cuando se quiera. "Dejar para más tarde" no hace que se abra el siguiente solo. Las opciones de la tarjeta siguen sirviendo para decidir rápido.
  - **Lectura de un toque** para los eventos sueltos (son cortos); las historias con capítulos siguen leyéndose de a momentos.
  - **Desafío en la mitad de los eventos** (antes casi todos): cada desafío sorprende en lugar de ser un trámite. Pasar el desafío sigue siendo posible y no cuesta nada.
- **Dónde:** `pickAutoStage`, `isArcEvent` y el nuevo reparto de desafíos en `src/domain/storyStage.js`; `Dashboard.jsx` y `StoryStage.jsx`.
- **TDD:** pruebas de dominio (orden de apertura, postergados, mitad sin desafío), de interfaz de la pantalla completa (lectura de un toque o de a momentos) y la primera prueba de la pantalla de inicio (`tests/ui/dashboardEvents.test.jsx`: una sola apertura automática, botón "Jugar" y sin eventos). Verificado que sin la regla de "una por visita" esas pruebas fallan.
- **Quality gates:** unitarias y BDD en verde, ESLint sin avisos.
