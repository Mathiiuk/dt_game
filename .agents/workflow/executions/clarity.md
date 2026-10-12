# Microsoft Clarity

- Proyecto `ywsirniaxt` instalado **con consentimiento**: `src/lib/clarity.js` inyecta el mismo código del fabricante (función `clarity` con cola + script asíncrono de `clarity.ms`) solo cuando la elección de cookies es "Aceptar"; con "Solo necesarias" no se carga y, si ya estaba cargado, se le avisa `consentv2` denegado. `src/lib/consent.js` lo dispara al responder el aviso y al abrir la app con la aceptación guardada.
- No se pegó el script suelto en `index.html`: habría grabado sesiones antes de aceptar las cookies.
- Política de privacidad actualizada (cookies, Google Tag Manager y Microsoft Clarity).
- Recomendación (panel de Clarity): enmascarado en "Estricto", porque en el juego se ven nombres de DT y de clubes. Los datos llegan solo de quienes aceptan las cookies.
- Verificación en producción: el HTML publicado no debe traer el script de Clarity; aparece al aceptar las cookies.
