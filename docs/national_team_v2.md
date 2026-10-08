# Plan de Rediseño: Selección Nacional (`/national-team`)

> **Objetivo de Diseño:** Transformar una pantalla estática y bloqueada para novatos en una experiencia **arcade, emocionante y viva desde la primera temporada**, combinando el seguimiento de convocatorias de tus propias figuras con una barra de progreso visual de carrera.

---

## 1. Auditoría del Estado Actual

### 1.1 Diagnóstico de Código y UX
* **Archivo principal:** `src/features/manager/NationalTeamScreen.jsx` (254 líneas).
* **Módulos asociados:** `src/api/nationalTeam.js`, `src/domain/nationalTeam.js`.
* **Problema clave (Pantalla Fantasma):**
  - Actualmente, si el usuario no tiene la reputación exigida (ej. 80 pts), la pantalla únicamente lista selecciones con badges grises de `Bloqueado` y el texto *"Necesitás al menos X de reputación"*.
  - Un DT que arranca en 5ª División (reputación 10-15) no interactúa con esta pantalla durante 5 a 10 temporadas reales de juego.
  - El diseño actual usa pestañas estándar (`Nómina`, `Partidos`, `Ofertas`) con tablas numéricas sin alma.
* **Fatiga visual:**
  - Pared de texto con requisitos inalcanzables.
  - Tablas de 23 jugadores con nombres, posiciones y stats que saturan en pantalla móvil.
  - Falta de feedback visual: no hay sensación de prestigio ni mística de camiseta nacional.

---

## 2. Qué Quitamos / Podamos

1. ❌ **La lista estática de requisitos numéricos fríos:** Eliminar los textos descriptivos de "requisitos mínimos para postularse" que hacen sentir al juego inaccesible.
2. ❌ **El bloqueo total de la pantalla en ligas bajas:** Nunca más una pantalla vacía sin nada que hacer.
3. ❌ **Tablas densas de 23 jugadores en móvil:** Reemplazar la lista plana con scroll interminable por una vista de convocatoria resumida por líneas (Arqueros, Defensores, Volantes, Delanteros) en tarjetas limpias.
4. ❌ **La solemnidad burocrática:** Quitar el tono de federación deportiva; sumar la pasión de los diarios deportivos y el clamor popular.

---

## 3. Qué Mejoramos y Qué Agregamos (Experiencia Arcade)

### 3.1 El "Radar Albiceleste" (Convocatorias de tu Club)
* **Concepto:** Aunque no dirijas la selección, el cuerpo técnico nacional está ojeando a tus jugadores.
* **Mecánica:**
  - Si un jugador de tu plantel tiene rendimiento estelar (media alta, racha goleadora, valla invicta):
    - Badge con brillo dorado: **⭐ En la mira de la Selección**.
  - Si llega una fecha FIFA y lo convocan:
    - **Notificación épica:** *"¡Convocado a la Selección! [Jugador] representará al país."*
    - **Beneficios arcade inmediatos:**
      - Moral del jugador al 100% (**"Motivación de Selección"**).
      - El valor de mercado del jugador sube un +25%.
      - La hinchada sube su orgullo barrial.
      - Ingreso en la caja del club por compensación de cesión internacional.

### 3.2 El "Termómetro Albiceleste" (Progreso Visual de Carrera)
* En lugar de decir *"Te faltan 65 puntos de reputación"*, una barra de energía estilo arcade:
  - **Nivel 1:** *DT Desconocido (Lejos del radar)*
  - **Nivel 2:** *Mencionado en programas de TV deportiva*
  - **Nivel 3:** *Candidato para la Selección Sub-20 / Preolímpica*
  - **Nivel 4:** *En la terna final para la Selección Mayor*
* Cada título ganado, clásico vencido o ascenso llena la barra con animación de chispas.

### 3.3 Interinatos y Torneos Relámpago (Ofertas Trampolín)
* En temporadas intermedias (temporada 2 o 3), permitir que te ofrezcan torneos cortos de 2 o 3 partidos:
  - *"Dirigir a la Sub-23 en el Torneo Maurice Revello / Sudamericano"*.
  - Minijuegos rápidos de selección sin comprometer toda la liga de tu club.

---

## 4. Estructura Visual Propuesta (Layout)

```
+-------------------------------------------------------------+
|  HEADER: Selección Nacional (Escudo / Bandera Nacional)      |
+-------------------------------------------------------------+
|  TARJETA 1: Tu Camino al Buzo de la Selección                |
|  [======= Termómetro Albiceleste: 42% =======]              |
|  "Si lográs el ascenso esta temporada, entrás en la terna"  |
+-------------------------------------------------------------+
|  TARJETA 2: Radar de Convocados del Club                     |
|  ★ Juan González (DC) -> ¡Convocado para las Eliminatorias!  |
|    Efecto: +25% Valor de mercado | +10 Orgullo Hinchada      |
|  ★ Lucas Gómez (PO) -> En el radar (78% de probabilidad)     |
+-------------------------------------------------------------+
|  TARJETA 3: Ofertas y Oportunidades Disponibles             |
|  [Oferta: Selección Sub-20 (Sudamericano)] -> [Aceptar Cargo] |
|  [Selección Mayor: Bloqueada (Nivel 4 requerido)]           |
+-------------------------------------------------------------+
```

---

## 5. Arquitectura de Componentes

* `NationalTeamScreen.jsx` (Contenedor principal con tabs simplificados).
* `NationalCareerGauge.jsx` (Termómetro visual arcade de reputación y objetivos).
* `NationalRadarCard.jsx` (Figuritas de los jugadores de tu plantel que están en la mira o convocados).
* `NationalOffersCarousel.jsx` (Tarjetas de ofertas de seleccionados mayores y juveniles).
* `NationalMatchView.jsx` (Si dirigís la selección: interfaz compacta para disputar la fecha FIFA en 1 clic).

---

## 6. Plan de Implementación

1. **Paso 1 (Lógica de Radar):** Crear función en domain `evaluateNationalCallups(players, clubTier)` para determinar qué jugadores propios llaman la atención del seleccionado nacional según su rendimiento y media.
2. **Paso 2 (UI Termómetro):** Diseñar el componente `NationalCareerGauge` con barra de progreso y metas dinámicas.
3. **Paso 3 (UI Tarjetas de Convocados):** Diseñar `NationalRadarCard` con estética de tarjeta dorada / sticker nacional.
4. **Paso 4 (Tests y Quality Gates):** Pruebas unitarias para el cálculo de progreso y el radar de convocatorias.
