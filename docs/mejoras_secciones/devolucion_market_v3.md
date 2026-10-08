# Devolución — `market_v3.md`

> Análisis y propuesta de mejoras sobre el rediseño del Mercado de Pases (`/market`).

---

## 1. Opinión general

El documento va en una dirección muy sólida. La idea de abandonar la tabla-planilla y transformar el mercado en una experiencia **arcade, visual y táctil** está muy bien alineada con la filosofía que venimos aplicando en `/finances`.

Los tres aciertos centrales son:

- **Figuritas Panini** como metáfora visual del jugador.
- **Negociación conversacional** con el representante.
- **Filtros ChoiceChips** de un toque.

Sin embargo, el documento tiene tres problemas:

1. **Se enfoca casi exclusivamente en la compra**, y el mercado también debería contemplar la **venta** (aunque sea en una segunda iteración).
2. **No conecta el fichaje con la economía del club**: no aparece en ningún lado cuánto queda en caja después de firmar, ni cómo impacta el sueldo en el límite salarial semanal.
3. **La tarjeta no dice si el jugador mejora o no mi plantel actual**. El jugador no puede decidir bien sin comparación directa.

**Recomendación:** mantener la filosofía del documento, pero **agregar una capa de decisión económica y comparación deportiva** que hoy no existe.

---

## 2. Qué DEJARÍA

### 2.1. La metáfora “Figuritas Panini”

Es el mejor acierto del documento. Convierte algo aburrido (una fila de tabla) en algo coleccionable y deseable.

Dejaría:

- **Cabecera de color por posición** (verde/azul/ámbar/rojo).
- **OVR en grande** con marco brillante.
- **Rasgo de personalidad cómico** como micro-badge.
- **Precio de ficha grande + sueldo en letra chica**.
- **Botón gigante** de acción.

Es la dirección correcta.

### 2.2. La negociación “Chat con el Representante”

Reemplazar el formulario gris por un chat con personalidad es exactamente lo que el juego necesita.

Dejaría:

- Avatar del representante.
- Mensaje inicial con voz propia.
- Botones de oferta rápida (`[$3.000]` `[$5.000]` `[$8.000]`).
- Selector de cuotas (`[1 Pago]` `[3 Cuotas]` `[6 Cuotas]`).
- Respuestas con chispa según la oferta.

### 2.3. Los ChoiceChips de filtrado rápido

`[Todos]` `[Libres]` `[Gangas]` `[Pibes]` `[Mi Billetera]` es un patrón mobile-first excelente. Mantenerlo.

### 2.4. La poda de lo burocrático

Eliminar el scroll horizontal, el formulario de oferta tipo AFIP y las alertas genéricas está perfectamente justificado. No volver atrás con eso.

---

## 3. Qué SACAR

### 3.1. El botón “Ojear ($500)”

Genera fricción innecesaria y un costo adicional que el jugador no entiende bien. Si el jugador ya está viendo la tarjeta, ya está ojeando.

**Reemplazar por:**

- **Informe siempre visible** (rasgo, comparación, moral estimada).
- O, si se quiere conservar el misterio, un único botón `[Ver informe completo]` **gratis**.

El scouting como mecánica separada puede existir en otro módulo (`/scouting`), no dentro del mercado.

### 3.2. La idea de “estrella de la categoría” con marco dorado como único indicador

El marco dorado está bien como detalle visual, pero no debería ser la única señal de jerarquía. Puede confundirse con “jugador caro” o “jugador en venta destacada”.

**Reemplazar por un sistema de dos capas:**

- **Marco dorado** = mejor OVR de la posición en el listado actual.
- **Etiqueta textual** = `⭐ Estrella` / `💎 Joya` / `🔥 Ganga`.

Así el jugador entiende por qué ese jugador está destacado.

### 3.3. El exceso de rasgos de personalidad

Tener 4+ rasgos cómicos distintos puede sonar divertido en el documento, pero en pantalla se vuelve ruido. Si cada tarjeta tiene un badge distinto, el jugador deja de leerlos.

**Recomendación:**

- Máximo **1 rasgo visible por tarjeta**.
- El resto, en el informe completo.

### 3.4. La tabla de escritorio como ciudadano de segunda

`MarketDesktopTable.jsx` aparece mencionado como “tabla compacta limpia solo para `lg+`”, pero no hay diseño definido.

**Recomendación:** o se diseña en serio (con el mismo lenguaje visual que las tarjetas, en grilla de 2-3 columnas), o se **elimina directamente** y se usa la misma experiencia de tarjetas en desktop con un layout más ancho. No vale la pena mantener dos paradigmas distintos.

---

## 4. Qué CAMBIARÍA

### 4.1. La tarjeta debe responder: “¿mejora mi plantel?”

Hoy la tarjeta muestra OVR, precio y rasgo. Pero **no dice si ese jugador es mejor que el que ya tengo en esa posición**.

Agregaría una línea de comparación:

