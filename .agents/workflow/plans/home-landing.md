# Plan técnico: home-landing

## Roles
Director técnico (orquestación), product-designer (portada mobile-first, accesibilidad), frontend-engineer (componentes y
hooks), seo-growth-expert (metadatos, JSON-LD, rastreo), qa-engineer (tests).

## Archivos
- `[NEW]` `src/data/site.js`: marca, dominio y contacto.
- `[NEW]` `src/data/managerQuotes.js`: dataset de frases con fuente y estado de verificación.
- `[NEW]` `src/data/publicPages.js`: contenido de las 11 páginas y grupos del pie.
- `[NEW]` `src/features/home/quoteCycle.js`, `useQuoteCycle.js`: reglas puras y máquina de estados del flash.
- `[NEW]` `src/features/home/{HomeLanding,Atmosphere,BrandLogo,PublicHeader,ManagerQuoteFlash,HeroIdentity,HeroCTA,PublicFooter,InfoPage}.jsx`
- `[NEW]` `src/features/home/useVisitorState.js`: estado del visitante sin cargar la base si no hay sesión guardada.
- `[NEW]` `src/seo/{homeSeo,structuredData,useSeo}.js`
- `[NEW]` `src/lib/analytics.js`
- `[NEW]` `src/App.jsx`: rutas públicas y carga diferida del juego.
- `[MODIFY]` `src/GameApp.jsx` (era `App.jsx`): rutas del juego, `/login`, `/registro`, `noindex`.
- `[MODIFY]` `src/context/GameContext.jsx`: `/login` y `/registro` como rutas de acceso.
- `[MODIFY]` `src/features/auth/AuthScreen.jsx`: `initialMode` y marca.
- `[MODIFY]` `src/components/layout/{AppShell.jsx,navigation.js}`, `src/features/design/DesignSystemScreen.jsx`: marca.
- `[MODIFY]` `index.html`: SEO estático, JSON-LD y prerender de la portada.
- `[MODIFY]` `vite.config.ts`: nombre de la app instalable, `start_url` al juego.
- `[NEW]` `public/robots.txt`, `public/sitemap.xml`, `public/vestuario-og-home.webp`
- `[NEW]` `tests/domain/managerQuotes.test.js`, `tests/ui/homeLanding.test.jsx`, `tests/static/homeSeo.test.jsx`
- `[MODIFY]` `tests/ui/authScreen.test.jsx`

## Decisiones
1. **Dos aplicaciones en una.** `App.jsx` sólo conoce la portada y las páginas públicas; el juego se importa con `lazy`.
2. **Prerender sin infraestructura nueva.** El HTML de la portada se genera con `renderToStaticMarkup` desde el test
   estático (`HOME_PRERENDER=write`) y se guarda en `index.html`. Como ese archivo responde a todas las rutas, un script
   en línea lo vacía fuera de `/` y quita canonical y JSON-LD de la portada.
3. **Frases.** Publicar exige `verified` y `approvedForProduction`; una histórica además exige autor, medio y URL.
4. **Accesibilidad del flash.** Sin `aria-live`; se detiene con el mouse encima y tiene un botón de pausa visible al
   enfocarlo con teclado. Con movimiento reducido queda fija.
5. **Una pantalla.** Grilla `auto / 1fr / auto` con alto `100svh` menos las zonas seguras; tamaños con `clamp()` atados
   al alto. En pantallas muy chicas (320×568) hay scroll en lugar de achicar la letra.

## Regenerar el prerender
`HOME_PRERENDER=write npx vitest run tests/static/homeSeo.test.jsx`
