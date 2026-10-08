# Devolución — `national_team_v2.md`

> Análisis y propuesta de mejoras sobre el rediseño de la Selección Nacional (`/national-team`).

---

## 1. Opinión general

El documento detecta con mucha claridad el problema más grave de la pantalla actual: **es una pantalla fantasma** que el jugador promedio nunca llega a tocar. Y propone una solución con identidad: convertirla en un sistema vivo desde la primera temporada mediante **radar de convocatorias**, **termómetro de carrera** e **interinatos relámpago**.

Los tres aciertos centrales son:

- **Radar Albiceleste** — tus jugadores son observados aunque vos no dirijas la selección.
- **Termómetro Albiceleste** — progreso visual en lugar de números fríos.
- **Interinatos / torneos relámpago** — experiencia temprana sin esperar 5 temporadas.

Sin embargo, el documento tiene tres problemas serios:

1. **Es demasiado “bonito” y sin costo.** Ser convocado al seleccionado aparece solo como beneficio (moral, valor, caja), pero en un manager de fútbol real **la fecha FIFA también duele**: el jugador vuelve cansado, se puede lesionar, se distrae, o directamente se lo llevan después.
2. **El termómetro es vago.** “Nivel 1 → Nivel 4” suena lindo pero no dice **qué llena la barra**, ni cuánto, ni cómo se pierde.
3. **Está todo escrito en clave Argentina.** Si el juego permite elegir otra selección, el lenguaje “Albiceleste / buzo / Eliminatorias” no aplica. Hay que **parametrizar por país** o dejarlo claro.

**Recomendación:** mantener la dirección, pero **agregar tensión, consecuencias y criterios numéricos concretos**. Un radar sin costo es solo una pantalla de recompensas; un radar con costo es una decisión.

---

## 2. Qué DEJARÍA

### 2.1. El “Radar Albiceleste”

Es el mejor acierto del documento. Convierte una pantalla muerta en una pantalla que **siempre tiene algo para el jugador**, aunque no dirija la selección. Mantenerlo entero.

### 2.2. El “Termómetro Albiceleste”

El concepto de barra de progreso con nombres narrativos en lugar de “te faltan 65 puntos” es correcto. Mantener la idea.

### 2.3. Los interinatos / torneos relámpago

Permitir dirigir la Sub-20 o la Sub-23 en torneos cortos es la mejor forma de dar **experiencia temprana de selección** sin romper el juego de clubes. Mantener.

### 2.4. El tono pasional vs. burocrático

Reemplazar “federación deportiva” por “diarios deportivos y clamor popular” está perfectamente alineado con la filosofía arcade de `/finances` y `/market`. Mantener.

### 2.5. La arquitectura general de componentes

`NationalCareerGauge`, `NationalRadarCard`, `NationalOffersCarousel` son componentes razonables. Mantener con ajustes.

---

## 3. Qué SACAR

### 3.1. El lenguaje exclusivamente argentino

“Albiceleste”, “buzo de la selección”, “Eliminatorias” son preciosos si el jugador dirige Argentina. Pero si el juego permite elegir selección, esto rompe la fantasía para cualquier otro país.

**Reemplazar por sistema parametrizado:**

```
Selección Nacional
└── País configurable por el jugador
    ├── Nombre oficial
    ├── Colores y escudo
    ├── Apodo popular (Albiceleste / Canarinha / Azzurra / etc.)
    └── Narrativa adaptada (Eliminatorias, Eurocopa, Copa África…)
```

Los textos pasan a usar un diccionario de país. Si el juego es solo Argentina por diseño, entonces dejarlo, pero **dejarlo explícito en el documento**.

### 3.2. La barra de progreso sin reglas

“Termómetro Albiceleste” sin decir qué llena la barra es solo decoración. Debe haber reglas claras y visibles.

**Reemplazar por un sistema explícito:**

```
La barra se llena con:
  + Ascenso de categoría             +15%
  + Título de liga                    +25%
  + Título de copa                    +15%
  + Ganar un clásico                  +5%
  + Formar un jugador convocado       +3%
  + Dirigir un interinato ganado      +10%
  - Descenso                          -30%
  - Temporada sin logros              -5%
```

Sin esto, el jugador no puede planificar su carrera hacia la selección, que es justamente el punto.

### 3.3. Los beneficios “gratis” de la convocatoria

Hoy el documento dice que una convocatoria da:

- Moral al 100%.
- +25% valor de mercado.
- +Orgullo hinchada.
- +Ingreso en caja.

Todo beneficio. Sin costo. Sin tensión.

**Esto convierte el radar en una máquina de regalos**, no en una decisión. Hay que sacarlo y reemplazarlo por un sistema bidireccional (ver punto 4.1).

### 3.4. La idea de “pantalla bloqueada” reemplazada por pantalla fantasma disfrazada

