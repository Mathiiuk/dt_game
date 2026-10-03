const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:d1fkM5K6yjB8Ol@db.qozozdaavjfxvssvxqbx.supabase.co:5432/postgres' });

async function checkPolicies() {
  await client.connect();

  console.log('=== POLÍTICAS RLS EN SUPABASE ===\n');

  const res = await client.query(`
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `);

  if (res.rows.length === 0) {
    console.log('[ALERTA] ¡No hay ninguna política RLS definida! Si RLS está habilitado, los usuarios anónimos/autenticados podrían ser bloqueados o permitir todo.');
  } else {
    console.log(`Total políticas encontradas: ${res.rows.length}`);
    res.rows.forEach(p => {
      console.log(`  - ${p.tablename.padEnd(25)} | [${p.cmd}] "${p.policyname}" | Roles: ${p.roles} | Permissive: ${p.permissive}`);
      if (p.qual) console.log(`      USING: ${p.qual}`);
      if (p.with_check) console.log(`      WITH CHECK: ${p.with_check}`);
    });
  }

  await client.end();
}

checkPolicies().catch(console.error);
