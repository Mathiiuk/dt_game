# 📖 Guía y Plantilla para la Creación de Historias (Arcos Narrativos)

Esta guía explica en detalle cómo diseñar, redactar e integrar nuevas historias de 4 capítulos con humor, anécdotas bizarras y tono del fútbol argentino en el juego.

---

## 🏗️ 1. Arquitectura del Motor de Historias

Las historias en el juego funcionan como eventos encadenados de larga duración:
- **Estructura fija de 4 capítulos**: Cada historia tiene exactamente 4 capítulos (`(1/4)`, `(2/4)`, `(3/4)`, `(4/4)`).
- **Aparición espaciada (`ARC_GAP_WEEKS = 3`)**: Entre la resolución de un capítulo y la llegada del siguiente pasan 3 semanas de juego.
- **Ventana de inicio (`ARC_FIRST_WEEK = 3`)**: No empiezan en las primeras dos semanas de la temporada.
- **Capacidad de bandeja (`MAX_PENDING_EVENTS = 3`)**: No se entregan nuevos capítulos si el usuario tiene 3 o más eventos pendientes sin responder.
- **Descanso entre historias (`ARC_COOLDOWN_WEEKS = 4`)**: Tras concluir el capítulo 4, hay 4 semanas de enfriamiento antes de sortear otra historia.
- **Ciclo completo**: Si el usuario completa todas las historias del catálogo en una carrera larga, el catálogo vuelve a habilitarse por completo.

---

## 👥 2. Galería de Personajes Dinámicos (Marcadores)

El juego genera personajes de barrio de manera **determinista y única por cada club** (con nombre propio y memoria de visitas). 

En el texto de los títulos, descripciones, opciones y recuerdos, **puedes usar estos marcadores entre llaves**:

| Marcador en minúscula | Marcador en mayúscula | Rol del Personaje | Ejemplos generados por el juego |
|---|---|---|---|
| `{presidente}` | `{Presidente}` | Presidente de la institución | "Don Raúl Benítez", "Doña Marta Ibáñez" |
| `{periodista}` | `{Periodista}` | Periodista local que te sigue | "Pepe Cabrera", "Marcela Funes" |
| `{medio}` | `{Medio}` | Medio de prensa del periodista | "Radio del Barrio", "Canal 4 Regional" |
| `{barra}` | `{Barra}` | Líder de la hinchada/barra brava | "el Oso", "el Gringo", "el Tano", "Cacho" |
| `{utilero}` | `{Utilero}` | Utilero histórico del club | "Don Pocho", "Don Rodolfo", "Don Cayetano" |
| `{vecina}` | `{Vecina}` | Vecina chismosa del predio (*acumula rencor*) | "Doña Mirta", "Doña Rosa", "Doña Esther" |
| `{quiosquero}` | `{Quiosquero}` | Quiosquero de la esquina (*acumula rencor*) | "Don Alcides", "Don Tito", "Don Fermín" |
| `{cocinera}` | `{Cocinera}` | Cocinera del buffet / comedor comunitario | "Doña Norma", "Doña Elvira", "Doña Chola" |
| `{puntero}` | `{Puntero}` | Puntero político del barrio | "el Turco Medina", "el Chino Barrios" |
| `{detective}` | `{Detective}` | Detective privado de barrio | "el Chapa Rodríguez", "el Pistola Vega" |
| `{arquitecto}` | `{Arquitecto}` | Arquitecto de obras del club | "el Ingeniero Pucheta", "el Arquitecto Bermúdez" |
| `{ingeniero}` | `{Ingeniero}` | Ingeniero técnico de instalaciones | "el Ingeniero Ferraro", "el Técnico Zabala" |
| `{empresario}` | `{Empresario}` | Empresario / comerciante de la zona | "el Turco Salomón", "el Gallego Rial" |
| `{ayudante}` | `{Ayudante}` | Ayudante de campo del DT | "el Colo Sández", "el Pipa Molina" |
| `{colectivero}` | `{Colectivero}` | Chofer de la línea de colectivos | "el Tito Acuña", "el Cholo Benítez" |
| `{dirigente}` | `{Dirigente}` | Dirigente de la comisión directiva | "el Doctor Bermúdez", "el Contador Paz" |
| `{contador}` | `{Contador}` | Contador auditor del club | "el Contador Peralta", "el Contador Sosa" |

