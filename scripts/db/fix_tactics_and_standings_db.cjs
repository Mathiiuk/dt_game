const { Client } = require('pg');

async function run() {
  const connectionString = 'postgresql://postgres:d1fkM5K6yjB8Ol@db.qozozdaavjfxvssvxqbx.supabase.co:5432/postgres';
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // 1. Deduplicar tabla tactics
    await client.query(`
      DELETE FROM tactics a
      USING tactics b
      WHERE a.club_id = b.club_id
        AND a.created_at < b.created_at;
    `);
    console.log('Deduplicated tactics table.');

    // 2. Añadir restricción UNIQUE en tactics(club_id)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'unique_club_tactic'
        ) THEN
          ALTER TABLE tactics ADD CONSTRAINT unique_club_tactic UNIQUE (club_id);
        END IF;
      END $$;
    `);
    console.log('Added unique constraint to tactics(club_id).');

    // 3. Deduplicar tabla standings
    await client.query(`
      DELETE FROM standings a
      USING standings b
      WHERE a.competition_id = b.competition_id
        AND a.club_id = b.club_id
        AND a.ctid < b.ctid;
    `);
    console.log('Deduplicated standings table.');

    // 4. Añadir restricción UNIQUE en standings(competition_id, club_id)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'unique_competition_club_standing'
        ) THEN
          ALTER TABLE standings ADD CONSTRAINT unique_competition_club_standing UNIQUE (competition_id, club_id);
        END IF;
      END $$;
    `);
    console.log('Added unique constraint to standings(competition_id, club_id).');

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
    console.log('Done.');
  }
}

run();
