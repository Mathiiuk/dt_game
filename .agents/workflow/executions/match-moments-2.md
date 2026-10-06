# match-moments-2

Penales, arquero lesionado y rival que reacciona.

- **Penales:** se anuncian (evento `PENALTY`), pausan el partido solos y se resuelven al minuto siguiente. A favor se elige quién patea entre los tres mejores definidores (probabilidad de gol de 55% a 90% según su definición) o se deja al que corresponde; en contra se elige hacia dónde se tira el arquero (izquierda, medio o derecha): si adivina la esquina, casi siempre ataja. Frecuencia de ~0,35% por minuto (~0,3 por partido) y favorecen al que más ataca.
- **Azar propio:** penales y reacciones del rival usan un generador aparte (`seed:pen`), así que no alteran el resto del partido.
- **Arquero lesionado:** aviso propio y castigo de 12% si sigue (4% para un jugador de campo).
- **Rival que reacciona:** si el rival (IA) va perdiendo a los 60 se tira al ataque (+15% ataque, -10% defensa por 15 minutos) y si va ganando a los 75 se cierra (+15% defensa, -10% ataque); queda en el relato como `RIVAL_TACTIC`. `startMatch` marca el lado de la IA (`aiSide`).
- **TDD:** tests en rojo primero (motor 5 + momentos 4), luego implementación; el test estadístico de "atacar con todo" se subió a 600 partidos porque los penales mueven un poco los totales.
- 1.069 tests en verde; `agt task:verify` pasa; `bdd_tests` desactivado (Cucumber no instalado).