> [!TIP]
> **Memoria automática:** Cuando incluyes un marcador (por ejemplo `{vecina}`), el motor registra la visita (`times`). Si reaparece en otro capítulo, el juego inyecta automáticamente memorias como: *"Doña Mirta ya vino antes: es la segunda vez."*

---

## 🏷️ 3. Reglas de Validación de Capítulos y Opciones

Al crear un arco debes seguir estas reglas obligatorias (validadas por `tests/domain/arcs.test.js`):

1. **`category`**: Debe ser una de las cuatro categorías válidas:
   - `'COMMUNITY'` (Barrio, hinchas, folclore, vecinos)
   - `'LOCKER_ROOM'` (Plantel, convivencia, cábalas, anécdotas insólitas)
   - `'BOARD_PRESS'` (Dirigencia, medios, polémicas, contratos raros)
   - `'FINANCIAL_CRISIS'` (Plata atada con alambre, sponsors bizarros, rifas)
2. **Capítulos 1, 2 y 3**:
   - Cada opción DEBE definir una marca única con `flag: 'NOMBRE_FLAG'` (ej: `flag: 'ACEPTADO'`).
   - Los capítulos posteriores pueden definir un objeto `memory: { NOMBRE_FLAG: 'Texto que se agrega al relato...' }`.
3. **Capítulo 4 (Desenlace)**:
   - Cada opción DEBE definir un `ending` de cierre (ej: `ending: 'El club inauguró la estatua y los perros la usan para mear.'`).
   - Opcionalmente puede tener `variants: [{ if: 'NOMBRE_FLAG', ending: 'Final alternativo según lo que elegiste en el cap 1 o 2.' }]`.
4. **Efectos (`effects`)**:
   - `fans`, `board`, `locker`, `budget`, `reputation`, `cost`.
   - Rencores especiales en personajes que acumulan enojo:
     `grudges: { vecina: 1 }` o `grudges: { quiosquero: -1 }` o `grudges: { journalist: 1 }`.
   - Un aumento de rencor en la vecina o el periodista amplifica los rumores cuando el DT saltea la conferencia de prensa (`rumorBoost`).

---

## 📋 4. Plantilla Lista para Copiar y Pegar

