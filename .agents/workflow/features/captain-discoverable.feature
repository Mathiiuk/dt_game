Feature: captain-discoverable - Elegir capitán se encuentra fácil
  # Como DT
  # Quiero ver quién es mi capitán y poder cambiarlo desde el Plantel
  # Para no tener que buscar la opción escondida en el Club
  # Reglas probadas en tests/ui/squadScreen.test.jsx y tests/ui/pitch.test.jsx

  Scenario: Cinta a la vista en el Plantel
    Given un plantel con capitán y subcapitán designados
    Then el Plantel los marca con su insignia

  Scenario: Hacer capitán desde el Plantel
    Given un jugador que no es el capitán
    When el DT elige "Hacer capitán"
    Then se abre el Vestuario con ese jugador propuesto como capitán

  Scenario: Cinta en la pizarra
    Given un once con el capitán en cancha
    Then su ficha muestra la cinta
