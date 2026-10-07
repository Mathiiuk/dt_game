Feature: season-close-flow - La temporada se cierra desde la gala
  # Como DT
  # Quiero cerrar la temporada en la última semana
  # Para cobrar el premio y empezar el año siguiente

  @auto
  Scenario Outline: La semana 52 pide cerrar la temporada
    Given la fecha del juego es <fecha>
    Then la temporada <estado>

    Examples:
      | fecha      | estado       |
      | 2026-07-01 | sigue        |
      | 2027-06-22 | sigue        |
      | 2027-06-23 | terminó      |
      | 2027-06-30 | terminó      |
