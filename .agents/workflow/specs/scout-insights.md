# Specification — scout-insights

## 1. Objetivo
Línea de contenido "Mercado": ojeo con informes más ricos.

## 2. Cambio
`scoutInsights({ player, squad, price })` (domain/scoutInsights.js) arma la lectura del ojeador: si mejora, iguala o no mejora a tu mejor jugador de esa posición (o si cubre un puesto sin titular), si el precio que pide el club es barato, acorde o caro frente al valor de mercado, y el perfil de edad y potencial (joven con margen, veterano con poca reventa). La tarjeta del mercado la muestra solo para jugadores ojeados.

## 5. Criterios de aceptación
- [x] AC-01: comparación con el plantel propio por posición.
- [x] AC-02: precio contra valor de mercado (±15%).
- [x] AC-03: un jugador sin ojear no muestra la lectura.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/scout-insights.yml`
