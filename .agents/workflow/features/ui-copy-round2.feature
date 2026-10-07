Feature: ui-copy-round2 - Textos claros en prensa, finanzas y enfermería
  # Como jugador
  # Quiero leer la pantalla sin códigos ni palabras técnicas
  # Para entender qué pasa sin preguntar
  # Reglas probadas en tests/static/copy.test.js y tests/domain/toneLabels.test.js

  Scenario: Tono de una respuesta de prensa
    Given una respuesta con el tono interno "PRAISING"
    Then la pantalla muestra "Elogioso"

  Scenario: Cuánto dura la caja
    Given un club que no pierde plata por semana
    Then Finanzas no muestra símbolos de mayor o menor

  Scenario: Infiltrar a un lesionado
    Given un lesionado al que se puede infiltrar
    Then la Enfermería explica el riesgo sin palabras médicas
