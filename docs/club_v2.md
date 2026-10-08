# Plan de Rediseño: El Club (`/club`)

> **Objetivo de Diseño:** Desarmar el monstruo actual de 8 pestañas y más de 3.300 líneas de código, podando lo redundante y trasladando lo que pertenece a otras áreas, para dejar una sección de **Club institucional, íntima, con mística futbolera y sólo 3 pestañas ultra claras**.

---

## 1. Auditoría del Estado Actual

### 1.1 Diagnóstico de Código y UX
* **Archivo principal:** `src/features/club/screens/ClubScreen.jsx` (278 líneas) + 8 sub-componentes de pestañas (`StadiumManagementTab`, `StaffManagementModal`, `FanbaseManagementTab`, `BoardManagementTab`, `LockerRoomTab`, `InfirmaryTab`, `ClubHistoryTab`, `IdolsLegendsTab`) sumando **más de 3.300 líneas de código**.
* **Problema clave (El Cajón de Sastre):**
  - Actualmente `/club` contiene TODO lo que no supo dónde ponerse:
    1. `Gestión y staff` (empleados y scouts).
    2. `Vestuario` (moral y cohesión).
    3. `Enfermería` (lesionados e infiltraciones).
    4. `Estadio y obras` (ampliación de tribunas, se duplica con Finanzas).
    5. `Hinchada` (barra brava y socios).
    6. `Directiva` (confianza del presidente).
    7. `Historia y récords` (palmarés histórico).
    8. `Ídolos y leyendas` (figuras históricas).
* **Fatiga visual y laberinto:**
  - En móvil, la barra de pestañas requiere un scroll horizontal larguísimo para encontrar una pestaña.
  - El usuario no sabe si mejorar el estadio en `/club` o en `/finances`.
  - No sabe si ver a los lesionados en `/squad` o en `/club`.
  - **El Capitán está enterrado (B19):** Para cambiar la cinta de capitán hay que entrar a Club, ir a Vestuario, scrollear hasta una tarjeta secundaria y presionar un enlace diminuto.

---

## 2. Qué Quitamos y Qué Trasladamos (La Gran Poda)

1. ❌ **Enfermería y Entrenamiento se van a `/squad` (Plantel):**
   - El estado físico, los lesionados y los entrenamientos son asuntos diarios del plantel de futbolistas.
   - `/squad` absorberá la vista de *Enfermería* (curaciones e infiltraciones) y *Entrenamiento*, quedando centralizado el cuidado de los jugadores.
2. ❌ **Estadio, Obras y Cuerpo Técnico se van a `/finances` (Finanzas):**
   - Construir una tribuna o contratar a un preparador físico son egresos de dinero.
   - Se eliminan las pestañas duplicadas de Obras y Staff en `/club`; ahora vivirán bajo la pestaña *Inversiones e Infraestructura* en `/finances`.
3. ❌ **Directiva pasa a `/manager` (Carrera del DT):**
   - La directiva no evalúa al club; evalúa la gestión y continuidad del DT.
4. ❌ **Eliminación de las 8 pestañas:** La barra horizontal de 8 botones desaparece para siempre.

---

## 3. Qué Queda en el Nuevo `/club` (3 Pestañas Puras y Dinámicas)

El nuevo `/club` pasa a ser el santuario de la **identidad, la pasión y el vestuario**:

```
[ Pestaña 1: Mística & Vitrina ]   [ Pestaña 2: La Tribuna ]   [ Pestaña 3: El Vestuario ]
```

### 3.1 Pestaña 1: Mística & Vitrina (La Institución)
* **Identidad barrial:** Escudo grande, año de fundación, apodo del club, cantidad de socios y categoría actual.
* **La Vitrina de Copas:** Estante virtual con trofeos brillantes ganados en tu ciclo y en la historia del club. Cada copa se puede tocar para ver el año del campeonato y el goleador del torneo.
* **Ídolos de la Casa:** Tarjetas doradas con las 3 máximas glorias del club.

### 3.2 Pestaña 2: La Tribuna (Hinchada & Clima Social)
* **El Termómetro Popular:**
  - Estado de la hinchada: *"Enamorada del equipo"* / *"Impaciente"* / *"En pie de guerra"*.
  - Influencia directa en los partidos como local (bonus de aliento o presión en contra).
* **Relación con la Barra Brava:**
  - Micro-decisiones con la hinchada (asados de camaradería, banderas, entradas).
  - Tono criollo y humorístico que da color al club.

### 3.3 Pestaña 3: El Vestuario & El Brazalete (Gestión de Egos)
* **Clima del Grupo:** Barra de cohesión general y estado anímico del plantel.
* **La Capitanía Destacada (Solución a B19):**
  - Una tarjeta visual de alto impacto con **La Cinta de Capitán**.
  - Muestra al Capitán y Subcapitán actuales con sus fotos/iniciales, liderazgo y efecto en el equipo.
  - Botón prominente: **[Asignar Nuevo Capitán]**.
  - Al cambiarlo, un diálogo directo advierte las consecuencias de vestuario: *"Sacarle la cinta a Nahuel bajará su moral un -15%, pero dársela a Juan inspirará a los pibes (+10% liderazgo)"*.

---

## 4. Estructura Visual Propuesta (Layout)

```
+-------------------------------------------------------------+
|  HEADER: Mi Club Atlético | 5ª División | Fundado en 1928   |
+-------------------------------------------------------------+
|  TABS:  [ 🏆 Mística ]   [ 🥁 La Tribuna ]   [ 👕 Vestuario ]|
+-------------------------------------------------------------+
|  (Si está en pestaña VESTUARIO):                            |
|                                                             |
|  +-------------------------------------------------------+  |
|  |  BRAZALETE DE CAPITÁN OFICIAL                         |  |
|  |  Capitán: Juan Pérez (32 años) - Líder del plantel    |  |
|  |  Efecto: +12% Temple en partidos difíciles            |  |
|  |  [ Cambiar Capitán / Subcapitán ]                     |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  +-------------------------------------------------------+  |
|  |  CLIMA DEL VESTUARIO: 84% (Unión total)               |  |
|  |  "Los referentes bancan a muerte la idea táctica"     |  |
|  |  Moral media: Alta | Egos controlados                 |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
```

---

## 5. Arquitectura de Componentes

* `ClubScreen.jsx` (Contenedor reducido a menos de 300 líneas).
* `ClubIdentityTab.jsx` (Escudo, socios, vitrina de copas y leyendas).
* `ClubFanbaseTab.jsx` (Termómetro de la tribuna y relación social).
* `ClubLockerRoomTab.jsx` (Moral, grupos de afinidad y selector visual de capitán).
* `CaptainSelectorSheet.jsx` (Modal deslizable para elegir capitán con preview de consecuencias).

---

## 6. Plan de Implementación

1. **Paso 1 (Reubicación de código):** Mover el acceso de Enfermería a `/squad` y Obras/Staff a `/finances`.
2. **Paso 2 (Rediseño de Pestañas de Club):** Reducir el selector a 3 pestañas principales.
3. **Paso 3 (Selector de Capitanía):** Crear `CaptainSelectorSheet` con botón prominente y badges de liderazgo.
4. **Paso 4 (Tests y Quality Gates):** Actualizar las pruebas de interfaz (`tests/ui/clubScreen.test.jsx`) para reflejar la nueva distribución de 3 pestañas.
