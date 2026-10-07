# VESTUARIO — HOME LANDING
## Especificación Maestra de Diseño, UX, SEO y Desarrollo

**Proyecto:** Vestuario  
**Dominio:** https://vestuario.com.ar/  
**Producto:** Videojuego web / PWA de gestión futbolística.  
**Rol del usuario:** Director Técnico.  
**Concepto:** el usuario dirige, decide, planifica, negocia y construye su carrera.

> **Vos sos el DT.**

---

# FASE 0 — CONTEXTO DEL PRODUCTO

Vestuario es un juego de Director Técnico de fútbol.

El jugador no controla directamente a los futbolistas. Sus decisiones determinan la evolución del plantel, los partidos, el club y su carrera.

Progresión:

```text
DT desconocido
→ club humilde
→ primeros partidos
→ ascenso
→ reconocimiento
→ grandes clubes
→ títulos
→ selección
→ ídolo
→ leyenda
```

La Home debe vender esta fantasía, no enumerar todo el juego.

---

# FASE 1 — OBJETIVO ESTRATÉGICO

## Objetivo principal

En menos de cinco segundos el visitante debe entender:

1. qué es Vestuario;
2. que es un juego de fútbol;
3. que él es el DT;
4. que puede comenzar una carrera.

## Objetivo emocional

La reacción buscada:

> “Quiero probarlo.”

## Mensaje núcleo

> **Vos sos el DT.**

CTA principal:

> **Crear mi carrera**

CTA secundario:

> **Conocer el juego**

---

# FASE 2 — ESTRUCTURA GENERAL

La Home no debe parecer un sitio SaaS.

No utilizar:

- pricing;
- múltiples tarjetas;
- testimonios artificiales;
- dashboard;
- carruseles de features;
- scroll infinito.

Estructura:

```text
BODY
├── HEADER
├── MAIN
│   ├── FONDO ATMOSFÉRICO
│   ├── FLASH DE FRASE
│   ├── HERO
│   └── CTA
└── FOOTER COMPACTO
```

Objetivo:

`100svh`

El contenido debe intentar entrar en una sola viewport sin sacrificar accesibilidad.

---

# FASE 3 — HEADER

## Desktop

```text
Vestuario                         Iniciar sesión   Crear mi carrera
```

## Izquierda

Mostrar:

> Vestuario

No añadir `.com.ar`, “Game”, “Football Manager” ni subtítulos permanentes.

## Derecha

- Iniciar sesión → `/login`
- Crear mi carrera → `/registro`

Si existe sesión:

- Continuar
- Carrera activa / nueva carrera según reglas del producto

El CTA principal debe tener mayor jerarquía visual.

## Mobile

Reducir a:

```text
Vestuario                 Entrar   Crear
```

No agregar navegación innecesaria.

---

# FASE 4 — ATMÓSFERA VISUAL

Concepto:

> Minutos antes de salir a la cancha.

Inspiraciones:

- banco de suplentes;
- vestuario;
- túnel;
- pizarra táctica;
- estadio;
- cancha nocturna.

Preferencia:

```text
fondo oscuro
+
luz puntual
+
textura mínima
+
líneas tácticas sutiles
```

La imagen nunca debe competir con el texto.

No usar estética:

- cyberpunk;
- neon;
- glitch;
- gamer genérico.

---

# FASE 5 — IDENTIDAD VISUAL

Paleta base:

- negro;
- carbón;
- gris oscuro;
- blanco roto.

Un solo color de acento para:

- CTA;
- estados;
- detalles.

Sensación:

- futbolera;
- sobria;
- contemporánea;
- premium;
- argentina;
- latinoamericana.

---

# FASE 6 — TIPOGRAFÍA

Máximo dos familias.

## Logo

Sans-serif fuerte.

## H1

Grande, dominante y limpio:

> Vos sos el DT.

## Cuerpo

Sans-serif muy legible.

## Citas

Puede utilizar la misma familia con otro peso o una serif editorial muy sutil.

No usar tipografías caricaturescas.

---

# FASE 7 — HERO

## H1

Debe existir un único H1:

```html
<h1>Vos sos el DT.</h1>
```

## Subheadline

```text
Construí tu carrera, dirigí tu equipo y llevá un club desde el barrio hasta la gloria.
```

## Contexto SEO visible

```text
Vestuario es un juego de Director Técnico de fútbol donde vos armás el plantel, elegís la táctica, negociás jugadores y construís tu carrera desde abajo.
```

Este texto no debe estar oculto.

Puede presentarse de forma compacta para no romper la estética.

---

