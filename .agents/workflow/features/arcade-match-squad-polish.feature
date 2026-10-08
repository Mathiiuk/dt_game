Feature: arcade-match-squad-polish - Escudos vectoriales arcade, fixes de encoding, mejoras interactivas en match, post-match desktop y rediseño de squad
  Como DT de fútbol arcade
  Quiero escudos vectoriales representativos, estadísticas en vivo dinámicas, cambios interactivos en pizarra y un plantel espacioso
  Para disfrutar de una experiencia visual pulida, responsiva y sin textos con errores de encoding

  @auto
  Scenario Outline: Resolución heráldica de escudos vectoriales arcade
    Given un club con nombre "<club_name>"
    When se resuelve el patrón de su escudo vectorial
    Then el patrón heráldico asignado es "<patron>"

    Examples:
      | club_name          | patron             |
      | River Plate        | SASH_DIAGONAL      |
      | Boca Juniors       | STRIPE_HORIZONTAL  |
      | Racing Club        | STRIPES_VERTICAL   |
      | Vélez Sarsfield    | CHEVRON_V          |
      | Newell's Old Boys  | HALVES             |
      | Club Ferro Carril  | SOLID              |

  @auto
  Scenario: Cálculo del resumen métrico para el rediseño espacioso del plantel
    Given un plantel con 22 jugadores y 2 lesionado
    When se calcula el resumen visual del plantel
    Then el total de jugadores es 22 y los lesionados son 2
