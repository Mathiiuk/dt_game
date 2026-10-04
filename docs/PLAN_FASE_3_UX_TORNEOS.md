# Plan Fase 3: Bugs, Rediseño UI/UX, Google Login y Torneos con Amigos

**Estado:** propuesto (pendiente de aprobación) · **Fecha:** 2026-10-04
**Decisiones del usuario:** multijugador asíncrono compartido · Google vía Supabase Auth · estética oscura editorial deportiva con shadcn/ui · orden: bugs, UI, Google, torneos.
**Método:** una tarea `agt` y una rama por feature/fix; commits semánticos dentro de la rama; cierre con `executions/<id>.md`.

---

## Fase 0 — Bugs reportados (diagnóstico previo)

| # | Reporte | Causa probable (verificada en código) | Solución |
|---|---|---|---|
| B1 | Tras el retiro se puede volver atrás y no se inicia nueva dinastía | `EndgameScreen` es una ruta más; no hay guard. Al estar `is_retired`, `GameContext` no redirige a `/endgame`. | Guard global: si el DT está retirado sin sucesor, toda ruta redirige a `/endgame`; bloquear botón atrás (`replace` + `popstate`); `startNewDynasty` idempotente. |
| B2 | Botón "jugar partido" bloqueado | `Dashboard.jsx:505` exige `nextFixture.match_date <= gameDate`; el calendario usa `SCHEDULED` y el dashboard/seed `PENDING` (estados distintos), y `clubs.game_date` es `varchar` vs `career_calendar."current_date"` `date`. | Unificar fuente de verdad del tiempo (`career_calendar`), enum único de estados de fixture, migración de datos y test. |
| B3 | "Contratos por vencer" al iniciar pretemporada | `dashboard.js:58` marca `contract_years <= 1`; el plantel generado nace con 1 año. | Calcular por fecha: vencer = `contract_end` dentro de 90 días de `game_date`; generar contratos de 1–4 años distribuidos; alerta sólo en ventana relevante. |
| B4 | Error `eventApi.generateRandomEvent` al avanzar semana | `calendar.js:313` llama `eventsApi.generateRandomEvents`, que no existe (existe `generateWeeklyEvents`). | Corregir llamada, envolver en try/catch con log, test de regresión. |
| B5 | Pizarra del once | Rediseño (Fase 2). | Ver Fase 2.4. |

**Entrega:** una rama `fix/f3-bN-...` por bug, pruebas en navegador con la cuenta de prueba.

---

## Fase 1 — Cimientos de calidad (previo al rediseño)

- **Tests reales:** Vitest + Testing Library para `src/api` puros (motor de partidos, calendario, contratos); hoy el único gate es `build`. Agregar `pnpm test` al manifiesto `agt`.
- **Datos:** TanStack Query para cache/SWR (reemplaza `queryCache` casero y elimina los requests duplicados de StrictMode).
- **Formularios:** react-hook-form + zod (creación de DT/club/torneo).
- **Tiempo/estados:** módulo único `src/domain/time.js` y `src/domain/status.js` (enums de fixture, fases).
- **Entorno:** resolver el fallo de caché de SWC en Windows (`SWC_NATIVE_BINDING_CACHE` en un directorio sin permisos de "Authenticated Users") para poder correr `npm run build` en CI local.

---

## Fase 2 — Rediseño UI/UX (anti "vibecode")

**Stack:** shadcn/ui (Radix) · framer-motion (animaciones) · vaul (drawers móviles) · sonner (ya instalado) · @tanstack/react-table (tablas) · recharts (gráficos) · lucide-react (ya instalado) · fuentes Inter + una display deportiva (p. ej. Barlow Condensed) por `@fontsource`.

### 2.1 Sistema de diseño
- Tokens en `index.css` (`@theme` Tailwind 4): color, tipografía, espaciado, radios y elevación; modo oscuro editorial, un solo color de acento, sin gradientes genéricos ni tarjetas anidadas.
- Componentes base en `src/components/ui/`: Button, Card, Badge, Tabs, Sheet/Drawer, Dialog, Table, Stat, EmptyState, Skeleton, Toast.
- Layout: `AppShell` (sidebar en desktop, bottom nav en móvil), `PageHeader`, grillas consistentes; auditoría WCAG AA (contraste, foco, tamaños táctiles 44 px).

### 2.2 Móvil sin modales
- **Regla:** en `<md` toda vista modal pasa a **página completa** con ruta propia (`/squad/contract/:id`, `/club/staff`, `/club/youth`, `/club/press`, `/competition/pyramid`, `/season/close`…); en `>=md` se mantiene como Dialog/Sheet mejor distribuido (2 columnas, secciones con jerarquía).
- Hook `useBreakpoint` + componente `ResponsiveOverlay` (Dialog en desktop, ruta/página en móvil) para no duplicar código.
- Inventario a migrar (20 archivos con `fixed inset-0`): `ContractRenewalModal`, `MentorshipModal`, `PlayerEvolutionModal`, `StaffManagementModal`, `YouthAcademyModal`, `PressRoomModal`, `LeaguePyramidModal`, `SeasonCloseModal`, `JobOfferBottomSheet`, `ReputationHistoryModal`, `InfirmaryTab`, `LockerRoomTab`, `IdolsLegendsTab`, Market, Squad, Dashboard, HallOfFame, ActionSheet.

### 2.3 Pantallas (una skill/rol por sección)
Cada sección se rediseña con su rol de `.agents/skills/`: `product-designer` (flujo y jerarquía) + `frontend-engineer` (componentes) + `mobile-pwa-architect` (móvil) + `tailwind-design-system` (tokens) + `qa-engineer` (BDD/tests). Orden: Dashboard → Plantel → Mercado → Club (pestañas) → Finanzas → Entrenamiento → Calendario/Tabla → Carrera DT → Selección/Copa → Salón/Logros/Epílogo → Auth/Creación.

