# Verificación de Bing Webmaster Tools

- Meta `msvalidate.01` agregada al `<head>` de `index.html` (después de `robots`). Como todas las páginas públicas se prerenderizan desde esa plantilla, sale en `/`, en cada página interna y en el 404 (una sola vez en cada una).
- Pruebas: `tests/static/homeSeo.test.jsx` (una vez, dentro del head, junto a los metadatos de SEO) y `tests/static/prerenderPublic.test.js` (todas las páginas públicas la conservan, sin duplicarla). Comprobado también en `dist/`.
- Pendiente del usuario: tras el deploy, tocar "Verificar" en Bing Webmaster Tools.
