# Devolución — Rediseño de `/club` de Vestuario

## Opinión general

El documento va en una **dirección correcta y necesaria**.

La mejor decisión es reconocer que `/club` se convirtió en un "cajón de sastre" y que la solución no es agregar más componentes sino **definir qué significa realmente "Club" dentro del juego**.

La reducción de ocho pestañas a tres:

- **Mística & Vitrina**
- **La Tribuna**
- **El Vestuario**

es, en líneas generales, una mejora fuerte. Le da identidad al producto y evita que `/club` parezca otro panel administrativo.

La principal mejora que haría es conceptual:

> `/club` no debería ser solo "una pantalla con tres pestañas".  
> Debería ser **la institución viva que el jugador construyó**.

---

# 1. Lo que DEJARÍA

## 1.1 Reducir de 8 pestañas a 3

**Dejar.**

Es probablemente la decisión más importante del documento.

La navegación actual genera fricción, especialmente en móvil. Una sección con ocho pestañas obliga al usuario a recordar dónde está cada cosa.

Tres áreas son fáciles de comprender:

```text
MÍSTICA
TRIBUNA
VESTUARIO
```

No agregaría una cuarta salvo una necesidad realmente fuerte.

---

## 1.2 Mística & Vitrina

**Dejar y profundizar.**

Es una excelente representación de la institución.

Debe contener:

- identidad;
- fundación;
- apodo;
- categoría;
- socios;
- palmarés;
- ídolos;
- momentos históricos.

La idea de la vitrina de copas funciona muy bien porque transforma estadísticas históricas en algo visual.

### Mejoraría la copa

En vez de mostrar solamente:

> 2031 — Campeón

al tocarla debería aparecer:

- temporada;
- competición;
- DT;
- capitán;
- máximo goleador;
- figura;
- rival decisivo;
- récord o momento memorable.

Así la copa se convierte en una pieza de historia.

---

## 1.3 Ídolos de la Casa

**Dejar.**

Pero no limitaría el sistema a "las 3 máximas glorias".

Mostraría tres destacados en `/club` y tendría:

> Ver historia completa

para acceder al resto.

Cada ídolo debería explicar por qué es importante.

Ejemplo:

```text
Gustavo "Tano" Ferreyra
312 partidos
4 títulos

"Capitán durante el primer ascenso."
```

Es mucho más potente que simplemente mostrar una tarjeta dorada.

---

# 2. Lo que DEJARÍA PERO CAMBIARÍA

## 2.1 La Tribuna

**Dejar el concepto.**

Pero cambiaría bastante su enfoque.

El documento la centra mucho en:

- termómetro;
- influencia;
- barra brava;
- microdecisiones.

Yo la convertiría en:

# CLIMA DEL CLUB

Y dentro:

- popularidad;
- expectativa;
- confianza;
- asistencia;
- socios;
- eventos;
- grupos de hinchas.

### Importante

No usaría "barra brava" como eje central del sistema.

Puede existir como una categoría/evento del mundo, pero no debería representar a toda la hinchada.

Es mejor trabajar con:

- socios;
- hinchas;
- peñas;
- grupos;
- referentes;
- tribuna.

Eso permite un sistema mucho más amplio.

---

## 2.2 Influencia de la hinchada

**Dejar el efecto, cambiar la fórmula.**

No haría:

> hinchada feliz = +X% al rendimiento local.

Eso se siente demasiado videojuego.

Preferiría:

```text
Estado de hinchada
      ↓
Ambiente
      ↓
Localía / presión / confianza
      ↓
pequeño modificador contextual
```

La hinchada puede ayudar, pero no transformar mágicamente un equipo mediocre en uno superior.

---

## 2.3 Clima del vestuario

El documento plantea:

> Clima del vestuario: 84%

Yo **mantendría el valor internamente pero no lo mostraría como protagonista**.

Primero mostraría el estado:

> **Muy unido**

> "Los referentes bancan la idea táctica."

Y debajo:

```text
Cohesión: Alta
Moral: Alta
Confianza en el DT: Alta
Conflictos: 1
Referentes: Estables
```

El juego debe hacer sentir el vestuario, no obligar al jugador a leer barras.

---

# 3. Lo que SACARÍA de `/club`

El documento acierta completamente en sacar:

### Enfermería

Mover a `/squad`.

### Entrenamiento

Mover a `/squad`.

### Obras

La gestión económica puede ir a `/finances`.

### Directiva

Mover a `/manager`.

### Operaciones de staff

No deberían existir como bloque principal en `/club`.

