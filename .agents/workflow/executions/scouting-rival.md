# Scouting del rival solo con Jefe de Ojeadores

El panel "Scouting" de /match (especialistas del rival y cómo juega) se mostraba siempre, gratis. Ahora se ve solo si el club tiene un `HEAD_SCOUT` en el cuerpo técnico (`staffApi.getStaff`, cargado junto al plantel). Sin ojeador aparece un aviso "Sin scouting del rival" que invita a contratarlo; si no se puede leer el staff, el partido carga igual sin scouting. Las pistas del banco en córners y tiros libres siguen siendo parte del juego base.

Tests: `tests/ui/matchDecisions.test.jsx` (con ojeador, sin ojeador y staff con error).
