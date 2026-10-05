# Ejecución: f3-p2-creation-wizards

- Nuevo `Wizard` / `Stepper` / `OptionCards` en `src/components/ui/wizard.jsx`: pasos con `aria-current="step"`, navegación fija al borde inferior en móvil, tarjetas excluyentes como `radiogroup` con flechas.
- Dominios `managerBuild.js` (reparto de puntos, tope inicial, filosofías y especializaciones) y `clubIdentity.js` (paletas, escudos, validación 3-40 caracteres, estadio que sigue al nombre).
- CreateManagerWizard y CreateClubWizard reescritos sobre esos bloques: errores junto al campo (ya no sólo toasts), cifras del acta tomadas de `TIER_5_STARTING_CONFIG` (antes estaban escritas a mano), camiseta con `role=img`.
- Verificado a 375 px los pasos 1-3 del DT. Se dejó sin firmar la credencial para que la carrera la cree el usuario.
- 10 tests nuevos (190 en total).
