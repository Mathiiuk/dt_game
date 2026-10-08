# ==============================================================================
# PLANTILLA ESTÁNDAR DE ESPECIFICACIÓN BDD EN GHERKIN
# ==============================================================================
# Propósito: Definir los criterios de aceptación y el comportamiento del sistema
# en un formato legible por humanos y ejecutable por máquinas (Cucumber).
# Palabras clave en inglés (estándar universal) con comentarios en español.
# ==============================================================================

Feature: bugs-mejoras-v3 - Bugs y mejoras v3: partido, prensa e historias
  # Como DT
  # Quiero un partido y una prensa que entren en la pantalla sin scroll y historias interactivas
  # Para jugar rapido y con ganas desde el celular

  # Escenarios de aceptacion (cubiertos por Vitest en tests/ui y tests/domain; no llevan @auto porque no tienen steps de Cucumber)
  Scenario: Abrir los cambios pausa el partido y salir lo retoma
    Given un partido en juego
    When el DT abre la pizarra de cambios
    Then el partido queda en pausa
    And al salir de la pizarra el partido se retoma solo

  Scenario: Las estadisticas se abren hacia arriba y se cierran
    Given un partido en juego con la barra de posesion a la vista
    When el DT toca la barra de posesion
    Then se despliegan los demas datos y el relato se achica
    And al tocarla de nuevo todo vuelve a como estaba

  Scenario: Una historia se decide con un desafio de pista
    Given una historia a pantalla completa con un desafio
    When el DT supera el desafio
    Then ve lo que cambia cada opcion antes de decidir
    And si no lo supera decide a ciegas sin costo