```
DC titular actual:  'El Tanque' Morales (OVR 64)
Este jugador:       'Pipa' Gutiérrez   (OVR 61)  ▼ -3
```

O un indicador visual:

```
🟢 Mejora el puesto   (+4 OVR vs. titular)
🟡 Rota el puesto     (similar al titular)
🔴 No mejora el puesto (por debajo del titular)
```

Sin esto, el jugador tiene que memorizar su plantel para decidir. Es fricción pura.

### 4.2. La tarjeta debe decir cuánto queda en caja después de fichar

Este es el mismo principio que aplicamos en `/finances`: **toda decisión económica debe mostrar su impacto**.

Agregaría en la tarjeta o en el chat de negociación:

```
Pase:           -$4.500
Sueldo:         -$320 / semana
────────────────────────────
Caja después:   $20.000
Margen salarial: OK (+$1.200 libres)
```

Si no alcanza:

```
⚠️ Esta operación te deja con 2 semanas de margen.
   ¿Confirmás igual?
```

Esto conecta `/market` con `/finances`, que es exactamente lo que el juego necesita.

### 4.3. El chat debe tener más de un turno

El documento plantea un intercambio de un solo turno. Pero la negociación real es iterativa.

**Propuesta:**

- El representante contraoferta.
- El jugador puede aceptar, volver a ofertar o retirarse.
- Cada contraoferta sube un poco el precio y baja la paciencia del representante.
- Si el jugador insiste demasiado, el representante se enoja y rompe la negociación.

Eso convierte el chat en un **mini-juego**, no en un formulario con estética de chat.

### 4.4. Los filtros deben ser combinables

Los ChoiceChips actuales se plantean como mutuamente excluyentes. Pero un jugador puede querer ver:

`[Libres]` + `[Jóvenes Promesas]`

**Recomendación:** permitir multi-selección con chips activables/desactivables.

### 4.5. El filtro “Mi Billetera” debe considerar sueldo, no solo pase

Si un jugador es libre (pase $0) pero pide $800/semana y el club tiene margen salarial de $300, **no está al alcance de la billetera**. El filtro actual puede mentir.

**Corregir:**

```
[Al alcance de mi billetera]
= pase ≤ caja disponible
  Y sueldo ≤ margen salarial semanal
```

---

## 5. Qué AGREGARÍA

### 5.1. Estado vacío

El documento no menciona qué pasa cuando no hay jugadores que cumplan el filtro.

**Agregar:**

```
🕵️ No hay jugadores que coincidan con tu búsqueda.
   Probá con otros filtros o esperá al próximo mercado.
```

Con un botón `[Limpiar filtros]`.

### 5.2. Estado de carga

Mientras se cargan los jugadores, mostrar **tarjetas skeleton** con el mismo layout. Nada de spinners genéricos.

### 5.3. Estado de error

Si falla la carga, un mensaje en personaje:

```
😅 El representante no atendió el teléfono.
   [Reintentar]
```

### 5.4. Indicador de ventana de mercado

El header dice “Faltan 2 semanas”, pero no se explica qué pasa cuando se cierra. Agregaría:

- Cuenta regresiva visual.
- Aviso antes del cierre.
- Qué pasa si no fichás a nadie (nada, pero conviene decirlo).

### 5.5. Sección de venta (segunda iteración)

El mercado también debería permitir **vender jugadores propios**. Aunque sea después:

- Lista de tus jugadores con valor estimado.
- Botón `[Poner en venta]`.
- Ofertas entrantes de clubes IA.

No hace falta en v1, pero conviene dejarlo anotado como deuda explícita.

### 5.6. Historial de negociaciones

Después de cerrar una operación (éxito o fracaso), dejar un registro breve:

```
Últimas negociaciones

✅ 'Pipa' Gutiérrez    Cerrada    $5.200
❌ 'Toto' Ramírez      Rechazada  (pedía $8.000)
```

Esto da sensación de progreso y memoria al sistema.

### 5.7. Feedback táctil / sonoro

Si el juego va a ser arcade, el chat de negociación debería tener:

- Vibración corta al recibir contraoferta.
- Sonido distinto al aceptar vs. rechazar.
- Animación de “apretón de manos” al cerrar.

Es lo que separa una app de gestión de un juego.

### 5.8. Contrato: duración y cláusulas

El documento habla de sueldo y cuotas, pero no de **duración del contrato**. En un manager de fútbol, eso es central.

Agregaría:

- Duración: `[1 año] [2 años] [3 años]`.
- Cláusula de rescisión (opcional, según categoría).
- Impacto en el límite salarial a futuro.

### 5.9. Comparación con jugadores del plantel

Ya mencionado en 4.1, pero vale como sección propia: un botón `[Comparar con mi plantel]` que abra una vista lado a lado.

### 5.10. Advertencia antes de confirmar

Mismo principio que `/finances`: nunca permitir un gasto grande sin un paso de confirmación claro.

```
⚠️ Vas a gastar $5.200 de tu caja.
   Te quedan $19.300.
   [Confirmar fichaje]   [Volver]
```

