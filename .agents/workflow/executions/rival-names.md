# Reporte de Ejecución: rival-names
- **Rama**: `feat/rival-names` | **Estado**: `DONE`
- **Pendiente cerrado (H6)**: todas las ligas tenían los mismos 19 rivales. `domain/rivalClubs.js` suma un pozo de 58 clubes barriales y `pickRivalClubs(semilla)` sortea 19 de forma determinista por carrera (sin repetir nombres ni siglas, con exclusión opcional). `initializeLeague` lo usa con el id del club como semilla.
- **Tests**: `rivalClubs.test.js` (5); suite completa verde.
