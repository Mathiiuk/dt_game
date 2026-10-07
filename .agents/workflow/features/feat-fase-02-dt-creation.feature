# language: es
Característica: Creación del Director Técnico y Presets de Trasfondo
  Como nuevo entrenador en Del Potrero al Ídolo
  Quiero forjar mi identidad profesional eligiendo mi historia previa y habilidades
  Para iniciar mi carrera con una credencial oficial y atributos balanceados

  Escenario: Distribución completa de los 15 puntos libres
    Dado que estoy en el paso de habilidades del asistente
    Cuando asigno los 15 puntos del pozo respetando el tope de 14 por estadística
    Entonces el pozo restante llega a 0 y se habilita el paso siguiente

  Escenario: Selección de trasfondo profesional
    Dado que estoy en el paso de trasfondo
    Cuando selecciono el arquetipo Exfutbolista Profesional
    Entonces mi reputación inicial base es establecida en 35 puntos
