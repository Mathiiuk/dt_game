# Diseño de consecuencias (M1) — borrador para aprobación

Estado: **diseño, sin código**. Nada de esto está implementado. Se construye recién después de que lo apruebes.
Idea rectora (tuya): **modo arcade con mirada realista de sostener un club. Todo está conectado: si vas bien, todo fluye; si vas mal, empiezan las apretadas de la barra, la corrupción y los eventos aleatorios.**

---

## 1. Resumen en una pantalla

1. **Hoy casi ninguna decisión pesa**, y no por falta de reglas sino por cuatro problemas de base (sección 2): la plata no tiene freno, hay medidores duplicados que no se hablan, la racha de resultados no llega a ningún lado y los eventos son al azar sin contexto.
2. **Propuesta central: un "clima del club"** con 4 medidores únicos (Hinchada, Dirigencia, Vestuario, Caja) y un índice de **Presión** que resume qué tan mal van las cosas. La Presión decide **qué tipo de eventos aparecen**: con presión baja pasan cosas buenas y fluye; con presión alta llegan las apretadas de la barra, los pedidos turbios de dirigentes y las ofertas de corrupción.
3. **Toda acción relevante pasa por un único módulo** (`src/domain/consequences.js`) que devuelve qué efectos tiene y **cuánto riesgo**. Si el riesgo es medio o alto, la pantalla **avisa antes** ("Esto puede molestar a la hinchada. ¿Seguir?"), y después muestra **"Esto pasó por tu decisión"**.
4. **Antes de nada hay que arreglar la economía**: el club de tu cuenta pasó de $25.000 a **$793.244 en 23 semanas**. Con esa plata, gastar de más no se castiga nunca.
5. Se entrega en **6 tandas** (sección 9), cada una con su rama, tests y verificación.

---

## 2. Diagnóstico: lo que hoy existe y lo que no (con evidencia)

### 2.1 Lo que ya funciona
| Sistema | Qué hace hoy |
|---|---|
| Entrenamiento | Cada intensidad tiene probabilidad de lesión por jugador (baja 0,1%, media 0,6%, alta 2,2% por semana, multiplicada por el cansancio) y un costo de condición física |
| Partidos | Riesgo de lesión por jugador según su condición física y el estado del césped; jugar lesionado agrava la lesión (35%) |
| Taquilla | La asistencia baja si subís el precio por encima de $10 y sube con la racha y el clásico |
| Dirigencia | Confianza que sube y baja con cada resultado, ultimátum con plazo de partidos y despido |
| Prensa | Cada respuesta cambia moral, hinchada y dirigencia |
| Vestuario | Charlas con enfriamiento de 4 semanas, capitanía, reclamos individuales |
| Eventos | 6 dilemas con opciones y efectos (boliche, caldera, sobrino del presidente, donación, soborno, pelea en el vestuario) |

### 2.2 Lo que está roto o sin conectar
| # | Hallazgo | Evidencia |
|---|---|---|
| D1 | **La economía no tiene freno.** Los ingresos fijos (patrocinio $25.000 + TV $15.000 por semana) son 15 veces la masa salarial | Tu club: caja $793.244 en 23 semanas; ingresos acumulados $920.000, gastos $152.106; sueldos semanales $2.702 contra $40.000 de ingreso. Dos motores de finanzas conviven (`economy.js` fijo y `finances.js` detallado) |
| D2 | **Medidores duplicados que no se sincronizan** | Hinchada: `clubs.fans_confidence` (la tocan eventos y prensa) y `club_fanbase.fan_support_score` (la toca el partido). Dirigencia: `clubs.board_confidence` y `club_board_confidence.confidence_score`. Moral: `clubs.squad_morale` y `players.state_morale`. Tu cuenta muestra moral del plantel **24** en una pantalla y **95%** en otra |
| D3 | **La racha nunca llega** | `processWeeklyMorale(clubId)` se llama sin rachas, así que la lógica de "3 derrotas seguidas" no corre; `recentWins` de la taquilla es un valor inventado (3 si ganaste, 1 si no) |
| D4 | **Las protestas no cambian nada** | El banderazo de repudio queda en un registro (`fanbase_events_log`) con un impacto declarado que nadie aplica; el "ambiente" de la tribuna se calcula pero el motor del partido usa un +8% fijo de local |
| D5 | **El precio de la entrada no afecta el humor** | Solo mueve la asistencia. Cobrar caro con el equipo perdiendo no enoja a nadie |
| D6 | **Los eventos no miran el contexto** | 25% de probabilidad semanal, plantilla elegida al azar, sin importar si venís ganando o perdiendo |
| D7 | **La barra y la corrupción no existen como sistema** | No hay estado de la barra ni ofertas de plata por fuera; el único dilema de soborno es una plantilla suelta |
| D8 | **Gastar de más no se registra** | No hay consecuencia de superar el tope salarial (`wage_budget`) ni de caja negativa |

