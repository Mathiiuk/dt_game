# Documentación viva (sin Cucumber instalado: se cubre con Vitest y con pruebas en la base real).

Feature: season-prize-server - Premio de fin de temporada en el servidor
  # Como DT
  # Quiero cobrar el premio que me corresponde por mi puesto al cerrar la temporada
  # Para que mi caja del año siguiente sea justa y nadie pueda alterarla desde el navegador

  Scenario Outline: Premio según el puesto
    Given mi club terminó en el puesto <puesto> de la liga
    When se cierra la temporada
    Then cobro <premio> de premio

    Examples:
      | puesto | premio |
      | 1      | 12000  |
      | 2      | 8000   |
      | 4      | 5000   |
      | 10     | 2500   |
      | 19     | 1000   |

  Scenario: Ascenso
    Given mi club terminó entre los dos primeros
    When se cierra la temporada
    Then el club sube de categoría y el presupuesto salarial crece 80 por ciento

  Scenario: Sin ascenso
    Given mi club terminó fuera de los dos primeros
    When se cierra la temporada
    Then la categoría no cambia y el presupuesto salarial crece 10 por ciento

  Scenario: Goleador del año
    Given mi goleador hizo 8 goles en la temporada
    When se cierra la temporada
    Then cobro 1500 más por el goleador

  Scenario: Cierre repetido
    Given el premio de esta temporada ya fue liquidado
    When se vuelve a liquidar
    Then no se cobra de nuevo y el libro mayor tiene un solo asiento de premio

  Scenario: Club ajeno
    Given un club que no es mío
    When se pide liquidar su premio
    Then el servidor lo rechaza
