# Rediseño del Mercado (Market v3)

Este documento plantea la modernización visual de la pantalla `/market`. La lógica de fondo (negociación, cuotas, representantes y ventas) que ya funciona en el servidor se mantiene intacta; el foco es exclusivamente la experiencia de usuario (UX/UI).

## 1. Qué hay hoy y los problemas

El mercado actual lista jugadores, pero la experiencia de búsqueda y negociación es árida:
- **Sobrecarga Visual:** Tablas densas con demasiados números en pantallas móviles, requiriendo scroll horizontal incómodo.
- **Negociación Seca:** Las contraofertas y los rechazos del representante aparecen como alertas genéricas, sin la sensación de "tira y afloje" de un mercado de pases real.
- **Falta de Contexto (M5):** El mercado ofrece jugadores genéricos sin importar en qué división está el club. Un club de 5ta División ve las mismas mecánicas de mercado que uno de 1ra.

## 2. Propuesta de Pantalla

### 2.1 Búsqueda y Filtros Simplificados

- **Vista Móvil de Tarjetas:** En móvil, la tabla se reemplaza por una lista de tarjetas (Cards) apiladas. Cada tarjeta destaca: Nombre, Posición, Media (estrellas o número grande) y Precio Estimado. Los datos secundarios (edad, potencial) se ven al expandir.
- **Filtros Rápidos:** Botones de un toque para: "Libres", "Transferibles", "Juveniles", "Mi Presupuesto".

### 2.2 La Interfaz de Negociación (Modo Chat / Oferta)

Para dar más vida a las negociaciones, la pantalla de oferta pasará a tener un formato híbrido entre formulario y "chat" o buzón de mensajes:
1. Armás la oferta (Monto fijo + Cuotas).
2. Se envía.
3. El representante responde en una "burbuja" de diálogo: *"A mi jugador le interesa, pero el club dueño del pase pide al menos $15.000 cash."*
4. Podés ajustar y reenviar, o retirarte.

### 2.3 Adecuación a la División (Integración con M5)

- La base de datos del mercado ofrecerá jugadores cuya calidad y pretensiones salariales estén directamente alineadas a la división del club. 
- Jugadores de calidad superior (ej. Media 75 para un club de 5ta) aparecerán bloqueados o con el mensaje del representante: *"El jugador no tiene interés en bajar a esta categoría."*

## 3. Tareas Estimadas (Esfuerzo M)

1. **Rediseño de Lista (UI):** Reemplazar la tabla por un sistema de Tarjetas Responsivas.
2. **Panel de Negociación:** Crear el componente modal `NegotiationDialog` con el historial de mensajes de la oferta actual.
3. **Paginación / Virtualización:** Asegurar que el scroll en móvil sea fluido incluso si hay 500 jugadores en la lista.
4. **Filtro de Interés:** Aplicar un filtro de "Nivel / División" para ocultar o bloquear a jugadores inaccesibles para el estatus actual del club (Depende de M5).

## 4. Criterio de Aprobación

Aprobando este documento, se validará el rediseño centrado en tarjetas para móviles y la nueva interfaz de negociación conversacional.
