# FASE 6 — DASHBOARD
# PROFUNDIZACIÓN 2.0

## 1. Objetivo
Definir el centro operativo del juego, prioridades, alertas, próximos eventos, partido, plantel y estado financiero.

## 2. Principio de diseño
Este sistema debe ser útil para tomar decisiones como DT y debe conectarse con los demás sistemas. No debe funcionar como una pantalla aislada.

## 3. Experiencia del usuario
El flujo recomendado es:
1. El sistema presenta el estado actual.
2. El usuario identifica una decisión pendiente.
3. El sistema explica información relevante.
4. El usuario toma una decisión.
5. El backend valida.
6. Se aplican consecuencias.
7. Se registra el resultado.
8. El dashboard refleja el nuevo estado.

## 4. Datos mínimos
Toda implementación debe identificar:
- ID estable.
- Propietario/contexto.
- Estado.
- Fecha de creación.
- Fecha de actualización.
- Historial cuando corresponda.
- Fuente de la modificación cuando sea relevante.

## 5. Estados
Definir estados explícitos en backend. Evitar depender de booleanos ambiguos cuando existan más de dos estados.

## 6. Reglas de negocio
- Las reglas críticas se ejecutan en backend.
- Las operaciones deben ser atómicas cuando modifiquen varios recursos.
- No permitir estados imposibles.
- Toda modificación debe respetar permisos y contexto de carrera.

## 7. Parámetros de balance
Separar configuración de código:
- límites;
- costes;
- probabilidades;
- multiplicadores;
- tiempos;
- recompensas;
- penalizaciones.

Los parámetros deben poder ajustarse sin modificar el dominio principal.

## 8. Integraciones
Este sistema debe contemplar interacción con:
- DT.
- Club.
- Jugadores.
- Calendario.
- Temporada.
- Competición.
- Economía.
- Reputación.
- Eventos.
- Historial.

No todas las integraciones aplican al MVP; deben dejarse preparadas.

## 9. Eventos
Cada evento importante debe poder producir:
- notificación;
- cambio de estado;
- consecuencia;
- entrada de historial.

## 10. Casos normales
Documentar al menos:
- operación exitosa;
- operación repetida;
- operación con recursos suficientes;
- operación con recursos insuficientes.

## 11. Casos extremos
Contemplar:
- datos faltantes;
- jugador lesionado;
- contrato vencido;
- dinero insuficiente;
- temporada terminada;
- partido ya procesado;
- usuario intentando repetir una acción;
- conflicto simultáneo de cambios.

## 12. Persistencia
Nunca depender exclusivamente del estado de frontend. El servidor debe poder reconstruir el estado actual desde persistencia.

## 13. Auditoría
Registrar acciones relevantes:
- quién;
- qué;
- cuándo;
- entidad afectada;
- estado anterior;
- estado posterior;
- motivo cuando corresponda.

## 14. UX
La interfaz debe:
- priorizar la acción principal;
- evitar sobrecarga de información;
- mostrar consecuencias antes de decisiones irreversibles;
- usar lenguaje futbolístico claro;
- evitar pantallas vacías;
- informar estados de carga/error;
- ser usable en desktop y móvil.

## 15. IA / comportamiento automático
Cuando este sistema implique clubes, jugadores o staff controlados por IA:
- definir objetivos;
- restricciones;
- información disponible;
- tolerancia al riesgo;
- presupuesto;
- personalidad;
- resultado esperado.

La IA nunca debe acceder a información que el usuario no tendría si esa información representa conocimiento oculto del juego.

## 16. Métricas
Definir métricas observables para balance:
- frecuencia;
- coste;
- beneficio;
- tasa de éxito;
- impacto en satisfacción;
- impacto deportivo;
- impacto económico.

## 17. Criterios de aceptación
El sistema está terminado cuando:
- funciona en flujo normal;
- persiste correctamente;
- valida reglas;
- maneja errores;
- integra sus consecuencias;
- tiene datos de prueba;
- puede reiniciarse/repetirse sin duplicar recursos;
- no permite exploits obvios.

## 18. Tests
Crear tests para:
1. caso exitoso;
2. límites mínimos;
3. límites máximos;
4. recursos insuficientes;
5. operación duplicada;
6. transición de estado;
7. persistencia;
8. integración.

## 19. Reglas específicas de esta fase

### DASHBOARD
La implementación debe profundizar específicamente en:

- Modelo funcional del sistema.
- Datos y relaciones.
- Reglas de negocio.
- Dependencias con otros sistemas.
- UX y flujo.
- Estados.
- Consecuencias.
- Balance.
- Casos extremos.
- Criterios de aceptación.

### Preguntas que deben quedar resueltas
- ¿Qué puede hacer exactamente el jugador?
- ¿Qué decide automáticamente el juego?
- ¿Qué información conoce el jugador?
- ¿Qué información permanece oculta?
- ¿Qué recursos consume la acción?
- ¿Qué consecuencias genera?
- ¿Qué ocurre si la acción falla?
- ¿Cómo se registra?
- ¿Cómo afecta a temporadas futuras?
- ¿Cómo interactúa con el resto del juego?

## 20. No implementar todavía
No convertir esta especificación en código automáticamente. La Fase 2 define comportamiento y contratos funcionales. La arquitectura técnica detallada, endpoints concretos y esquema físico de base de datos deben consolidarse posteriormente para evitar inconsistencias entre fases.
