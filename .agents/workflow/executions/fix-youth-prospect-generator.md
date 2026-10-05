# Ejecución: fix-youth-prospect-generator
Otear en la Academia insertaba un juvenil sin nacionalidad ni otros 28 campos obligatorios de `players` (y con posiciones DF/MD/FW que el resto del juego no usa). Ahora `buildYouthProspect` (player.js) arma la fila completa con los mismos generadores del plantel inicial: nacionalidad del club, dorsal libre desde el 21, atributos, contrato y valor. Tests: todos los NOT NULL de la base, nacionalidad, potencial según nivel de academia, dorsal.
Pendiente (M3): unificar los códigos de posición en todo el juego.