---

## 3. Cómo es en la vida real (investigación)

Lo que tomé del fútbol argentino para que el juego se sienta verdadero:

- **Rueda de prensa**: en la Copa Argentina la AFA programa una conferencia después de cada partido, **obligatoria para ambos técnicos; quien no habla asume la multa**. En la práctica hay técnicos que **suspenden la conferencia tras derrotas dolorosas** (casos de Vojvoda en Racing y Tevez en Independiente) y aceptan la sanción. Lectura para el juego: omitir **es una decisión posible con costo**, y se usa sobre todo cuando se perdió.
- **La barra brava** (La Nación): pide **dinero para viajes, entradas y "plata pendiente"**. Cuando el equipo va mal presiona con **intimidaciones en los entrenamientos, mensajes del tipo "cambien o no cobran" y entradas al vestuario**. **Los dirigentes generalmente ceden y evitan la confrontación.** Un caso célebre: el técnico Antonio Mohamed renunció en Independiente tras ser intimidado en la puerta del vestuario.
- **Dirigentes y barras**: históricamente se usaron para presionar a un técnico o a un jugador que pide más plata, y se les paga de forma encubierta (entradas, empleos, "seguridad" de eventos). Lectura para el juego: la barra **no es solo un enemigo; también es una herramienta que los dirigentes ofrecen**, con costo oculto.
- **Despidos**: tras una seguidilla de derrotas la dirigencia se reúne, a veces fija **un plazo hasta un partido clave** y, si no hay reemplazo, el técnico sigue hasta entonces. Ya lo tenemos como ultimátum.
- **Corrupción**: los casos documentados son de pagos encubiertos y comisiones alrededor de contratos grandes (derechos de TV, copas) a través de intermediarios. Para un club chico se traduce en **comisiones de representantes, sponsors "amigos" del presidente, contratos inflados y pedidos de favores**. Se muestra con tono sobrio, sin glorificarla.
- **Plata de un club chico**: las categorías bajas viven de **cuotas de socios, taquilla, algún sponsor y subsidios**, con sueldos modestos; un club del ascenso de una categoría superior mueve cientos de millones de pesos al año, con los socios aportando alrededor del 40% de lo que ingresa. Lectura: **los socios y la taquilla tienen que ser la base del ingreso** y el margen tiene que ser chico.

*Fuentes al final del documento.*

---

## 4. El modelo: clima del club

### 4.1 Cuatro medidores únicos (0 a 100) y la Presión

| Medidor | Quién lo mueve | Para qué sirve |
|---|---|---|
| **Hinchada** | Resultados, precio de entradas, ventas de ídolos, rueda de prensa, eventos | Asistencia, ambiente de local, protestas, socios |
| **Dirigencia** | Resultados vs objetivo, finanzas, escándalos, pedidos que aceptás o rechazás | Paciencia, apoyo con fondos, ultimátum y despido |
| **Vestuario** | Resultados, charlas, minutos, sueldos, atrasos, la barra | Moral y cohesión, rendimiento, reclamos y pedidos de salida |
| **Caja** | Ingresos y gastos reales | Margen semanal, déficit, sueldos atrasados |

**Presión (0 a 100)**: resume qué tan mal van las cosas. Se calcula con la racha, cuánto falta respecto del objetivo de la temporada, el humor de la hinchada, la salud de la Caja y los escándalos abiertos.