El documento dice “nunca más una pantalla vacía”, pero la propuesta sigue dependiendo de que el jugador tenga reputación suficiente para *algo*. Si estás en 5ª División con reputación 8 y ningún jugador en el radar, la pantalla puede volver a quedar casi vacía.

**Sacar la promesa de “viva desde la primera temporada”** y reemplazarla por algo concreto: **siempre hay al menos un bloque con contenido útil**:

- Termómetro siempre visible.
- Radar con “próximos candidatos” aunque no haya convocados aún.
- Ofertas de interinato juvenil mínimas aunque sea de un torneo de barrio.

### 3.5. `NationalMatchView.jsx` como “1 clic”

El documento menciona dirigir la selección “en 1 clic” como si fuera un detalle. Dirigir un partido de selección es uno de los momentos más épicos posibles del juego. **No puede ser un botón.**

**Sacar la mención de “1 clic”** y dejar la mecánica de partido como parte de una fase posterior bien diseñada. No meterla a medias.

---

## 4. Qué CAMBIARÍA

### 4.1. La convocatoria debe tener costo, no solo beneficio

El radar debe sentirse como **un honor con consecuencias**, igual que en la vida real.

**Propuesta:**

| Efecto | Positivo | Negativo |
|---|---|---|
| Moral del jugador | 🟢 +100% | — |
| Valor de mercado | 🟢 +25% | — |
| Fatiga | — | 🔴 Vuelve agotado (‑30% ritmo, 1-2 partidos) |
| Lesión | — | 🔴 Riesgo +10% durante la fecha FIFA |
| Distracción | — | 🔴 Baja concentración 1-2 semanas |
| Orgullo hinchada | 🟢 +10 | — |
| Caja del club | 🟢 Compensación por cesión | — |
| Mercado de pases | — | 🔴 Clubes grandes empiezan a preguntar por él |
| Renovación de contrato | — | 🔴 Pide aumento de sueldo |

Esto convierte la convocatoria en algo **que el DT vive con emoción y con miedo**. Es exactamente lo que un manager de fútbol debe sentir.

### 4.2. La reputación debe poder perderse

El termómetro hoy solo sube. Sin decrecimiento, el progreso se vuelve trivial.

**Agregar:**

- Descenso resta fuerte.
- Temporadas mediocres restan poco.
- Escándalos mediáticos (declaraciones polémicas, conflicto con la directiva) restan.
- Ausencias repetidas a interinatos restan (el sistema te “olvida”).

### 4.3. El radar debe distinguir categorías

Una convocatoria a la **Sub-17** no vale lo mismo que a la **Mayor**.

**Reemplazar “Convocado a la Selección” por:**

```
⭐ Convocado a la Sub-17
⭐⭐ Convocado a la Sub-20
⭐⭐⭐ Convocado a la Sub-23
⭐⭐⭐⭐ Convocado a la Mayor
```

Cada nivel con su propio peso narrativo, económico y de reputación. Esto permite que un club de 5ª División vea a sus pibes convocados a la Sub-17 sin romper la fantasía.

### 4.4. Los interinatos deben tener consecuencias

El documento los plantea como experiencia sin costo. **Eso es un error.**

**Agregar:**

- Ganar un interinato suma reputación fuerte.
- Perderlo suma poco o resta.
- Rechazar un interinato resta reputación leve.
- Aceptar y abandonar el cargo a mitad resta mucho (el sistema te marca como poco serio).
- El interinato ocurre **en paralelo a tu club**, no en lugar de él: podés perder partidos de liga por estar dirigiendo la Sub-20. Eso es tensión real.

### 4.5. La pantalla debe tener modo “no seleccionador” y modo “seleccionador”

Son dos pantallas distintas y el documento las mezcla.

- **No seleccionador:** termómetro + radar + ofertas de interinato.
- **Seleccionador:** convocatoria de 23, táctica, partidos, prensa, clasificación, eliminación, renuncia o despido.

**Separar explícitamente** en la arquitectura.

### 4.6. El radar debe mirar dos veces

Hoy el radar solo muestra jugadores de tu club. Pero hay otras dos categorías importantes:

- **Jugadores que ya dirigiste y ahora están en otro club** (ej. los vendiste y ahora los convocan — orgullo del DT formador).
- **Jugadores que querés comprar y ver si están en el radar** (señal de que es un buen fichaje).

Agregar esos dos ángulos al radar aunque sea en una segunda iteración.

---

## 5. Qué AGREGARÍA

### 5.1. Calendario FIFA integrado

El documento no menciona **cuándo** pasan las convocatorias. Debe estar atado al calendario del juego.

**Agregar:**

