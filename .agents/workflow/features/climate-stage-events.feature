Feature: climate-stage-events - Cada etapa de la barra y cada nivel de presión tienen sus propios eventos
  # Como DT
  # Quiero que el club se sienta distinto según cómo está la barra y cuánta presión hay
  # Para que las semanas no se parezcan unas a otras

  @auto
  Scenario Outline: Un evento solo aparece en la etapa que le corresponde
    Given la barra está en la etapa <etapa> con presión <presion>
    When se sortean los eventos de ambiente de la semana
    Then el evento <evento> <resultado>

    Examples:
      | etapa     | presion | evento               | resultado         |
      | ASKS      | 30      | EVT_TICKET_RESELLING | puede aparecer    |
      | CALM      | 30      | EVT_TICKET_RESELLING | no puede aparecer |
      | PRESSURES | 30      | EVT_WALL_PAINTINGS   | puede aparecer    |
      | SQUEEZES  | 30      | EVT_PLAYER_AFRAID    | puede aparecer    |
      | CALM      | 80      | EVT_PRESIDENT_RADIO  | puede aparecer    |
      | CALM      | 30      | EVT_PRESIDENT_RADIO  | no puede aparecer |

  @auto
  Scenario: Los combos nuevos se disparan una sola vez por racha
    Given una racha de 4 victorias con 3 lesionados
    When se detectan los combos de la semana
    Then aparece el combo GRIT_WINS

  @auto
  Scenario: Sin la racha exacta no hay combo
    Given una racha de 5 victorias con 3 lesionados
    When se detectan los combos de la semana
    Then no aparece ningún combo