```
Presión = 0,35 × racha_negativa + 0,25 × (objetivo - rendimiento) + 0,20 × (100 - Hinchada) + 0,10 × deficit_caja + 0,10 × escandalos_abiertos
```

| Estado | Presión | Cómo se siente |
|---|---|---|
| **Fluye** | menos de 30 | Todo ayuda: ofertas de sponsors, ovaciones, juveniles que explotan, la dirigencia te banca |
| **Tensión** | 30 a 55 | Primeros murmullos: la prensa duda, un dirigente pide un favor, un jugador reclama |
| **Crisis** | 55 a 80 | **La barra aparece**, el presidente aprieta, hay rumores de despido, jugadores piden irse |
| **Caos** | más de 80 | Ultimátum, invasiones al entrenamiento, ofertas de corrupción como "salida", motín en el vestuario |

Cada estado tiene su **tabla de eventos** (sección 7): la presión elige qué puede pasar, no solo cuánto.

### 4.2 Una sola fuente de verdad
- Una tabla `club_climate` por club con los cuatro medidores, la Presión, el estado de la barra y los contadores de racha. Los campos duplicados de `clubs` (`fans_confidence`, `board_confidence`, `squad_morale`) pasan a ser **espejos mantenidos por trigger**, igual que hicimos con la moral de los jugadores, para no romper nada.
- La moral individual (`players.state_morale`) sigue siendo la base: el medidor **Vestuario** es su promedio ponderado más la cohesión.

---

## 5. Matriz acción → consecuencia

Cada fila: **qué hacés**, **qué pasa**, **riesgo** (bajo, medio, alto) y **si avisa antes**. Los números son una primera propuesta para discutir.

### 5.1 Entradas y taquilla
| Acción | Consecuencias | Riesgo | Aviso |
|---|---|---|---|
| Subir el precio más de 20% sobre el recomendado | Asistencia baja (ya existe). **Nuevo:** si el equipo no gana (racha 1 o menos) la Hinchada baja 1 por partido por cada 10% de exceso; con victorias se tolera | Medio | Sí, si la racha es mala |
| Precio más de 50% arriba con el equipo perdiendo | Evento "Banderazo contra el precio"; Hinchada −6; la barra lo usa como excusa en Crisis | Alto | Sí |
| Bajar el precio más de 30% | Estadio lleno, Hinchada +0,5 por semana, menos ingreso; si hay déficit, la Dirigencia −2 | Bajo | Solo si hay déficit |
| Cobrar entrada a juveniles o ceder entradas a la barra | Ver 6.3 | Medio | Sí |

### 5.2 Entrenamiento
| Acción | Consecuencias | Riesgo | Aviso |
|---|---|---|---|
| Intensidad alta | Ya: 2,2% de lesión por jugador. **Nuevo:** **carga acumulada**: cada semana seguida en alta suma +20% de riesgo y −3 de moral ("plantel reventado"); veteranos de más de 29 años y juveniles de menos de 20 suman otro +30% | Alto desde la 2ª semana | Sí si la condición media es menor a 70 o ya hay 2 semanas seguidas |
| Intensidad baja varias semanas | Menos desarrollo (ya) y **la Hinchada y la Dirigencia lo leen como falta de ambición** si venís perdiendo | Bajo | No |
| Entrenar con partido en 2 días | La condición para el partido baja; riesgo de lesión en el partido ×1,3 | Medio | Sí |
| Semana regenerativa tras mucha carga | Quita la carga acumulada y devuelve moral | Bajo | No |

### 5.3 Alineación y plantel
| Acción | Consecuencias | Riesgo | Aviso |
|---|---|---|---|
| Jugar a alguien fuera de puesto | **Ya hecho** (M3): rinde menos y el nivel del once baja | Medio | Ya se ve en la pizarra |
| Poner de titular a un lesionado | Ya: agrava 35%. **Nuevo:** si lo hacés dos veces seguidas el cuerpo médico lo reclama y la Dirigencia −2 | Alto | Ya avisa |
| Dejar a un referente (capitán, ídolo) en el banco | Vestuario −3 por partido; si es el ídolo, Hinchada −2 | Medio | Sí |
| Jugar siempre los mismos 11 | Condición baja y más lesiones; los suplentes con más de 4 partidos sin jugar pierden moral y piden minutos | Medio | A los 3 partidos |
| Aceptar al sobrino del presidente (evento) | Ya existe: Dirigencia +, Vestuario −, Hinchada − | Medio | Ya avisa |

