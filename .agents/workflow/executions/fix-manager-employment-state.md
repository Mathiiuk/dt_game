# Ejecución: fix-manager-employment-state
No se pudo reproducir con datos sanos (la cuenta actual figura EMPLOYED); la causa más probable es un `employment_status` desfasado en el DT (quedó UNEMPLOYED y nadie lo corrigió al fundar un club). Se cierra por tres lados:
1. `createClub` marca al DT `EMPLOYED` junto con `club_id`.
2. `GameContext` corrige en silencio el estado si el DT dirige un club.
3. `/manager` decide con el club real (`!!club && !manager.is_retired`), no con el estado guardado.
Test: con `employmentStatus: UNEMPLOYED` y club presente no aparece "Actualmente desempleado".
