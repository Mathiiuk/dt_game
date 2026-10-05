# Ejecución: fix-dashboard-stale-fixture
Inicio seguía mostrando el partido jugado: la caché del dashboard (`dashboard:overview:<club>`) sólo se refrescaba cuando cambiaba la fecha, la caja o la XP, y jugar un partido no cambia ninguna. Ahora `postMatchApi.processResult` descarta toda la caché cuando termina de consolidar el partido. 2 tests (caché descartada, un solo procesamiento por partido).
