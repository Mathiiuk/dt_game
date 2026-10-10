# Liga de amigos (etapa 1: sala, tabla, muro y travesuras)

- Roles: director-tecnico (alcance), backend-engineer (SQL/RLS), frontend-engineer + product-designer (pantalla), qa-engineer (TDD), security-guardian (aislamiento entre cuentas).
- Diseño: cada cuenta sigue siendo un mundo aislado. La sala solo comparte nombre del club, puntos de la liga y el muro. Máximo 10 DT por sala. Nada se escribe desde el navegador: las tres tablas (`friend_rooms`, `friend_members`, `friend_wall`) solo tienen política de lectura para miembros y todo lo demás pasa por funciones `security definer` que validan que el club sea de quien llama.
- Puntos de la sala = puntos de la liga del club (en vivo) + bono de travesuras. Mangos = 30 + 2 por partido jugado − gastados.
- Travesuras (en el servidor, con azar): El Sobre, Árbitro amigo, El Mote (lista cerrada, sin texto libre), La Denuncia (solo al líder). Tope 3 por día. Solo mueven puntos de la sala y el muro.
- Migración `scripts/db/migration_friend_rooms.sql` aplicada en producción y probada con una transacción revertida con dos usuarios: crear, entrar con código en minúsculas y guiones, club ajeno rechazado, mote fuera de lista rechazado, falta de mangos, travesura contra uno mismo.
- App: `friendsApi`, `src/domain/friendRoom.js`, pantalla `/friends` (lazy) y entrada en el menú (Competición).
- Gates: eslint, tests y BDD en verde.
- Pendiente (etapas siguientes): Mundialito entre clubes de la sala, puntos acumulados entre temporadas, más travesuras.