La separación conceptual debería quedar:

```text
/SQUAD
jugadores + salud + entrenamiento

/FINANCES
dinero + inversiones + infraestructura

/MANAGER
carrera + dirigencia

/MARKET
transferencias

/CLUB
identidad + historia + hinchada + vestuario
```

Esto me parece fundamental.

---

# 4. Una corrección importante: STAFF

El documento propone:

> "Cuerpo Técnico se va a `/finances`."

Lo revisaría.

Finanzas debería manejar:

- costo;
- contratación;
- salario;
- presupuesto.

Pero el staff tiene funciones deportivas.

Ejemplo:

```text
/FINANCES
Contratar preparador físico
$2M/año
```

y después:

```text
/SQUAD / TRAINING
Preparador físico nivel 4
↓
reduce fatiga
↓
mejora recuperación
```

No escondería toda la lógica del cuerpo técnico dentro de Finanzas.

---

# 5. Una corrección importante: ESTADIO

También revisaría sacar totalmente el estadio de `/club`.

El estadio es una parte central de la identidad del club.

Yo haría:

### En `/club`

Mostrar:

> **Nuestra casa**

con:

- nombre;
- imagen;
- capacidad;
- año;
- récord de asistencia.

Y:

> Ver infraestructura

lleva a `/finances`.

Entonces:

```text
CLUB
→ identidad del estadio

FINANCES
→ obras, mejoras, costos
```

Mucho más natural.

---

# 6. Lo que MÁS agregaría: ADN DEL CLUB

Esto para mí falta y puede ser una de las mejores mecánicas del sistema.

Sin agregar una cuarta pestaña.

Dentro de:

# Mística & Vitrina

agregaría:

## ADN DEL CLUB

El club desarrolla una identidad con los años.

Posibles rasgos:

- Potrero
- Garra
- Cantera
- Ofensivo
- Defensivo
- Barrio
- Formación
- Títulos
- Tradición
- Identidad local

Ejemplo:

```text
ADN DEL CLUB

"Orgullo de barrio"

74 años de historia

Cantera: ████████░░ 78
Identidad local: █████████░ 91
Tradición: ████████░ 84
```

Lo importante es que esos valores sean consecuencia de las decisiones del jugador.

Ejemplo:

```text
promovés juveniles
       ↓
fortalecés cantera

vendés referentes
       ↓
cambia la percepción histórica

ganás copas
       ↓
crece tradición

contratás muchas estrellas
       ↓
menos identidad de cantera
```

Eso hace que el club realmente tenga personalidad.

---

# 7. `/club` como institución viva

Este sería el cambio central.

Cada pestaña debería responder una pregunta.

## Mística

> **¿Qué club estoy construyendo?**

## Tribuna

> **¿Qué piensa la gente?**

## Vestuario

> **¿Qué está pasando dentro del equipo?**

Esta definición es mucho más importante que cualquier layout.

---

# 8. MÍSTICA — ESTRUCTURA QUE USARÍA

```text
IDENTIDAD
↓
ADN DEL CLUB
↓
VITRINA
↓
ÍDOLOS
↓
MOMENTO HISTÓRICO DESTACADO
```

No mostrar toda la historia de golpe.

Ejemplo:

> **El ascenso de 2031**

> "La tarde en que el club dejó atrás la quinta división."

[ Ver historia ]

Eso invita a explorar.

---

# 9. TRIBUNA — ESTRUCTURA QUE USARÍA

```text
CLIMA ACTUAL
↓
POPULARIDAD
↓
ASISTENCIA
↓
SOCIOS
↓
EVENTOS
```

Ejemplo:

> **La gente te banca**

> "Tres victorias consecutivas devolvieron la ilusión."

Después:

```text
Popularidad      71
Confianza        84
Asistencia       83%
Socios           8.421
```

Los números pueden existir, pero deben acompañar una lectura humana.

---

# 10. VESTUARIO — ESTRUCTURA QUE USARÍA

```text
CAPITÁN
↓
CLIMA
↓
REFERENTES
↓
GRUPOS
↓
CONFLICTOS
```

La capitanía sí debe estar arriba.

Ejemplo:

```text
JUAN PÉREZ
Capitán

32 años
DFC
7 temporadas

Liderazgo: 89
Moral: 82
Autoridad: 91
```

Botón:

> Cambiar capitán

Y después:

> **El grupo está unido.**

o:

> **Hay tensión entre dos referentes.**

Esto genera narrativa.

---

# 11. El capitán debe ser una decisión importante

