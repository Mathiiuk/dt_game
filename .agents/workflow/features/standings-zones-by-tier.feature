Feature: standings-zones-by-tier - La tabla marca las zonas reales de la división
  # Como DT
  # Quiero que la tabla pinte solo lo que de verdad pasa al cerrar la temporada
  # Para no asustarme con un descenso que no existe ni creer en un reducido que no se juega
  # Reglas probadas en tests/ui/standingsScreen.test.jsx

  Scenario: Última división
    Given un club en la división 5
    Then los últimos tres no figuran en zona de descenso
    And los dos primeros figuran en ascenso directo

  Scenario: División intermedia
    Given un club en la división 3
    Then los dos primeros figuran en ascenso directo y los tres últimos en descenso

  Scenario: Falla la carga
    Given que la tabla no se puede leer
    Then se muestra un aviso con "Reintentar" y ninguna tabla
