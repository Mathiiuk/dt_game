# Specification — match-moments-2

## 1. Objetivo
Más decisiones con consecuencias durante el partido: penales (a favor y en contra), arquero lesionado y un rival que reacciona al marcador.

## 2. Problema actual
El partido solo tenía goles, atajadas, córners, tarjetas y lesiones sin efecto diferenciado; las únicas decisiones eran el entretiempo, ir perdiendo o ganando, una roja y una lesión. El rival nunca decidía nada.

## 3. Resultado esperado
- Penales: se anuncian, pausan el partido y se resuelven al minuto siguiente según la decisión del DT.
- Arquero lesionado: aviso propio y castigo mayor (-12%) si sigue jugando.
- El rival se tira al ataque si pierde a los 60 y se cierra si gana a los 75, con aviso en el relato.

## 4. Alcance
### Incluido
Motor del partido (`simulateMatch`), momentos (`detectMoment`), pantalla del partido y tests.
### No incluido
Decisiones del rival sobre cambios o tarjetas; penales en definiciones por tanda.

## 5. Criterios de aceptación
- [ ] AC-01: cada penal anunciado se resuelve al minuto siguiente con gol o fallo del mismo equipo.
- [ ] AC-02: quien patea importa (un especialista convierte más) y adivinar la esquina casi siempre ataja.
- [ ] AC-03: los penales y las reacciones del rival no alteran el resto del partido (azar propio).
- [ ] AC-04: la lesión del arquero castiga más que la de un jugador de campo.
- [ ] AC-05: el rival reacciona a los 60 y 75 minutos según el marcador, solo si es IA.

## 6. Restricciones
Determinismo por semilla (el partido se rejuega con los cambios); sin tocar la base.

## 7. Dependencias
`changes` del motor, `replayWithChanges`, momentos pausados.

## 8. Riesgos
Equilibrio: los penales suman goles (unos 0,3 por partido) y cambian levemente las tablas.

## 9. Impacto
Frontend: pantalla del partido. Backend/Database/Infra: ninguno. Seguridad: ninguno.

## 10. Preguntas / incertidumbres
Frecuencia de penales (0,35% por minuto): ajustable.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/match-moments-2.yml`
