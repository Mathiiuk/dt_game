# Plan de Pruebas — feat-fase-02-dt-creation

## 1. Casos de Prueba Verificados

### Caso 1: Validación de Suma Cero (Exactamente 15 Puntos)
- Intentar avanzar con 14 puntos o menos muestra advertencia y bloquea el botón.
- Intentar asignar más de 15 puntos bloquea los botones `+`.

### Caso 2: Tope Máximo Inicial de Atributo
- Ningún atributo puede superar 14 puntos en el wizard. Al llegar a 14, el botón `+` se desactiva y alerta al usuario.

### Caso 3: Presets de Trasfondo y Reputación
- Seleccionar `EX_PRO_PLAYER` asigna base de reputación 35 y atributos correspondientes.
- Seleccionar `STREET_COACH` asigna base de reputación 20 y alta motivación.

### Caso 4: Verificación de Build
- `npm run build` genera la salida de producción en menos de 1.5s sin errores.
