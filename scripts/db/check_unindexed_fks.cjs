const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:d1fkM5K6yjB8Ol@db.qozozdaavjfxvssvxqbx.supabase.co:5432/postgres' });
async function check() {
  await client.connect();
  const res = await client.query(`
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
  `);
  console.log('Restantes FKs sin índice:', res.rows.length);
  res.rows.forEach(r => console.log(`  * ${r.table_name} (${r.fk_columns}) -> ${r.referenced_table}`));
  await client.end();
}
check().catch(console.error);
