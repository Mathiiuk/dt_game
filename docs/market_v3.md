# Plan de Rediseño: Mercado de Pases (`/market`)

> **Objetivo de Diseño:** Reemplazar la tabla densa de tipo planilla de cálculo por una experiencia **arcade, visual y divertida**: tarjetas de jugadores estilo "figuritas coleccionables" y negociaciones picantes estilo "chat con el representante", todo optimizado para jugar con el pulgar en el celular.

---

## 1. Auditoría del Estado Actual

### 1.1 Diagnóstico de Código y UX
* **Archivo principal:** `src/features/market/MarketScreen.jsx` (344 líneas) y `src/features/market/OfferModal.jsx` (187 líneas).
* **Módulos asociados:** `src/api/market.js`, `src/domain/market.js`, `src/domain/contractDemands.js`.
* **Problema clave (La Planilla de Ferretería):**
  - En móvil, el mercado renderiza una tabla con múltiples columnas: `Jugador`, `Posición`, `Media`, `Ritmo`, `Potencial`, `Precio`, `Sueldo`, `Acción`.
  - En pantallas de 360-390 px de ancho, esto genera un scroll horizontal forzado, ilegible y propenso a toques accidentales.
  - El modal de ofertas (`OfferModal.jsx`) es un formulario gris con inputs numéricos descoloridos, donde ofertar se siente como llenar una declaración jurada.
  - La respuesta de rechazo o contraoferta es una alerta estática de texto (`El club rechazó tu oferta y pide $X`), carente de dinamismo.
* **Fatiga visual:**
  - Fondo oscuro con filas de números pequeños.
  - Cero personalidad en los jugadores en venta (todos se ven iguales).

---

## 2. Qué Quitamos / Podamos

1. ❌ **La tabla clásica con scroll horizontal en móvil:** Se elimina por completo en pantallas menores a `lg`.
2. ❌ **El formulario burocrático de oferta:** Se reemplaza por un sistema de sliders o botones de incremento rápido (`+$1.000`, `+$5.000`, `+1 Cuota`) para operar a toda velocidad con el pulgar.
3. ❌ **Jugadores fuera de categoría mezclados:** Con M5 ya implementado, ningún crack inalcanzable de 1ª División aparecerá disponible para un club de 5ª si no tiene intenciones reales de negociar.
4. ❌ **Alertas de error genéricas:** No más toasts aburridos de rechazo; las respuestas vienen con voz propia de los personajes.

---

## 3. Qué Mejoramos y Qué Agregamos (Experiencia Arcade)

### 3.1 "Figuritas Panini": Tarjetas Coleccionables en Móvil
* Cada jugador en el mercado se presenta como una **tarjeta visual atractiva**:
  - **Cabecera de Color por Posición:**
    - 🧤 **Verde:** Arquero (PO)
    - 🛡️ **Azul:** Defensores (DFC, LI, LD)
    - ⚡ **Amarillo/Ámbar:** Mediocampistas (MC, MI, MD)
    - 🔥 **Rojo:** Delanteros (DC, EI, ED)
  - **Media en Grande (OVR):** Número destacado con marco brillante (dorado si es estrella de la categoría).
  - **Rasgo de Personalidad Cómico (Micro-Badge):**
    - *"El Fiestero (baja moral si pierde, figura si gana)"*
    - *"De Cristal (se lesiona fácil)"*
    - *"El Pibe Maravilla (potencial enorme)"*
    - *"El Mercenario (juega solo por plata)"*
  - **Precios Claros:** Precio de ficha en grande y sueldo semanal estimado en letra chica.
  - **Botón Gigante:** `[Ojear ($500)]` o `[Negociar]`.

