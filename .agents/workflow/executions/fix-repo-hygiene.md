# Ejecución: fix-repo-hygiene
- `docs/localhost.har` (18 MB, captura de red) se quita del repo; se revisó antes: sin tokens ni credenciales.
- `.gitignore` ahora excluye `*.har`, `docs/client_secret*.json`, `docs/recaptcha*.md`, `docs/resend*.md` y `.claude/` para que no se cuelen con un `git add`.
- Recordatorio: el secreto de Google pegado en el chat hay que resetearlo en Google Cloud antes de la Fase 3.
