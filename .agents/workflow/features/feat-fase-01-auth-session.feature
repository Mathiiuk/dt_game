# language: es
Característica: Inicio de Sesión, Autenticación y Aislamiento de Carreras
  Como director técnico
  Quiero autenticarme de forma segura y acceder a mi carrera protegida
  Para gestionar mi club con total integridad de datos

  Escenario: Registro con contraseña robusta
    Dado que estoy en la pantalla de registro
    Cuando ingreso un correo válido y una contraseña con 8 caracteres, números y símbolos
    Entonces la cuenta es creada y se me redirige a la creación de DT

  Escenario: Bloqueo de acceso tras 5 intentos fallidos
    Dado que estoy en la pantalla de inicio de sesión
    Cuando ingreso credenciales erróneas 5 veces seguidas
    Entonces el sistema bloquea los intentos por 15 minutos e informa el tiempo restante

  Escenario: Recuperación de clave con anti-enumeración
    Dado que estoy en la pantalla de recuperar contraseña
    Cuando ingreso un correo cualquiera
    Entonces el sistema responde con confirmación neutra protegiendo la identidad
