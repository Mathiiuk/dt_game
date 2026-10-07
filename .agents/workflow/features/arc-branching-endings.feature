Feature: arc-branching-endings - El final de la historia depende del camino y del estado del club
  # Como DT
  # Quiero que el final de cada historia dependa de lo que decidí antes y de cómo está el club
  # Para que valga la pena elegir distinto en cada capítulo

  @auto
  Scenario Outline: La marca del camino cambia el final
    Given el DT eligió el camino <marca> en la historia del pibe
    When cierra la historia vendiendo al pibe
    Then el final menciona "<frase>"

    Examples:
      | marca    | frase                                  |
      | FICHADO  | que habías traído vos                  |
      | PERDIDO  | que habías mandado a probarse al vecino |

  @auto
  Scenario Outline: El estado del club agrega una frase de cierre
    Given la barra está en la etapa <etapa> y la dirigencia en <dirigencia>
    When se cierra una historia sin variantes
    Then la frase de cierre menciona "<frase>"

    Examples:
      | etapa     | dirigencia | frase           |
      | INVASION  | 90         | barra           |
      | CALM      | 20         | continuidad     |
      | CALM      | 85         | dirigencia      |

  @auto
  Scenario: Con el club tranquilo no se agrega ninguna frase
    Given la barra está en la etapa CALM y la dirigencia en 50
    When se cierra una historia sin variantes
    Then no hay frase de cierre
