const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:d1fkM5K6yjB8Ol@db.qozozdaavjfxvssvxqbx.supabase.co:5432/postgres' });

async function deepAudit() {
  await client.connect();

  console.log('=== AUDITORÍA PROFUNDA DE CALIDAD DE DATOS (DATA INTEGRITY) ===\n');

  // 1. Fixtures duplicados
  const dupFixtures = await client.query(`
    SELECT competition_id, match_week, home_team_id, away_team_id, COUNT(*)
    FROM fixtures
    GROUP BY competition_id, match_week, home_team_id, away_team_id
    HAVING COUNT(*) > 1;
  `);
  console.log(`1. Fixtures duplicados (misma fecha, local y visitante): ${dupFixtures.rows.length}`);
  if (dupFixtures.rows.length > 0) {
    console.log('   Detalle primeros 3:', dupFixtures.rows.slice(0, 3));
  }

  // 2. Clubes con datos faltantes o inválidos
  const badClubs = await client.query(`
    SELECT id, name, stadium_name, stadium_capacity, city, country, reputation
    FROM clubs
    WHERE stadium_capacity <= 0 OR stadium_name IS NULL OR reputation < 0 OR city IS NULL;
  `);
  console.log(`2. Clubes con capacidad de estadio <= 0 o datos nulos: ${badClubs.rows.length}`);

  // 3. Jugadores con datos faltantes o inconsistentes
  const badPlayers = await client.query(`
    SELECT COUNT(*) FROM players
    WHERE position IS NULL OR age < 14 OR age > 45 OR contract_salary < 0;
  `);
  console.log(`3. Jugadores con edad anómala (<14 o >45), posición nula o salario negativo: ${badPlayers.rows[0].count}`);

  // 4. Standings con números negativos
  const badStandings = await client.query(`
    SELECT COUNT(*) FROM standings
    WHERE played < 0 OR won < 0 OR drawn < 0 OR lost < 0 OR points < 0;
  `);
  console.log(`4. Standings con estadísticas negativas: ${badStandings.rows[0].count}`);

  // 5. Standings con partidos jugados != (won + drawn + lost)
  const inconsistentStandings = await client.query(`
    SELECT COUNT(*) FROM standings
    WHERE played != (won + drawn + lost);
  `);
  console.log(`5. Standings con played != (won + drawn + lost): ${inconsistentStandings.rows[0].count}`);

  // 6. Tácticas sin formacion o con valores nulos
  const badTactics = await client.query(`
    SELECT COUNT(*) FROM tactics
    WHERE formation IS NULL OR mentality IS NULL OR pressure IS NULL;
  `);
  console.log(`6. Tácticas con configuración nula o incompleta: ${badTactics.rows[0].count}`);

  // 7. Managers con datos anómalos
  const badManagers = await client.query(`
    SELECT id, first_name, last_name, level, xp, reputation
    FROM managers
    WHERE level < 1 OR xp < 0 OR reputation < 0;
  `);
  console.log(`7. Managers con nivel < 1, xp < 0 o reputación < 0: ${badManagers.rows.length}`);

  // 8. Clubs sin táctica asignada
  const clubsWithoutTactic = await client.query(`
    SELECT c.id, c.name 
    FROM clubs c
    LEFT JOIN tactics t ON c.id = t.club_id
    WHERE t.id IS NULL AND c.manager_id IS NOT NULL;
  `);
  console.log(`8. Clubes activos (con DT humano) sin registro en tactics: ${clubsWithoutTactic.rows.length}`);

  // 9. Clubs sin registro en standings
  const clubsWithoutStandings = await client.query(`
    SELECT c.id, c.name 
    FROM clubs c
    LEFT JOIN standings s ON c.id = s.club_id
    WHERE s.id IS NULL AND c.manager_id IS NOT NULL;
  `);
  console.log(`9. Clubes activos (con DT humano) sin registro en standings: ${clubsWithoutStandings.rows.length}`);

  // 10. Check nulls en columnas críticas de players
  const playerNulls = await client.query(`
    SELECT 
      COUNT(*) FILTER (WHERE attr_pace IS NULL) as null_pace,
      COUNT(*) FILTER (WHERE attr_finishing IS NULL) as null_finishing,
      COUNT(*) FILTER (WHERE state_fitness IS NULL) as null_fitness,
      COUNT(*) FILTER (WHERE state_morale IS NULL) as null_morale
    FROM players;
  `);
  console.log('10. Nulos en atributos críticos de players:', playerNulls.rows[0]);

  await client.end();
}

deepAudit().catch(console.error);