### 5.4 Mercado y contratos
| Acción | Consecuencias | Riesgo | Aviso |
|---|---|---|---|
| Fichar pagando más de 120% del valor | Dirigencia (financiera) −3; el agente "se acuerda" y pide más en la próxima | Medio | Sí |
| Gastar más de 40% de la caja en un solo fichaje y quedar con menos de 6 semanas de sueldos | Dirigencia −5 y evento "Caja flaca" | Alto | Sí |
| Vender al ídolo o al capitán | Hinchada −8, Vestuario −6; si la plata no se reinvierte en 4 semanas la Dirigencia cuestiona | Alto | Sí |
| Renovar a uno con aumento desparejo | Reclamos de los compañeros de rendimiento similar con sueldo 25% menor ("inequidad salarial") | Medio | Sí |
| Dejar vencer un contrato clave sin renovar | Pierde valor (ya) y la Hinchada lo toma mal si era del club | Medio | Sí, a 26 semanas |

### 5.5 Plata, obras y deuda
| Acción | Consecuencias | Riesgo | Aviso |
|---|---|---|---|
| Superar el tope salarial (`wage_budget`) | Dirigencia −2 por semana mientras dure | Medio | Sí |
| Caja bajando 3 semanas seguidas | Aviso de la directiva; "Alerta de liquidez" | Medio | Sí |
| **Caja negativa** | **Sueldos atrasados**: Vestuario −10 por semana, jugadores piden irse, la barra "pide cuentas", ultimátum financiero | Alto | Sí, antes de gastar |
| Pedir aporte extraordinario a la directiva | Ya existe: −5 de confianza; **nuevo:** no se puede pedir más de 1 vez cada 8 semanas y empeora la Presión | Medio | Ya avisa |
| Obra en el estadio | Durante la obra baja la capacidad; después sube taquilla; sin mantenimiento el césped empeora y suben las lesiones | Bajo | No |

### 5.6 Resultados (lo que "pasa solo")
| Situación | Consecuencias |
|---|---|
| Victoria | Hinchada +4, Dirigencia +4, Vestuario +8 en titulares; **con racha de 3 o más: Fluye** (eventos buenos) |
| Derrota | Hinchada −5, Dirigencia −6, Vestuario −8; derrota de local sube la Presión más que de visitante |
| **3 derrotas seguidas** | Hoy no pasa nada (D3). **Nuevo:** Vestuario −8 por semana, rumor de despido en la prensa, entra la Presión |
| Goleada en contra (3 o más) | Vestuario −15 (ya) y evento de reproche público |
| Clásico perdido | Hinchada −10 (ya) y la barra pide reunión con los jugadores |
| Racha invicta de 5 | Sponsor mejora la oferta, socios nuevos, ovación |

### 5.7 Hinchada, barra y dirigentes
Ver sección 6. En resumen: **la barra solo aparece con Presión de Crisis o más**; los dirigentes **ofrecen** manejarla y eso trae un costo oculto.

### 5.8 Rueda de prensa
Ver sección 8.

### 5.9 Vestuario
| Acción | Consecuencias | Riesgo | Aviso |
|---|---|---|---|
| Charla de equipo | Ya existe (moral y cohesión), enfriamiento de 4 semanas | Bajo | No |
| Exigir excelencia con cohesión baja | Ya: moral −5 | Medio | Ya avisa |
| Ignorar un reclamo individual | Después de 2 semanas el jugador pide la salida y contagia a su clan | Medio | Se ve en el vestuario |
| Sancionar a un referente | Respeto de los veteranos (+) pero su clan se enoja (−) | Medio | Sí |

---

## 6. La barra y la corrupción

### 6.1 La barra: un estado, no un evento suelto
Estados: **Tranquila → Pide → Presiona → Aprieta → Invasión**. Avanza de a un escalón por semana mientras la Presión esté en Crisis, y retrocede si el equipo gana.

