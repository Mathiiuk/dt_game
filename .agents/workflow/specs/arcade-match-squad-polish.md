# Specification — arcade-match-squad-polish

## 1. Objetivo
Implementar un paquete integral de mejoras y correcciones visuales e interactivas:
1. Escudos vectoriales SVG dinámicos (Opción A) para todos los clubes históricos con patrones emblemáticos (banda diagonal, franja horizontal, bastones verticales, V, mitades y plenos).
2. Corrección completa de textos con caracteres corruptos (mojibake UTF-8 como "Dirección Técnica").
3. En `/match` (MatchScreen):
   - Estadísticas dinámicas acumuladas en tiempo real minuto a minuto (no hardcodeadas con valores fijos finales).
   - Botonera/panel de órdenes y gritos del DT compacta e integrada para desktop sin ocupar toda la pantalla como modal intrusivo.
   - Modal interactivo con cancha táctica (estilo `/tactic` con fichas) para realizar cambios y sustituciones de jugadores.
4. En `/post-match` (PostMatchScreen):
   - Carga ultrarrápida (paralelización de procesamiento y conferencia de prensa).
   - Diseño compacto sin scroll vertical para desktop (100% viewport fit con vista de cabecera, resumen tripartito y barra de acción fija).
5. En `/squad` (SquadScreen):
   - Rediseño con aire, espaciado generoso, separación visual por líneas y tarjetas limpias para evitar que los elementos queden amontonados.

## 2. Problema actual
- Varios archivos en `src/features/match/` contienen caracteres `\uFFFD` rompiendo textos en castellano (ej. "Direccin Tcnica", "Estadsticas", "Posesin", "Crners", "Tctica").
- En `MatchScreen`, `MatchStats` muestra datos estáticos congelados que no reflejan el transcurso del partido ni los eventos reales.
- El panel de gritos del DT abre un modal overlay que tapa la pantalla completa incluso en monitores grandes.
- La pantalla de cambios es una lista tosca de texto sin representación de la cancha ni contexto visual de posiciones.
- `PostMatchScreen` ejecuta consultas en cascada bloqueando la pantalla con un spinner lento, y en desktop requiere desplazarse verticalmente por múltiples tarjetas sobredimensionadas.
- En `SquadScreen`, la tabla de escritorio y las tarjetas móviles están comprimidas con exceso de datos amontonados sin respiración visual.

## 3. Criterios de aceptación
- [ ] **AC-01 (Escudos vectoriales SVG):** Componente `ClubBadge` renderiza escudos SVG con patrones históricos auténticos (banda, franja, bastones, chevrons, mitades, pleno) y siglas distintivas en `Dashboard`, `Match`, `PostMatch` y `Standings`.
- [ ] **AC-02 (Corrección de Encoding):** Cero caracteres `\uFFFD` o mojibake en el código fuente.
- [ ] **AC-03 (Estadísticas en vivo en Match):** `MatchStats` calcula disparos, tiros al arco, faltas, córners, tarjetas y posesión de forma reactiva y acumulada según el minuto de juego en progreso.
- [ ] **AC-04 (Órdenes y gritos del DT desktop):** En pantallas desktop, los gritos se integran de forma elegante sin tapar la pantalla con overlays móviles.
- [ ] **AC-05 (Cancha interactiva de sustituciones):** La sustitución abre un modal con la cancha táctica interactiva permitiendo seleccionar quién sale y quién entra con previsualización posicional.
- [ ] **AC-06 (Post-match rápido y sin scroll):** Post-partido carga de inmediato paralelizando tareas y se visualiza en desktop sin scroll vertical forzado (`h-dvh` / fit viewport).
- [ ] **AC-07 (Squad desahogado):** `SquadScreen` cuenta con mayor espacio, jerarquía clara y separación armoniosa.
- [ ] **AC-08 (Quality Gates):** 100% verde en `pnpm test`, `pnpm test:bdd`, `pnpm lint` (<=13 warnings) y `pnpm build`.
