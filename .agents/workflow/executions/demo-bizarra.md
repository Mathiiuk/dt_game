# Demo bizarra: "Tu primer día como DT" (sin cuenta)

- Roles: product-designer (guion y humor), frontend-engineer (pantalla), seo-growth-expert (página indexable), qa-engineer (TDD).
- `src/domain/demo.js` (puro y determinista): 3 decisiones con 3 opciones cada una (la barra, el dirigente con el sobre, el árbitro), 4 medidores (caja, barra, dirigencia, vestuario) y la suerte con el árbitro; partido contra un rival ficticio con relato por minutos, penal final con la barra de potencia y titulares del día siguiente. Sin clubes reales (test).
- `/demo` indexable y prerenderizada (título, texto y migas de pan); pantalla propia `DemoScreen` cargada bajo demanda.
- Medición sin datos personales: `demo_start`, `demo_decision`, `demo_complete`, `demo_cta_click`.
- Enlaces: portada ("Probar la demo gratis"), pie, guías y CTA final a `/registro`; botón de compartir (Web Share o copiar enlace).
- Gates: lint, 1913 tests, 70 escenarios BDD y build (21 páginas prerenderizadas).
