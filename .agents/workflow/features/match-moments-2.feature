# Documentación viva (sin Cucumber instalado: se cubre con Vitest).

Feature: match-moments-2 - Penales, arquero lesionado y rival que reacciona
  # Como DT
  # Quiero decidir en los momentos calientes del partido
  # Para que mis decisiones cambien el resultado

  Scenario: Penal a favor
    Given el árbitro cobra un penal para mi equipo
    When elijo que lo patee mi mejor definidor
    Then el penal se resuelve al minuto siguiente con más chances de gol

  Scenario: Penal en contra
    Given el árbitro cobra un penal para el rival
    When mi arquero se tira hacia la esquina que elegí y el rival patea ahí
    Then el penal casi siempre se ataja

  Scenario: Arquero lesionado
    Given se lesiona mi arquero
    When decido que siga jugando
    Then el equipo rinde 12 por ciento menos hasta que lo cambio

  Scenario Outline: El rival reacciona al marcador
    Given el rival va <situacion> en el minuto <minuto>
    When llega ese minuto
    Then <reaccion>

    Examples:
      | situacion | minuto | reaccion                                  |
      | perdiendo | 60     | se tira al ataque y se avisa en el relato |
      | ganando   | 75     | se cierra atrás y se avisa en el relato   |
