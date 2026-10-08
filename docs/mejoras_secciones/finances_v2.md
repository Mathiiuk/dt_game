Devolución — finances_v2.md
Opinión general

El archivo va en una dirección mucho mejor que una pantalla financiera tradicional. La idea de transformar Finanzas en un sistema arcade/tycoon futbolero encaja muy bien con el concepto del juego: el jugador debería entender rápidamente si tiene plata, si puede gastar y qué obtiene a cambio.

La frase que mejor resume el acierto es:

“la plata se entienda en 2 segundos”

Ese debería ser el principio rector de toda la pantalla.

Sin embargo, veo un problema importante: el documento mezcla tres sistemas diferentes:

Finanzas.
Infraestructura/obras.
Staff.

La propuesta mejora mucho la UX, pero corre el riesgo de convertir /finances en un “panel administrativo gigante del club” en lugar de un sistema financiero simple.

Mi recomendación sería mantener la filosofía del documento, pero reducir bastante el alcance de Finanzas.

1. Qué DEJARÍA
1.1. La filosofía Arcade / Tycoon

Esto lo dejaría sí o sí.

La comparación con un simulador clásico es acertada. El jugador no debería sentirse como un contador.

La pantalla tiene que responder inmediatamente:

¿Cuánta plata tengo?

¿Estoy ganando o perdiendo plata?

¿Puedo gastar?

¿En qué puedo gastar?

La propuesta actual apunta correctamente hacia eso.

1.2. La Billetera del Club

Es probablemente la mejor parte del documento.

La tarjeta:

Caja actual.
Estado financiero.
Ingresos.
Gastos.
Resultado semanal.

es exactamente lo que debería existir.

La idea de mostrar:

💰 $18.400

🟢 ESTAMOS DULCES

Esta semana
Entraron      +$4.200
Gastamos      -$3.100
──────────────────
Resultado     +$1.100

es mucho más entendible que

Devolución y Rediseño Mejorado — finances_v2.md
1. Opinión General

La dirección propuesta es correcta y mucho más alineada con la identidad del juego.

El mayor acierto es abandonar la sensación de sistema contable y convertir Finanzas en una herramienta que el DT pueda entender inmediatamente:

¿Cuánta plata tengo? ¿Estoy ganando o perdiendo? ¿Qué puedo permitirme?

La idea de que la economía se entienda en aproximadamente 2 segundos debe convertirse en el principio central de /finances.

Sin embargo, el documento actual mezcla demasiado:

Finanzas.
Infraestructura.
Staff.
Obras.
Progresión del club.

Esto puede terminar convirtiendo /finances en un panel administrativo gigante.

La propuesta mejorada debería mantener la filosofía arcade/tycoon, pero establecer una separación mucho más clara entre dinero, decisiones económicas y gestión del club.

2. Qué DEJAR
2.1. El concepto Arcade / Tycoon

Mantenerlo completamente.

La economía debería sentirse como parte del juego y no como un ERP.

El jugador debe poder mirar la pantalla y entender inmediatamente:

💰 CAJA

$18.400

🟢 ESTAMOS DULCES

Esta semana
Entró       +$4.200
Gastamos    -$3.100
────────────────
Resultado   +$1.100

La propuesta original ya apunta correctamente hacia esta simplificación.

2.2. La Billetera del Club

Mantenerla como elemento principal de Finanzas.

Debe ser el componente visual más importante de la pantalla.

Información principal
Caja disponible.
Resultado semanal.
Ingresos de la semana.
Gastos de la semana.
Estado financiero.
Evitar
demasiadas cifras secundarias;
gráficos innecesarios;
lenguaje contable;
proyecciones complejas;
tablas financieras.
3. Qué SACAR
3.1. El concepto de "52 semanas"

Eliminar completamente:

"Respaldo de liquidez (> 52 semanas)"

Aunque sea financieramente correcto, no aporta diversión ni comprensión inmediata.

El jugador no necesita pensar como un contador.

El concepto de semanas de caja puede mantenerse internamente, pero traducido a una experiencia sencilla:

🟢 ESTAMOS DULCES
Podés mantener el club durante 24 semanas.

