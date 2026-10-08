# Implementation Plan — arcade-match-squad-polish

## 1. Resumen
Implementar la suite de mejoras solicitadas por el usuario:
1. `ClubBadge.jsx`: Escudos vectoriales SVG dinámicos (Opción A) con patrones tradicionales argentinos.
2. Limpieza exhaustiva de caracteres corruptos en `src/features/match/` (UTF-8 limpio).
3. `MatchScreen.jsx`:
   - Cálculo dinámico reactivo de estadísticas minuto a minuto (`liveStats`).
   - Panel de órdenes/gritos integrado y compacto para desktop.
   - Modal de cambios interactivo con la cancha táctica (`InteractiveSubstitutionsModal.jsx`).
4. `PostMatchScreen.jsx`:
   - Carga paralela no bloqueante para inicio veloz.
   - Layout sin scroll en desktop (`lg:h-dvh lg:overflow-hidden` con disposición modular de resumen).
5. `SquadScreen.jsx`:
   - Rediseño con espaciado amplio, aire visual y mejor distribución.

## 2. Repositorio inspeccionado
- Stack: React 18, Tailwind v4, Motion, Lucide icons, Supabase, Vitest, Cucumber.
- Rama: `feat/arcade-match-squad-polish-escudos-vectoriales-arcade-fixes-de-encoding-mejoras-interactivas-en-match-post-match-desktop-y-rediseno-de-squad`

## 3. Cambios propuestos

### [NEW]
- `src/components/ui/ClubBadge.jsx`: Componente de escudo vectorial arcade configurable con patrones históricos.
- `src/features/match/InteractiveSubstitutionsModal.jsx`: Modal táctico con cancha interactiva para cambios en partido.

### [MODIFY]
- `src/features/match/DecisionSheet.jsx`: Fix encoding UTF-8.
- `src/features/match/MatchActions.jsx`: Fix encoding UTF-8 y layout de botones.
- `src/features/match/MatchHeader.jsx`: Fix encoding UTF-8 e integración de `ClubBadge`.
- `src/features/match/MatchScreen.jsx`: Fix encoding UTF-8, estadísticas acumuladas en vivo y modal interactivo de sustitución.
- `src/features/match/MatchStats.jsx`: Fix encoding UTF-8 y soporte de estadísticas en vivo.
- `src/features/match/MatchTimeline.jsx`: Fix encoding UTF-8.
- `src/features/match/ShoutsSheet.jsx`: Fix encoding UTF-8 y estilo compacto.
- `src/features/match/SubstitutionsSheet.jsx`: Reemplazar por modal con cancha interactiva.
- `src/features/dashboard/Dashboard.jsx`: Reemplazar el `Crest` provisional por `ClubBadge`.
- `src/features/match/PostMatchScreen.jsx`: Paralelización de carga, escudos vectoriales y layout sin scroll en desktop.
- `src/features/squad/SquadScreen.jsx`: Rediseño con espaciado amplio, aire visual y layout relajado.

## 4. Estrategia de implementación y verificación
1. Desarrollar `ClubBadge.jsx` con patrones SVG (banda, franjas, bastones, V, mitades, pleno) y siglas centradas con excelente contraste.
2. Limpiar todos los caracteres `\uFFFD` en los archivos de `match/`.
3. Crear el cálculo de estadísticas dinámicas en `MatchScreen` acumulando eventos hasta el minuto actual.
4. Construir `InteractiveSubstitutionsModal.jsx` renderizando la cancha táctica con tokens de los 11 jugadores en cancha y lista de suplentes debajo/al lado.
5. Optimizar la carga de `PostMatchScreen` (cargas concurrentes) y diseñar la vista compacta de escritorio sin scroll.
6. Ajustar `SquadScreen` para mayor respiro y separación.
7. Ejecutar todos los Quality Gates: `pnpm test`, `pnpm test:bdd`, `pnpm lint`, `pnpm build`.
