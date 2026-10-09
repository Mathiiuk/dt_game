# plantel-botones-fila

Los botones parecidos de la cabecera van en una sola fila en el celular, y se distinguen por color.

- **Antes:** en Plantel el tercer botón (Entrenamiento) caía debajo de los otros dos; la Tabla y la Carrera del DT tenían el mismo problema de botones que se apilaban.
- **Ahora:** `QuickActions` (en `components/ui/page-header.jsx`) pone los botones en una sola fila que reparte el ancho por igual; en el celular cada botón lleva el icono arriba y el texto abajo, y desde `sm` vuelve a icono y texto en línea. Cada icono tiene su color (Desarrollo verde, Mentorías dorado, Entrenamiento azul; Calendario azul, Pirámide dorado; Logros dorado, Salón de la Fama verde). `PageHeader` tiene la opción `actionsFill` para que las acciones ocupen todo el ancho en el celular.
- **Pantallas:** Plantel, Tabla de posiciones y Carrera del DT.
- **Verificado a ojo:** captura en navegador a 360 y 390 px (una fila, botones parejos) y a 1100 px (sin cambios en escritorio).
- **TDD:** `tests/ui/quickActions.test.jsx` (misma fila, ancho completo, sin apilar ni envolver).
- **Quality gates:** unitarias y BDD en verde, ESLint sin avisos.