La solución B19 es buena, pero profundizaría.

Cambiar capitán debería considerar:

- liderazgo;
- edad;
- antigüedad;
- relación con DT;
- respeto de compañeros;
- rendimiento;
- personalidad;
- importancia histórica.

No hacer solamente:

> -15 moral

o:

> +10 liderazgo.

Primero mostrar la consecuencia en lenguaje natural:

> "Sacarle la cinta a Juan puede ser interpretado como una pérdida de confianza."

El número puede aparecer como información secundaria.

---

# 12. Eventos RANDOM — MUY IMPORTANTE

Este sistema encaja perfectamente con `/club`.

Ejemplos:

### Tribuna

> "Los hinchas organizaron un banderazo antes del clásico."

### Vestuario

> "Dos referentes discutieron después del entrenamiento."

### Mística

> "Apareció una vieja camiseta de 1974 detrás de una pared del estadio."

### Institución

> "Un exjugador volvió al club y contó una historia del primer ascenso."

Así `/club` deja de ser estático.

---

# 13. Cambiaría el concepto "dinámico" por "vivo"

No pensaría:

> "Tenemos tres pestañas dinámicas."

Pensaría:

# EL CLUB ESTÁ VIVO.

Esto debería ser un principio de diseño.

El club cambia porque:

- gana;
- pierde;
- asciende;
- vende jugadores;
- forma juveniles;
- cambia de DT;
- crece la hinchada;
- aparecen ídolos;
- ocurren eventos.

La UI simplemente representa ese estado.

---

# 14. No convertir `/club` en otro panel de administración

Este es un riesgo muy importante.

No deberíamos terminar con:

```text
Club
→ 14 botones
→ 27 estadísticas
→ 9 acciones
→ 11 modales
```

El propósito de `/club` debe ser:

> **observar, comprender y cuidar la institución.**

No administrar absolutamente todo.

---

# 15. Arquitectura que dejaría

```text
ClubScreen
│
├── ClubHeader
│
├── ClubTabs
│
├── ClubIdentityTab
│   ├── ClubIdentity
│   ├── ClubDNA
│   ├── TrophyGallery
│   ├── FeaturedIdols
│   └── HistoricalMoment
│
├── ClubTribuneTab
│   ├── CrowdMood
│   ├── Popularity
│   ├── Attendance
│   ├── Members
│   └── SupporterEvents
│
└── ClubLockerRoomTab
    ├── CaptainCard
    ├── LockerMood
    ├── Leaders
    ├── Groups
    └── Conflicts

CaptainSelectorSheet
```

Esta estructura me parece limpia y escalable.

---

# 16. Datos nuevos que recomiendo

## Club

Agregar:

```text
dna
identity_tags
historical_moments
supporter_mood
popularity
attendance
members
institutional_reputation
```

## Vestuario

Agregar:

```text
cohesion
morale
leadership
dt_confidence
groups
conflicts
captain_id
vice_captain_id
```

## Historia

Agregar:

```text
milestones
trophies
records
idols
legends
```

---

# 17. Interacciones entre sistemas

`/club` no debe ser una isla.

## Hinchada

Puede afectar:

- asistencia;
- ingresos;
- presión;
- localía;
- eventos.

## Vestuario

Puede afectar:

- moral;
- rendimiento;
- desarrollo;
- conflictos.

## Historia

Se alimenta de:

- ascensos;
- títulos;
- récords;
- jugadores;
- DT.

## Capitán

Puede afectar:

- liderazgo;
- cohesión;
- juveniles;
- momentos críticos.

## DT

Puede afectar:

- confianza;
- vestuario;
- hinchada;
- identidad.

Esto es lo que hace que la pantalla represente al club entero.

---

# 18. Lo que NO haría

No haría:

### 1.
Un número gigante como protagonista:

> 84%

### 2.
Una página llena de cards.

### 3.
Todo basado en barras.

### 4.
La barra brava como representación de toda la hinchada.

### 5.
El estadio totalmente desconectado de la identidad.

### 6.
Staff completamente escondido en Finanzas.

### 7.
Toda acción dentro de modales.

### 8.
Eventos aleatorios sin relación con el contexto.

---

# 19. Decisión por elemento

