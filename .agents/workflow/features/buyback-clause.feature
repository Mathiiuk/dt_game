Feature: buyback-clause - Cláusula de recompra
  # Como DT
  # Quiero dejar una opción de volver a comprar al jugador que vendo
  # Para no perderlo para siempre si llega a ser una figura
  #
  # Los importes se calculan igual en el dominio y en la base (grant_buyback); las reglas de vencimiento y de dueño viven en la base y
  # se verificaron con un bloque que se deshace (escenarios @db).

  @auto
  Scenario Outline: Costo y precio de recompra según la venta
    Given el club vendió a un jugador por <venta>
    When calcula la cláusula de recompra
    Then paga <costo> por dejarla y lo recompra por <precio>

    Examples:
      | venta | costo | precio |
      | 8000  | 800   | 10000  |
      | 12345 | 1235  | 15431  |
      | 0     | 0     | 0      |

  @db
  Scenario: Solo se deja la cláusula sobre una venta de esta temporada
    Given un jugador que el club no vendió este año
    When intenta dejar la cláusula
    Then la base responde "No hay una venta de este jugador en la temporada para dejar la cláusula."

  @db
  Scenario: La cláusula vencida no se puede ejercer
    Given una cláusula que venció hace una temporada
    When intenta recomprar al jugador
    Then la base responde "La cláusula de recompra venció."
