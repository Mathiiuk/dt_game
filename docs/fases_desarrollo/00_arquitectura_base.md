# FASE 0 — ARQUITECTURA BASE

## Objetivo
Definir la arquitectura técnica y el modelo de dominio antes de implementar gameplay.

## Reglas
- Arquitectura modular.
- Persistencia transaccional.
- Separar autenticación, dominio, simulación y presentación.
- Toda acción relevante debe quedar registrada.
- El motor de partidos debe poder evolucionar sin romper el resto.
- La simulación debe ser determinista cuando se proporcione una semilla.

## Entidades iniciales
- User
- Manager
- Club
- Player
- Season
- Competition
- Match
- Squad
- Tactic
- TrainingSession
- Contract
- FinanceTransaction

## Requisitos de persistencia
Guardar:
- Identidad del usuario.
- Carrera del DT.
- Club actual.
- Plantel.
- Contratos.
- Presupuesto.
- Calendario.
- Resultados.
- Tabla.
- Historial.

## Estados globales
`ACCOUNT_CREATED`, `CAREER_SETUP`, `ACTIVE_SEASON`, `MATCHDAY`, `POST_MATCH`, `SEASON_END`, `RETIRED`.

## Requisito
Ninguna pantalla debe depender de datos hardcodeados una vez conectada a la API.
