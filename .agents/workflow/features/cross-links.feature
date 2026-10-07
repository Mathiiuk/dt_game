Feature: cross-links - Cada aviso abre el lugar donde se resuelve
  # Como DT
  # Quiero que "Resolver" me lleve a la sección exacta
  # Para no buscar por todo el juego dónde se arregla cada problema
  # Reglas probadas en tests/api/alertLinks.test.js y tests/ui/clubScreen.test.jsx

  Scenario Outline: Enlace de cada aviso
    Given un aviso de "<aviso>" en el Inicio
    When el DT elige "Resolver"
    Then se abre "<destino>"

    Examples:
      | aviso                 | destino                          |
      | bajas médicas         | Club, pestaña Enfermería         |
      | plantel insuficiente  | Plantel                          |
      | contratos por vencer  | Plantel ordenado por vencimiento |
      | déficit               | Finanzas                         |
