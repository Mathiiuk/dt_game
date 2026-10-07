Feature: press-situations - La prensa pregunta por la situación y recuerda cómo contestaste
  # Como DT
  # Quiero que los periodistas pregunten por lo que realmente pasa en el club
  # Para sentir que la conferencia no es siempre la misma

  @auto
  Scenario Outline: Pregunta según la situación del equipo
    Given el club viene con <situacion>
    When el periodista arma la pregunta de la conferencia
    Then la pregunta es de tipo <tipo>

    Examples:
      | situacion                  | tipo            |
      | 4 derrotas seguidas        | BAD_RUN_CRISIS  |
      | 3 victorias seguidas       | STAR_PERFORMANCE |
      | 6 partidos sin perder      | TACTICAL_CHOICE |
      | un ex jugador en el rival  | EX_PLAYER       |

  @auto
  Scenario: Tres respuestas combativas seguidas se le hacen notar al DT
    Given las últimas tres respuestas fueron combativas
    When el periodista revisa cómo contestó el DT
    Then hay una pregunta de memoria sobre la relación con la prensa

  @auto
  Scenario: Con respuestas variadas el periodista no recuerda nada especial
    Given las últimas tres respuestas fueron combativa, elogiosa y combativa
    When el periodista revisa cómo contestó el DT
    Then no hay pregunta de memoria
