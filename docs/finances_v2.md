# Plan de Rediseño: Finanzas e Infraestructura (`/finances`)

> **Objetivo de Diseño:** Convertir una pantalla que parece el portal de la AFIP en un **sistema financiero arcade y tycoon futbolero**, donde la plata se entienda en 2 segundos, no canse la vista y mejorar la cancha o la tienda sea tan gratificante y visual como en los mejores simuladores clásicos.

---

## 1. Auditoría del Estado Actual

### 1.1 Diagnóstico de Código y UX
* **Archivo principal:** `src/features/finances/FinancesScreen.jsx` (341 líneas).
* **Módulos asociados:** `src/api/finances.js`, `src/domain/finances.js`.
* **Problema clave (El Balance Contable Burocrático):**
  - La pantalla usa vocabulario técnico de contador público: *"Flujo neto semanal"*, *"Respaldo de liquidez (> 52 semanas)"*, *"Libro mayor"*, *"Desglose de partidas"*.
  - En lugar de divertir, abruma y genera miedo a tocar algo por temor a fundirse.
  - **Duplicación con Club (Obras vs. Instalaciones):**
    - En `/club` hay una pestaña "Estadio y obras".
    - En `/finances` hay tres tarjetas llamadas "Instalaciones" (Estadio, Tienda, Centro Médico).
    - Ambas hacen cosas parecidas con interfaces distintas, confundiendo al jugador.
  - **Pretemporada confusa:**
    - Antes de empezar el torneo, la pantalla mostraba números verdes falsos proyectando recaudaciones de entradas de partidos que todavía no se jugaron.
* **Fatiga visual:**
  - Listas divididas de ingresos y egresos llenas de números chicos y líneas divisorias grises.
  - Falta de íconos grandes, colores de impacto y metáforas visuales.

---

## 2. Qué Quitamos / Podamos

1. ❌ **La jerga contable fría:**
   - Fuera "Flujo neto semanal" ➡️ Pasa a **"Balance de la Semana"**.
   - Fuera "Libro mayor" ➡️ Pasa a **"Últimos Movimientos"**.
   - Fuera "Respaldo de liquidez > 52 semanas" ➡️ Pasa a **Semáforo de Caja** (*"Tranquilidad total"*, *"Cuidá los gastos"*, *"Peligro de quiebra"*).
2. ❌ **La duplicación de Obras de Club:** Todo lo que sea ladrillo, infraestructura y staff vive exclusivamente aquí.
3. ❌ **Costos irreales para categorías bajas:** Obras de $50.000 bloqueadas para un club de potrero con $10.000 de presupuesto; los costos se escalonan según la división (M5).

---

## 3. Qué Mejoramos y Qué Agregamos (Experiencia Arcade / Tycoon)

### 3.1 La "Billetera del Club" (Foto Rápida en 1 Segundo)
* Una tarjeta principal con diseño de alcancía/bóveda:
  - **Caja Actual en Grande:** Ej. **$18.400** con animación al sumar o restar.
  - **El Semáforo de Salud:**
    - 🟢 **Verde:** *"Estamos dulces"* (Alcanza para más de 20 semanas de sueldos).
    - 🟡 **Amarillo:** *"Alerta de ajuste"* (Alcanza para 4 a 8 semanas).
    - 🔴 **Rojo:** *"Peligro de quiebra"* (Menos de 4 semanas de sueldos en caja).
  - **Ecuación Simple de la Semana:**
    - `Entran: +$4.200 (Socios + TV + Sponsors)`
    - `Salen: -$3.100 (Sueldos Plantel y Staff)`
    - **Resultado:** `+$1.100 semanal` (en verde brillante).

