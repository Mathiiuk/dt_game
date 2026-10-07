Feature: press-delegate-first-only - Delegar o faltar a la prensa solo antes de contestar
  # Como DT
  # Quiero que delegar la conferencia sea una decisión de antes de hablar
  # Para que no pueda borrar una respuesta que ya tuvo consecuencias
  # Reglas probadas en tests/api/pressDelegate.test.js y tests/ui/pressRoomDelegate.test.jsx

  Scenario: Antes de la primera respuesta
    Given una conferencia sin preguntas contestadas
    Then se puede no presentarse o delegar en el segundo entrenador

  Scenario: Después de contestar
    Given una conferencia con una pregunta contestada
    Then no se puede faltar ni delegar
    And se puede terminar ahí conservando lo respondido

  Scenario: Delegar con respuestas dadas no cambia nada
    Given una conferencia con una pregunta contestada
    When se intenta delegar
    Then la respuesta queda igual y la moral no cambia
