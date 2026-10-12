# Leyendas en la tabla pública "Los mejores DT"

- Cinco DT argentinos más ganadores (por títulos, fuentes: El Economista, Marketing Registrado): Ramón Díaz 17, Helenio Herrera 16, Carlos Bianchi 15, Marcelo Gallardo 15, Guillermo Stábile 13. Las fuentes difieren en ±1–2 títulos; se usó la cifra más citada. Sin clubes.
- Puntaje de leyenda = títulos × 600 (10200, 9600, 9000, 9000, 7800), alcanzable por DT reales.
- BD (aditivo): tabla `legend_managers` (RLS sin políticas) y función nueva `public_top_managers_v2` con `is_legend`. La función anterior queda sin uso: `drop function` quedó colgado en producción, así que no se reemplazó.
- Cliente: `publicRanking.js` llama a v2 y normaliza `legend`; `TopManagersTable` muestra el sello "Leyenda", la nota y pide 3 DT + las leyendas.
- Privacidad: se aclara que las leyendas son figuras públicas, no usuarios.
