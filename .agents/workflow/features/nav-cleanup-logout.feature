Feature: nav-cleanup-logout - Menú con cerrar sesión y sin secciones repetidas
  # Como jugador
  # Quiero cerrar mi sesión desde el menú y no ver secciones duplicadas
  # Para cambiar de cuenta y encontrar las cosas más rápido
  # Reglas probadas en tests/ui/appShell.test.jsx

  Scenario: Cerrar sesión
    Given un jugador con la sesión abierta
    When elige "Cerrar sesión" y confirma
    Then la sesión se cierra y vuelve a la portada

  Scenario: Cancelar el cierre
    Given un jugador con la sesión abierta
    When elige "Cerrar sesión" y cancela
    Then la sesión sigue abierta

  Scenario: Logros y Salón de la Fama
    Given el menú del juego
    Then Logros y Salón de la Fama no figuran en el menú
    And se llega a ellos desde Carrera del DT
