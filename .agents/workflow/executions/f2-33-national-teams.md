# Reporte de Ejecución: f2-33-national-teams

- **ID de Tarea**: `f2-33-national-teams`
- **Título**: Fase 33: Selecciones Nacionales y Doble Carrera
- **Tipo**: `feat`
- **Rama**: `feat/f2-33-national-teams-fase-33-selecciones-nacionales-y-doble-carrera`
- **Estado**: `DONE`
- **Quality Gates**: `[PASS] build -> npm run build` (100% verde)

---

## 1. Resumen de Implementación
Se implementó de forma completa y atómica la **Fase 33 (Selecciones Nacionales y Doble Carrera)** de la documentación oficial `Del_Potrero_al_Idolo_Fase_2`:

1. **Base de Datos (Supabase / PostgreSQL)**:
   - Migración en `scripts/db/update_db_national_teams.cjs`.
   - Creada tabla `national_teams` (nombre, categoría: `u20`, `u23`, `senior`, reputación, colores, récord de victorias, empates y derrotas).
   - Creada tabla `national_team_callups` para la lista de 23 futbolistas convocados, titularidad, presencias internacionales (caps) y goles.
   - Creada tabla `national_fixtures` para los encuentros de Fecha FIFA / Torneos Internacionales.
   - Verificada la columna `national_team_id` en `managers` para permitir la doble carrera simultánea (Club + Selección).

2. **Servicio de Backend / Lógica de Negocio (`src/api/nationalTeam.js`)**:
   - `getCurrentNationalTeam(managerId)`: Detecta si el DT está al mando de un combinado nacional.
   - `getAvailableOffers(managerId)`: Retorna ofertas de selecciones (Sub-20 con rep >= 25, Sub-23 con rep >= 45, Selección Mayor con rep >= 65).
   - `acceptOffer(managerId, nationalTeamId)`: Vincula al DT con la selección, siembra la nómina inicial de convocados y fixtures FIFA.
   - `resign(managerId, nationalTeamId)`: Renuncia voluntaria a la selección que preserva íntegramente la continuidad y contrato en el club del usuario.
   - `playMatch(...)`: Simulación de partidos de Fecha FIFA, actualiza el palmarés histórico del país, otorga XP internacional (+120 XP por triunfo) y reputación al DT, e incrementa los caps de los futbolistas.

3. **Interfaz de Usuario Mobile-First (`src/features/manager/NationalTeamScreen.jsx`)**:
   - Vista de Bolsa de Ofertas cuando el DT no tiene selección asignada.
   - Vista de Dirección Técnica Nacional con dos pestañas:
     - **Nómina Convocada**: Tarjetas de los futbolistas convocados con club de origen, posición, caps y goles internacionales.
     - **Partidos Fecha FIFA**: Calendario de compromisos internacionales con botón interactivo para disputar los encuentros.
   - Botón para renunciar voluntariamente en cualquier momento.
   - Integración con ruta `/national-team` en `App.jsx` y tarjeta destacada de acceso en `ManagerCareerScreen.jsx`.

---

## 2. Quality Gates y Verificación
- Manifiesto: `.agents/workflow/tasks/f2-33-national-teams.yml`
- Comando: `agt task:verify f2-33-national-teams`
- Resultado:
  ```
  Verificando tarea: f2-33-national-teams
  Estructura de manifiesto YAML válida.
  Ejecutando gates activos...
    [PASS] build -> npm run build
  Todos los Quality Gates pasaron para f2-33-national-teams.
  ```
