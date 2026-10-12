# 2.0 Fase 7 · Lanzamiento

## Definition of Done (aplicable a esta entrega)
- [x] Lint, pruebas unitarias, BDD y build en verde (ver resultados al pie).
- [x] Seguridad: advisors de Supabase revisados (solo lectura): sin hallazgos nuevos. Las tablas con RLS sin políticas y las funciones `security definer` visibles para `anon` son las previstas (tabla y perfil públicos). Pendientes conocidos: protección contra contraseñas filtradas (del usuario) y `pg_net` en `public` (preexistente).
- [x] Base de datos en producción verificada en solo lectura: 23 dilemas del reto, `daily_get`/`daily_submit` con racha y bonus, `legend_road`; `anon` sin acceso a `daily_get` ni `legend_road`; `daily_streak` interna.
- [x] Compatibilidad: todo aditivo; funciones nuevas en vez de reemplazar (`public_top_managers_v3`, etc.); las versiones viejas se revocan recién cuando ninguna versión instalada las use (regla `safe-releases`).
- [x] Documentación: guía pública nueva `/guias/mejores-dt-argentinos` (con imagen og y sitemap), changelog "Vestuario 2.0", un reporte por fase en `.agents/workflow/executions/`.
- [ ] Prueba con rollback de racha y bonus en producción (la herramienta de base de datos pidió aprobación para las consultas de prueba con escritura).
- [ ] Prueba en celular real (tema claro y oscuro, sin conexión, avisos, invitar, reto, consentimiento, cancha en vivo, tarjetas para compartir).
- [ ] Mundial completo con 2 o 3 amigos.

## Pendiente del usuario
GTM/GA4 (eventos `invite_shared`, `ranking_opt_in`, `match_played`, etc.), Search Console (el sitemap incluye la guía nueva), protección contra contraseñas filtradas en Supabase, casilla `contacto@`, sumar más leyendas con cifras verificadas, y revisar las capturas en un celular real.

## Qué incluye 2.0
Camisetas con seis diseños, retratos de jugadores, sellos animados, tarjetas de diario para compartir, perfil público del DT con puesto, cancha en vivo, racha y contrarreloj en el reto del día (con tabla de ayer y 9 dilemas nuevos), camino a la leyenda.