### 2.4 Pizarra táctica (once titular)
- Cancha SVG 11 vs. vacío, jugadores como fichas posicionadas por coordenadas de formación (`FORMATIONS = { '4-3-3': [{slot,x,y}] }`).
- Al cambiar de formación: **animación con framer-motion** (`layout`/`animate` de x,y con spring) hacia las nuevas posiciones; reasignación automática por afinidad posicional.
- Drag & drop (dnd-kit) para intercambiar titulares/suplentes; banco lateral; en móvil, tap para seleccionar y tap en el hueco.
- Instrucciones de equipo (mentalidad, presión, ancho, estilo de pase, tempo) redistribuidas en tarjetas con controles segmentados y vista previa; panel de afinidad por jugador.

---

## Fase 3 — Inicio de sesión con Google

- **Supabase Auth** + `supabase.auth.signInWithOAuth({ provider: 'google' })`; callback `/auth/callback`; vincular identidad con la cuenta existente por email.
- **Configuración (la hace el usuario en el dashboard):** Google Cloud (redirect URI = `https://<ref>.supabase.co/auth/v1/callback`), luego Supabase > Auth > Providers > Google con Client ID y Secret, y Site URL / Redirect URLs (`http://localhost:5173`, dominio de producción).
- **Seguridad:** el Client Secret **nunca** va al repo ni al front. El secreto compartido en el chat debe **resetearse** en Google Cloud Console antes de cargarlo.
- Flujo posterior: usuario nuevo → `/create-manager`; existente → `/welcome`. Botón Google en `AuthScreen` con estados de carga y errores.

---

## Fase 4 — Torneos con amigos (liga compartida asíncrona)

### 4.1 Modelo de dominio
`tournaments` (owner, nombre, formato, estado, semilla, `join_code`, reglas), `tournament_participants` (usuario, club, rol HUMAN/BOT, estado), `tournament_groups`, `tournament_fixtures`, `tournament_standings`, `tournament_matchdays` (apertura/cierre, plazo), `tournament_invites`.

### 4.2 Configuración total del torneo
Cantidad de equipos y de grupos (ej. 2 grupos de 15), tamaño de grupo, ida y vuelta (o sólo ida), fase final (eliminación directa, playoffs por grupo, final única), puntos por victoria/empate, desempates, relleno con bots y su nivel (reputación/overall), cupos humanos, plazo por fecha (24 h / 48 h / manual) y comportamiento ante ausencia (bot toma el club), presupuesto inicial común, ventana de fichajes, lesiones/cansancio/suspensiones on/off, visibilidad (privado por código/invitación).

### 4.3 Flujo
Crear → configurar → invitar (link/código) → lobby con cupos y confirmación → generar calendario (round-robin con algoritmo del círculo, ida y vuelta) → jugar fechas asíncronas → cierre de fecha (todos jugaron o venció el plazo; bots simulan) → tablas por grupo → fase final → campeón e historial (Salón de la Fama).

### 4.4 Backend (autoritativo, resuelve G-02)
- Operaciones del torneo como **RPC `SECURITY DEFINER`** / Edge Functions (crear, unirse, generar calendario, cerrar fecha, simular): el cliente no escribe resultados.
- RLS **real** por pertenencia al torneo (`is_tournament_member(tournament_id)`), sin `USING (true)`.
- Cierre de fecha por **pg_cron** o Edge Function programada; Supabase Realtime para lobby y tabla en vivo.
- Idempotencia y concurrencia (Reglas 2.1 #8, #13): claves de operación, `SELECT ... FOR UPDATE` al cerrar fecha.

### 4.5 Pantallas
Listado/creación (wizard por pasos), lobby, tablero de grupos, fixture por fecha, tabla, bracket, estado de la fecha ("faltan 3 DT"), resumen del torneo.

---

## Fase 5 — Seguridad y endurecimiento (transversal, comienza en la Fase 4)

- Migrar las reglas críticas (dinero, XP, resultados) del cliente a RPC; cerrar RLS tabla por tabla empezando por las nuevas.
- Activar protección contra contraseñas filtradas; rotar credenciales; rate limiting en Auth.
- Observabilidad: tabla de eventos de auditoría ya existente + métricas de RPC.

---

## Cronograma y entregables

| Fase | Contenido | Ramas (ejemplo) | Estimación |
|---|---|---|---|
| 0 | B1–B4 | `fix/f3-b1-retiro-guard` … | 1–2 días |
| 1 | Tests, TanStack Query, domain/time | `feat/f3-foundations` | 2 días |
| 2 | Sistema de diseño, modales→páginas, pizarra, pantallas | `feat/f3-design-system`, `feat/f3-mobile-pages`, `feat/f3-tactics-pitch`, `feat/f3-redesign-*` | 2–3 semanas |
| 3 | Google login | `feat/f3-google-auth` | 0.5 día + configuración manual |
| 4 | Torneos | `feat/f3-tournaments-*` (modelo, RPC, lobby, fixture, UI) | 2–3 semanas |
| 5 | Endurecimiento | `fix/f3-rls-*` | continuo |

## Riesgos
- La arquitectura actual escribe desde el cliente; los torneos exigen mover lógica al backend o habrá trampas entre amigos.
- El rediseño toca ~25 pantallas: hacerlo por secciones, con capturas antes/después y sin cambiar lógica.
- `npm run build` no corre en este entorno (SWC/ACL): arreglar en Fase 1 para tener gate real.
- La rama `fix/f2-frontend-request-dedup` aún no está mergeada a `master`.
