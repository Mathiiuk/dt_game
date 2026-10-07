Feature: board-balance-calibration - La directiva reacciona a los resultados con un balance calibrado
  # Como DT
  # Quiero que la directiva me apriete cuando voy mal y me respete cuando voy bien
  # Para que sostener el club tenga tensión real sin despidos injustos

  @auto
  Scenario Outline: Cambio del ánimo deportivo según el resultado
    Given la directiva está conforme con deportiva 70, financiera 70 y plantel 70
    When el equipo <resultado>
    Then el ánimo deportivo queda en <deportiva>

    Examples:
      | resultado | deportiva |
      | gana      | 74        |
      | empata    | 69        |
      | pierde    | 64        |

  @auto
  Scenario: Con la confianza en el piso la directiva da un ultimátum antes de echar
    Given la directiva está en crisis con deportiva 3, financiera 5 y plantel 5
    When el equipo pierde
    Then se emite un ultimátum y no hay despido

  @auto
  Scenario: Fallar el ultimátum es el despido
    Given la directiva dio un ultimátum con un partido restante y 0 puntos de 4
    When el equipo pierde
    Then el DT es despedido por ultimátum fallido