# FASE 8 — FRASES DE DT

Elemento distintivo de Home.

Las frases funcionan como flashes cinematográficos, no como carrusel.

Ejemplo:

```text
“Un equipo es un estado de ánimo.”

— César Luis Menotti
```

Luego desaparece y aparece otra.

No usar flechas de carrusel ni contadores.

## Concepto narrativo

```text
grandes DT
    ↓
historia del fútbol
    ↓
vos
    ↓
tu carrera
```

Las frases introducen al visitante en la cultura del DT.

---

# FASE 9 — DATASET DE FRASES

Nunca hardcodear frases dentro del componente.

Crear:

```text
src/data/managerQuotes.ts
```

Modelo:

```ts
export interface ManagerQuote {
  id: string;
  text: string;
  manager: string;
  country: string;
  era?: string;
  sourceUrl?: string;
  sourceName?: string;
  verified: boolean;
  approvedForProduction: boolean;
  type: "historical" | "original";
}
```

Solo publicar si:

```text
verified === true
approvedForProduction === true
```

Las frases propias de Vestuario deben marcarse como:

```text
type: "original"
```

No atribuir frases originales a DTs reales.

---

# FASE 10 — VERIFICACIÓN DE CITAS

No utilizar frases solamente porque son populares en:

- redes sociales;
- Pinterest;
- memes;
- páginas de citas;
- publicaciones sin fuente.

Cada frase histórica debe registrar:

- autor;
- fuente;
- URL;
- estado de verificación;
- estado de aprobación.

Ante una atribución dudosa:

> NO PUBLICAR.

Esto evita convertir una animación atractiva en una fuente de información incorrecta.

---

# FASE 11 — ANIMACIÓN DE FRASES

Estados:

```text
IDLE
ENTER
VISIBLE
EXIT
WAIT
NEXT
```

Timing recomendado:

- enter: 500–800 ms;
- visible: 2500–4500 ms;
- exit: 500–800 ms;
- espera: 300–1000 ms.

Usar:

- opacity;
- pequeño translate;
- blur mínimo;
- scale entre 0.98 y 1.

Evitar:

- bounce;
- shake;
- zoom agresivo;
- glitch.

El movimiento debe ser cinematográfico y lento.

---

# FASE 12 — REDUCED MOTION

Implementar:

```css
@media (prefers-reduced-motion: reduce)
```

Cuando esté activo:

- deshabilitar transiciones no esenciales;
- mostrar la frase estáticamente;
- mantener contenido y CTA disponibles.

La Home debe funcionar sin depender de animaciones.

---

# FASE 13 — CTA

CTA principal:

> Crear mi carrera

Destino:

```text
/registro
```

CTA secundario:

> Conocer el juego

Destino:

```text
/juego
```

No usar “Registrarse ahora” como mensaje principal.

La CTA debe comunicar la fantasía de la carrera.

Microcopy opcional:

> Tu carrera empieza acá.

Solo incorporarlo si no perjudica la composición.

---

# FASE 14 — FOOTER

El footer debe ser pequeño y funcional.

Estructura:

```text
Vestuario

Juego
Cómo jugar
Tácticas
Mercado de pases
Cantera
Carrera del DT

Soporte
FAQ
Contacto
Soporte

Legal
Privacidad
Términos

© 2026 Vestuario
```

Links:

```text
/juego
/como-jugar
/tacticas
/mercado-de-pases
/cantera
/carrera-del-dt
/faq
/contacto
/soporte
/privacidad
/terminos
```

No incluir newsletter ni 20 enlaces sociales.

---

# FASE 15 — FOOTER SEO

El footer sirve como navegación interna y refuerzo semántico.

Usar anchors descriptivos:

- Cómo jugar
- Tácticas
- Mercado de pases
- Cantera
- Carrera del DT

Evitar “click acá”.

No llenar el footer de keywords.

---

# FASE 16 — MOBILE FIRST

Resolución de referencia:

`390 × 844`

Composición:

```text
┌────────────────────────────┐
│ Vestuario          Entrar  │
│                    Crear   │
│                            │
│        [ FRASE ]           │
│                            │
│       Vos sos              │
│        el DT.              │
│                            │
│ Construí tu carrera        │
│ desde abajo.               │
│                            │
│ [ CREAR MI CARRERA ]       │
│                            │
│     Conocer el juego       │
│                            │
│────────────────────────────│
│ Juego · Tácticas · Carrera │
│ Soporte · Legal            │
│ © 2026 Vestuario           │
└────────────────────────────┘
```

No producir:

