Feature: auth-pwa-session-security - Seguridad robusta, persistencia PWA de sesión y navegación con retroceso seguro

  @auto
  Scenario: Sesión PWA reanuda y refresca credenciales al volver del segundo plano
    Given una app PWA con sesión activa almacenada en "dt_supabase_auth_token"
    When la aplicación recupera la visibilidad en pantalla
    Then el cliente de autenticación reanuda el auto-refresco de tokens
    And la sesión activa se mantiene disponible para el usuario

  @auto
  Scenario: Usuario autenticado navega a la pantalla de acceso y es reingresado de inmediato
    Given un usuario autenticado con sesión válida en el sistema
    When el usuario retrocede o ingresa a la ruta "/auth"
    Then el sistema detecta la sesión activa de inmediato
    And redirige al usuario a "/dashboard" con reemplazo en el historial

  @auto
  Scenario: Cierre de sesión seguro y eliminación de credenciales locales
    Given un director técnico con sesión activa y caché local "dt_last_active_user"
    When el usuario confirma el cierre de sesión
    Then se revoca la sesión y se eliminan las credenciales locales
    And el estado queda completamente limpio para nuevos ingresos
