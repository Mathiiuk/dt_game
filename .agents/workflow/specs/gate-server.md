# Specification — gate-server

## 1. Objetivo
Cerrar el último agujero de plata de M2: que la taquilla la calcule y acredite el servidor.

## 2. Problema
El navegador calculaba la asistencia y el importe y los acreditaba (aunque ya por `club_cash_move`, el importe era decisión del cliente).

## 3. Cambio
- `settle_gate` (SQL): lee estadio, entrada y afición del club, calcula la asistencia con la fórmula de `src/domain/attendance.js` (paridad con valores fijos: 1.940 personas, $19.400 brutos, $11.640 netos), descuenta el 40% y acredita por `club_cash_move` con referencia por partido (no se cobra dos veces).
- Valida que el partido exista, sea de local del club y esté jugado (con un partido inventado se cobraría de más).
- Del navegador solo acepta clásico y victorias recientes (acotadas a 0..5).
- `postMatch` usa la respuesta del servidor; si el servidor rechaza no se cuenta ningún ingreso.

## 4. Límite conocido
Quien arma la lista de victorias recientes y el aviso de clásico sigue siendo el navegador (efecto acotado: la racha suma como mucho 5 victorias).

## 5. Criterios de aceptación
- [x] AC-01: paridad de la fórmula con la base.
- [x] AC-02: partido inventado rechazado; repetición sin doble cobro; racha acotada.
- [x] AC-03: verificado en el navegador con 3 partidos de local reales.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/gate-server.yml`
