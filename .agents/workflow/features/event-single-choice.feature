Feature: event-single-choice - Un evento aleatorio aplica una sola opción
  # Como DT
  # Quiero que un dilema me cobre y me afecte una sola vez
  # Para que un doble clic no me cueste plata ni moral de más
  # Reglas probadas con la base simulada en tests/api/eventSingleChoice.test.js

  Scenario: Dos opciones apretadas a la vez
    Given un evento pendiente con dos opciones
    When se eligen las dos opciones al mismo tiempo
    Then se aplica una sola y la otra no cambia nada

  Scenario: Evento ya resuelto
    Given un evento que ya fue resuelto
    When se elige otra opción
    Then no se mueve la caja ni la reputación

  Scenario: La caja no se puede mover
    Given un evento pendiente con una opción con costo
    When el servidor rechaza el movimiento de caja
    Then el evento vuelve a quedar pendiente y no se aplica ningún efecto