### 3.2 El Panel Tycoon de Obras (Subir de Nivel con Recompensa Visible)
* En la pestaña **Infraestructura**, cada obra es una tarjeta con nivel visual progresivo (Nivel 1 a 5):
  1. **🏟️ El Estadio:**
     - *Nivel 1: El Potrero (1.200 populares)* ➡️ *Nivel 2: La Cancha de Cemento (3.000 lugares)*.
     - **Recompensa directa en 1 línea:** *"+$1.500 de recaudación en cada partido de local"*.
  2. **🍔 Cantina y Merchandising:**
     - *Nivel 1: Kiosquito de choripán* ➡️ *Nivel 2: Puesto de camisetas oficial*.
     - **Recompensa directa:** *"+$600 asegurados todas las semanas"*.
  3. **🏥 Centro Médico y Gimnasio:**
     - *Nivel 1: Botiquín barrial* ➡️ *Nivel 2: Consultorio con kine*.
     - **Recompensa directa:** *"Los lesionados se recuperan 1 semana más rápido"*.
  4. **🌱 La Cantera (Semillero de Cracks):**
     - *Nivel 1: Baldío municipal* ➡️ *Nivel 2: Cancha auxiliar iluminada*.
     - **Recompensa directa:** *"Los juveniles suben de nivel más rápido"*.
* **Botón de Acción Claro:** `[Mejorar a Nivel 2 por $2.500]` (con advertencia automática si te deja con poca caja).

### 3.3 Gestión de Staff Centralizada
* Pestaña **Cuerpo Técnico** donde ves a tu ayudante de campo, preparador físico y médico:
  - Cada uno con su sueldo semanal visible en rojo claro.
  - Botón directo para renovar, mejorar o reemplazar si el club crece.

---

## 4. Estructura Visual Propuesta (Layout)

```
+-------------------------------------------------------------+
|  FINANZAS & CLUB TYCOON: Caja del Club                      |
|  $24.500 [ 🟢 ESTAMOS DULCES: +$1.200/sem ]                |
+-------------------------------------------------------------+
|  TABS:  [ 💰 La Billetera ]  [ 🏗️ Obras ]  [ 👔 Staff ]     |
+-------------------------------------------------------------+
|  (Si está en pestaña OBRAS):                                |
|                                                             |
|  +-------------------------------------------------------+  |
|  |  🏟️ ESTADIO MUNICIPAL                     Nivel 1 / 5 |  |
|  |  Capacidad: 1.500 tablones                            |  |
|  |  Beneficio actual: ~$1.200 de taquilla por partido    |  |
|  |  Siguiente nivel: Tribuna de Cemento (+1.000 lugares) |  |
|  |  [ Subir a Nivel 2 por $3.000 ]                       |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  +-------------------------------------------------------+  |
|  |  🍔 CANTINA & CHORIPANES                  Nivel 2 / 5 |  |
|  |  Ingreso fijo: +$750 cada semana                      |  |
|  |  [ Subir a Nivel 3 (Tienda Oficial) por $2.000 ]      |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
```

---

## 5. Arquitectura de Componentes

* `FinancesScreen.jsx` (Contenedor general con tabs reducidas).
* `FinancesWalletCard.jsx` (Alcancía principal, semáforo de semanas de caja y ecuación semanal).
* `FinancesFacilitiesTycoon.jsx` (Tarjetas de mejoras de estadio, cantina, clínica y cantera).
* `FinancesStaffManager.jsx` (Cuerpo técnico y scouts con costo directo semanal).
* `FinancesTransactionFeed.jsx` (Historial limpio de entradas y salidas sin jerga de libro mayor).

---

## 6. Plan de Implementación

1. **Paso 1 (Traducción de lenguaje):** Reemplazar textos contables en `domain/finances.js` y `FinancesScreen.jsx` por el diccionario futbolero y semáforo.
2. **Paso 2 (Unificación de Obras):** Integrar las obras de Estadio desde `ClubScreen` hacia el componente `FinancesFacilitiesTycoon`.
3. **Paso 3 (Integración de Staff):** Traer el módulo de empleados a la pestaña Staff de Finanzas.
4. **Paso 4 (Tests y Quality Gates):** Verificar que `tests/ui/financesScreen.test.jsx` y `tests/api/weeklyFinance.test.js` pasen al 100%.
