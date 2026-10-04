const { Client } = require('pg');

const connectionString = (process.env.DATABASE_URL || (() => { throw new Error('Falta DATABASE_URL. Ejecutar: node --env-file=.env.local <script>') })());

async function updateDbHallOfFame() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log('=== CREANDO TABLA Y DATOS DEL SALÓN DE LA FAMA (FASE 38) ===\n');

  // 1. Crear tabla hall_of_fame
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.hall_of_fame (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      manager_id UUID REFERENCES public.managers(id) ON DELETE SET NULL,
      manager_name VARCHAR(120) NOT NULL,
      nationality VARCHAR(50) DEFAULT 'Argentina',
      legacy_score INT NOT NULL DEFAULT 0,
      titles_count INT NOT NULL DEFAULT 0,
      national_titles INT NOT NULL DEFAULT 0,
      international_titles INT NOT NULL DEFAULT 0,
      matches_played INT NOT NULL DEFAULT 0,
      matches_won INT NOT NULL DEFAULT 0,
      win_ratio NUMERIC(5,2) NOT NULL DEFAULT 0.00,
      clubs_managed TEXT[] DEFAULT '{}',
      national_teams_managed TEXT[] DEFAULT '{}',
      era VARCHAR(50) DEFAULT 'Era Moderna',
      is_human BOOLEAN DEFAULT false,
      snapshot_data JSONB DEFAULT '{}'::jsonb,
      inducted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    ALTER TABLE public.hall_of_fame ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Public hall_of_fame" ON public.hall_of_fame;
    CREATE POLICY "Public hall_of_fame" ON public.hall_of_fame FOR ALL TO public USING (true) WITH CHECK (true);

    CREATE INDEX IF NOT EXISTS idx_hall_of_fame_score ON public.hall_of_fame(legacy_score DESC);
    CREATE INDEX IF NOT EXISTS idx_hall_of_fame_manager ON public.hall_of_fame(manager_id);
  `);
  console.log('  [OK] Tabla hall_of_fame creada con RLS e indices B-Tree.');

  // 2. Sembrar leyendas históricas si la tabla está vacía
  const countRes = await client.query('SELECT COUNT(*) FROM public.hall_of_fame');
  if (parseInt(countRes.rows[0].count, 10) === 0) {
    const legends = [
      {
        name: 'Carlos Bianchi',
        nationality: 'Argentina',
        legacy_score: 9850,
        titles: 15,
        national_titles: 9,
        international_titles: 6,
        matches: 740,
        won: 412,
        win_ratio: 55.68,
        clubs: ['Vélez Sarsfield', 'Boca Juniors', 'Atlético de Madrid', 'Roma'],
        national_teams: [],
        era: '1993 - 2014'
      },
      {
        name: 'Marcelo Gallardo',
        nationality: 'Argentina',
        legacy_score: 9200,
        titles: 14,
        national_titles: 7,
        international_titles: 7,
        matches: 424,
        won: 228,
        win_ratio: 53.77,
        clubs: ['Nacional', 'River Plate', 'Al-Ittihad'],
        national_teams: [],
        era: '2014 - Presente'
      },
      {
        name: 'Helenio Herrera',
        nationality: 'Argentina / Francia',
        legacy_score: 8900,
        titles: 16,
        national_titles: 12,
        international_titles: 4,
        matches: 910,
        won: 510,
        win_ratio: 56.04,
        clubs: ['Atlético de Madrid', 'Barcelona', 'Inter de Milán', 'Roma'],
        national_teams: ['España', 'Italia'],
        era: '1948 - 1981'
      },
      {
        name: 'Carlos Salvador Bilardo',
        nationality: 'Argentina',
        legacy_score: 8600,
        titles: 5,
        national_titles: 2,
        international_titles: 3,
        matches: 610,
        won: 320,
        win_ratio: 52.46,
        clubs: ['Estudiantes LP', 'San Lorenzo', 'Sevilla', 'Boca Juniors'],
        national_teams: ['Argentina (Campeón 1986, Subcampeón 1990)'],
        era: '1971 - 2004'
      },
      {
        name: 'César Luis Menotti',
        nationality: 'Argentina',
        legacy_score: 8500,
        titles: 6,
        national_titles: 4,
        international_titles: 2,
        matches: 680,
        won: 345,
        win_ratio: 50.74,
        clubs: ['Huracán', 'Barcelona', 'Boca Juniors', 'River Plate', 'Independiente'],
        national_teams: ['Argentina (Campeón 1978)', 'México'],
        era: '1970 - 2007'
      },
      {
        name: 'Osvaldo Zubeldía',
        nationality: 'Argentina',
        legacy_score: 8400,
        titles: 9,
        national_titles: 4,
        international_titles: 5,
        matches: 580,
        won: 295,
        win_ratio: 50.86,
        clubs: ['Estudiantes LP', 'San Lorenzo', 'Racing', 'Atlético Nacional'],
        national_teams: [],
        era: '1961 - 1982'
      },
      {
        name: 'Marcelo Bielsa',
        nationality: 'Argentina',
        legacy_score: 7900,
        titles: 6,
        national_titles: 5,
        international_titles: 1,
        matches: 820,
        won: 410,
        win_ratio: 50.00,
        clubs: ['Newell\'s Old Boys', 'Vélez Sarsfield', 'Athletic Club', 'Olympique de Marsella', 'Leeds United'],
        national_teams: ['Argentina', 'Chile', 'Uruguay'],
        era: '1990 - Presente'
      }
    ];

    for (const leg of legends) {
      await client.query(`
        INSERT INTO public.hall_of_fame (
          manager_name,
          nationality,
          legacy_score,
          titles_count,
          national_titles,
          international_titles,
          matches_played,
          matches_won,
          win_ratio,
          clubs_managed,
          national_teams_managed,
          era,
          is_human
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, false);
      `, [
        leg.name,
        leg.nationality,
        leg.legacy_score,
        leg.titles,
        leg.national_titles,
        leg.international_titles,
        leg.matches,
        leg.won,
        leg.win_ratio,
        leg.clubs,
        leg.national_teams,
        leg.era
      ]);
    }
    console.log(`  [OK] ${legends.length} leyendas históricas sembradas en hall_of_fame.`);
  }

  await client.end();
  console.log('\n=== MIGRACIÓN DEL SALÓN DE LA FAMA FINALIZADA ===');
}

updateDbHallOfFame().catch(console.error);
