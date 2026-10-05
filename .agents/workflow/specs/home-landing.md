# Especificación: Home pública de Vestuario

**ID:** home-landing · **Tipo:** feat · **Fuente:** `docs/home_landing/HOME_LANDING_MASTER.md` (fases 0 a 45)

## Objetivo
Que quien llega a https://vestuario.com.ar/ entienda en menos de cinco segundos que Vestuario es un juego de fútbol,
que él es el DT y que puede empezar una carrera. Mensaje núcleo: **Vos sos el DT.**

## Decisiones tomadas con el usuario (05/10/2026)
- Se hace la Home y además las 11 páginas secundarias del pie, con contenido breve y real (sin enlaces rotos).
- Marca: Vestuario en todo lo que ve el público y los buscadores (portada, metadatos, app instalable, acceso) y en los
  pocos lugares internos que decían "El Pizarrón". Los textos del juego con "potrero" son ambientación y no se tocan.
- Cierre con el flujo habitual: tests, push y auto-merge.

## Adaptaciones de la especificación al proyecto
| La especificación pide | En este proyecto |
|---|---|
| TypeScript y CSS Modules | JavaScript y Tailwind (lo que usa el resto del código) |
| `src/pages/HomeLanding` y `src/components/*` | `src/features/home/*` (el proyecto se organiza por features) |
| SSR / SSG | La portada se prerenderiza dentro de `index.html` y un test obliga a mantenerla al día |
| Juego bajo `/app/*` | Las rutas del juego no se mueven; se bloquean en `robots.txt` y llevan `noindex` |
| Imagen o video de fondo | Fondo hecho con CSS y SVG en línea (cero descargas) |

## Alcance
1. Portada: encabezado, flash de frases, H1, bajada, contexto visible, dos llamados a la acción y pie compacto.
2. Frases: dataset `src/data/managerQuotes.js`; sólo se publican las verificadas y aprobadas; las propias sin autor.
3. Estados: visitante, con sesión sin carrera, con carrera (Continuar carrera).
4. SEO: title, description, canonical, lang es-AR, robots, Open Graph con imagen propia, JSON-LD (Organization + VideoGame/WebApplication).
5. Rastreo: `robots.txt` y `sitemap.xml`.
6. Rutas `/login` y `/registro`.
7. Páginas: /juego, /como-jugar, /tacticas, /mercado-de-pases, /cantera, /carrera-del-dt, /faq, /contacto, /soporte, /privacidad, /terminos.
8. Analítica: eventos en `window.dataLayer`, sin datos personales.
9. Rendimiento: el juego se descarga aparte de la portada (`React.lazy`).

## Fuera de alcance
- Contenido SEO profundo de las páginas secundarias y su prerender.
- Contratar una herramienta de analítica y medir conversiones del embudo.
- Mover el juego a `/app/*`.

## Pendientes para el usuario
- Canal de contacto real (`SITE.contactEmail` en `src/data/site.js`): hoy las páginas avisan que todavía no está publicado.
- Revisión legal de Privacidad y Términos (texto base, no redactado por un abogado).
- Aprobar más frases históricas: Menotti y Cruyff quedaron pendientes por falta de fuente primaria. La frase del ejemplo
  ("Un equipo es un estado de ánimo") no es de Menotti: se atribuye a Jorge Valdano, por eso no se usó.
