# Documentación viva: lo que el cierre semanal de finanzas debe cumplir.
# (El proyecto todavía no tiene Cucumber instalado: los escenarios se cubren con tests de Vitest y con pruebas en la base real.)

Feature: weekly-finance-server - Cierre semanal de finanzas en el servidor
  # Como DT
  # Quiero que cada semana se cobren los ingresos y se paguen los sueldos de forma confiable
  # Para que mi caja refleje lo que realmente pasó y nadie la pueda alterar desde el navegador

  Background:
    Given un club del usuario con 20 jugadores que cobran 130 por semana y reputación 20

  Scenario: Semana normal de liga
    Given la fecha del juego es posterior al primer partido
    When el servidor cierra la semana 10
    Then se registran ingresos por socios, patrocinio, televisión y tienda
    And se registran los sueldos del plantel y el mantenimiento como gastos
    And la caja queda igual al saldo del último asiento

  Scenario: Semana de pretemporada
    Given la fecha del juego es anterior al primer partido
    When el servidor cierra la semana 3
    Then la dirigencia aporta la mitad de los sueldos del plantel

  Scenario: Cierre repetido
    Given la semana 10 ya fue cerrada
    When el servidor recibe otro cierre de la semana 10
    Then no se registra ningún asiento nuevo
    And la caja no cambia

  Scenario: Club ajeno
    Given un club que no es del usuario
    When se pide cerrar su semana
    Then el servidor rechaza el pedido

  Scenario Outline: Los importes salen de la economía del club
    Given un club con reputación <reputacion> y tienda de nivel <tienda>
    When el servidor cierra una semana de liga
    Then el patrocinio es <patrocinio> y la tienda aporta <aporte_tienda>

    Examples:
      | reputacion | tienda | patrocinio | aporte_tienda |
      | 15         | 1      | 470        | 150           |
      | 20         | 1      | 510        | 150           |
      | 20         | 3      | 510        | 450           |