- overflow;
- botones pequeños;
- texto cortado;
- footer superpuesto.

Considerar safe areas de PWA.

---

# FASE 17 — DESKTOP

Referencia:

`1440 × 900`

```text
┌────────────────────────────────────────────────────┐
│ Vestuario                         Entrar   Crear   │
│                                                    │
│                                                    │
│              [ FRASE HISTÓRICA ]                  │
│                                                    │
│                  VOS SOS EL DT.                   │
│                                                    │
│        Construí tu carrera desde abajo.           │
│                                                    │
│              [ CREAR MI CARRERA ]                 │
│                Conocer el juego                   │
│                                                    │
│────────────────────────────────────────────────────│
│ Vestuario  Juego  Tácticas  Carrera  Soporte ... │
└────────────────────────────────────────────────────┘
```

---

# FASE 18 — NO SCROLL

La Home debe apuntar a:

```text
document.documentElement.scrollHeight
≈
window.innerHeight
```

No forzar esto reduciendo excesivamente la tipografía.

Orden de optimización:

1. espacios;
2. footer;
3. distribución;
4. tamaños razonables;
5. solo después microajustes.

---

# FASE 19 — SEO INTERNO

## URL

```text
https://vestuario.com.ar/
```

## TITLE

```text
Vestuario | Juego de Director Técnico de Fútbol
```

## META DESCRIPTION

```text
Vestuario es un juego de Director Técnico de fútbol donde vos armás el plantel, elegís la táctica, negociás jugadores y construís tu carrera desde abajo.
```

## CANONICAL

```text
https://vestuario.com.ar/
```

## LANG

```html
<html lang="es-AR">
```

## ROBOTS

```text
index,follow
```

## H1

```text
Vos sos el DT.
```

La Home debe mantener coherencia entre title, H1 y contenido contextual.

---

# FASE 20 — SEO SEMÁNTICO

Integrar naturalmente:

- juego de fútbol;
- Director Técnico;
- DT;
- manager de fútbol;
- club;
- plantel;
- jugadores;
- tácticas;
- partidos;
- mercado de pases;
- fichajes;
- entrenamiento;
- cantera;
- juveniles;
- carrera;
- ascenso;
- descenso.

No utilizar keyword stuffing.

La Home debe priorizar claridad y marca.

---

# FASE 21 — DESAMBIGUACIÓN DE “VESTUARIO”

“Vestuario” también puede significar:

- ropa;
- indumentaria;
- camerino;
- vestuario teatral.

Por eso el contexto fútbol debe aparecer en los primeros elementos de la página.

Frase recomendada:

> Vestuario es un juego de Director Técnico de fútbol.

También asociar:

```text
Vestuario
+
juego
+
DT
+
fútbol
```

en title, contenido visible, enlaces y datos estructurados.

---

# FASE 22 — STRUCTURED DATA

Utilizar JSON-LD cuando corresponda.

## Organización

Preparar:

```text
Organization
```

con información real:

- name;
- url;
- logo;
- sameAs;
- contactPoint si corresponde.

## Producto

Cuando aplique:

```text
VideoGame
WebApplication
SoftwareApplication
```

Ejemplo:

```json
{
  "@context": "https://schema.org",
  "@type": ["VideoGame", "WebApplication"],
  "name": "Vestuario",
  "url": "https://vestuario.com.ar/",
  "applicationCategory": "GameApplication",
  "operatingSystem": "Web"
}
```

No inventar reviews, ratings, precios, usuarios o premios.

---

# FASE 23 — OPEN GRAPH

Implementar:

```text
og:title
og:description
og:url
og:image
og:type
```

Valores:

```text
Vestuario | Juego de Director Técnico de Fútbol
```

```text
Vos sos el DT. Armá tu plantel, elegí tu táctica y construí tu carrera.
```

```text
https://vestuario.com.ar/
```

Crear imagen social propia:

```text
vestuario-og-home.webp
```

---

# FASE 24 — INTERNAL LINKING

Home como hub de producto.

Priorizar:

```text
/juego
/como-jugar
/tacticas
/mercado-de-pases
/cantera
/carrera-del-dt
/faq
```

No enlazar todas las páginas posibles.

Cada enlace debe tener sentido.

---

# FASE 25 — PUBLIC VS PRIVATE

La Home es pública.

El juego autenticado debe vivir aparte:

```text
/app
/app/dashboard
/app/plantel
/app/tacticas
/app/mercado
/app/entrenamiento
/app/partido
/app/club
/app/dt
```

El área privada:

- requiere autenticación;
- no entra en sitemap;
- no debe competir en SEO;
- debe evitar indexación accidental.