| Estado | Qué ocurre | Efecto sobre el equipo |
|---|---|---|
| Tranquila | Nada | — |
| **Pide** | Pide **entradas, plata de viaje o "plata pendiente"** (Presión desde 55) | — |
| **Presiona** | Banderazo y amenazas en la puerta del club | Vestuario −2 por semana |
| **Aprieta** | Aparece en el entrenamiento ("cambien o no cobran") | Vestuario −5, condición −5, rendimiento −2% en el próximo partido |
| **Invasión** | Entra al vestuario o al predio tras una derrota | Vestuario −10, un jugador pide irse; la Dirigencia presiona por tu salida |

### 6.2 Tus opciones ante el pedido de la barra
| Opción | Corto plazo | Costo oculto |
|---|---|---|
| **Ceder** (entradas + plata) | La barra baja un escalón y el Vestuario se calma | Costo de caja; **sube el "contador de favores"**: cada cesión aumenta la próxima exigencia y la chance de escándalo; Dirigencia ±0 (ellos lo prefieren) pero Hinchada normal −2 si se sabe |
| **Negarte** | Respeto de algunos referentes | La barra sube un escalón; el próximo partido con riesgo |
| **Que lo resuelva la dirigencia** | Barra baja un escalón sin plata tuya | Dirigencia te "cobra" el favor: te pide uno (evento 5.7) |
| **Denunciar** | Hinchada normal (+) y Vestuario (+) | Barra al máximo; escándalo; Dirigencia −10; solo si la Dirigencia está en 55 o más |

### 6.3 Corrupción: la oferta aparece cuando vas mal
Tipos de oferta (con tono sobrio; no se glorifica):
| Oferta | Qué recibís | Qué arriesgás |
|---|---|---|
| **Comisión en un traspaso** | +$ en tu cuenta personal | Escándalo si hay investigación; reputación del DT −; Dirigencia ± |
| **Sponsor "amigo" del presidente** | Más ingreso para el club | Contrato desfavorable, cláusulas que se pagan después |
| **"Cobrar por fuera"** un fichaje o venta | Plata inmediata | Auditoría |
| **Contrato inflado a un representante** | Favor del agente | Vestuario (inequidad), Dirigencia |

**Auditoría**: cada semana hay una chance de revisión que **crece con la cantidad de favores aceptados** (de 3% a 40%). Si te agarra: multa, reputación −, Dirigencia −15, posible suspensión o despido. Si no te agarra, el contador sigue subiendo: **la tentación es más fuerte cuanto peor vas**, que es justo tu idea.

---

## 7. Eventos aleatorios por clima

Reemplaza el sorteo uniforme (25% semanal, plantilla al azar) por **eventos con condiciones y pesos según el estado**:

| Estado | Probabilidad semanal | Tipos de eventos (ejemplos) |
|---|---|---|
| **Fluye** | 20% | Sponsor mejora la oferta · ovación en el estadio · un vecino dona material · un juvenil explota · la prensa elogia · el presidente te refuerza el contrato |
| **Tensión** | 30% | Un dirigente pide un favor · reclamo de un jugador · la prensa duda · rumor de transferencia · pelea chica en el vestuario · caldera rota |
| **Crisis** | 45% | **Barra pide** · el presidente aprieta · rumor de despido · jugador pide irse · oferta de comisión · el sobrino del presidente |
| **Caos** | 60% | **Apretada en el entrenamiento** · invasión · auditoría · motín · ultimátum financiero · oferta de corrupción como salida |

El catálogo actual de 6 plantillas se amplía a unas **25 a 30**, cada una con `cuando` (estado y condiciones), `peso`, opciones y efectos sobre los cuatro medidores. Máximo 3 pendientes a la vez (como hoy).

---

## 8. Rueda de prensa obligatoria

Decidido: después del post-partido se pasa por la prensa; se puede **omitir**, con consecuencias que dependen del resultado (con un evento aleatorio).

### 8.1 Hacerla
Sigue el sistema actual (preguntas, tonos, efectos). Se suma que **responder bien con equipo ganando** deja a la prensa a favor 1 semana (Hinchada +1 pasiva) y **responder mal con equipo perdiendo** alimenta el rumor.

