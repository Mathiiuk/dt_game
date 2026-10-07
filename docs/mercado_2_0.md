# Mercado 2.0 (M6) — documento de diseño

Estado: **borrador para decidir**. Nada de esto está implementado.

## 1. Por qué rehacerlo

El mercado de hoy es una tienda: elegís un jugador, ofrecés plata, si llegás al 85 % del valor te lo venden. Eso choca con la visión del juego (arcade con mirada realista de sostener un club):

- **No hay negociación.** Una oferta se acepta o se rechaza; no hay contraoferta, ni cláusulas, ni "mirá, lo vendo si me lo pagás en cuotas".
- **No hay drama.** Ni representantes, ni jugadores que se quieren ir, ni ofertas que llegan por tus jugadores.
- **No tiene consecuencias de verdad.** Hoy hay avisos de caja y de vender referentes, pero fichar o vender no cambia el clima ni abre historias.
- **La plata la mueve el navegador.** `buyPlayer` descuenta y acredita la caja desde el cliente: se puede romper con una llamada manual. Es el mismo problema que ya cerramos en la copa.
- **Los precios no hablan con la economía.** La caja ronda los $20.000, pero el valor de un jugador sale de `market_value` o de `ritmo × 10.000`: puede costar cientos de veces tu caja.

## 2. Qué problemas queremos resolver (elegí)

| # | Problema | Qué cambia para el jugador |
|---|----------|----------------------------|
| A | Realismo económico | Precios a escala de la caja, cuotas, venta de jugadores para sobrevivir |
| B | Drama y decisiones | Ofertas por tus jugadores, jugadores que piden irse, representantes con carácter |
| C | Consecuencias | Fichar o vender mueve vestuario, hinchada, dirigencia y barra |
| D | Integridad | La plata y las transferencias las resuelve el servidor |

Recomiendo **A + C + D como base** y **B como segunda etapa**.

## 3. Diseño propuesto

### 3.1 Precios a escala (A)
- Valor de un jugador: función de media, edad y potencial, calibrada para que un titular del club valga entre 1× y 4× la caja inicial ($20.000) y un crack, hasta 8×.
- Salario y duración de contrato salen de ese valor (ya existe `contracts.js`).
- Los jugadores de clubes grandes cuestan más: factor por reputación del vendedor (0,9 a 1,3).

### 3.2 Negociación con contraoferta (A, B)
Oferta → respuesta del club vendedor, en tres posibles resultados:
1. **Acepta** (oferta ≥ lo que pide).
2. **Contraoferta**: pide un monto fijo (entre 92 % y 115 % del valor según su necesidad de caja y la reputación del comprador). Hay **hasta 2 rondas** y después se cierra la negociación por esa ventana.
3. **Rechaza**: el jugador es "intransferible" (referente, o recién renovó) o la oferta es ofensiva (< 70 %).

Formas de pago: **contado** o **en 3 cuotas** (pagás un 40 % hoy y el resto en las siguientes semanas; si la caja no alcanza, hay recargo y aviso). Las cuotas se descuentan en el cierre semanal de finanzas.

### 3.3 Representantes (B)
Cada jugador relevante tiene un representante (nombre fijo, como los personajes del clima): `agresivo`, `leal` o `oportunista`.
- Agresivo: pide más salario y bono; si lo rechazás, la próxima negociación es más cara.
- Leal: acepta menos si el club lo trata bien (racha, minutos).
- Oportunista: aparece cuando el jugador rinde y empuja una oferta de otro club.

### 3.4 Ofertas por tus jugadores (B, C)
- Cada semana, con probabilidad según el rendimiento y la caja del club, llega una oferta por un jugador tuyo.
- Evento con opciones: **aceptar**, **contraofertar** o **rechazar**. Aceptar un jugador querido sube el malestar del vestuario; rechazar a uno que quería irse lo hace rendir menos hasta que se resuelva.
- Si la caja está en rojo, la dirigencia **presiona para vender** (se conecta con la presión del club).

### 3.5 Consecuencias (C)
Se reutiliza `squadConsequences.js`:
- Vender un referente: tribuna y vestuario (ya existe).
- Fichar a un crack y dejar afuera a un titular: reclamo del suplente (ya existe).
- Fichar con cuotas atrasadas: la dirigencia lo anota; si la caja no cubre una cuota, el presidente te cita.
- Ventas que salvan la caja: alivian la presión financiera, pero bajan la satisfacción de la hinchada.
- Favores de dirigentes (ya hay `favors` en el clima): un fichaje "recomendado" por la dirigencia te cuesta un favor.

### 3.6 Servidor (D)
- Función SQL `execute_transfer(player_id, buyer_club_id, amount, installments)` en una sola transacción: valida ventana de pases, caja, cupo del plantel, pertenencia del jugador; mueve la plata de ambos clubes, cambia el club y el contrato, y deja el registro en `transfers`.
- `transfers` guarda monto, cuotas, fecha de juego y quién las pagó; el cierre semanal liquida cuotas pendientes.
- El navegador solo propone la oferta; **el precio de venta lo calcula el servidor**, no se acepta lo que mande el cliente.
- Bloquear con RLS la escritura directa de `clubs.budget` desde el cliente. **Es un cambio grande**: hoy muchas partes del juego escriben la caja desde el navegador. Se haría en una etapa aparte, migrando de a poco cada flujo a funciones del servidor.

## 4. Etapas

1. **Servidor primero (D):** `execute_transfer` y precios a escala. El mercado actual sigue igual de simple pero seguro.
2. **Negociación (A):** contraoferta, 2 rondas, cuotas y pantalla de negociación.
3. **Consecuencias (C):** conectar fichajes/ventas con clima y finanzas.
4. **Ofertas por tus jugadores y representantes (B).**

Cada etapa se entrega como una rama propia con tests y se puede jugar sin las siguientes.

## 5. Riesgos
- **Escala de precios:** hay que recalibrar contratos y salarios de todo el plantel inicial; migración con revisión de números.
- **Complejidad de pantalla:** una negociación con rondas y cuotas necesita un diseño de UI cuidado; conviene bocetarlo antes.
- **Equilibrio:** si vender es demasiado fácil, se vuelve la salida a todos los problemas; los costos de vestuario/hinchada tienen que doler.
- **Compatibilidad:** jugadores "virtuales" del pool de mercado (`mkt_player_`) hoy se insertan al comprarlos; hay que decidir si se mantienen.

## 6. Decisiones que necesito
1. ¿Qué problemas atacamos: A, B, C, D? (recomendado: A + C + D, y B después).
2. ¿Contraofertas de hasta 2 rondas está bien, o preferís una sola?
3. ¿Querés pago en cuotas desde la primera versión, o lo dejamos para después?
4. ¿Los representantes entran ahora o en una segunda etapa?
5. ¿Hacemos la etapa 1 (servidor + precios a escala) aunque no se vea cambio en pantalla, porque cierra el hueco de la plata?