### 3.2 La Negociación "Chat con el Representante"
* Al negociar, se abre un **Bottom Sheet / Diálogo de Chat**:
  - Foto/Avatar del representante (con traje brillante y cara de zorro).
  - Mensaje inicial: *"Escucho ofertas por mi jugador. Pero ojo que no come vidrio."*
  - **Tus controles de oferta (Rápidos):**
    - Botones de monto cash: `[$3.000]` `[$5.000]` `[$8.000]`.
    - Selector de cuotas: `[1 Pago]` `[3 Cuotas]` `[6 Cuotas]`.
  - **La respuesta con chispa:**
    - Si ofertás muy poco: *"¿Esto es un chiste o una cámara oculta? Por esa plata que juegue en el torneo de veteranos."*
    - Si estás cerca: *"Estirate a $6.000 cash y firmamos antes del entrenamiento de mañana."*
    - Si acepta: *"¡Trato cerrado! Ya le pedí el auto al presidente."*

### 3.3 Filtros Rápidos de un Toque (ChoiceChips)
* En la parte superior, botones estilo chip que filtran al instante:
  - 🟢 **[Todos]**
  - 🏷️ **[Libres (Costo $0)]**
  - 💥 **[Gangas / En venta]**
  - ⭐ **[Jóvenes Promesas]**
  - 💵 **[Al alcance de mi billetera]**

---

## 4. Estructura Visual Propuesta (Layout)

```
+-------------------------------------------------------------+
|  MERCADO DE PASES: Estado [ABIERTO - Faltan 2 semanas]       |
|  Presupuesto Disponible: $24.500 | Límite salarial: OK       |
+-------------------------------------------------------------+
|  FILTROS: [Todos] [Libres] [Gangas] [Pibes] [Mi Billetera]  |
+-------------------------------------------------------------+
|  [ TARJETA DE JUGADOR (Móvil)                             ] |
|  +--------------------------------------------------------+ |
|  | [ROJO] DELANTERO - DC                           OVR 64 | |
|  | 'El Tanque' Morales (24 años)              [Estrella]  | |
|  | Rasgo: "Goleador de rachas"                            | |
|  | Pase: $4.500  |  Sueldo: $320/sem                      | |
|  | [ Ojear ($500) ]              [ Iniciar Oferta ]      | |
|  +--------------------------------------------------------+ |
|  [ TARJETA DE JUGADOR (Móvil)                             ] |
|  +--------------------------------------------------------+ |
|  | [AZUL] DEFENSOR CENTRAL - DFC                   OVR 58 | |
|  | Nahuel Cáceres (31 años)                   [Líder]     | |
|  | Rasgo: "Fuerte como una roca"                          | |
|  | Pase: LIBRE ($0)  |  Sueldo: $210/sem                  | |
|  | [ Ver Informe ]               [ Negociar Contrato ]   | |
|  +--------------------------------------------------------+ |
+-------------------------------------------------------------+
```

---

## 5. Arquitectura de Componentes

* `MarketScreen.jsx` (Pantalla principal simplificada).
* `MarketFilterBar.jsx` (ChoiceChips rápidos y buscador sin tildes).
* `MarketPlayerCard.jsx` (La tarjeta de figurita Panini para móvil).
* `MarketDesktopTable.jsx` (Tabla compacta limpia solo para pantallas de escritorio `lg+`).
* `NegotiationChatSheet.jsx` (El diálogo conversacional con el representante).

---

## 6. Plan de Implementación

1. **Paso 1 (Componente de Tarjetas):** Construir `MarketPlayerCard` con diseño responsive, colores semánticos por posición y visualización clara de OVR.
2. **Paso 2 (Negociación Conversacional):** Refactorizar `OfferModal.jsx` a `NegotiationChatSheet.jsx` integrando respuestas cómicas del representante y botones de oferta de un toque.
3. **Paso 3 (Filtros Rápidos):** Implementar barra de chips `MarketFilterBar` conectada con la lógica de filtrado existente (`filterMarketPlayers`).
4. **Paso 4 (Tests y Quality Gates):** Asegurar que todas las pruebas existentes de mercado y compraventa (`marketBuy.test.js`, `marketSales.test.js`) sigan pasando en verde.
