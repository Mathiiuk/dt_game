# Rediseño de la Sección Club (Club v2)

Este documento analiza la sección `/club`, que actualmente concentra 8 pestañas y 3 paneles en más de 3.300 líneas de código, y propone una reorganización para hacerla más intuitiva y escalable.

## 1. Qué hay hoy y los problemas principales

Actualmente `/club` es un "cajón de sastre" donde conviven:
- **Resumen:** Muestra información general del club.
- **Vestuario:** Moral, cohesión, elección de capitán (escondido).
- **Entrenamiento:** Planes de práctica.
- **Enfermería:** Lista de lesionados y opciones de tratamiento.
- **Estadio y Obras:** Mejoras de infraestructura (se pisa con la pestaña Instalaciones de Finanzas).
- **Empleados:** Contratación de cuerpo técnico y ojeadores (costos desactualizados).
- **Historia / Sala de Trofeos:** Archivo de la partida.
- **Directiva:** Confianza y exigencias.

### Problemas:
- Sobrecarga cognitiva: Demasiadas pestañas en una sola vista.
- Costos rotos (B8): Otear cuesta $5.000 fijos (un cuarto de la caja inicial), y el resumen muestra sueldos anuales divididos por 52 de manera incorrecta.
- Redundancia: Obras e Instalaciones están duplicadas en concepto entre Club y Finanzas.
- Capitanía oculta (B19): Elegir al capitán está enterrado en una sub-tarjeta del Vestuario.

## 2. Propuesta de Reorganización (Qué se saca y qué cambia)

### 2.1 Desacoplamiento de Pestañas (Split)

Se propone desarmar `/club` en secciones más enfocadas, elevando algunas al menú principal o moviéndolas a áreas más afines:

1. **Entrenamiento y Enfermería -> Plantel (`/squad`)**
   - La salud y el entrenamiento físico son asuntos del plantel.
   - `/squad` tendrá tres vistas: *Alineación*, *Entrenamiento*, *Enfermería*.
   - Esto soluciona de raíz el flujo de los avisos médicos (B6).

2. **Estadio, Obras y Empleados -> Finanzas (`/finances`)**
   - Son centros de costo. Deben evaluarse junto con la caja disponible y el flujo semanal.
   - En `/finances` se crea la vista *Inversiones*, consolidando Obras y Empleados, resolviendo la duplicación actual (D4).

3. **Directiva y Sala de Trofeos -> Carrera del DT (`/manager`)**
   - La evaluación de la directiva y los logros históricos son la evaluación del usuario como DT.

### 2.2 El Nuevo `/club` (Identidad Institucional)

La ruta `/club` quedará puramente para la gestión institucional y social. Solo tendrá **3 pestañas claras**:

- **Resumen:**
  - Información básica, reputación, cantidad de socios.
  - Corrección de números (B8): mostrará el balance exacto que provee el motor financiero.
- **Hinchada y Clima:**
  - Relación con la barra brava, presiones sociales, exigencias de los simpatizantes.
- **Vestuario (Gestión de Egos):**
  - Moral, cohesión grupal.
  - **Capitanía (B19):** Interfaz dedicada y visible para nombrar Capitán y Subcapitán, con advertencias claras sobre el impacto moral de cambiar los brazaletes.

## 3. Revisión de Costos (Otear y Staff)

- **Ojeo:** Pasa de costar $5.000 fijos a un sistema escalonado. Un ojeo "Barrial" costará $500, uno "Regional" $2.000 y uno "Nacional" $5.000.
- **Empleados:** Los sueldos del cuerpo técnico se ajustarán al nivel de la división actual (M5), asegurando que un club de 5ta División no quiebre por contratar a un preparador físico.

## 4. Tareas Estimadas (Esfuerzo M/L)

1. **Migración de Vistas:** Mover los componentes de Entrenamiento y Enfermería a `SquadScreen`. Mover Empleados y Obras a `FinancesScreen`.
2. **Limpieza de ClubScreen:** Eliminar las 5 pestañas extraídas y refactorizar el código sobrante (de 3.300 líneas a menos de 800).
3. **Refactorización de Capitanía (B19):** Crear el panel explícito de Brazaletes en la nueva pestaña Vestuario.
4. **Fix de Números (B8):** Conectar el Resumen a `finances.js` para usar el flujo real.
5. **Nuevos Costos:** Actualizar la tabla de precios en `staff.js` y `scouting.js`.

## 5. Criterio de Aprobación

Por favor, validá si estás de acuerdo con mover Enfermería al Plantel y las Obras a Finanzas. Si es así, esta reorganización será la base para las próximas mejoras de UI.
