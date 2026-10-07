# VESTUARIO — HOME LANDING

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
