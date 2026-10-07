Feature: league-home-away-balance - El calendario de liga reparte local y visitante parejo
  # Como DT
  # Quiero jugar la mitad de los partidos de local
  # Para que la taquilla y la economA-a del club tengan sentido

  @auto
  Scenario: Calendario de una liga de 20 clubes
    Given una liga de 20 clubes
    When se arma el calendario
    Then hay 38 fechas de 10 partidos
    And cada club juega entre 19 y 19 partidos de local
    And ningAn club juega mAs de 3 fechas seguidas de visitante

  @auto
  Scenario: Cada rival se enfrenta una sola vez
    Given una liga de 20 clubes
    When se arma el calendario
    Then cada par de clubes se cruza exactamente dos veces