| Elemento | Decisión |
|---|---|
| 8 pestañas | ❌ Sacar |
| 3 pestañas | ✅ Dejar |
| Identidad | ✅ Dejar |
| Vitrina | ✅ Dejar + profundizar |
| Ídolos | ✅ Dejar |
| Tribuna | ✅ Dejar + ampliar |
| Barra brava como eje | ❌ Replantear |
| Clima hinchada | ✅ Dejar |
| Entrenamiento | ❌ Mover |
| Enfermería | ❌ Mover |
| Obras | ⚠️ Finanzas |
| Staff | ⚠️ Separar parte operativa |
| Directiva | ❌ Mover |
| Historia | ✅ Dejar |
| Capitán | ✅ Dejar + profundizar |
| Moral como porcentaje | ❌ No como elemento principal |
| Eventos random | ✅ Potenciar |
| ADN del club | ✅ Agregar |
| Estadio como identidad | ✅ Mantener visualmente |
| Club vivo | ✅ Convertir en principio |

---

# 20. Mi propuesta final de `/club`

```text
┌──────────────────────────────────────────────┐
│ CLUB ATLÉTICO CENTRAL                       │
│                                             │
│ "El club que estamos construyendo."         │
│                                             │
│ 1928 · 8.421 socios · 5ª División           │
└──────────────────────────────────────────────┘

[ MÍSTICA ] [ TRIBUNA ] [ VESTUARIO ]
```

### Mística

```text
¿Qué club estamos construyendo?

ADN
Orgullo de barrio

🏆 3 títulos

Ídolos destacados

Momento histórico
"El ascenso de 2031"
```

### Tribuna

```text
¿Qué piensa la gente?

LA GENTE TE BANCA

Popularidad 71
Confianza 84
Asistencia 83%
Socios 8.421

Último evento:
"Bandera gigante antes del clásico"
```

### Vestuario

```text
¿Qué pasa adentro?

CAPITÁN
Juan Pérez
32 años · DFC

Liderazgo 89

[ CAMBIAR CAPITÁN ]

EL GRUPO ESTÁ UNIDO

Referentes
Juveniles
Conflictos
```

---

# 21. Qué cambiaría del plan de implementación

El orden actual está bien pero lo reorganizaría:

## Paso 1
Definir contratos de datos y responsabilidades de cada sección.

## Paso 2
Mover funcionalidades fuera de `/club`.

## Paso 3
Crear las tres pestañas.

## Paso 4
Crear identidad + ADN.

## Paso 5
Crear vitrina + historia + ídolos.

## Paso 6
Crear clima de tribuna.

## Paso 7
Crear vestuario + capitán.

## Paso 8
Conectar eventos dinámicos.

## Paso 9
Adaptar mobile.

## Paso 10
Tests y regresión.

---

# 22. Veredicto

## 8,5/10 como dirección

El documento actual **no necesita un cambio de concepto**.

Necesita una profundización.

La poda de 8 pestañas es correcta.

La separación de responsabilidades es correcta.

La solución del capitán es correcta.

La idea de Mística / Tribuna / Vestuario es buena.

Lo que falta para que sea realmente excelente es convertirlo de:

> **"una pantalla más ordenada"**

a:

> **"la representación visual de la institución que el DT está construyendo."**

Ese debería ser el objetivo definitivo.

---

# CONCLUSIÓN

## DEJAR

- 3 pestañas;
- identidad;
- mística;
- vitrina;
- ídolos;
- tribuna;
- vestuario;
- capitán;
- separación de responsabilidades;
- navegación simple;
- arquitectura de componentes.

## SACAR

- enfermería;
- entrenamiento;
- operaciones financieras;
- directiva;
- staff como bloque puramente financiero;
- barra brava como eje;
- exceso de porcentajes;
- `/club` como cajón de sastre.

## MEJORAR

- vitrina;
- historia;
- clima social;
- hinchada;
- vestuario;
- capitanía;
- eventos;
- integración entre sistemas.

## AGREGAR

- ADN del club;
- momentos históricos;
- identidad;
- referentes;
- grupos;
- conflictos;
- eventos institucionales;
- memoria de temporadas.

---

# IDEA CENTRAL

La mejor definición que dejaría para el equipo de desarrollo es:

> **`/club` no es el lugar donde administrás el club.**
>
> **Es el lugar donde ves en qué se convirtió el club que vos estás construyendo.**

Cuando el jugador vuelva diez temporadas después y vea:

> Fundado en 1928.  
> Primer ascenso: 2031.  
> 3 títulos.  
> 8.421 socios.  
> Juan Pérez: 312 partidos.  
> La cantera produjo 4 titulares.  
> La hinchada está con vos.  
> El vestuario está unido.

tiene que sentir:

> **"Este es mi club."**

Ese debería ser el norte del rediseño.