---

# FASE 26 — RENDERIZADO

La parte pública debe poder entregar HTML semántico de forma robusta.

Preferir:

- SSR;
- SSG;
- prerendering;

según el stack.

El área privada puede funcionar como SPA/PWA.

Arquitectura conceptual:

```text
PUBLIC SEO APP
        +
PRIVATE GAME APP
```

---

# FASE 27 — PERFORMANCE

La Home debe ser extremadamente liviana.

Optimizar:

- LCP;
- INP;
- CLS;
- JavaScript;
- CSS;
- imágenes;
- fuentes.

Evitar:

- videos gigantes;
- fondos de varios MB;
- librerías de animación innecesarias;
- cinco o seis fuentes;
- JS excesivo.

---

# FASE 28 — BACKGROUND

Si se utiliza imagen:

- AVIF/WebP;
- responsive;
- compresión;
- tamaño adecuado.

No utilizar una imagen de 5–10 MB.

Si se utiliza vídeo posteriormente:

- poster;
- fallback;
- carga no bloqueante;
- compresión.

Inicialmente se recomienda imagen/arte ligero antes que video de fondo.

---

# FASE 29 — ACCESIBILIDAD

Requisitos:

- contraste adecuado;
- keyboard navigation;
- focus visible;
- links reales;
- botones reales;
- orden de tabulación lógico;
- H1 real;
- reduced motion.

No usar `div` clickeables.

CTA:

```html
<a href="/registro">
  Crear mi carrera
</a>
```

---

# FASE 30 — ARQUITECTURA FRONTEND

Propuesta:

```text
src/
├── pages/
│   └── HomeLanding/
│       ├── HomeLanding.tsx
│       ├── HomeLanding.module.css
│       └── index.ts
│
├── components/
│   ├── Header/
│   ├── BrandLogo/
│   ├── ManagerQuoteFlash/
│   ├── HeroIdentity/
│   ├── HeroCTA/
│   └── Footer/
│
├── data/
│   └── managerQuotes.ts
│
├── seo/
│   ├── homeSeo.ts
│   └── structuredData.ts
│
└── assets/
    └── home/
```

No colocar toda la Home en un único componente.

---

# FASE 31 — ESTADOS DE USUARIO

## Visitante

Mostrar:

- Iniciar sesión;
- Crear mi carrera.

## Usuario autenticado sin carrera

CTA:

> Crear mi carrera

## Usuario autenticado con carrera

CTA principal:

> Continuar carrera

La Home sigue siendo indexable y estable para buscadores.

---

# FASE 32 — ANALYTICS

Registrar:

```text
landing_view
login_click
register_click
game_info_click
tactics_click
market_click
career_click
faq_click
```

Conversiones:

```text
registration
career_creation
game_start
```

No enviar información sensible.

---

# FASE 33 — FUNNEL

```text
Google / Social / Direct
        ↓
Home
        ↓
Entiende Vestuario
        ↓
Se identifica como DT
        ↓
Crear mi carrera
        ↓
Registro
        ↓
Crear DT
        ↓
Crear club
        ↓
Primer partido
```

No medir únicamente tráfico.

Medir también:

- CTR CTA;
- registros;
- carreras creadas;
- primera sesión;
- retención.

---

# FASE 34 — FRASES PROPIAS DE VESTUARIO

Crear fallback sin atribución.

Ejemplos:

> Las decisiones también juegan.

> Cada partido empieza antes del pitazo.

> El equipo juega en la cancha. La historia se decide desde el banco.

> Tu carrera empieza acá.

Estas frases son propiedad narrativa de Vestuario y no deben atribuirse a personas reales.

---

# FASE 35 — COPY FINAL DE HOME

## Header

```text
Vestuario

Iniciar sesión
Crear mi carrera
```

## Frase

```text
“[CITA HISTÓRICA VERIFICADA]”

— [DT]
```

## H1

```text
Vos sos el DT.
```

## Subheadline

```text
Construí tu carrera, dirigí tu equipo
y llevá un club desde el barrio hasta la gloria.
```

## Contexto SEO

```text
Vestuario es un juego de Director Técnico de fútbol
donde vos armás el plantel, elegís la táctica,
negociás jugadores y construís tu carrera desde abajo.
```

## CTA

```text
Crear mi carrera
```

## Secundario

```text
Conocer el juego
```

---

# FASE 36 — TONO DE VOZ

Debe ser:

- argentino;
- latinoamericano;
- directo;
- personal;
- futbolero;
- elegante.

Ejemplos:

