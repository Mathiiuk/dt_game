# Ejecución: dashboard-priorities (M1 + M2)

## Qué se hizo
- Se reordenó la pantalla de Inicio (Dashboard.jsx) siguiendo los lineamientos de la mejora M1.
- Se reubicó el aviso del próximo partido a la cabecera, dándole prioridad como acción principal.
- Se agruparon las estadísticas principales en una barra horizontal condensada con acceso directo a Plantel, Finanzas, Posición en Liga y Carrera.
- Se implementó la nueva vista \/events\ (EventScreen.jsx) que reemplaza la tarjeta flotante de eventos en el dashboard.
- Se agregó una alerta prioritaria en el Dashboard cuando el mánager tiene una 'Decisión urgente', que lo dirige a la página de Eventos, cumpliendo con la separación de contexto solicitada por la mejora M2.
- Se solucionaron y verificaron errores de test suite relacionados a mayúsculas ("Fin de temporada" en vez de "Fin de Temporada") y SEO local, integrando \/events\ dentro del robots.txt para evitar su indexación como contenido no público.

## Próximos pasos
- Realizar pruebas de usabilidad en dispositivos móviles para corroborar que la barra horizontal sea completamente amigable.
- Preparar o ejecutar la migración a la base de datos que había quedado pendiente de las fechas de calendario.