- Fechas FIFA visibles en el calendario general.
- Aviso previo (1-2 semanas antes): *“Se acerca la fecha FIFA, 3 de tus jugadores están en la prelista.”*
- Post fecha FIFA: informe con resultados, minutos jugados, lesiones.

### 5.2. Prensa deportiva viva

El documento habla de “diarios deportivos” pero no los implementa.

**Agregar:**

- Titulares generados tras cada convocatoria:
  ```
  📰 “González, el pibe que ilusiona al país”
  📰 “La Sub-20 ya tiene a su capitán: el 10 de tu club”
  📰 “¿Selección? El DT mira de reojo a Cáceres”
  ```
- Titulares negativos:
  ```
  📰 “Papelón: el DT del club no dejó ir a su figura”
  📰 “Polémica: un jugador convocado llega lesionado”
  ```

Sin prensa, la selección se siente administrativa. Con prensa, se siente viva.

### 5.3. Estado vacío, de carga y de error

El documento no menciona ninguno.

- **Vacío:** *“El seleccionador aún no puso los ojos en tu club. Seguí formando jugadores.”*
- **Carga:** skeletons con la forma del termómetro y las tarjetas del radar.
- **Error:** *“El periodista que sigue al seleccionado no atendió el teléfono. [Reintentar]”*

### 5.4. Narrativa de largo plazo

El documento plantea el termómetro como meta, pero no como **historia**.

**Agregar un log de carrera:**

```
Tu camino al buzo de la Selección

T1  Ascenso a 4ª División          +15%
T2  Título de Copa Regional        +15%
T3  Subcampeón de 3ª               +5%
T4  Ascenso a 2ª                   +15%
T5  Formaste 2 convocados a Sub-20 +6%
T6  Interinato Sub-23 ganado       +10%
T6  Descenso                        -30%
T7  Ascenso a 2ª                    +15%
...
```

Esto da sensación de **carrera**, no de barra de XP.

### 5.5. Despido del cargo de seleccionador

El documento no menciona qué pasa si dirigís la selección y fracasás.

**Agregar:**

- Eliminación temprana en un torneo → despido.
- No clasificar al Mundial → despido.
- Renuncia voluntaria disponible (con costo de reputación).
- Volver al club sin penalización, pero con huella en la narrativa.

### 5.6. Beneficio mutuo club ↔ selección

El documento premia al club por ceder jugadores (compensación). Bien. Pero podría ir más lejos:

- **Jugador convocado que vuelve con experiencia:** gana puntos de progresión más rápido por 1 temporada.
- **Club formador:** gana prestigio barrial que atrae juveniles en el próximo mercado.
- **Seleccionador que fue tu jugador:** si vos dirigís la selección y convocás a tu ex jugador, se genera un titular especial.

### 5.7. Conflicto de interés cuando sos DT de club y seleccionador

Si sos DT de un club y también seleccionador, **no podés convocar a tus propios jugadores**. Esto es real en el fútbol y agrega una tensión divertidísima.

Agregar esa regla con un mensaje claro.

### 5.8. Doble nacionalidad

Jugadores con doble nacionalidad pueden ser tentados por dos selecciones. Mecánica de decisión para el jugador (que no controlás) y titular de prensa:

```
📰 “El pibe del barrio: ¿juega para Argentina o para Italia?”
```

Ideal para fases posteriores.

### 5.9. Feedback táctil / sonoro

Al igual que en `/market`:

- Vibración al recibir una convocatoria.
- Sonido distinto al ganar un interinato vs. perderlo.
- Animación de “hinchada” al cerrar una convocatoria a la Mayor.

### 5.10. Compensación económica parametrizada

El documento menciona “ingreso en la caja del club por compensación” sin números. Hay que definirlo:

- Sub-17: nada o casi nada.
- Sub-20: compensación simbólica.
- Sub-23: compensación media.
- Mayor: compensación significativa, escalada por categoría del club.

Sin esto se puede romper la economía de `/finances`.

---

## 6. Arquitectura recomendada (ajustada)

```
NationalTeamScreen.jsx
│
├── NationalTeamHeader.jsx          ← país configurable, estado
│
├── NationalCareerGauge.jsx         ← termómetro + log de carrera
│   ├── NationalCareerBar.jsx
│   └── NationalCareerLog.jsx       ← historial de hitos
│
├── NationalRadarCard.jsx           ← figuritas de jugadores en el radar
│   ├── NationalRadarCallup.jsx     ← convocado actual
│   ├── NationalRadarWatch.jsx      ← en la mira
│   └── NationalRadarAlumni.jsx     ← ex jugadores tuyos convocados
│
├── NationalFifaCalendar.jsx        ← fechas FIFA + avisos
│
├── NationalOffersCarousel.jsx      ← interinatos y ofertas juveniles
│
├── NationalPress.jsx               ← titulares deportivos
│
├── NationalEmptyState.jsx
├── NationalSkeleton.jsx
└── NationalError.jsx
```

