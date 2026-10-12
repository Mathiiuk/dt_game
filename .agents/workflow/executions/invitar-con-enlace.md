# Invitar a la liga de amigos con un enlace

- **Enlace:** `https://www.vestuario.com.ar/friends?codigo=CODIGO&utm_source=invite&utm_medium=room`. Sin ruta nueva ni cambios de servidor (`/friends` ya es del juego).
- **Dominio** (`src/domain/roomInvite.js`): `normalizeCode`, `inviteUrl`, `inviteText`, `codeFromSearch`. **Memoria** (`src/lib/inviteStore.js`): guarda el código al llegar para que sobreviva al registro y a crear el club.
- `GameApp` guarda el código antes de cualquier redirección; `FriendsScreen` lo trae cargado con un aviso y botón "Entrar a la sala"; una vez dentro, botón **Invitar a mis amigos** (menú de compartir del celular o copia el mensaje armado); el código se limpia al entrar.
- `AppShell`: aviso "Te invitaron a una sala de amigos" para quien se registró con el enlace y aún no entró.
- Tests: `tests/domain/roomInvite.test.js` (7), dos casos nuevos en `friendsScreen.test.jsx`.
- Sin cambios de base de datos.
