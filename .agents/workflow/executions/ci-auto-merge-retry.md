# Reporte de Ejecución: ci-auto-merge-retry
- **Rama**: `fix/ci-auto-merge-retry` | **Estado**: `DONE`
- **Problema**: al publicar varias ramas a la vez, los workflows `Auto Merge to Master` corren en paralelo; los que terminan después encuentran `master` adelantado y su `git push` es rechazado (3 de 5 fallaron).
- **Fix**: el paso de merge hace `fetch` + `reset --hard origin/master` + merge de la rama + push, con hasta 6 reintentos y espera aleatoria; un conflicto real falla de inmediato con `::error::`. (No se usa `concurrency` porque GitHub descarta los runs pendientes intermedios.)
- **Verificación**: YAML válido; la prueba real ocurre al publicar ramas en simultáneo.
