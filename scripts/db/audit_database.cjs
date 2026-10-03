const { Client } = require('pg');

const connectionString = 'postgresql://postgres:d1fkM5K6yjB8Ol@db.qozozdaavjfxvssvxqbx.supabase.co:5432/postgres';

async function audit() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log('=== AUDITORÍA PROFUNDA DE BASE DE DATOS (POSTGRESQL / SUPABASE) ===\n');

  // 1. Tablas y recuento de registros
  console.log('--- 1. TABLAS Y CANTIDAD DE REGISTROS ---');
  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  const tables = tablesRes.rows.map(r => r.table_name);
  for (const table of tables) {
    try {
      const countRes = await client.query(`SELECT COUNT(*) FROM "${table}"`);
      console.log(`  - ${table.padEnd(28)} : ${countRes.rows[0].count} filas`);
    } catch (err) {
      console.log(`  - ${table.padEnd(28)} : Error leyendo conteo (${err.message})`);
    }
  }

  // 2. Claves Foráneas sin Índices
  console.log('\n--- 2. CLAVES FORÁNEAS SIN ÍNDICE (PERFORMANCE RISK) ---');
  const fkWithoutIndexQuery = `
    SELECT
      c.conrelid::regclass AS table_name,
      string_agg(a.attname, ', ') AS fk_columns,
      c.conname AS constraint_name,
      c.confrelid::regclass AS referenced_table
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    WHERE c.contype = 'f'
      AND c.connamespace = 'public'::regnamespace
      AND NOT EXISTS (
        SELECT 1
        FROM pg_index i
        WHERE i.indrelid = c.conrelid
          AND c.conkey = i.indkey[0:array_length(c.conkey, 1) - 1]
      )
    GROUP BY c.conrelid, c.conname, c.confrelid
    ORDER BY table_name;
  `;
  const fkRes = await client.query(fkWithoutIndexQuery);
  if (fkRes.rows.length === 0) {
    console.log('  [OK] Todas las claves foráneas cuentan con índices dedicados.');
  } else {
    console.log(`  [ALERTA] Se encontraron ${fkRes.rows.length} claves foráneas SIN índice:`);
    fkRes.rows.forEach(r => {
      console.log(`    * Tabla: ${r.table_name} -> (${r.fk_columns}) FK a ${r.referenced_table} [${r.constraint_name}]`);
    });
  }

  // 3. Índices existentes en la base de datos
  console.log('\n--- 3. ÍNDICES EXISTENTES (EXCLUYENDO PK) ---');
  const idxRes = await client.query(`
    SELECT
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname NOT LIKE '%_pkey'
    ORDER BY tablename, indexname;
  `);
  console.log(`  Total índices secundarios encontrados: ${idxRes.rows.length}`);
  idxRes.rows.forEach(i => {
    console.log(`    * ${i.tablename}.${i.indexname} -> ${i.indexdef}`);
  });

  // 4. Claves Primarias y Restricciones Únicas
  console.log('\n--- 4. RESTRICCIONES ÚNICAS Y DE CLAVE ---');
  const uniqueRes = await client.query(`
    SELECT
      tc.table_name,
      tc.constraint_name,
      tc.constraint_type,
      string_agg(kcu.column_name, ', ') AS columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
    GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
    ORDER BY tc.table_name, tc.constraint_type;
  `);
  uniqueRes.rows.forEach(u => {
    console.log(`    * ${u.table_name}: [${u.constraint_type}] ${u.constraint_name} (${u.columns})`);
  });

  // 5. Integridad referencial / Huérfanos
  console.log('\n--- 5. INTEGRIDAD DE DATOS Y REGISTROS HUÉRFANOS ---');
  
  // Jugadores sin club válido o nulo
  const orphanPlayers = await client.query(`
    SELECT COUNT(*) FROM players p
    LEFT JOIN clubs c ON p.club_id = c.id
    WHERE p.club_id IS NOT NULL AND c.id IS NULL;
  `);
  console.log(`  - Jugadores con club_id inexistente: ${orphanPlayers.rows[0].count}`);

  // Fixtures sin clubes válidos
  const orphanFixtures = await client.query(`
    SELECT COUNT(*) FROM fixtures f
    LEFT JOIN clubs h ON f.home_team_id = h.id
    LEFT JOIN clubs a ON f.away_team_id = a.id
    WHERE h.id IS NULL OR a.id IS NULL;
  `);
  console.log(`  - Fixtures con club local o visitante inexistente: ${orphanFixtures.rows[0].count}`);

  // Standings con club inexistente
  const orphanStandings = await client.query(`
    SELECT COUNT(*) FROM standings s
    LEFT JOIN clubs c ON s.club_id = c.id
    WHERE c.id IS NULL;
  `);
  console.log(`  - Standings con club_id inexistente: ${orphanStandings.rows[0].count}`);

  // Tácticas con club inexistente
  const orphanTactics = await client.query(`
    SELECT COUNT(*) FROM tactics t
    LEFT JOIN clubs c ON t.club_id = c.id
    WHERE c.id IS NULL;
  `);
  console.log(`  - Tácticas con club_id inexistente: ${orphanTactics.rows[0].count}`);

  // 6. RLS (Row Level Security) Status
  console.log('\n--- 6. ESTADO DE SEGURIDAD RLS ---');
  const rlsRes = await client.query(`
    SELECT 
      relname AS table_name,
      relrowsecurity AS rls_enabled
    FROM pg_class
    JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
    WHERE pg_namespace.nspname = 'public' 
      AND pg_class.relkind = 'r'
    ORDER BY relname;
  `);
  rlsRes.rows.forEach(r => {
    console.log(`  - ${r.table_name.padEnd(28)} : RLS ${r.rls_enabled ? 'HABILITADO' : 'DESHABILITADO (Público)'}`);
  });

  // 7. Sanidad de Datos
  console.log('\n--- 7. CHEQUEOS DE RANGOS Y ANOMALÍAS DE DATOS ---');
  
  // Atributos de jugadores fuera de rango (1-99)
  const invalidAttrs = await client.query(`
    SELECT COUNT(*) FROM players 
    WHERE attr_pace < 1 OR attr_pace > 99
       OR attr_shooting < 1 OR attr_shooting > 99
       OR attr_passing < 1 OR attr_passing > 99
       OR attr_potential < 1 OR attr_potential > 99;
  `);
  console.log(`  - Jugadores con atributos fuera del rango 1-99: ${invalidAttrs.rows[0].count}`);

  // Clubes con presupuestos anómalos o fechas inválidas
  const invalidClubs = await client.query(`
    SELECT id, name, budget, game_date FROM clubs 
    WHERE budget < -1000000 OR game_date IS NULL;
  `);
  console.log(`  - Clubes con presupuestos o fechas anómalas: ${invalidClubs.rows.length}`);

  // Camisetas duplicadas en un mismo club
  const duplicateDorsals = await client.query(`
    SELECT club_id, shirt_number, COUNT(*) 
    FROM players 
    WHERE club_id IS NOT NULL AND shirt_number IS NOT NULL
    GROUP BY club_id, shirt_number 
    HAVING COUNT(*) > 1;
  `);
  console.log(`  - Dorsales duplicados dentro del mismo club: ${duplicateDorsals.rows.length}`);

  // Standings duplicados
  const dupStandings = await client.query(`
    SELECT competition_id, club_id, COUNT(*)
    FROM standings
    GROUP BY competition_id, club_id
    HAVING COUNT(*) > 1;
  `);
  console.log(`  - Filas duplicadas en standings (competition_id, club_id): ${dupStandings.rows.length}`);

  // Tácticas duplicadas
  const dupTactics = await client.query(`
    SELECT club_id, COUNT(*)
    FROM tactics
    GROUP BY club_id
    HAVING COUNT(*) > 1;
  `);
  console.log(`  - Filas duplicadas en tactics (club_id): ${dupTactics.rows.length}`);

  await client.end();
  console.log('\n=== AUDITORÍA FINALIZADA CON ÉXITO ===');
}

audit().catch(console.error);
