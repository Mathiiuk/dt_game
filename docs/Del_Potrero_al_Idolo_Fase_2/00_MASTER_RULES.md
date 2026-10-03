# DEL POTRERO AL ÍDOLO — FASE 2
# MASTER RULES 2.0

## Propósito
Esta fase profundiza las 40 fases funcionales originales. No agrega una dirección diferente al juego: convierte el concepto en una especificación de diseño mucho más precisa para una futura implementación.

## Principios
1. El usuario es el DT, no un jugador controlable.
2. Cada decisión debe producir consecuencias comprensibles.
3. El azar existe, pero nunca debe sustituir las reglas.
4. Los sistemas deben interactuar entre sí.
5. El mundo debe conservar historial.
6. Los valores de balance deben ser configurables.
7. El backend es la autoridad sobre reglas, economía, progreso y simulación.
8. El frontend nunca puede otorgar XP, dinero, atributos o resultados.
9. Toda acción importante debe poder auditarse.
10. La complejidad se desbloquea progresivamente.

## Modelo conceptual
Usuario → Carrera → DT → Club → Plantel → Temporada → Competición → Partido → Consecuencias → Progresión.

## Escalas recomendadas
- Atributos: 1–100.
- Reputación: 0–100.
- Moral: 0–100.
- Fitness: 0–100.
- Forma: 0–100.
- Cohesión: 0–100.
- Confianza directiva: 0–100.
- XP: entero positivo.
- Dinero: decimal de precisión suficiente para moneda del juego.

## Diseño de sistemas
Cada sistema profundizado debe documentar:
- Objetivo.
- UX.
- Pantallas.
- Datos.
- Estados.
- Reglas.
- Fórmulas o parámetros.
- Dependencias.
- Eventos.
- Casos extremos.
- Validaciones.
- Persistencia.
- Criterios de aceptación.

## Balance
No fijar valores irreversibles en código. Todas las tasas relevantes deben poder parametrizarse:
- XP.
- salarios.
- inflación.
- probabilidades.
- lesiones.
- crecimiento.
- depreciación.
- valoración.
- premios.
- asistencia.
- impacto de reputación.

## Mundo vivo
Los clubes no controlados por el usuario también deben:
- comprar;
- vender;
- renovar;
- despedir DT;
- contratar staff;
- desarrollar juveniles;
- ascender;
- descender;
- disputar competiciones.

## Regla de oro
El juego debe producir historias a partir de sistemas, no depender exclusivamente de textos guionados.


## 10. REGLA OPERATIVA DE GIT Y CI/CD (AUTO-MERGE)
El entorno de GitHub del proyecto cuenta con un CI/CD automatizado que hace merge de las ramas a master automa�ticamente. Por ende, la IA debe seguir estrictamente este flujo:
1. Antes de iniciar un modulo: \git checkout master\ y \git pull\.
2. Crear la rama \eature/fase-xyz\.
3. Implementar, probar (build/lint) y hacer commit.
4. Hacer \git push origin feature/fase-xyz\.
5. NO realizar \git merge\ manual a master. GitHub lo hace solo.
6. Pasar de inmediato a la siguiente rama volviendo al paso 1.
