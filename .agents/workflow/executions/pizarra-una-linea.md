# Pizarra: datos en una línea y sin scroll al elegir una ficha

**Problema (captura del usuario):** la cinta de arriba ocupaba dos líneas (formación + "?" y chips + "?") y, al tocar una ficha, la barra "Cambiar jugador" se sumaba y empujaba la cancha: la pantalla pasaba a hacer scroll.

**Solución** (`src/features/tactics/MobileTactics.jsx`, `TacticsScreen.jsx`):
- `TopBar`: una franja de altura fija (`h-11`, `data-top-slot`) que cambia de contenido sin cambiar de tamaño: resumen, ficha elegida ("Puesto · jugador" + "Cambiar jugador" + cancelar) o modo Editar (aviso + "Listo").
- `SummaryBar` en una línea: formación y estilo (se recorta si falta lugar), `Niv.`, `Quím.`, una marca `⚠ n` con las bajas (lesionados, suspendidos, fuera de puesto; el detalle va en el nombre accesible), Guardar (solo ícono, 44 px) y un único "?".
- El "?" ahora explica todo junto: uso de la pizarra, nivel, química, fuera de puesto, colores y símbolos.
- El aviso del modo Editar ya no es un párrafo bajo la cancha.

**Tests:** `tacticsMobile` (fila única, misma franja y misma altura al elegir una ficha, modo Editar, ayuda unificada, bajas). Capturas a 390 px: las cuatro variantes miden 44 px.
