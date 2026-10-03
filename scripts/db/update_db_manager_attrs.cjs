const { Client } = require('pg')

const connectionString = 'postgresql://postgres:d1fkM5K6yjB8Ol@db.qozozdaavjfxvssvxqbx.supabase.co:5432/postgres'

const sql = `
ALTER TABLE public.managers 
ADD COLUMN IF NOT EXISTS nationality text,
ADD COLUMN IF NOT EXISTS specialization text;
`

async function run() {
  const client = new Client({ connectionString })
  try {
    await client.connect()
    await client.query(sql)
    console.log('Database updated successfully for dt attributes!')
  } catch (err) {
    console.error('Error updating DB', err)
  } finally {
    await client.end()
  }
}

run()
