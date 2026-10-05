# Ejecución: f3-p2-auth-wizards

- AuthScreen reescrita con el sistema de diseño (Field/Input/Button): bienvenida editorial, login, registro con requisitos de contraseña dichos para lectores de pantalla, error de confirmación junto al campo, botón mostrar/ocultar con nombre accesible, bloqueo por intentos con `role=alert`, recuperación de contraseña.
- WelcomeScreen y asistentes de creación de DT y de club: migración de paleta a tokens (`scripts/restyle-tokens.cjs`) y vinculación de cada etiqueta con su control (`scripts/link-labels.cjs`); `min-h-dvh` para móvil. No se reescribió su estructura interna (pasos) — queda como mejora futura si se desea un rediseño completo.
- Verificado a 375 px sin desborde. 5 tests nuevos de AuthScreen.
