Funcionalidad: Niveles y Progresión del Director Técnico
  Como entrenador en carrera
  Quiero ganar experiencia con las victorias y logros de mi equipo
  Para subir de nivel y desbloquear ventajas tácticas en mi perfil

  Escenario: Ganancia de XP y subida de nivel tras victoria
    Dado que mi DT posee 100 XP en Nivel 1
    Cuando gano un partido oficial y el backend adjudica 150 XP
    Entonces mi total asciende a 250 XP y subo a Nivel 2 obteniendo 1 punto de habilidad

  Escenario: Prevención de duplicación de XP
    Dado que un partido ya otorgó XP a mi DT
    Cuando el worker de partido reintenta la notificación por timeout
    Entonces el ledger detecta la clave compuesta y descarta la duplicación
