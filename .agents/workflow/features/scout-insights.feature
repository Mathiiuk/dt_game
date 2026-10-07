Feature: scout-insights - El ojeo da una lectura del jugador
  # Como DT
  # Quiero que el informe del ojeador me diga si el jugador me sirve y si el precio es justo
  # Para decidir un fichaje con algo más que números

  @auto
  Scenario Outline: Cómo encaja el jugador en el plantel
    Given mi mejor DC tiene nivel 62
    When ojeo a un DC de nivel <nivel>
    Then la lectura dice "<frase>"

    Examples:
      | nivel | frase                    |
      | 66    | Mejoraría a tu mejor DC  |
      | 62    | igual a igual            |
      | 58    | sería suplente           |

  @auto
  Scenario: Sin nadie en esa posición cubre un puesto vacío
    Given mi mejor DC tiene nivel 62
    When ojeo a un PO de nivel 55
    Then la lectura dice "puesto sin titular"

  @auto
  Scenario: Un jugador sin datos no genera lectura
    Given no hay jugador para ojear
    Then no hay lectura
