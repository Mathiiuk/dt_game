Feature: year-in-review - El resumen del año cuenta fichajes y decisiones
  # Como DT
  # Quiero que al cerrar la temporada me cuenten qué compré, qué vendí y cuál fue mi mejor y peor decisión
  # Para sentir que mi año tuvo una historia

  @auto
  Scenario: Compras y ventas del año
    Given el club compró 2 jugadores por 8000 y 3000 y vendió 1 por 5000
    When se arma el resumen de fichajes
    Then se informa que compró 2 gastando 11000 y vendió 1 ingresando 5000

  @auto
  Scenario: Un año sin movimientos no inventa fichajes
    Given el club no hizo ninguna operación
    When se arma el resumen de fichajes
    Then se informa que compró 0 gastando 0 y vendió 0 ingresando 0

  @auto
  Scenario Outline: Mejor y peor decisión del año
    Given la decisión "<decision>" tuvo un impacto total de <impacto>
    When se arma el ranking de decisiones
    Then la <lugar> decisión es "<decision>"

    Examples:
      | decision                | impacto | lugar |
      | Racha de campeón        | 12      | mejor |
      | Cedieron ante la barra  | -9      | peor  |
