# press-flow

Flujo del final del partido y rueda de prensa relámpago.

- **Fin del partido:** al sonar el pitazo aparece el botón "Continuar" junto al marcador (ya no hay que bajar hasta el fondo); las estadísticas se pueden mirar antes si se quiere.
- **Resumen:** las pestañas quedan en crónica, estadísticas, calificaciones y boletería; el botón principal es "Continuar a la rueda de prensa". La prensa ya no es una pestaña al fondo: es un segundo paso con su propia pantalla (`PressRoom`). Salir con la conferencia sin resolver sigue contando como no presentarse (con aviso previo).
- **Prensa relámpago:** cada pregunta tiene cuenta regresiva de 12 s (opción "Sin cuenta regresiva", que se recuerda); si se acaba, responde nervioso con la opción más cauta; tras cada respuesta la sala reacciona (línea según tono y resultado, hinchada y dirigencia suben o bajan); al terminar hay "Completá la frase del DT" (frase de manual +1 de hinchada, pasable 0, desubicada -1), una sola vez por conferencia.
- `domain/pressRoom.js`, `pressApi.applyPhrase` y tests de dominio, sala y flujo de la pantalla.
- Mejora futura: Titular o fake y Bingo del DT (plan C).