🟡 OJO CON LOS GASTOS
Tenemos margen para 7 semanas.

🔴 PELIGRO
La caja alcanza para menos de 4 semanas.
3.2. "Libro mayor"

Eliminar.

Reemplazar por:

Últimos movimientos

La decisión ya está correctamente planteada en el documento original.

Pero además recomiendo que sea secundario, no protagonista.

Ejemplo:

Últimos movimientos

🟢 Premio partido       +$1.200
🔴 Sueldos              -$2.100
🟢 Sponsors             +$800
🔴 Mantenimiento        -$300

[Ver todos]
3.3. "Flujo neto semanal"

Eliminar como término visible.

Usar:

Balance de la semana

Mucho más natural para el jugador.

3.4. Exceso de pestañas

La propuesta:

La Billetera
Obras
Staff

es razonable, pero no necesariamente debería vivir todo dentro de Finanzas.

El problema original de duplicación entre /club y /finances está bien detectado.

Pero la solución no debería ser simplemente trasladar todo a Finanzas.

Debe definirse una única fuente de verdad.

4. Qué CAMBIARÍA
4.1. Finanzas debería responder una sola pregunta

La pantalla /finances debería estar diseñada alrededor de:

"¿Cómo está económicamente mi club y qué decisiones puedo tomar con mi plata?"

No debería convertirse en:

"Todo lo relacionado con la administración del club."

5. Nueva estructura recomendada

Propongo reducir /finances a tres bloques conceptuales:

┌──────────────────────────────────────────────┐
│ 💰 CAJA DEL CLUB                             │
│                                              │
│              $24.500                         │
│                                              │
│ 🟢 ESTAMOS DULCES                            │
│ +$1.200 esta semana                          │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ 📊 ESTA SEMANA                               │
│                                              │
│ Ingresos             +$4.200                 │
│ Gastos               -$3.000                 │
│ ─────────────────────────────                │
│ Balance              +$1.200                │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ 💸 ¿EN QUÉ SE FUE LA PLATA?                 │
│                                              │
│ 👥 Plantel             $1.800                │
│ 👔 Staff                 $600                │
│ 🏟️ Mantenimiento         $300                │
│                                              │
│ [Ver movimientos]                            │
└──────────────────────────────────────────────┘

Después, fuera de este núcleo financiero:

Club
 ├── Estadio
 ├── Infraestructura
 ├── Staff
 └── Finanzas

Cada sección tiene una responsabilidad clara.

6. Infraestructura: mantener el Tycoon, pero separarlo conceptualmente

La parte de instalaciones es buena y debería conservarse.

La idea de:

Nivel 1 → Nivel 2 → Nivel 3 → Nivel 4 → Nivel 5

es perfecta para un juego de gestión.

La propuesta original de mostrar el beneficio directamente también debe mantenerse.

Ejemplo:

🏟️ ESTADIO

NIVEL 2 / 5

3.000 lugares

Actualmente
+$1.500 por partido

Próximo nivel
+1.000 lugares
+$700 potenciales por partido

💰 Mejorar por $3.000

[ MEJORAR ]

El jugador siempre debe saber:

Cuánto cuesta → qué gano → qué cambia.

7. No mostrar solamente el costo de una mejora

El documento actual tiene:

[Mejorar a Nivel 2 por $2.500]

Esto está bien, pero falta una información crítica:

¿Qué impacto tiene sobre mi economía?

Ejemplo:

Mejorar estadio

Costo:
-$2.500

Después de mejorar:

Capacidad
1.500 → 2.500

Recaudación estimada
+$1.200 → +$1.900

Recuperás la inversión aproximadamente
en 4 partidos.

Esto convierte una compra en una decisión estratégica.

Es mucho más interesante que simplemente:

"Nivel 2 cuesta $2.500."

8. El sistema debe evitar falsas ganancias

El problema de pretemporada detectado en el documento es importante y debe convertirse en una regla general.

No mostrar dinero como si ya hubiera sido obtenido.

Incorrecto:

🟢 +$5.000
Recaudación de partidos

si todavía no hubo partidos.

Correcto:

Próximos ingresos

🏟️ Próximo partido
Recaudación potencial: ~$1.200

