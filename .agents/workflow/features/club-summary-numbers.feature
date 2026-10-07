Feature: club-summary-numbers - El resumen del club usa los números de Finanzas
  # Como DT
  # Quiero ver en el Club los mismos sueldos y el mismo balance semanal que en Finanzas
  # Para no decidir con números que no son reales
  # Regla probada en tests/ui/clubScreen.test.jsx

  Scenario: Resumen del club
    Given un club que paga 2900 de sueldos de plantel y 300 de staff por semana
    And cuyo flujo de la semana es de -450
    When se abre la pantalla Club
    Then el resumen muestra sueldos por 3200 y un flujo semanal de -450
