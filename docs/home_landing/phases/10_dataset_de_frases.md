# VESTUARIO — HOME LANDING

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