### 8.2 Omitirla (lo que dijiste que hay que investigar)
Según lo que encontré (multa obligatoria en la Copa Argentina y técnicos que igual la suspenden tras derrotas):

| Resultado | Costo seguro | Evento aleatorio (probabilidad) |
|---|---|---|
| **Derrota** (omitir es lo "normal") | **Multa** de $200 a $500 según el rival y la categoría; Hinchada −1 ("se escondió") | **55%** "La prensa llena el vacío": rumor de despido o pelea con un jugador (Dirigencia −3 y Hinchada −2) · **30%** no pasa nada (la nota la absorbe otro partido) · **15%** la hinchada lo entiende y sube la empatía (Hinchada +2) |
| **Empate** | Multa menor ($100) | 35% "Prensa molesta" (Hinchada −1) · 65% nada |
| **Victoria** (omitir es raro y mal visto) | **Multa** + pierdes el efecto positivo de la prensa | **40%** "Soberbia": la prensa lo cuenta como desprecio (Hinchada −2, Dirigencia −1) · 60% nada |

**Por qué así**: omitir tras ganar casi no tiene justificación, por eso es lo más castigado; omitir tras perder es "humano" y tiene una chance real de salir bien, pero lo más probable es que la prensa rellene el silencio.

---

## 9. Economía: hay que arreglarla primero

### 9.1 Problema
Ingresos de patrocinio y TV fijos en $40.000 por semana contra una masa salarial de ~$2.700 (D1). Cualquier decisión de plata queda sin peso.

### 9.2 Propuesta (valores para un club de la división 5)
Un solo motor (`finances.js`, que ya detalla socios, patrocinio, TV, tienda y taquilla) y el fijo de `economy.js` desaparece.

| Concepto | Hoy | Propuesto |
|---|---|---|
| Patrocinio + TV | $40.000/sem | **$1.100/sem** (patrocinio principal $700 que mejora con la racha + derechos TV $400) |
| Cuotas de socios | según base | **$900/sem** con 350 socios; crece con la Hinchada |
| Taquilla local | según precio y asistencia | similar, **$1.000 a $2.500 por partido de local** con 1.500 de aforo |
| Sueldos del plantel | ~$2.700/sem | igual (la escala 7 puntos no los encareció) |
| Mantenimiento y staff | $5.000 mantenimiento fijo | **$450/sem** + sueldos del staff |
| **Margen semanal típico** | **+$34.000** | **+$300 a +$900** si gestionás bien; **negativo** si fichás de más o bajás la entrada |

**Efecto práctico**: la caja inicial de $25.000 alcanza para una temporada de decisiones razonables, una compra grande de $8.000 te deja sin margen, y el déficit sostenido dispara las consecuencias de 5.5.

> Esta recalibración **cambia el balance de todas las carreras existentes**. Propongo aplicarla solo a carreras nuevas y a las actuales desde la fecha del cambio, sin tocar la caja acumulada (sección 12, decisión 1).

---

## 10. Avisos y retroalimentación (UI)

### 10.1 Avisos antes de la acción
Solo aparecen cuando el riesgo es **medio o alto**, para no cansar. Un diálogo con tres partes: **qué puede pasar**, **cuánto riesgo** y **dos botones** ("Seguir de todos modos" / "Cancelar"). Ejemplos de texto:

- *Subir la entrada a $18 con tres derrotas seguidas puede enojar a la hinchada y dar pie a un banderazo. ¿Seguís?*
- *Entrenar con intensidad alta una tercera semana seguida: el riesgo de lesión sube y el plantel ya está cansado. ¿Seguís?*
- *Vender al capitán va a caer mal en el vestuario y en la tribuna. ¿Seguís?*

Niveles: **información** (sin pantalla extra, un texto chico), **precaución** (aviso con "Seguir"), **riesgo alto** (aviso con confirmación extra y el motivo en rojo).

### 10.2 Después de la acción: "Esto pasó por tu decisión"
Un feed (en Inicio) con una línea por consecuencia: *"Subiste la entrada a $18 → Hinchada −3, asistencia −14%."* Cada línea enlaza a la sección afectada. Es la bitácora `consequence_log` (también sirve para que el jugador entienda por qué cambió algo).

