# Portada pública como primera plana de diario deportivo

- **Mástil** (`PublicHeader masthead`, `BrandLogo masthead`): "VESTUARIO" en slab 800 con filete doble, "El diario del DT · Edición de hoy", barra con la fecha (`EditionDate`, solo en el navegador para que el HTML pre-dibujado no quede desactualizado ni desajuste al hidratar) y "Juego gratis · sin descargas". Las demás páginas públicas usan la versión chica del encabezado (marca en slab y filete).
- **Titular** (`HeroIdentity`): kicker "Portada · Fútbol", H1 único "Vos sos el DT." en slab, bajada y contexto de `HOME_COPY` sin cambios. **CTA** (`HeroCTA`): mismos enlaces, textos y eventos; sin sombra de brillo; "Conocer el juego →" como enlace.
- **"El pensamiento del día"** (`ManagerQuoteFlash`): la frase rotativa pasa a un recuadro de diario (lógica, pausa y altura reservada intactas).
- **"En esta edición"** (`EditionColumn`, nuevo; solo `lg+`): tres notas → `/tacticas`, `/mercado-de-pases`, `/guias/liga-con-amigos`. En escritorio la portada es una grilla de tres columnas.
- Se eliminó `Atmosphere` (pizarra dibujada y reflector); pie con colores de papel. Claro y oscuro según el sistema.
- `index.html` regenerado (`HOME_PRERENDER=write`).
- Tests: 3 nuevos en `homeLanding` (mástil, pensamiento del día, En esta edición); el resto de los de la portada y SEO siguen verdes.
- Capturas Chromium 390 / 360 / 1280, claro y oscuro: sin desborde horizontal. El titular, los botones y el mástil entran en la primera pantalla; el pie (con todos los enlaces públicos, igual que antes) queda debajo.