Para crear una nueva historia, copia este bloque y agrégalo al final del array `ARC_CATALOG` en [`src/domain/arcCatalog.js`](file:///d:/Proyectos/dt_game/src/domain/arcCatalog.js):

```javascript
  {
    id: 'mi_nueva_historia', // ID único en snake_case
    title: 'El título bizarro de la historia',
    tagline: 'Resumen gracioso en una sola línea de lo que va a pasar.',
    category: 'COMMUNITY', // 'COMMUNITY' | 'LOCKER_ROOM' | 'BOARD_PRESS' | 'FINANCIAL_CRISIS'
    chapters: [
      // ---------------------------------------------------------
      // CAPÍTULO 1: El planteo del problema
      // ---------------------------------------------------------
      chapter(
        'Título del primer capítulo',
        'Descripción inicial de lo que pasa en el club. {vecina} viene con una propuesta rara y {presidente} te mira desde la ventana esperando ver qué hacés.',
        [
          o('A', 'Aceptar la propuesta con entusiasmo', 'Te tirás de cabeza a la idea.', { fans: 2, locker: 1 }, { cost: 200, flag: 'ACEPTO' }),
          o('B', 'Rechazarla de plano', 'Acá se viene a jugar al fútbol, no a hacer papelones.', { board: 1, locker: -1 }, { flag: 'RECHAZO' }),
          o('C', 'Derivárselo a {utilero}', 'Que se encargue la utilería y no te molesten.', { fans: 1 }, { flag: 'DERIVO' })
        ]
      ),

      // ---------------------------------------------------------
      // CAPÍTULO 2: La complicación
      // ---------------------------------------------------------
      chapter(
        'Título del segundo capítulo',
        'La cosa se sale de control. {periodista} se enteró de todo y publica una nota en {medio}. {barra} aparece por el estacionamiento a pedir explicaciones.',
        [
          o('A', 'Dar la cara en conferencia de prensa', 'Explicás todo con seriedad.', { board: 1, fans: 1 }, { flag: 'CONFERENCIA' }),
          o('B', 'Esconderse en el baño del vestuario', 'Que pase la tormenta sola.', { locker: -2, board: -1 }, { flag: 'ESCONDE' }),
          o('C', 'Comprar el silencio con choripanes', 'Un arreglo rápido y criollo con {barra}.', { budget: -300, fans: 2 }, { cost: 300, flag: 'CHORI' })
        ],
        // Recuerdos del capítulo 1
        {
          ACEPTO: 'Como aceptaste la propuesta al principio, el barrio entero te hace responsable.',
          RECHAZO: 'Haber rechazado la idea no impidió que los rumores crecieran igual.',
          DERIVO: 'El pobre {utilero} no sabe cómo sacarse el problema de encima.'
        }
      ),

      // ---------------------------------------------------------
      // CAPÍTULO 3: El clímax del absurdo
      // ---------------------------------------------------------
      chapter(
        'Título del tercer capítulo',
        'Llegó el día decisivo. {quiosquero} armó una colecta popular, mientras {presidente} amenaza con rescindir contratos si esto no se resuelve antes del domingo.',
        [
          o('A', 'Apostar todo al partido del domingo', 'Si ganan, nadie se acuerda de nada.', { locker: 3, fans: 2 }, { flag: 'APUESTA' }),
          o('B', 'Negociar un armisticio en el buffet', 'Café, medialunas y firma de actas.', { board: 2, locker: 1 }, { flag: 'NEGOCIA' }),
          o('C', 'Hacerse el desentendido', 'Total, en este país todo se olvida a los quince días.', { fans: -1, board: -1 }, { flag: 'OLVIDO' })
        ],
        // Recuerdos de los capítulos anteriores
        {
          CONFERENCIA: 'Tus declaraciones en la radio calmaron las aguas a medias.',
          ESCONDE: 'El plantel todavía se acuerda de la tarde que no saliste del baño.',
          CHORI: 'Los choripanes compraron paz temporal, pero la barra quiere postre.'
        }
      ),

      // ---------------------------------------------------------
      // CAPÍTULO 4: El desenlace (Ending obligatorio y Variantes)
      // ---------------------------------------------------------
      chapter(
        'Título del desenlace',
        'El desenlace inevitable. El asunto llegó a su fin y el club debe escribir el punto final de esta historia.',
        [
          o(
            'A',
            'Cerrar el ciclo con una fiesta popular',
            'Asado, cumbia y humo de carbón en la tribuna.',
            { fans: 4, budget: -400 },
            {
              cost: 400,
              ending: 'La fiesta fue inolvidable. Se comieron cuarenta kilos de asado y hasta {presidente} bailó cumbia en el círculo central.',
              variants: [
                { if: 'ACEPTO', ending: 'Como fuiste el primero en bancar la idea, te pasearon en andas por la popular y {vecina} te regaló una torta.' },
                { if: 'RECHAZO', ending: 'A pesar de tu resistencia inicial, terminaron festejando todos juntos. El fútbol de ascenso siempre da revancha.' }
              ]
            }
          ),
          o(
            'B',
            'Archivar el caso y que no se hable más',
            'Un candado en la utilería y mirada hacia adelante.',
            { board: 2, locker: 1 },
            {
              ending: 'El caso quedó archivado. En el buffet todavía queda una foto torcida recordando aquel día.',
              variants: [
                { if: 'ESCONDE', ending: 'El tema quedó enterrado, pero cada vez que vas al baño del vestuario alguien hace un chiste.' },
                { if: 'DERIVO', ending: '{Utilero} guardó los papeles en un cajón con candado y prometió no hablar del tema por veinte años.' }
              ]
            }
          ),
          o(
            'C',
            'Monetizar la anécdota vendiendo remeras',
            'Mercadotecnia de ascenso: la remera con la frase del año.',
            { budget: 900, fans: 2 },
            {
              ending: 'Las remeras se agotaron en dos horas. En la popular todos la llevan puesta con orgullo.',
              variants: [
                { if: 'CHORI', ending: 'La remera tiene impresa una foto de los choripanes. {Barra} cobra un porcentaje por derechos de imagen.' }
              ]
            }
          )
        ],
        // Recuerdos acumulados
        {
          APUESTA: 'La victoria del domingo le dio el marco épico que la historia merecía.',
          NEGOCIA: 'El pacto del buffet quedó firmado en una servilleta de papel.',
          OLVIDO: 'Nadie se olvidó de nada, pero todos fingen demencia cordialmente.'
        }
      )
    ]
  },
```

---

## 🗂️ 5. Archivos Relacionados en el Código

Si vas a expandir o modificar historias, estos son los archivos clave:

1. **[`src/domain/arcCatalog.js`](file:///d:/Proyectos/dt_game/src/domain/arcCatalog.js)**:
   Catálogo maestro donde vive el array `ARC_CATALOG`. Aquí pegas tus nuevas historias.
2. **[`src/domain/characters.js`](file:///d:/Proyectos/dt_game/src/domain/characters.js)**:
   Contiene los pools de nombres de personajes (`BARRA_LEADERS`, `UTILEROS`, `VECINAS`, etc.), la generación con seed y los reemplazos de marcadores en `renderText`.
3. **[`src/domain/arcs.js`](file:///d:/Proyectos/dt_game/src/domain/arcs.js)**:
   Motor puro que gestiona el avance temporal (`stepArcs`), la resolución con marcas y memoria (`resolveChapter`), y las colas contextuales del final según el club (`closingTail`).
4. **[`src/api/climate.js`](file:///d:/Proyectos/dt_game/src/api/climate.js)**:
   Servicio que enlaza el avance de la semana con la base de datos (`club_climate`), pasando los personajes a `stepArcs` y despachando eventos a la bandeja.
5. **[`src/domain/seasonStory.js`](file:///d:/Proyectos/dt_game/src/domain/seasonStory.js)**:
   Resumen de fin de temporada donde los desenlaces (`ending`) de las historias completadas se leen y se narran en el epílogo anual.
6. **[`tests/domain/arcs.test.js`](file:///d:/Proyectos/dt_game/tests/domain/arcs.test.js)**:
   Suite de tests que recorre automáticamente todas las historias del catálogo y verifica que no haya llaves sin reemplazar, que los flags existan y que no haya IDs duplicados.

---

## 🧪 6. Cómo Comprobar que tu Nueva Historia está Perfecta

Una vez agregada tu historia a `src/domain/arcCatalog.js`, ejecuta:

```bash
pnpm exec vitest run tests/domain/arcs.test.js tests/api/arcsWeek.test.js
```

Si el comando termina en verde, significa que:
- Tu historia tiene exactamente 4 capítulos.
- Cada opción tiene labels, descriptions y flags válidos.
- Las marcas referenciadas en `memory` y `variants` existen en capítulos previos.
- Todos los marcadores `{personaje}` fueron reconocidos y reemplazados exitosamente.
- El final se integra fluidamente con el epílogo de la temporada.