Correcto:

> Vos sos el DT.

Correcto:

> Las decisiones también juegan.

Correcto:

> Tu carrera empieza acá.

Evitar:

> Vive una experiencia inmersiva revolucionaria.

Evitar:

> La nueva revolución del gaming futbolístico.

---

# FASE 37 — NO IMPLEMENTAR

No poner en Home:

- pricing;
- planes;
- testimonios falsos;
- contadores sin datos reales;
- ranking;
- blog completo;
- noticias;
- múltiples capturas;
- newsletter;
- popups;
- publicidad;
- chat flotante;
- banners;
- exceso de redes sociales.

La Home es portada, no catálogo.

---

# FASE 38 — REGLAS CONTRA SOBREDISEÑO

Ningún elemento se añade únicamente por estética.

Debe responder al menos una pregunta:

```text
¿Refuerza la identidad?
¿Ayuda a comprender?
¿Ayuda a convertir?
¿Ayuda al SEO?
¿Ayuda a navegar?
```

Si no aporta:

> eliminar.

---

# FASE 39 — TESTS VISUALES

Probar:

### Mobile
- 375×812
- 390×844
- 412×915

### Tablet
- 768×1024
- 1024×768

### Desktop
- 1280×720
- 1366×768
- 1440×900
- 1920×1080

Validar:

- no overflow;
- H1 visible;
- CTA visible;
- footer visible;
- quotes legibles;
- header estable.

---

# FASE 40 — TESTS FUNCIONALES

## Header

[ ] Logo funciona  
[ ] Login funciona  
[ ] Crear carrera funciona

## Hero

[ ] H1 existe  
[ ] Subheadline existe  
[ ] CTA funciona  
[ ] Segundo CTA funciona

## Quotes

[ ] Dataset carga  
[ ] Solo aparecen citas aprobadas  
[ ] No se repite inmediatamente  
[ ] Fallback funciona  
[ ] Reduced motion funciona

## Footer

[ ] Links funcionan  
[ ] Sin enlaces rotos  
[ ] Legal funciona

---

# FASE 41 — TESTS SEO

[ ] Title correcto  
[ ] Meta description correcta  
[ ] Canonical correcto  
[ ] lang correcto  
[ ] H1 único  
[ ] HTML semántico  
[ ] JSON-LD válido  
[ ] Open Graph  
[ ] Home indexable  
[ ] Home en sitemap  
[ ] Área privada protegida  
[ ] No hay texto SEO oculto

---

# FASE 42 — PERFORMANCE CHECKLIST

[ ] Imágenes optimizadas  
[ ] Fuentes limitadas  
[ ] JS mínimo  
[ ] CSS mínimo  
[ ] Fondo liviano  
[ ] No video pesado inicial  
[ ] LCP revisado  
[ ] INP revisado  
[ ] CLS revisado  
[ ] Sin layout shifts

---

# FASE 43 — CRITERIOS DE ACEPTACIÓN

La Home está terminada cuando:

1. Se entiende qué es Vestuario en menos de cinco segundos.
2. Se entiende que el visitante es el DT.
3. “Vos sos el DT.” es el único H1.
4. Vestuario domina visualmente.
5. Las frases generan atmósfera.
6. Las citas reales están verificadas.
7. “Crear mi carrera” es la CTA principal.
8. Login está visible.
9. Footer es compacto.
10. No hace falta scroll para comprender el producto.
11. Mobile funciona correctamente.
12. Desktop funciona correctamente.
13. SEO está implementado.
14. Structured data está validada.
15. Performance es buena.
16. Accessibility está contemplada.
17. La Home parece la portada de un videojuego.
18. No parece una landing SaaS.

---

# FASE 44 — VISIÓN FINAL

La secuencia ideal:

```text
ENTRÁS
  ↓
VES VESTUARIO
  ↓
SENTÍS FÚTBOL
  ↓
APARECE UNA FRASE
  ↓
DESAPARECE
  ↓
APARECE OTRA
  ↓
SILENCIO
  ↓
VOS SOS EL DT.
  ↓
CREAR MI CARRERA
```

La Home debe transmitir:

> **El partido todavía no empezó.**
>
> **Pero vos ya estás tomando decisiones.**

---

# FASE 45 — DEFINICIÓN DE PRODUCTO

La Home no debe vender:

> “un juego con muchas funcionalidades”.

Debe vender:

> **“una carrera que empieza cuando te sentás en el banco.”**

Y la definición más importante:

> **Vestuario no es un juego donde manejás jugadores.**
>
> **Es un juego donde vos sos el DT.**
