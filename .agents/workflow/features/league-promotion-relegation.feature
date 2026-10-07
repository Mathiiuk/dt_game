Feature: league-promotion-relegation - Ascensos y descensos reales
  # Como DT
  # Quiero que mi puesto final me mueva de categoría
  # Para que subir y bajar tenga consecuencias

  @auto
  Scenario Outline: Movimiento según el puesto y la categoría
    Given mi club está en la categoría <categoria>
    When termina la temporada en el puesto <puesto>
    Then el resultado es <movimiento>

    Examples:
      | categoria | puesto | movimiento |
      | 5         | 1      | PROMOTED   |
      | 4         | 2      | PROMOTED   |
      | 4         | 10     | STAY       |
      | 4         | 18     | RELEGATED  |
      | 1         | 1      | STAY       |
      | 5         | 20     | STAY       |
