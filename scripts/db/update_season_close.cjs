const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

async function run() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('Error: Falta la variable DATABASE_URL.')
    console.error('Por favor, agrégala a tu archivo .env.local o expórtala en la terminal.')
    process.exit(1)
  }

  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('Conectado a la base de datos Supabase.')

    const sqlPath = path.join(__dirname, 'migration_season_close_server.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('Aplicando migración: migration_season_close_server.sql ...')
    await client.query(sql)
    console.log('¡Migración aplicada exitosamente!')

  } catch (err) {
    console.error('Error al aplicar la migración:', err)
  } finally {
    await client.end()
    console.log('Desconectado.')
  }
}

run()