### 10.3 Estado del clima en Inicio
Una tarjeta chica: **Fluye / Tensión / Crisis / Caos** con una frase ("La barra pide entradas para el domingo") y el botón de la acción pendiente.

---

## 11. Arquitectura

- **`src/domain/consequences.js`** (puro, con tests): `evaluateAction(action, contexto)` devuelve `{ efectos, riesgo, aviso }`; `climateState(presion)`; `pressureIndex(clima)`; `eventWeights(estado)`; `auditChance(favores)`.
- **`src/api/climate.js`**: lee/escribe `club_climate`, aplica efectos de forma **idempotente** y registra en `consequence_log`.
- **Migración**: tabla `club_climate` y `consequence_log`, trigger que mantiene espejos en `clubs`, conversión de datos actuales a la nueva escala.
- **Integraciones** (una por tanda): taquilla, entrenamiento, post-partido, mercado, finanzas, eventos, prensa.
- **Seguridad**: los efectos son del servidor cuando exista la Fase 5 (RPC); mientras tanto, el cliente los calcula con las mismas reglas puras.

### Plan en tandas (una rama cada una)
| Tanda | Contenido | Resultado visible |
|---|---|---|
| **T1** | Economía recalibrada + clima unificado (tabla, espejos, rachas reales) | La plata pesa; los medidores coinciden en todas las pantallas |
| **T2** | Resultados, racha, taquilla y precio de entradas conectados a Hinchada y Dirigencia; ambiente real en el partido | Una racha mala se siente en la tribuna y en la directiva |
| **T3** | Entrenamiento (carga acumulada), lesiones, minutos y plantel (consecuencias 5.2 a 5.4, 5.9) | Entrenar fuerte cuesta caro; los suplentes reclaman |
| **T4** | Barra, corrupción y catálogo de eventos por clima | Las apretadas y las ofertas turbias aparecen cuando vas mal |
| **T5** | Rueda de prensa obligatoria con omisión y eventos | Ver 8 |
| **T6** | Avisos previos, feed "Esto pasó por tu decisión" y tarjeta de clima | Todo explicado en pantalla |

Cada tanda: tests de dominio, tests de pantalla, verificación en el navegador, `agt` con su rama, registro de memoria.

---

## 12. Decisiones que necesito de vos

1. **Economía (sección 9)**: ¿recalibro los ingresos como propuse? ¿Se aplica solo a carreras nuevas y desde ahora a las existentes (sin tocar la caja acumulada), o querés reiniciar la caja de las existentes a un valor razonable?
2. **Tono de la barra y la corrupción**: me parece bien mostrarlos con tono sobrio (hechos y consecuencias, sin violencia gráfica). ¿Estás de acuerdo o querés más crudeza o menos?
3. **Dureza**: ¿los números de la matriz (sección 5) te parecen bien como punto de partida, o más duros o más permisivos? Puedo agregar un selector de dificultad (Relajado, Normal, Realista) que multiplique los efectos.
4. **Despido**: hoy la Dirigencia te echa con confianza en 0 y hay ultimátum. ¿Querés además que **la barra pueda precipitar tu salida** (como Mohamed) si llega a Invasión y la Dirigencia está por debajo de 40?
5. **Corrupción**: ¿las ofertas pueden terminar en **suspensión** del DT (una semana sin dirigir) o solo en multa, reputación y despido?
6. **Rueda de prensa omitida**: ¿te cierran las probabilidades y multas de 8.2, o querés otras?
7. **Orden de tandas**: ¿arrancamos por T1 (economía y clima) como propongo? Es la base de todo lo demás.
8. **Avisos**: ¿preferís que aparezcan siempre que el riesgo sea medio o alto, o que se puedan desactivar con "no volver a avisarme esto" en cada tipo?

---

## Fuentes

