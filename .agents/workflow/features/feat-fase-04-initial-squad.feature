Funcionalidad: Generación Procedural del Primer Plantel
  Como director técnico
  Quiero que mi club cuente con un plantel equilibrado y completo de 20 futbolistas
  Para poder armar alineaciones tácticas y competir en la liga

  Escenario: Generación de las 20 cuotas posicionales
    Dado que mi club no posee futbolistas
    Cuando se inicializa la plantilla oficial
    Entonces se generan exactamente 2 arqueros, 6 defensores, 7 volantes y 5 delanteros

  Escenario: Dorsales únicos y control salarial
    Dado un plantel generado para el club
    Cuando inspecciono los dorsales y salarios
    Entonces cada dorsal del 1 al 20 es único y la masa salarial no excede el presupuesto
