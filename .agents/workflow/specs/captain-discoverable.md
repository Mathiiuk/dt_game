# Specification — captain-discoverable (B19 de docs/roadmap_v2.md)

## 1. Objetivo
Que se encuentre dónde elegir capitán y subcapitán. Antes era un enlace de 11 px ("Cambiar brazaletes") dentro de una tarjeta del Vestuario.

## 3. Cambio
- Vestuario: botón visible "Cambiar capitán".
- Plantel: insignias "Capitán" y "Subcapitán" y acción "Hacer capitán" en cada jugador (menos el capitán actual). Lleva a `/club?tab=vestuario&capitan=<jugador>`, que abre el panel con ese jugador elegido; la confirmación (con el aviso de moral) sigue siendo la del Vestuario.
- Pizarra: la ficha del capitán lleva una "C" y lo anuncia a lectores de pantalla.
- `lockerRoomApi.getCaptains`: lectura liviana de quién lleva la cinta (no crea ni sincroniza nada).
- De paso: el punto rojo de lesionado de la pizarra ahora queda pegado a la ficha (el círculo no tenía posición propia).

## 5. Criterios de aceptación
- [x] AC-01: el Plantel marca capitán y subcapitán.
- [x] AC-02: "Hacer capitán" abre el Vestuario con el jugador elegido.
- [x] AC-03: la pizarra marca al capitán.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/captain-discoverable.yml`
