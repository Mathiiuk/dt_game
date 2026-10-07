# Specification — tooling-eslint

## 1. Objetivo
Tener ESLint corriendo en el proyecto y en el CI, para frenar errores de código antes de que lleguen a master.

## 2. Problema actual
El lint nunca estuvo configurado: no había ESLint instalado ni archivo de configuración, y el gate `lint` del flujo estaba apagado.

## 3. Resultado esperado
- `npm run lint` con configuración plana (`eslint.config.js`): reglas recomendadas, reglas de hooks de React y variables sin uso.
- Cero errores hoy; los 54 avisos existentes (variables sin uso, asignaciones pisadas, dependencias de hooks) quedan como tope (`--max-warnings=54`): no pueden crecer, y se bajan de a poco.
- Paso de lint en los dos flujos del CI.

## 4. Alcance
Incluido: dependencias, configuración, un `catch` vacío corregido, CI.
No incluido: `eslint-plugin-react` (todavía no soporta ESLint 10; los componentes se reconocen por mayúscula) y limpiar los 54 avisos.

## 5. Criterios de aceptación
- [x] AC-01: `npm run lint` termina sin errores.
- [x] AC-02: el CI corre el lint.
- [x] AC-03: `agt task:verify` con `lint` activo pasa.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/tooling-eslint.yml`
