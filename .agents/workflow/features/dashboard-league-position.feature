Feature: dashboard-league-position - El Inicio muestra el mismo puesto que la Tabla
  # Como DT
  # Quiero ver mi puesto en el Inicio
  # Para no tener que entrar a la Tabla después de cada partido
  # Reglas probadas en tests/api/dashboardRank.test.js

  Scenario: Puesto tras jugar
    Given un club que va segundo con 10 puntos en 5 partidos
    When se abre el Inicio
    Then se muestra puesto 2, 10 puntos y 5 jugados

  Scenario: La tabla no se puede leer
    Given que la tabla falla al cargar
    When se abre el Inicio
    Then el Inicio carga sin el puesto
