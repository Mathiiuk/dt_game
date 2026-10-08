Feature: historical-teams - Agregar clubes históricos de Promiedos adaptados por categorías desde potrero
  Como DT del club
  Quiero competir contra clubes históricos reales del fútbol argentino adaptados a cada división
  Para experimentar una carrera arcade inmersiva con folclore, estadios y colores auténticos desde el potrero

  @auto
  Scenario: Generación de rivales para la liga de Potrero
    Given una categoría de juego de nivel 5
    When se sortean 19 rivales para la carrera "carrera-potrero"
    Then todos los rivales pertenecen a la categoría 5
    And cada rival tiene estadio real y capacidad registrada

  @auto
  Scenario: Generación de rivales para Primera División
    Given una categoría de juego de nivel 1
    When se sortean 19 rivales para la carrera "carrera-primera"
    Then todos los rivales pertenecen a la categoría 1
    And ningún nombre de club se repite entre los rivales

  @auto
  Scenario: Exclusión del club del usuario para no duplicar en la categoría
    Given una categoría de juego de nivel 1
    When se sortean 19 rivales excluyendo al club "River Plate"
    Then el club "River Plate" no forma parte de los rivales
