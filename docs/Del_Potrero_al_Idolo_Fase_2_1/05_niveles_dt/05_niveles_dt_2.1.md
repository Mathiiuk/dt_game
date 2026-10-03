# FASE 5 — NIVELES DEL DT
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Profundizar funcionalmente **NIVELES DEL DT** hasta eliminar ambigüedades antes de arquitectura y código.

## 2. Alcance específico
XP, niveles, habilidades, costes y desbloqueos

## 3. Entidades
Definir como mínimo:
- entidad principal;
- contexto/carrera;
- estado actual;
- configuración;
- evento;
- historial;
- snapshot cuando corresponda.

Cada entidad debe tener identidad estable, contexto, ciclo de vida y reglas de persistencia.

## 4. Máquina de estados
Toda transición debe seguir:

`estado_actual + comando + contexto -> estado_nuevo + eventos + consecuencias`

Para cada transición documentar:
1. actor autorizado;
2. precondiciones;
3. recursos;
4. validaciones;
5. cambios;
6. eventos;
7. idempotencia;
8. reversibilidad;
9. errores.

## 5. Flujo funcional
1. Leer estado autoritativo.
2. Mostrar únicamente información legítimamente disponible.
3. Presentar decisión.
4. Validar nuevamente en backend.
5. Ejecutar operación atómica.
6. Emitir eventos.
7. Actualizar proyecciones.
8. Registrar auditoría.
9. Mostrar consecuencias.

## 6. Reglas específicas
Para cada componente del alcance:
- definir modelo;
- definir estados;
- definir límites;
- definir validaciones;
- definir consecuencias;
- definir dependencia con otras fases;
- definir tests normales y de borde.

## 7. Balance
Separar configuración de código.

Usar modelos parametrizables como:
- `resultado = base × modificadores`
- `probabilidad = clamp(base + ajustes, mínimo, máximo)`
- `coste = base + variables_contextuales`
- `impacto = magnitud × relevancia × contexto`

Registrar versión de reglas y balance en resultados históricos.

## 8. Información
**Visible:** información que el DT puede conocer.
**Parcial:** estimaciones, scouting o intenciones con incertidumbre.
**Oculta:** seeds, pesos internos, información futura y conocimiento privado de IA.

El cliente nunca debe recibir información oculta.

## 9. IA
La IA debe decidir mediante:
`objetivo -> candidatos -> restricciones -> evaluación -> decisión`

No puede consultar conocimiento oculto que el actor no tendría.

## 10. Eventos y auditoría
Registrar:
- event_id;
- career_id;
- timestamp;
- actor_id;
- entity_type/entity_id;
- event_type;
- estado anterior/posterior;
- motivo;
- ruleset_version;
- balance_version.

## 11. Idempotencia
Evitar duplicación por:
- doble clic;
- retry;
- timeout;
- refresh;
- dos pestañas;
- worker repetido.

## 12. Concurrencia
Contemplar versiones obsoletas, acciones simultáneas, temporada cerrada, carrera pausada y workers concurrentes.

## 13. Persistencia
Separar:
1. estado actual;
2. historial;
3. snapshots;
4. configuración.

No mutar silenciosamente hechos históricos.

## 14. UX
La interfaz debe responder:
**¿Dónde estoy? → ¿Qué puedo hacer? → ¿Qué cuesta? → ¿Qué puede pasar? → ¿Qué ocurrió?**

Antes de acciones irreversibles mostrar coste, beneficios, riesgos e impacto.

## 15. Casos extremos
Probar recursos insuficientes, operación duplicada, fecha vencida, entidad inactiva, sesión expirada, carrera pausada, temporada terminada, conflicto concurrente, IA sin candidatos y cambio de balance.

## 16. Anti-exploits
Bloquear duplicación, manipulación del reloj cliente, IDs manipulados, atributos enviados desde frontend, recompensas repetidas y acciones fuera de ventana.

## 17. Observabilidad
Medir frecuencia, errores, rechazos, duración, impacto económico/deportivo, eventos y exploits.

## 18. Tests
- unitarios;
- integración;
- persistencia;
- seguridad;
- simulación reproducible;
- balance estadístico.

## 19. Criterios de aceptación
- [ ] Estados definidos.
- [ ] Transiciones definidas.
- [ ] Reglas cerradas.
- [ ] Información visible/oculta definida.
- [ ] IA delimitada.
- [ ] Eventos y auditoría definidos.
- [ ] Idempotencia definida.
- [ ] Concurrencia contemplada.
- [ ] Balance parametrizable.
- [ ] Casos extremos.
- [ ] Anti-exploits.
- [ ] Tests.
- [ ] Contrato con Fase 3.

## 20. Contrato hacia Fase 3
Convertir esta especificación en módulos de dominio, entidades, repositorios, servicios, comandos, queries, eventos, APIs, workers, autorización, observabilidad, seeds, fixtures y tests.

**Fase 3 no debe inventar reglas que contradigan esta especificación.**
