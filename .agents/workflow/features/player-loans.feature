Feature: player-loans - Cesiones a préstamo
  # Como DT
  # Quiero ceder a un jugador a otro club por la temporada
  # Para ahorrar su sueldo y recuperarlo al cerrar el año
  #
  # Las reglas viven en la base (loan_out_player y return_loans) y se verificaron en la base real con un bloque que se deshace;
  # por eso estos escenarios van con la marca @db y no se ejecutan con Cucumber. El cliente se prueba con Vitest.

  @db
  Scenario: Ceder a un jugador
    Given un club con 20 jugadores
    When cede a un jugador a préstamo
    Then el jugador pasa a un club rival de su liga y deja de cobrar en su plantel
    And queda marcado como cedido por el club de origen

  @db
  Scenario Outline: Reglas que cortan la cesión
    Given un club con <jugadores> jugadores y <cedidos> cedidos
    When intenta ceder a otro jugador
    Then la base responde "<mensaje>"

    Examples:
      | jugadores | cedidos | mensaje                                                       |
      | 16        | 0       | Necesitás al menos 16 jugadores en el plantel para ceder a alguien. |
      | 20        | 3       | Ya tenés 3 jugadores cedidos: es el máximo.                   |

  @db
  Scenario: Al cerrar la temporada los cedidos vuelven
    Given un club con 3 jugadores cedidos
    When se cierra la temporada
    Then los 3 vuelven al club antes de liberar a los de contrato vencido
