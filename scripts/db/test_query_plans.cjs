const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:d1fkM5K6yjB8Ol@db.qozozdaavjfxvssvxqbx.supabase.co:5432/postgres' });

async function testPlans() {
  await client.connect();

  console.log('=== TEST DE TIEMPOS DE RESPUESTA Y EXPLAIN ANALYZE (ANTES DE OPTIMIZAR) ===\n');

  // 1. Obtener club del manager
  const clubRes = await client.query("SELECT id FROM clubs WHERE manager_id IS NOT NULL LIMIT 1");
  const clubId = clubRes.rows[0]?.id;
  console.log(`Club de prueba: ${clubId}`);

  // Query 1: Obtener plantilla del club (getSquad)
  console.log('\n--- 1. EXPLAIN ANALYZE: SELECT * FROM players WHERE club_id = $1 ---');
  const t1Start = Date.now();
  const q1 = await client.query(`EXPLAIN ANALYZE SELECT * FROM players WHERE club_id = '${clubId}'`);
  console.log(q1.rows.map(r => r['QUERY PLAN']).join('\n'));
  console.log(`Tiempo cliente: ${Date.now() - t1Start} ms`);

  // Query 2: Obtener próximo partido pendiente en fixtures (dashboard)
  console.log('\n--- 2. EXPLAIN ANALYZE: Fixture pendiente en dashboard (15,200 filas) ---');
  const t2Start = Date.now();
  const q2 = await client.query(`
    EXPLAIN ANALYZE 
    SELECT * FROM fixtures 
    WHERE (home_team_id = '${clubId}' OR away_team_id = '${clubId}')
      AND status = 'PENDING'
    ORDER BY match_week ASC 
    LIMIT 1;
  `);
  console.log(q2.rows.map(r => r['QUERY PLAN']).join('\n'));
  console.log(`Tiempo cliente: ${Date.now() - t2Start} ms`);

  // Query 3: Mercado de pases (MarketScreen)
  console.log('\n--- 3. EXPLAIN ANALYZE: Mercado de pases (players != club_id ORDER BY market_value DESC LIMIT 50) ---');
  const t3Start = Date.now();
  const q3 = await client.query(`
    EXPLAIN ANALYZE 
    SELECT * FROM players 
    WHERE club_id != '${clubId}' 
    ORDER BY market_value DESC 
    LIMIT 50;
  `);
  console.log(q3.rows.map(r => r['QUERY PLAN']).join('\n'));
  console.log(`Tiempo cliente: ${Date.now() - t3Start} ms`);

  // Query 4: Standings por competencia
  const compRes = await client.query("SELECT id FROM competitions LIMIT 1");
  const compId = compRes.rows[0]?.id;
  console.log(`\n--- 4. EXPLAIN ANALYZE: Standings por competition_id (${compId}) ---`);
  const t4Start = Date.now();
  const q4 = await client.query(`
    EXPLAIN ANALYZE 
    SELECT * FROM standings 
    WHERE competition_id = '${compId}'
    ORDER BY points DESC, (goals_for - goals_against) DESC;
  `);
  console.log(q4.rows.map(r => r['QUERY PLAN']).join('\n'));
  console.log(`Tiempo cliente: ${Date.now() - t4Start} ms`);

  await client.end();
}

testPlans().catch(console.error);