- [Juan Pablo Vojvoda suspendió la conferencia de prensa tras la derrota de Racing ante Boca por Copa Argentina — Bolavip Argentina](https://bolavip.com/ar/futbolargentino/juan-pablo-vojvoda-suspendio-la-conferencia-de-prensa-tras-la-derrota-de-racing-ante-boca-por-copa-argentina)
- [Tevez suspendió la conferencia de prensa tras la eliminación de Independiente — ESPN](https://espndeportes.espn.com/futbol/argentina/nota/_/id/13524816/tevez-suspendio-conferencia-prensa-eliminado-independiente-talleres-copa-de-la-liga)
- [Las presiones de la barra brava, una constante en el fútbol argentino — La Nación](https://www.lanacion.com.ar/deportes/futbol/las-presiones-de-la-barra-brava-una-constante-en-el-futbol-argentino-nid1418226/)
- [Cómo los hinchas argentinos conquistaron el fútbol, la política y el mundo criminal del país — Tribuna](https://tribuna.com/es/blogs/como-los-hinchas-argentinos-conquistaron-el-futbol-la-politi/)
- [Juan Pablo Vojvoda dejó de ser el técnico de Racing tras la derrota frente a Boca — La Nación](https://www.lanacion.com.ar/deportes/futbol/racing/juan-pablo-vojvoda-deja-de-ser-el-tecnico-de-racing-tras-la-agonica-derrota-frente-a-boca-nid28092026/)
- [La caja de la AFA: los documentos que revelan los manejos ocultos de los fondos del fútbol argentino — Infobae](https://www.infobae.com/politica/2026/01/04/la-caja-de-la-afa-los-documentos-que-revelan-los-manejos-ocultos-de-los-fondos-del-futbol-argentino/)
- [Cronología del FIFAgate — La Nación](https://www.lanacion.com.ar/deportes/futbol/cronologia-del-escandalo-de-corrupcion-que-sacudio-al-futbol-paso-a-paso-todo-lo-que-sucedio-en-el-fifagate-nid1857924/)
- [Es un club del ascenso en Argentina y tiene un presupuesto anual de 1000 millones — OneFootball](https://onefootball.com/es/noticias/es-un-club-del-ascenso-en-argentina-y-tiene-un-presupuesto-anual-de-1000-millones-35129538)
- [Primera D Metropolitana — Wikipedia](https://en.wikipedia.org/wiki/Primera_D_Metropolitana)

---

## 13. Decisiones aprobadas (05/10/2026)

1. **Economía**: nueva economía para todas las carreras; la caja de las existentes se normaliza a ~$15.000–$25.000 con un evento narrativo ("La dirigencia reestructuró las finanzas"). Si el club ya está en déficit, no se toca. Carreras nuevas: $25.000.
2. **Tono**: sobrio pero inquietante (sugerir, no mostrar). La corrupción como normalidad administrativa.
3. **Dificultad** asimétrica: Relajado (negativos ×0,7, eventos malos −10%), Normal, Realista (negativos ×1,3, positivos ×0,9, eventos malos +10%, la barra avanza un escalón más rápido). Números de la matriz como están.
4. **Barra → salida**: Invasión + Dirigencia < 40 dispara "Reunión de emergencia": A) ceder a todo (favores suben fuerte, Dirigencia 20); B) plantarse (50% despido, 50% ultimátum de 3 partidos); C) renunciar (final narrativo distinto).
5. **Escándalos**: 1º multa + reputación − + Dirigencia −15; 2º suspensión de 1 partido (ayudante dirige, rendimiento −5%); 3º despido.
6. **Prensa omitida**: derrota → "la hinchada lo entiende" 10% (no 15%); victoria → "Soberbia" 50%; con Dirigencia > 70 la multa se reduce a la mitad.
7. **Orden**: arrancar por T1.
8. **Avisos**: silenciables por tipo; se reactivan una vez tras un escándalo o una racha de 5 partidos.

### Ideas sumadas al backlog (después de T1–T6)
Decisiones rápidas en el partido (banco min 70, charla de entretiempo, prensa relámpago) · personajes con nombre y memoria (líder de la barra, presidente, periodista) · feedback visual del clima · arcos narrativos de 8–10 fechas · combos y círculos viciosos visibles en el feed · mostrar probabilidades cuando hay riesgo · resumen de historia al final de temporada · dilemas que suben la Presión a propósito · onboarding gradual (sem 1–4 Hinchada y Dirigencia; 5–8 Caja y Vestuario; 9+ Presión, barra, corrupción).
