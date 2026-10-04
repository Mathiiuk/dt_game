const { Client } = require('pg');

const connectionString = (process.env.DATABASE_URL || (() => { throw new Error('Falta DATABASE_URL. Ejecutar: node --env-file=.env.local <script>') })());

async function cleanRunawayCompetitions() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log('=== SANEANDO COMPETICIONES DUPLICADAS Y CLUBES BOT EN LA BD ===\n');

  try {
    // 1. Elegir UNA única competición para el club activo '1bd3d9d8-be1e-450e-bfc1-f98e60a7cd3a'
    const targetCompRes = await client.query(`
      SELECT competition_id 
      FROM standings 
      WHERE club_id = '1bd3d9d8-be1e-450e-bfc1-f98e60a7cd3a'
      ORDER BY created_at ASC
      LIMIT 1
    `);

    if (targetCompRes.rows.length === 0) {
      console.log('No se encontró competición para el club.');
      return;
    }

    const keeperCompId = targetCompRes.rows[0].competition_id;
    console.log(`Competición principal a conservar: ${keeperCompId}`);

    // Identificar competiciones a eliminar
    const compsToDeleteRes = await client.query(`
      SELECT id FROM competitions WHERE id != $1
    `, [keeperCompId]);

    const compIdsToDelete = compsToDeleteRes.rows.map(r => r.id);
    console.log(`Competiciones duplicadas a eliminar: ${compIdsToDelete.length}`);

    if (compIdsToDelete.length > 0) {
      // 2. Identificar clubes bot que pertenecen a las competiciones duplicadas y no a la principal ni son de usuarios
      const clubsToDeleteRes = await client.query(`
        SELECT id FROM clubs 
        WHERE manager_id IS NULL 
          AND id NOT IN (
            SELECT club_id FROM standings WHERE competition_id = $1
          )
      `, [keeperCompId]);

      const clubIdsToDelete = clubsToDeleteRes.rows.map(r => r.id);
      console.log(`Clubes bot duplicados a eliminar: ${clubIdsToDelete.length}`);

      // 3. Eliminar dependencias
      // a) Fixtures de competiciones duplicadas
      const delFixtures = await client.query(`
        DELETE FROM fixtures WHERE competition_id != $1
      `, [keeperCompId]);
      console.log(`  [OK] Eliminados ${delFixtures.rowCount} fixtures duplicados.`);

      // b) Standings de competiciones duplicadas
      const delStandings = await client.query(`
        DELETE FROM standings WHERE competition_id != $1
      `, [keeperCompId]);
      console.log(`  [OK] Eliminadas ${delStandings.rowCount} filas de standings duplicadas.`);

      // c) Jugadores de clubes bot eliminados
      if (clubIdsToDelete.length > 0) {
        // Eliminar scout_reports de jugadores bot
        await client.query(`
          DELETE FROM scout_reports WHERE player_id IN (
            SELECT id FROM players WHERE club_id = ANY($1::uuid[])
          )
        `, [clubIdsToDelete]);

        // Eliminar offers de jugadores bot
        await client.query(`
          DELETE FROM offers WHERE player_id IN (
            SELECT id FROM players WHERE club_id = ANY($1::uuid[])
          )
        `, [clubIdsToDelete]);

        const delPlayers = await client.query(`
          DELETE FROM players WHERE club_id = ANY($1::uuid[])
        `, [clubIdsToDelete]);
        console.log(`  [OK] Eliminados ${delPlayers.rowCount} jugadores de bots duplicados.`);

        // d) Clubes bot eliminados
        const delClubs = await client.query(`
          DELETE FROM clubs WHERE id = ANY($1::uuid[])
        `, [clubIdsToDelete]);
        console.log(`  [OK] Eliminados ${delClubs.rowCount} clubes bot.`);
      }

      // e) Competiciones duplicadas eliminadas
      const delComps = await client.query(`
        DELETE FROM competitions WHERE id != $1
      `, [keeperCompId]);
      console.log(`  [OK] Eliminadas ${delComps.rowCount} competiciones duplicadas.`);
    }

    // 4. Agregar restricción de unicidad para evitar duplicación futura
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_standings_club_competition ON standings (club_id, competition_id);
    `);
    console.log('  [OK] Creado índice único uq_standings_club_competition.');

    // 5. Verificar estado final
    const finalComps = await client.query('SELECT count(*) FROM competitions');
    const finalClubs = await client.query('SELECT count(*) FROM clubs');
    const finalStandings = await client.query('SELECT count(*) FROM standings');
    const finalFixtures = await client.query('SELECT count(*) FROM fixtures');

    console.log('\n--- ESTADO FINAL DE LA BD ---');
    console.log(`Competiciones: ${finalComps.rows[0].count}`);
    console.log(`Clubes: ${finalClubs.rows[0].count}`);
    console.log(`Standings: ${finalStandings.rows[0].count}`);
    console.log(`Fixtures: ${finalFixtures.rows[0].count}`);

  } catch (err) {
    console.error('Error durante el saneamiento:', err);
  } finally {
    await client.end();
  }
}

cleanRunawayCompetitions();
