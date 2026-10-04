const { Client } = require('pg')

const connectionString = (process.env.DATABASE_URL || (() => { throw new Error('Falta DATABASE_URL. Ejecutar: node --env-file=.env.local <script>') })())

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
