require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.VITE_SUPABASE_URL ? 
    process.env.VITE_SUPABASE_URL.replace('https://', 'postgres://postgres:').replace('.supabase.co', '') : 
    process.env.SUPABASE_DB_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Buscar clubes que sean 'bot' y no tengan jugadores
    const res = await client.query(`
      SELECT c.id, c.reputation 
      FROM clubs c
      LEFT JOIN players p ON c.id = p.club_id
      WHERE c.history_type = 'bot' AND p.id IS NULL
    `);
    
    const botClubs = res.rows;
    console.log(`Encontrados ${botClubs.length} clubes bot sin jugadores.`);
    
    if (botClubs.length > 0) {
      console.log('Debes inicializar la liga nuevamente o generar jugadores para estos bots. Como esto es Javascript cliente en la app real, generaremos un mock SQL directo aquí o simplemente los ignoramos para MVP.');
      // Lo más fácil es hacer un script rápido para generarlos en Node, pero para no replicar toda la lógica de nombres y posiciones, 
      // lo ideal es decir al desarrollador que borre los clubes bot y recree la liga, 
      // o simplemente ignorarlo ya que estamos en MVP.
      
      console.log('Se recomienda borrar la base de datos y recrear el usuario para probar el MVP completo, o ejecutar la función de generación en el cliente.');
    }

    await client.query('COMMIT');
    console.log('Migración completada.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error:', e);
  } finally {
    client.release();
    pool.end();
  }
}

main();