Modo seleccionador (fase posterior):

```
NationalTeamSelectionScreen.jsx
│
├── NationalSquadSelector.jsx
├── NationalTacticsBoard.jsx
├── NationalMatchView.jsx
└── NationalPostMatchReport.jsx
```

---

## 7. Regla de oro UX para `/national-team`

Toda pantalla de selección debería responder:

```
¿DÓNDE ESTOY EN MI CARRERA?
        ↓
¿QUIÉN DE MI CLUB ESTÁ EN EL RADAR?
        ↓
¿QUÉ OPORTUNIDADES TENGO AHORA?
        ↓
¿QUÉ ME CUESTA ACEPTARLAS?
        ↓
¿QUÉ GANO (Y QUÉ PIERDO) SI LO HAGO?
```

Si alguna de esas no se responde, la pantalla vuelve a ser fantasma.

---

## 8. Plan de implementación ajustado

### Fase 1 — Termómetro y narrativa

- `NationalCareerGauge` con reglas explícitas de subida y bajada.
- `NationalCareerLog` con historial de hitos.
- Estados vacío / carga / error.

### Fase 2 — Radar básico

- `NationalRadarCard` con convocados y “en la mira”.
- Distinción Sub-17 / Sub-20 / Sub-23 / Mayor.
- `evaluateNationalCallups` determinística + probabilística.
- Beneficios y costos (fatiga, lesión, distracción).

### Fase 3 — Calendario FIFA y prensa

- `NationalFifaCalendar` con fechas y preavisos.
- `NationalPress` con titulares generados.

### Fase 4 — Interinatos y torneos relámpago

- `NationalOffersCarousel` con ofertas juveniles.
- Consecuencias reales: reputación, paralelismo con el club, riesgo de perder partidos de liga.

### Fase 5 — Modo seleccionador

- Convocatoria de 23, táctica, partidos, prensa.
- Despido / renuncia.
- Conflicto de interés con tu club.

### Fase 6 — Doble nacionalidad, alumni, prestigio del club formador

- Extras narrativos y mecánicas de largo plazo.

---

## 9. Veredicto final

### DEJAR

- 🔴 Radar de convocatorias de tus jugadores.
- 🔴 Termómetro visual con nombres narrativos.
- 🔴 Interinatos y torneos relámpago.
- 🔴 Tono pasional / prensa deportiva (en lugar de burocracia).
- 🔴 Arquitectura general de componentes.

### MEJORAR

- 🔴 Parametrizar país (Albiceleste → sistema configurable).
- 🔴 Reglas explícitas de qué llena y qué vacía el termómetro.
- 🔴 Beneficios con costo (fatiga, lesión, distracción, mercado).
- 🔴 Distinción por categoría (Sub-17, Sub-20, Sub-23, Mayor).
- 🔴 Consecuencias reales de aceptar/rechazar interinatos.
- 🔴 Separar modo “no seleccionador” vs. “seleccionador”.
- 🔴 Compensación económica parametrizada.

### AGREGAR

- 🔴 Calendario FIFA integrado con avisos.
- 🔴 Prensa deportiva viva (titulares generados).
- 🔴 Log de carrera (historial de hitos).
- 🔴 Despido / renuncia del cargo de seleccionador.
- 🔴 Conflicto de interés cuando sos DT de club y seleccionador.
- 🔴 Radar de ex jugadores tuyos convocados.
- 🔴 Doble nacionalidad (fase posterior).
- 🔴 Prestigio del club formador como beneficio extra.
- 🔴 Estados vacío / carga / error.
- 🔴 Feedback táctil / sonoro.

### SACAR

- 🔴 Lenguaje exclusivamente argentino (si el juego permite elegir país).
- 🔴 Beneficios “gratis” sin costo para el club.
- 🔴 Promesa de “viva desde la primera temporada” sin mecanismo concreto.
- 🔴 `NationalMatchView.jsx` como “1 clic” a medias.
- 🔴 Barra de reputación que solo sube, nunca baja.

---

## Concepto definitivo

> **La selección no debe ser una pantalla que se desbloquea al final del juego.**
>
> **Debe ser una presencia que te acompaña desde el primer día: te mira, te saca jugadores, te los devuelve cansados, te ofrece un interinato, te pone un titular en el diario, y algún día —si te lo ganás— te entrega el buzo.**

Ese debería ser el criterio para decidir qué entra y qué queda afuera de `/national-team`.

---

## 10. Frase que resume el rediseño

> **“Dirigir la selección tiene que sentirse como una carrera diplomática: empezás siendo mencionado en un programa de radio y terminás levantando la copa. Pero el camino se juega desde la primera temporada.”**

Si esa frase se cumple, el rediseño funcionó.