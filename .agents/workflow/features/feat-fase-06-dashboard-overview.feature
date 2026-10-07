# language: es
Característica: Dashboard Central y Centro de Mando
  Como director técnico del club
  Quiero visualizar el estado consolidado de mi institución, alertas y próximo partido
  Para tomar decisiones informadas y preparar el siguiente compromiso deportivo

  Escenario: Carga rápida de la proyección del club
    Dado que he iniciado sesión y tengo un club activo
    Cuando ingreso al centro de mando
    Entonces visualizo las finanzas, condición del plantel y próximo partido en una sola vista

  Escenario: Alerta de bajas médicas en enfermería
    Dado que tengo futbolistas lesionados
    Cuando observo el centro de mando
    Entonces aparece un banner de alerta con el número de bajas médicas y enlace al plantel
