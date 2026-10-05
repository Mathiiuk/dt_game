# Ejecución: fix-scouting-column
`scoutPlayer` escribía `last_scouted_at` (columna inexistente en scout_reports) y fallaba siempre. Además cobraba los viáticos antes de guardar el informe: si el guardado fallaba se perdía la plata. Ahora el informe se guarda primero (con `updated_at`) y recién después se cobra. 3 tests (columnas reales, orden de cobro, sin cobro si falla).
