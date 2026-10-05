# language: es
Característica: Portada pública de Vestuario
  Para decidir si quiero jugar
  Como visitante que llega desde un buscador
  Quiero entender en segundos qué es Vestuario y poder empezar mi carrera

  Escenario: Un visitante entiende qué es Vestuario
    Dado que entro a la portada sin haber iniciado sesión
    Entonces veo un único título principal "Vos sos el DT."
    Y veo el texto "Vestuario es un juego de Director Técnico de fútbol"
    Y la portada entra en una sola pantalla en mi celular

  Escenario: Crear mi carrera
    Dado que estoy en la portada
    Cuando toco "Crear mi carrera"
    Entonces llego a "/registro" con el formulario de cuenta nueva

  Escenario: Iniciar sesión
    Dado que estoy en la portada
    Cuando toco "Iniciar sesión"
    Entonces llego a "/login" con el formulario de inicio de sesión

  Escenario: Conocer el juego
    Dado que estoy en la portada
    Cuando toco "Conocer el juego"
    Entonces llego a "/juego"

  Escenario: Ya tengo una carrera
    Dado que tengo una sesión iniciada y una carrera activa
    Cuando entro a la portada
    Entonces el llamado principal dice "Continuar carrera"

  Escenario: Sólo se muestran frases aprobadas
    Dado un dataset con una frase verificada y otra sin verificar
    Cuando miro el flash de frases
    Entonces nunca aparece la frase sin verificar

  Escenario: Las frases propias no se atribuyen a nadie
    Dado una frase propia de Vestuario
    Cuando aparece en la portada
    Entonces no muestra ningún autor

  Escenario: Movimiento reducido
    Dado que mi sistema pide reducir el movimiento
    Cuando entro a la portada
    Entonces veo una frase fija y los llamados a la acción siguen disponibles

  Escenario: El juego no aparece en buscadores
    Dado que un buscador lee "robots.txt"
    Entonces las rutas del juego están bloqueadas
    Y el sitemap sólo lista la portada y las páginas públicas
