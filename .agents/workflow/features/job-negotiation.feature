Feature: job-negotiation - Las ofertas de trabajo se negocian
  # Como DT
  # Quiero pedir un sueldo mejor antes de firmar con otro club
  # Para que mi reputación valga algo en la mesa de negociación

  @auto
  Scenario Outline: Respuesta del club según lo que se pide
    Given una oferta de 1000 por semana para un puesto que exige reputación 50
    And el DT tiene reputación <reputacion>
    When pide <pedido> por semana en la primera ronda
    Then el club responde <respuesta>

    Examples:
      | reputacion | pedido | respuesta |
      | 60         | 1150   | ACCEPTED  |
      | 60         | 1300   | COUNTER   |
      | 60         | 2000   | WITHDRAWN |
      | 70         | 1150   | ACCEPTED  |
      | 50         | 1150   | COUNTER   |
      | 60         | 900    | INVALID   |

  @auto
  Scenario: En la segunda ronda el club ya no se mueve
    Given una oferta de 1175 por semana para un puesto que exige reputación 50
    And el DT tiene reputación 60
    When pide 1300 por semana en la segunda ronda
    Then el club responde FINAL

  @auto
  Scenario: No se puede negociar más de dos rondas
    Given una oferta de 1000 por semana para un puesto que exige reputación 50
    And el DT tiene reputación 60
    When pide 1100 por semana en la tercera ronda
    Then el club responde CLOSED