---

## 6. Arquitectura recomendada (ajustada)

La propuesta del documento es correcta. Agregaría:

```
MarketScreen.jsx
│
├── MarketHeader.jsx              ← presupuesto, límite salarial, cierre de mercado
│
├── MarketFilterBar.jsx           ← chips multi-selección
│
├── MarketPlayerCard.jsx          ← figurita Panini
│   ├── MarketPlayerHeader.jsx    ← color por posición, OVR, edad
│   ├── MarketPlayerTraits.jsx    ← 1 rasgo visible
│   ├── MarketPlayerCompare.jsx   ← comparación con titular actual
│   └── MarketPlayerPrices.jsx    ← pase + sueldo + impacto en caja
│
├── NegotiationChatSheet.jsx      ← chat con representante
│   ├── NegotiationBubble.jsx
│   ├── NegotiationOfferBar.jsx
│   └── NegotiationSummary.jsx    ← impacto económico antes de confirmar
│
├── MarketEmptyState.jsx
├── MarketSkeleton.jsx
└── MarketHistory.jsx             ← últimas negociaciones
```

Sin `MarketDesktopTable.jsx` separado: la misma grilla de tarjetas se adapta a desktop con 2-3 columnas.

---

## 7. Regla de oro de UX para `/market`

Toda tarjeta de jugador debería responder en una sola pantalla:

```
¿QUIÉN ES?
     ↓
¿ES MEJOR QUE EL QUE TENGO?
     ↓
¿CUÁNTO CUESTA (PASE + SUELDO)?
     ↓
¿QUÉ ME QUEDA EN CAJA DESPUÉS?
     ↓
¿PUEDO NEGOCIARLO?
```

Si alguna de esas preguntas no se responde, la tarjeta está incompleta.

---

## 8. Plan de implementación ajustado

### Fase 1 — Tarjetas base

- `MarketPlayerCard` con cabecera por posición, OVR grande, rasgo único, precio y sueldo.
- Estados: skeleton, vacío, error.

### Fase 2 — Comparación y economía

- `MarketPlayerCompare`: ¿mejora el puesto?
- `MarketPlayerPrices`: impacto en caja y margen salarial.
- Advertencia antes de confirmar.

### Fase 3 — Negociación conversacional

- `NegotiationChatSheet` con múltiples turnos.
- Contraofertas con paciencia limitada.
- Feedback táctil/sonoro.

### Fase 4 — Filtros y memoria

- `MarketFilterBar` multi-selección.
- Corrección del filtro `Mi Billetera` (pase + sueldo).
- `MarketHistory` con últimas negociaciones.

### Fase 5 — Venta de jugadores (segunda iteración)

- Lista de jugadores propios.
- Poner en venta.
- Ofertas entrantes.

---

## 9. Veredicto final

### DEJAR

- 🔴 Metáfora “Figuritas Panini”.
- 🔴 Cabecera de color por posición.
- 🔴 OVR destacado.
- 🔴 Rasgo de personalidad cómico (máx. 1 por tarjeta).
- 🔴 Negociación tipo “chat con el representante”.
- 🔴 Respuestas con chispa del representante.
- 🔴 ChoiceChips de filtrado rápido.
- 🔴 Eliminación de la tabla y del formulario burocrático.

### MEJORAR

- 🔴 Comparación con el titular actual del plantel.
- 🔴 Impacto económico del fichaje (caja y margen salarial).
- 🔴 Chat con múltiples turnos y paciencia limitada.
- 🔴 Filtros multi-selección.
- 🔴 Filtro “Mi Billetera” con pase + sueldo.
- 🔴 Estado vacío, de carga y de error.
- 🔴 Arquitectura de componentes unificada (sin tabla desktop separada).

### AGREGAR

- 🔴 Duración de contrato y cláusulas.
- 🔴 Advertencia antes de confirmar gasto grande.
- 🔴 Historial de negociaciones.
- 🔴 Feedback táctil / sonoro en el chat.
- 🔴 Sección de venta de jugadores (segunda iteración).
- 🔴 Indicador visual de cierre de mercado.
- 🔴 Botón `[Comparar con mi plantel]`.

### SACAR

- 🔴 Botón “Ojear ($500)” dentro del mercado.
- 🔴 Marco dorado como único indicador de jerarquía.
- 🔴 Exceso de rasgos visibles por tarjeta.
- 🔴 `MarketDesktopTable.jsx` como paradigma separado.

---

## Concepto definitivo

> **El mercado no debe ser una tabla donde miro precios.**
>
> **Debe ser el lugar donde el DT encuentra a su próximo refuerzo y entiende, en 2 segundos, si puede pagarlo, si mejora el equipo y qué le queda en caja después.**

Ese debería ser el criterio para decidir qué entra y qué queda afuera de `/market`.

---

## 10. Frase que resume el rediseño

> **“Fichar tiene que sentirse como abrir un sobre de figuritas, no como llenar un formulario del banco.”**

Si esa frase se cumple, el rediseño funcionó.