⚠️ Todavía no cobrado

Separar siempre:

💰 DINERO REAL
vs.
📈 INGRESOS ESPERADOS
9. El semáforo financiero debe ser dinámico

La idea del semáforo es excelente, pero no debería depender únicamente de la cantidad absoluta de dinero.

No es lo mismo:

$10.000

para un club cuyos gastos semanales son:

$1.000

que para uno cuyos gastos son:

$8.000

Por eso el indicador debe considerar:

Caja actual
÷
Gasto semanal obligatorio
=
Semanas de supervivencia

Pero el cálculo queda oculto.

El jugador solamente ve:

🟢 ESTAMOS DULCES
24 semanas de margen

o:

🟡 HAY QUE CUIDAR LA CAJA
6 semanas de margen

o:

🔴 PELIGRO DE QUIEBRA
2 semanas de margen
10. Evitar que el sistema infantilice al jugador

Hay que tener cuidado con expresiones como:

"Estamos dulces"

Funcionan para darle personalidad al juego, pero no deberían utilizarse en absolutamente todos los textos.

Recomiendo utilizar un tono híbrido:

🟢 CAJA SALUDABLE
"Estamos dulces"

🟡 CAJA AJUSTADA
"Cuidá los gastos"

🔴 CAJA CRÍTICA
"Hay que levantarla"

Así el sistema mantiene personalidad sin parecer un juego infantil.

11. Staff: reconsiderar su ubicación

La propuesta de:

"Gestión de Staff Centralizada"

es buena funcionalmente.

Pero no necesariamente tiene que estar dentro de Finanzas.

Recomiendo:

Club
 └── Staff

y dentro de cada empleado:

👔 Preparador físico

Sueldo
$350 / semana

Nivel
★★★☆☆

Beneficio
Reduce fatiga

[Mejorar]
[Reemplazar]

En Finanzas solamente debería aparecer:

👔 Staff
-$1.050 / semana

con posibilidad de entrar al detalle.

Esto evita duplicar funcionalidades.

12. El sistema económico debería tener "decisiones"

Esta es una mejora importante que falta en el documento.

Finanzas no debería limitarse a mostrar números.

Debe permitir tomar decisiones.

Ejemplos:

💰 Tengo $18.000

¿En qué lo gasto?

🏟️ Mejorar estadio       $5.000
🌱 Mejorar cantera        $3.500
👔 Contratar PF           $1.200
🩺 Mejorar centro médico  $4.000
👕 Comprar jugadores      Variable

Esto convierte Finanzas en una parte real del gameplay.

13. No llenar la pantalla de gráficos

No agregaría:

gráficos circulares;
gráficos de barras innecesarios;
dashboards financieros;
porcentajes;
KPIs empresariales;
tablas enormes.

El juego no necesita parecer:

Power BI + AFIP + Excel.

Necesita parecer:

Un buen manager de fútbol.

14. Últimos movimientos

Mantenerlo, pero con formato extremadamente simple.

ÚLTIMOS MOVIMIENTOS

🟢 Premio por victoria
+$1.200
Hoy

🔴 Sueldos plantel
-$1.850
Hoy

🟢 Sponsor
+$600
Ayer

🔴 Mantenimiento estadio
-$250
Ayer

[VER TODOS]

Cada movimiento debería tener:

icono;
concepto;
monto;
fecha;
color positivo/negativo.

No mostrar información técnica innecesaria.

15. Arquitectura recomendada

La arquitectura propuesta originalmente es correcta como punto de partida.

La dejaría así:

FinancesScreen.jsx
│
├── FinancesWalletCard.jsx
│
├── FinancesWeeklyBalance.jsx
│
├── FinancesExpenseBreakdown.jsx
│
└── FinancesTransactionFeed.jsx

Y separaría infraestructura:

ClubScreen
│
└── Infrastructure
    ├── Stadium
    ├── Shop
    ├── MedicalCenter
    └── Academy

Staff:

ClubScreen
│
└── Staff
    ├── CoachingStaff
    ├── MedicalStaff
    └── Scouts

Finanzas consume esos datos, pero no necesariamente posee esos módulos.

