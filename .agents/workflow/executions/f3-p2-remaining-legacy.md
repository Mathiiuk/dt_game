# Ejecución: f3-p2-remaining-legacy

- Se retiró `BottomNav` (AppShell lo reemplaza; EndgameScreen era el último consumidor).
- EndgameScreen, MatchScreen, PostMatchScreen, ReloadPrompt y RequireCareer migrados a tokens de diseño (`scripts/restyle-tokens.cjs`) y `min-h-dvh`. Sin cambios de lógica ni de estructura.
- Pendiente (no es de Fase 2): comprobar visualmente Partido/Post-partido/Epílogo con un partido real, porque requieren estado de juego.
