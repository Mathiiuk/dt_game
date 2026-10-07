# Specification — ui-copy-round2 (B16 + B17 de docs/roadmap_v2.md)

## 1. Objetivo
Que la pantalla no muestre códigos internos ni palabras de contador o de médico.

## 3. Cambio
- B16: `TONE_LABELS` y `toneLabel` en `domain/press.js` (Elogioso, Combativo, Autocrítico, Cauteloso), usados en la sala de prensa y en el archivo de prensa del Club. El libro de actas del Vestuario muestra "Cambio de capitán", "Reunión de plantel" o "Conflicto resuelto" en vez del código.
- B17: Finanzas dice "Cuánto te dura la caja: 6 semanas / Más de un año / No se gasta / Sin caja", "Por semana: lo que entra menos lo que sale", "Movimientos" y "Plata disponible hoy". El historial de reputación pasa a "Historial de cambios".
- Enfermería: la infiltración se explica en criollo (qué es, qué pasa si sale bien y si sale mal), también en los mensajes de resultado.
- `tests/static/copy.test.js`: dos reglas nuevas: sin `>` ni `<` para decir "más de" o "menos de" (también en los textos que arma la capa de datos) y sin campos de código puestos tal cual en pantalla.

## 5. Criterios de aceptación
- [x] AC-01: ningún tono de prensa se muestra como código.
- [x] AC-02: Finanzas y Enfermería no usan símbolos ni jerga.
- [x] AC-03: el test de textos impide que vuelvan a aparecer.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/ui-copy-round2.yml`
