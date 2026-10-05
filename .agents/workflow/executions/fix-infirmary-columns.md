# Ejecución: fix-infirmary-columns
La enfermería devolvía 400 (42703): `getClubInfirmary` pedía `players.number` y `players.photo_url`, que no existen (el dorsal es `shirt_number`). Se corrigió la consulta y el uso del dorsal en InfirmaryTab; test estático de regresión.