16. Regla de oro de UX

Toda decisión económica debería responder en una pantalla:

¿CUÁNTO CUESTA?
        ↓
¿QUÉ OBTENGO?
        ↓
¿CUÁNDO RECUPERO LA INVERSIÓN?

Por ejemplo:

🏟️ MEJORAR ESTADIO

Costo
$4.000

Beneficio
+700 capacidad
+$500 aprox. por partido

Recuperación
~8 partidos

[ MEJORAR POR $4.000 ]

Esto es muchísimo más interesante para el jugador que una pantalla financiera tradicional.

17. Propuesta final de /finances
Header
FINANZAS

💰 $24.500

🟢 CAJA SALUDABLE
+6 semanas de margen
Balance
ESTA SEMANA

🟢 Entró       +$4.200
🔴 Gastamos    -$3.000
──────────────────────
💰 Balance     +$1.200
Gastos
¿EN QUÉ GASTAMOS?

👥 Plantel             $1.800
👔 Staff                 $600
🏟️ Mantenimiento         $300
🩺 Otros                 $300
Movimientos
ÚLTIMOS MOVIMIENTOS

🟢 Premio victoria       +$1.200
🔴 Sueldos               -$1.850
🟢 Sponsor                 +$600
🔴 Mantenimiento           -$250

[VER TODOS]
Acciones
DECISIONES DEL CLUB

🏟️ Mejorar infraestructura
👔 Gestionar staff
🛒 Mercado de jugadores

Estas acciones pueden llevar a sus respectivos módulos.

18. Qué NO implementaría en esta versión

Sacaría del alcance inicial:

❌ Dashboard financiero avanzado.
❌ Proyecciones a 52 semanas.
❌ Libro mayor.
❌ Terminología contable.
❌ Grandes tablas.
❌ Gráficos financieros complejos.
❌ Gestión completa de Staff dentro de Finanzas.
❌ Gestión completa de infraestructura dentro de Finanzas.
❌ Duplicación de funcionalidades existentes en /club.
❌ Ingresos futuros presentados como dinero disponible.
19. Qué implementaría primero
Fase 1 — Economía básica
Caja
↓
Ingresos semanales
↓
Gastos semanales
↓
Balance
↓
Semáforo
Fase 2 — Historial
Últimos movimientos
↓
Detalle de ingresos
↓
Detalle de gastos
Fase 3 — Decisiones
Mejorar
Contratar
Comprar
Invertir
Fase 4 — Infraestructura
Nivel
↓
Costo
↓
Beneficio
↓
Retorno
Fase 5 — Eventos económicos

Más adelante:

💰 El sponsor quiere renovar

+ $2.000 por semana

pero exige:
- camiseta principal
- contrato de 10 semanas

[ACEPTAR]
[RECHAZAR]

Esto puede hacer que Finanzas se convierta en una parte mucho más divertida del gameplay.

20. Veredicto final
DEJAR
✅ Concepto Arcade / Tycoon.
✅ Billetera.
✅ Caja grande.
✅ Balance semanal.
✅ Semáforo financiero.
✅ Mejoras por niveles.
✅ Beneficios claros.
✅ Últimos movimientos.
✅ Costos adaptados a la división.
✅ Advertencias antes de gastar.
MEJORAR
🔧 Separar Finanzas / Infraestructura / Staff.
🔧 Convertir las mejoras en decisiones estratégicas.
🔧 Mostrar retorno de inversión.
🔧 Separar dinero real de ingresos proyectados.
🔧 Hacer el semáforo dependiente del gasto semanal.
🔧 Reducir información visible.
🔧 Priorizar decisiones sobre estadísticas.
SACAR
❌ Jerga contable.
❌ Libro mayor.
❌ "52 semanas de liquidez".
❌ Dashboards empresariales.
❌ Tablas financieras pesadas.
❌ Duplicación con /club.
❌ Proyecciones mostradas como dinero real.
Concepto definitivo

Finanzas no debe ser una pantalla para mirar números.

Debe ser la pantalla donde el DT entiende si puede permitirse su próxima decisión.

Ese debería ser el criterio para decidir qué entra y qué queda afuera de /finances.