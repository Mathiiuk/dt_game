# Specification — cross-links (B6 de docs/roadmap_v2.md)

## 1. Objetivo
Cada aviso abre el lugar exacto donde se resuelve. Antes "Resolver" una baja médica llevaba al Plantel y no había forma de enlazar la Enfermería (la pestaña del Club vivía en estado local).

## 3. Cambio
- `ClubScreen.jsx`: la pestaña pasa a la dirección (`/club?tab=enfermeria`); una pestaña desconocida cae en Gestión.
- Aviso de bajas médicas del Inicio: abre `/club?tab=enfermeria`.
- Aviso de contratos por vencer: abre `/squad?orden=contrato`; el Plantel suma el orden "Contrato por vencer" (el que vence antes, primero).
- Plantel: si hay lesionados, una franja con el enlace "Ver la enfermería".
- Déficit ya abría Finanzas (queda cubierto por test).

## 5. Criterios de aceptación
- [x] AC-01: bajas médicas -> Enfermería; plantel corto -> Plantel; contratos -> Plantel ordenado por vencimiento; déficit -> Finanzas.
- [x] AC-02: `/club?tab=enfermeria` abre la pestaña directamente.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/cross-links.yml`
