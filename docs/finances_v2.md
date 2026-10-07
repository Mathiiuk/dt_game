# Rediseño de Finanzas e Instalaciones (Finances v2)

Este documento aborda la unificación de la gestión financiera y de infraestructura del club, resolviendo la confusión actual entre las secciones de Club y Finanzas, y mejorando la legibilidad de la información contable.

## 1. Problemas Actuales

- **Duplicación Institucional:** Actualmente existen mejoras de "Estadio y Obras" en la pantalla de Club y tres tarjetas de mejora ("Estadio", "Tienda" y "Centro Médico") en la pantalla de Finanzas bajo el concepto de "Instalaciones".
- **Falta de Claridad (B17):** Se usan términos de contador ("Superavitario (> 52 semanas)", "Respaldo de liquidez") que alejan la experiencia del tono futbolero del juego.
- **Riesgo de Quiebra (M11):** En las primeras semanas, es muy fácil gastar la caja inicial en mejoras u ojeadores caros sin advertencias suficientes, llevando a un déficit irremontable antes del primer partido.
- **Falsa Sensación de Riqueza:** El indicador de caja proyecta ingresos de partidos no jugados, mostrando números en verde irreales durante la pretemporada.

## 2. Propuesta de Pantalla y Cambios

### 2.1 Consolidación de "Inversiones"

Todo lo que implique un gasto estructural (Obras, Estadio, Centro Médico, Tienda, Staff) vivirá exclusivamente en `/finances`. 
La pantalla de Finanzas se dividirá en 3 pestañas:
1. **Resumen y Flujo:** La foto actual de la caja y el movimiento semanal real.
2. **Infraestructura:** Unificación del Estadio, Tienda y Centro Médico. Se mostrarán como niveles de mejora (ej. Nivel 1 -> Nivel 2) con un costo claro y el beneficio esperado (ej. "Aumenta la capacidad en 500 lugares").
3. **Staff:** Contratación de preparadores físicos, médicos y ojeadores (movidos desde `/club`).

### 2.2 Lenguaje Claro y Futbolero (B17 resuelto)

Reemplazar la jerga técnica por términos directos:
- "Flujo neto semanal" -> **"Balance de la semana"** o **"Lo que entra y sale"**.
- "Libro mayor" -> **"Movimientos"**.
- Estados de liquidez:
  - *"Te alcanza para más de un año"* (Excelente).
  - *"Caja estable para esta rueda"* (Bueno).
  - *"Te quedan X semanas de caja"* (Alerta).
  - *"Números en rojo"* (Peligro).

### 2.3 Red de Contención para Principiantes (M11 completado)

- **Costo Dinámico:** Los costos de obras, ojeadores y cuerpo técnico se ajustarán al nivel de división (M5). Para la 5ta División, las obras básicas costarán entre $1.000 y $3.000 (y no $50.000).
- **Hard-block de Inicio:** Ninguna compra de infraestructura que deje al club con menos de 4 semanas de sueldos en caja será permitida sin un doble cartel de advertencia de alto riesgo.

## 3. Tareas Estimadas (Esfuerzo M)

1. **Migración UI:** Absorber los componentes de Obras y Empleados desde `ClubScreen` hacia `FinancesScreen`.
2. **Refactor de Instalaciones:** Crear un componente único `InfrastructureUpgrades` que unifique Estadio, Tienda y Centro Médico con costos nivelados.
3. **Actualización de Textos:** Implementar el diccionario de términos simplificados en la vista de Resumen (B17).
4. **Calculadora Real:** Ajustar el cálculo del balance semanal proyectado para que no asuma ingresos de taquilla en semanas vacías o de pretemporada.

## 4. Criterio de Aprobación

Aprobando este documento, confirmamos el traslado definitivo de todo el gasto fijo y estructural a la sección Finanzas, simplificando `/club` (como se detalla en D2).
