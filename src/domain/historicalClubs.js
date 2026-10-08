/**
 * Catálogo de clubes históricos del fútbol argentino adaptados por categorías (Tiers 1 a 5).
 * Basado en la Tabla Histórica del fútbol argentino (Promiedos: https://www.promiedos.com.ar/tablahistorica)
 * y en el mapa federal del ascenso metropolitano e interior.
 *
 * Cada club cuenta con:
 * - name: Nombre oficial.
 * - short_name: Sigla única (sin colisiones en todo el catálogo).
 * - city: Ciudad o barrio de origen.
 * - primary_color / secondary_color: Colores de camiseta tradicionales en HEX.
 * - founded_year: Año de fundación histórica.
 * - stadium_name: Nombre icónico de su estadio.
 * - stadium_capacity: Capacidad real aproximada.
 * - tier: Categoría en la pirámide de ligas del juego (1 a 5).
 */

export const HISTORICAL_CLUBS_BY_TIER = {
  // Tier 1: Primera División (Los grandes y tradicionales de la máxima categoría)
  1: [
    {
      name: 'River Plate',
      short_name: 'RIV',
      city: 'Núñez, Buenos Aires',
      primary_color: '#FF0000',
      secondary_color: '#FFFFFF',
      founded_year: 1901,
      stadium_name: 'Estadio Mâs Monumental',
      stadium_capacity: 84567,
      tier: 1
    },
    {
      name: 'Boca Juniors',
      short_name: 'BOC',
      city: 'La Boca, Buenos Aires',
      primary_color: '#003B7A',
      secondary_color: '#FFC72C',
      founded_year: 1905,
      stadium_name: 'Estadio Alberto J. Armando (La Bombonera)',
      stadium_capacity: 57000,
      tier: 1
    },
    {
      name: 'San Lorenzo',
      short_name: 'SLO',
      city: 'Boedo, Buenos Aires',
      primary_color: '#0A2472',
      secondary_color: '#C8102E',
      founded_year: 1908,
      stadium_name: 'Estadio Pedro Bidegain (Nuevo Gasómetro)',
      stadium_capacity: 47964,
      tier: 1
    },
    {
      name: 'Independiente',
      short_name: 'IND',
      city: 'Avellaneda, Buenos Aires',
      primary_color: '#CC0000',
      secondary_color: '#FFFFFF',
      founded_year: 1905,
      stadium_name: 'Estadio Libertadores de América - Ricardo E. Bochini',
      stadium_capacity: 48069,
      tier: 1
    },
    {
      name: 'Racing Club',
      short_name: 'RAC',
      city: 'Avellaneda, Buenos Aires',
      primary_color: '#75AADB',
      secondary_color: '#FFFFFF',
      founded_year: 1903,
      stadium_name: 'Estadio Presidente Perón (El Cilindro)',
      stadium_capacity: 51000,
      tier: 1
    },
    {
      name: 'Vélez Sarsfield',
      short_name: 'VEL',
      city: 'Liniers, Buenos Aires',
      primary_color: '#0033A0',
      secondary_color: '#FFFFFF',
      founded_year: 1910,
      stadium_name: 'Estadio José Amalfitani',
      stadium_capacity: 49540,
      tier: 1
    },
    {
      name: 'Estudiantes de La Plata',
      short_name: 'EDL',
      city: 'La Plata, Buenos Aires',
      primary_color: '#E31B23',
      secondary_color: '#FFFFFF',
      founded_year: 1905,
      stadium_name: 'Estadio Jorge Luis Hirschi (UNO)',
      stadium_capacity: 32530,
      tier: 1
    },
    {
      name: "Newell's Old Boys",
      short_name: 'NOB',
      city: 'Rosario, Santa Fe',
      primary_color: '#000000',
      secondary_color: '#D52B1E',
      founded_year: 1903,
      stadium_name: 'Estadio Marcelo Bielsa (Coloso del Parque)',
      stadium_capacity: 42000,
      tier: 1
    },
    {
      name: 'Rosario Central',
      short_name: 'CEN',
      city: 'Rosario, Santa Fe',
      primary_color: '#002B49',
      secondary_color: '#FDB913',
      founded_year: 1889,
      stadium_name: 'Estadio Gigante de Arroyito',
      stadium_capacity: 48000,
      tier: 1
    },
    {
      name: 'Gimnasia y Esgrima La Plata',
      short_name: 'GEL',
      city: 'La Plata, Buenos Aires',
      primary_color: '#003865',
      secondary_color: '#FFFFFF',
      founded_year: 1887,
      stadium_name: 'Estadio Juan Carmelo Zerillo (El Bosque)',
      stadium_capacity: 24500,
      tier: 1
    },
    {
      name: 'Huracán',
      short_name: 'HUR',
      city: 'Parque Patricios, Buenos Aires',
      primary_color: '#FFFFFF',
      secondary_color: '#DF0000',
      founded_year: 1908,
      stadium_name: 'Estadio Tomás Adolfo Ducó (El Palacio)',
      stadium_capacity: 48314,
      tier: 1
    },
    {
      name: 'Banfield',
      short_name: 'BAN',
      city: 'Banfield, Buenos Aires',
      primary_color: '#006633',
      secondary_color: '#FFFFFF',
      founded_year: 1896,
      stadium_name: 'Estadio Florencio Sola (Lencho)',
      stadium_capacity: 34901,
      tier: 1
    },
    {
      name: 'Lanús',
      short_name: 'LAN',
      city: 'Lanús, Buenos Aires',
      primary_color: '#6C1D2F',
      secondary_color: '#FFFFFF',
      founded_year: 1915,
      stadium_name: 'Estadio Ciudad de Lanús - Néstor Díaz Pérez (La Fortaleza)',
      stadium_capacity: 47027,
      tier: 1
    },
    {
      name: 'Argentinos Juniors',
      short_name: 'ARG',
      city: 'La Paternal, Buenos Aires',
      primary_color: '#CC0000',
      secondary_color: '#FFFFFF',
      founded_year: 1904,
      stadium_name: 'Estadio Diego Armando Maradona',
      stadium_capacity: 26000,
      tier: 1
    },
    {
      name: 'Ferro Carril Oeste',
      short_name: 'FCO',
      city: 'Caballito, Buenos Aires',
      primary_color: '#006837',
      secondary_color: '#FFFFFF',
      founded_year: 1904,
      stadium_name: 'Estadio Arquitecto Ricardo Etcheverri',
      stadium_capacity: 24442,
      tier: 1
    },
    {
      name: 'Platense',
      short_name: 'PLA',
      city: 'Vicente López, Buenos Aires',
      primary_color: '#5D3A1A',
      secondary_color: '#FFFFFF',
      founded_year: 1905,
      stadium_name: 'Estadio Ciudad de Vicente López',
      stadium_capacity: 34530,
      tier: 1
    },
    {
      name: 'Colón de Santa Fe',
      short_name: 'COL',
      city: 'Santa Fe, Santa Fe',
      primary_color: '#D9272E',
      secondary_color: '#000000',
      founded_year: 1905,
      stadium_name: 'Estadio Brigadier General Estanislao López (El Cementerio)',
      stadium_capacity: 40000,
      tier: 1
    },
    {
      name: 'Unión de Santa Fe',
      short_name: 'UNI',
      city: 'Santa Fe, Santa Fe',
      primary_color: '#DF0000',
      secondary_color: '#FFFFFF',
      founded_year: 1907,
      stadium_name: 'Estadio 15 de Abril',
      stadium_capacity: 27000,
      tier: 1
    },
    {
      name: 'Talleres de Córdoba',
      short_name: 'TAL',
      city: 'Córdoba, Córdoba',
      primary_color: '#002B49',
      secondary_color: '#FFFFFF',
      founded_year: 1913,
      stadium_name: 'Estadio Mario Alberto Kempes',
      stadium_capacity: 57000,
      tier: 1
    },
    {
      name: 'Belgrano de Córdoba',
      short_name: 'BEL',
      city: 'Córdoba, Córdoba',
      primary_color: '#6CA0DC',
      secondary_color: '#000000',
      founded_year: 1905,
      stadium_name: 'Estadio Julio César Villagra (Gigante de Alberdi)',
      stadium_capacity: 34000,
      tier: 1
    },
    {
      name: 'Tigre',
      short_name: 'TIG',
      city: 'Victoria, Buenos Aires',
      primary_color: '#003399',
      secondary_color: '#DF0000',
      founded_year: 1902,
      stadium_name: 'Estadio José Dellagiovanna',
      stadium_capacity: 26282,
      tier: 1
    },
    {
      name: 'Defensa y Justicia',
      short_name: 'DYJ',
      city: 'Florencio Varela, Buenos Aires',
      primary_color: '#00843D',
      secondary_color: '#FFCD00',
      founded_year: 1935,
      stadium_name: 'Estadio Norberto Tito Tomaghello',
      stadium_capacity: 20000,
      tier: 1
    },
    {
      name: 'Godoy Cruz',
      short_name: 'GOD',
      city: 'Godoy Cruz, Mendoza',
      primary_color: '#003399',
      secondary_color: '#FFFFFF',
      founded_year: 1921,
      stadium_name: 'Estadio Feliciano Gambarte',
      stadium_capacity: 18000,
      tier: 1
    },
    {
      name: 'Atlético Tucumán',
      short_name: 'ATU',
      city: 'San Miguel de Tucumán, Tucumán',
      primary_color: '#75AADB',
      secondary_color: '#FFFFFF',
      founded_year: 1902,
      stadium_name: 'Estadio Monumental José Fierro',
      stadium_capacity: 35200,
      tier: 1
    },
    {
      name: 'Sarmiento de Junín',
      short_name: 'SAR',
      city: 'Junín, Buenos Aires',
      primary_color: '#006633',
      secondary_color: '#FFFFFF',
      founded_year: 1911,
      stadium_name: 'Estadio Eva Perón',
      stadium_capacity: 22000,
      tier: 1
    },
    {
      name: 'Central Córdoba (SdE)',
      short_name: 'CCO',
      city: 'Santiago del Estero, Sgo. del Estero',
      primary_color: '#000000',
      secondary_color: '#FFFFFF',
      founded_year: 1919,
      stadium_name: 'Estadio Alfredo Terrera',
      stadium_capacity: 23500,
      tier: 1
    },
    {
      name: 'Deportivo Riestra',
      short_name: 'RIE',
      city: 'Villa Soldati, Buenos Aires',
      primary_color: '#000000',
      secondary_color: '#FFFFFF',
      founded_year: 1931,
      stadium_name: 'Estadio Guillermo Laza',
      stadium_capacity: 3000,
      tier: 1
    },
    {
      name: 'Barracas Central',
      short_name: 'BAR',
      city: 'Barracas, Buenos Aires',
      primary_color: '#DF0000',
      secondary_color: '#FFFFFF',
      founded_year: 1904,
      stadium_name: 'Estadio Claudio Chiqui Tapia',
      stadium_capacity: 4400,
      tier: 1
    }
  ],

  // Tier 2: Primera B Nacional (Gigantes del Ascenso e Históricos de Primera)
  2: [
    {
      name: 'Chacarita Juniors',
      short_name: 'CHJ',
      city: 'San Martín, Buenos Aires',
      primary_color: '#000000',
      secondary_color: '#DF0000',
      founded_year: 1906,
      stadium_name: 'Estadio de Chacarita Juniors',
      stadium_capacity: 20000,
      tier: 2
    },
    {
      name: 'Quilmes Atlético Club',
      short_name: 'QUI',
      city: 'Quilmes, Buenos Aires',
      primary_color: '#002B49',
      secondary_color: '#FFFFFF',
      founded_year: 1887,
      stadium_name: 'Estadio Centenario Ciudad de Quilmes',
      stadium_capacity: 30200,
      tier: 2
    },
    {
      name: 'Atlanta',
      short_name: 'ATL',
      city: 'Villa Crespo, Buenos Aires',
      primary_color: '#FFD100',
      secondary_color: '#003399',
      founded_year: 1904,
      stadium_name: 'Estadio Don León Kolbowski',
      stadium_capacity: 14000,
      tier: 2
    },
    {
      name: 'All Boys',
      short_name: 'ALB',
      city: 'Floresta, Buenos Aires',
      primary_color: '#FFFFFF',
      secondary_color: '#000000',
      founded_year: 1913,
      stadium_name: 'Estadio Islas Malvinas',
      stadium_capacity: 21500,
      tier: 2
    },
    {
      name: 'Instituto de Córdoba',
      short_name: 'INS',
      city: 'Córdoba, Córdoba',
      primary_color: '#DF0000',
      secondary_color: '#FFFFFF',
      founded_year: 1918,
      stadium_name: 'Estadio Juan Domingo Perón (Monumental de Alta Córdoba)',
      stadium_capacity: 32000,
      tier: 2
    },
    {
      name: 'San Martín de Tucumán',
      short_name: 'SMT',
      city: 'San Miguel de Tucumán, Tucumán',
      primary_color: '#DF0000',
      secondary_color: '#FFFFFF',
      founded_year: 1909,
      stadium_name: 'Estadio La Ciudadela',
      stadium_capacity: 30500,
      tier: 2
    },
    {
      name: 'San Martín de San Juan',
      short_name: 'SMJ',
      city: 'San Juan, San Juan',
      primary_color: '#006633',
      secondary_color: '#000000',
      founded_year: 1907,
      stadium_name: 'Estadio Ingeniero Hilario Sánchez',
      stadium_capacity: 26000,
      tier: 2
    },
    {
      name: 'Aldosivi',
      short_name: 'ALD',
      city: 'Mar del Plata, Buenos Aires',
      primary_color: '#00843D',
      secondary_color: '#FFCD00',
      founded_year: 1913,
      stadium_name: 'Estadio José María Minella',
      stadium_capacity: 35180,
      tier: 2
    },
    {
      name: 'Patronato',
      short_name: 'PAT',
      city: 'Paraná, Entre Ríos',
      primary_color: '#DF0000',
      secondary_color: '#000000',
      founded_year: 1914,
      stadium_name: 'Estadio Presbítero Bartolomé Grella',
      stadium_capacity: 22000,
      tier: 2
    },
    {
      name: 'Atlético de Rafaela',
      short_name: 'RAF',
      city: 'Rafaela, Santa Fe',
      primary_color: '#75AADB',
      secondary_color: '#FFFFFF',
      founded_year: 1907,
      stadium_name: 'Estadio Nuevo Monumental',
      stadium_capacity: 20600,
      tier: 2
    },
    {
      name: 'Nueva Chicago',
      short_name: 'NUC',
      city: 'Mataderos, Buenos Aires',
      primary_color: '#006633',
      secondary_color: '#000000',
      founded_year: 1911,
      stadium_name: 'Estadio República de Mataderos',
      stadium_capacity: 28500,
      tier: 2
    },
    {
      name: 'Deportivo Morón',
      short_name: 'MOR',
      city: 'Morón, Buenos Aires',
      primary_color: '#DF0000',
      secondary_color: '#FFFFFF',
      founded_year: 1947,
      stadium_name: 'Estadio Nuevo Francisco Urbano',
      stadium_capacity: 32000,
      tier: 2
    },
    {
      name: 'Almirante Brown',
      short_name: 'ALM',
      city: 'Isidro Casanova, Buenos Aires',
      primary_color: '#FFD100',
      secondary_color: '#000000',
      founded_year: 1922,
      stadium_name: 'Estadio Fragata Presidente Sarmiento',
      stadium_capacity: 25000,
      tier: 2
    },
    {
      name: 'Temperley',
      short_name: 'TEM',
      city: 'Temperley, Buenos Aires',
      primary_color: '#6CA0DC',
      secondary_color: '#FFFFFF',
      founded_year: 1912,
      stadium_name: 'Estadio Alfredo Beranger (El Teatro de Turdera)',
      stadium_capacity: 22000,
      tier: 2
    },
    {
      name: 'Gimnasia y Esgrima de Jujuy',
      short_name: 'GEJ',
      city: 'San Salvador de Jujuy, Jujuy',
      primary_color: '#75AADB',
      secondary_color: '#FFFFFF',
      founded_year: 1931,
      stadium_name: 'Estadio 23 de Agosto',
      stadium_capacity: 24000,
      tier: 2
    },
    {
      name: 'Olimpo de Bahía Blanca',
      short_name: 'OLI',
      city: 'Bahía Blanca, Buenos Aires',
      primary_color: '#FFD100',
      secondary_color: '#000000',
      founded_year: 1910,
      stadium_name: 'Estadio Roberto Natalio Carminatti',
      stadium_capacity: 18000,
      tier: 2
    },
    {
      name: 'Defensores de Belgrano',
      short_name: 'DFB',
      city: 'Núñez, Buenos Aires',
      primary_color: '#DF0000',
      secondary_color: '#000000',
      founded_year: 1906,
      stadium_name: 'Estadio Juan Pasquale',
      stadium_capacity: 10000,
      tier: 2
    },
    {
      name: 'Estudiantes de Buenos Aires',
      short_name: 'EBA',
      city: 'Caseros, Buenos Aires',
      primary_color: '#000000',
      secondary_color: '#FFFFFF',
      founded_year: 1898,
      stadium_name: 'Estadio Ciudad de Caseros',
      stadium_capacity: 16740,
      tier: 2
    },
    {
      name: 'San Telmo',
      short_name: 'TEL',
      city: 'Isla Maciel, Buenos Aires',
      primary_color: '#003399',
      secondary_color: '#6CA0DC',
      founded_year: 1904,
      stadium_name: 'Estadio Doctor Osvaldo Baletto',
      stadium_capacity: 10000,
      tier: 2
    },
    {
      name: 'Brown de Adrogué',
      short_name: 'BRO',
      city: 'Adrogué, Buenos Aires',
      primary_color: '#75AADB',
      secondary_color: '#DF0000',
      founded_year: 1945,
      stadium_name: 'Estadio Lorenzo Arandilla',
      stadium_capacity: 5000,
      tier: 2
    },
    {
      name: 'Tristán Suárez',
      short_name: 'TSU',
      city: 'Tristán Suárez, Buenos Aires',
      primary_color: '#003399',
      secondary_color: '#FFFFFF',
      founded_year: 1929,
      stadium_name: 'Estadio 20 de Octubre',
      stadium_capacity: 7500,
      tier: 2
    },
    {
      name: 'Chaco For Ever',
      short_name: 'CFE',
      city: 'Resistencia, Chaco',
      primary_color: '#000000',
      secondary_color: '#FFFFFF',
      founded_year: 1913,
      stadium_name: 'Estadio Juan Alberto García',
      stadium_capacity: 25000,
      tier: 2
    },
    {
      name: 'Gimnasia y Esgrima de Mendoza',
      short_name: 'GEM',
      city: 'Mendoza, Mendoza',
      primary_color: '#000000',
      secondary_color: '#FFFFFF',
      founded_year: 1908,
      stadium_name: 'Estadio Víctor Antonio Legrotaglie',
      stadium_capacity: 14000,
      tier: 2
    },
    {
      name: 'Independiente Rivadavia',
      short_name: 'INR',
      city: 'Mendoza, Mendoza',
      primary_color: '#002B49',
      secondary_color: '#FFFFFF',
      founded_year: 1913,
      stadium_name: 'Estadio Bautista Gargantini',
      stadium_capacity: 24000,
      tier: 2
    },
    {
      name: 'Agropecuario Argentino',
      short_name: 'AGR',
      city: 'Carlos Casares, Buenos Aires',
      primary_color: '#DF0000',
      secondary_color: '#006633',
      founded_year: 2011,
      stadium_name: 'Estadio Ofelia Rosenzuaig',
      stadium_capacity: 8000,
      tier: 2
    },
    {
      name: 'Deportivo Maipú',
      short_name: 'MAI',
      city: 'Maipú, Mendoza',
      primary_color: '#DF0000',
      secondary_color: '#000000',
      founded_year: 1927,
      stadium_name: 'Estadio Omar Higinio Sperdutti',
      stadium_capacity: 8000,
      tier: 2
    },
    {
      name: 'Alvarado de Mar del Plata',
      short_name: 'ALV',
      city: 'Mar del Plata, Buenos Aires',
      primary_color: '#003399',
      secondary_color: '#FFFFFF',
      founded_year: 1928,
      stadium_name: 'Estadio José María Minella',
      stadium_capacity: 35180,
      tier: 2
    },
    {
      name: 'Almagro',
      short_name: 'AMG',
      city: 'José Ingenieros, Buenos Aires',
      primary_color: '#003399',
      secondary_color: '#FFFFFF',
      founded_year: 1911,
      stadium_name: 'Estadio Tres de Febrero',
      stadium_capacity: 19000,
      tier: 2
    },
    {
      name: 'Atlético Belgrano',
      short_name: 'ATB',
      city: 'Paraná, Entre Ríos',
      primary_color: '#003865',
      secondary_color: '#FFCD00',
      founded_year: 1911,
      stadium_name: 'Estadio Nuevo Mondonguero',
      stadium_capacity: 4500,
      tier: 2
    }
  ],

  // Tier 3: Primera B Metropolitana / Torneo Federal A
  3: [
    {
      name: 'Los Andes',
      short_name: 'LOM',
      city: 'Lomas de Zamora, Buenos Aires',
      primary_color: '#DF0000',
      secondary_color: '#FFFFFF',
      founded_year: 1917,
      stadium_name: 'Estadio Eduardo Gallardón',
      stadium_capacity: 36942,
      tier: 3
    },
    {
      name: 'Deportivo Español',
      short_name: 'ESP',
      city: 'Parque Avellaneda, Buenos Aires',
      primary_color: '#DF0000',
      secondary_color: '#FFD100',
      founded_year: 1956,
      stadium_name: 'Estadio Nueva España',
      stadium_capacity: 32500,
      tier: 3
    },
    {
      name: 'Arsenal de Sarandí',
      short_name: 'ARS',
      city: 'Sarandí, Buenos Aires',
      primary_color: '#4169E1',
      secondary_color: '#DC143C',
      founded_year: 1957,
      stadium_name: 'Estadio Julio Humberto Grondona',
      stadium_capacity: 18500,
      tier: 3
    },
    {
      name: 'Colegiales',
      short_name: 'CLG',
      city: 'Munro, Buenos Aires',
      primary_color: '#003399',
      secondary_color: '#DF0000',
      founded_year: 1908,
      stadium_name: 'Estadio Libertarios Unidos',
      stadium_capacity: 6500,
      tier: 3
    },
    {
      name: 'Talleres de Remedios de Escalada',
      short_name: 'TRE',
      city: 'Remedios de Escalada, Buenos Aires',
      primary_color: '#DF0000',
      secondary_color: '#FFFFFF',
      founded_year: 1906,
      stadium_name: 'Estadio Pablo Comelli',
      stadium_capacity: 16000,
      tier: 3
    },
    {
      name: 'Comunicaciones',
      short_name: 'COM',
      city: 'Agronomía, Buenos Aires',
      primary_color: '#FFD100',
      secondary_color: '#000000',
      founded_year: 1931,
      stadium_name: 'Estadio Alfredo Ramos',
      stadium_capacity: 3500,
      tier: 3
    },
    {
      name: 'Acassuso',
      short_name: 'ACA',
      city: 'San Isidro, Buenos Aires',
      primary_color: '#003399',
      secondary_color: '#FFFFFF',
      founded_year: 1922,
      stadium_name: 'Estadio Armenia',
      stadium_capacity: 8000,
      tier: 3
    },
    {
      name: 'Flandria',
      short_name: 'FLA',
      city: 'Jáuregui, Buenos Aires',
      primary_color: '#FFD100',
      secondary_color: '#000000',
      founded_year: 1941,
      stadium_name: 'Estadio Carlos V',
      stadium_capacity: 5000,
      tier: 3
    },
    {
      name: 'Villa Dálmine',
      short_name: 'VDL',
      city: 'Campana, Buenos Aires',
      primary_color: '#4B0082',
      secondary_color: '#FFFFFF',
      founded_year: 1957,
      stadium_name: 'Estadio El Coliseo de Mitre y Puccini',
      stadium_capacity: 12000,
      tier: 3
    },
    {
      name: 'Deportivo Armenio',
      short_name: 'ARM',
      city: 'Ingeniero Maschwitz, Buenos Aires',
      primary_color: '#DF0000',
      secondary_color: '#006633',
      founded_year: 1962,
      stadium_name: 'Estadio Armenia',
      stadium_capacity: 10500,
      tier: 3
    },
    {
      name: 'Dock Sud',
      short_name: 'DOC',
      city: 'Dock Sud, Buenos Aires',
      primary_color: '#FFD100',
      secondary_color: '#003399',
      founded_year: 1916,
      stadium_name: 'Estadio de los Inmigrantes',
      stadium_capacity: 9500,
      tier: 3
    },
    {
      name: 'Argentino de Quilmes',
      short_name: 'ADQ',
      city: 'Quilmes, Buenos Aires',
      primary_color: '#75AADB',
      secondary_color: '#FFFFFF',
      founded_year: 1899,
      stadium_name: 'Estadio Argentino de Quilmes',
      stadium_capacity: 7000,
      tier: 3
    },
    {
      name: 'San Miguel',
      short_name: 'SMG',
      city: 'Los Polvorines, Buenos Aires',
      primary_color: '#006633',
      secondary_color: '#FFFFFF',
      founded_year: 1922,
      stadium_name: 'Estadio Malvinas Argentinas',
      stadium_capacity: 9000,
      tier: 3
    },
    {
      name: 'Deportivo Merlo',
      short_name: 'MER',
      city: 'Merlo, Buenos Aires',
      primary_color: '#FFFFFF',
      secondary_color: '#003399',
      founded_year: 1954,
      stadium_name: 'Estadio José Manuel Moreno',
      stadium_capacity: 11000,
      tier: 3
    },
    {
      name: 'Sacachispas',
      short_name: 'SAC',
      city: 'Villa Soldati, Buenos Aires',
      primary_color: '#4B0082',
      secondary_color: '#FFFFFF',
      founded_year: 1948,
      stadium_name: 'Estadio Beto Larrosa',
      stadium_capacity: 7000,
      tier: 3
    },
    {
      name: 'Excursionistas',
      short_name: 'EXC',
      city: 'Belgrano, Buenos Aires',
      primary_color: '#006633',
      secondary_color: '#FFFFFF',
      founded_year: 1910,
      stadium_name: 'Estadio de Excursionistas',
      stadium_capacity: 7200,
      tier: 3
    },
    {
      name: 'Deportivo Laferrere',
      short_name: 'LAF',
      city: 'Gregorio de Laferrere, Buenos Aires',
      primary_color: '#006633',
      secondary_color: '#FFFFFF',
      founded_year: 1956,
      stadium_name: 'Estadio Ciudad de Laferrere',
      stadium_capacity: 13000,
      tier: 3
    },
    {
      name: 'Villa San Carlos',
      short_name: 'VSC',
      city: 'Berisso, Buenos Aires',
      primary_color: '#6CA0DC',
      secondary_color: '#FFFFFF',
      founded_year: 1925,
      stadium_name: 'Estadio Genacio Sálice',
      stadium_capacity: 4000,
      tier: 3
    },
    {
      name: 'UAI Urquiza',
      short_name: 'UAI',
      city: 'Villa Lynch, Buenos Aires',
      primary_color: '#6CA0DC',
      secondary_color: '#800020',
      founded_year: 1950,
      stadium_name: 'Estadio Monumental de Villa Lynch',
      stadium_capacity: 1000,
      tier: 3
    },
    {
      name: 'Fénix',
      short_name: 'FNX',
      city: 'Pilar, Buenos Aires',
      primary_color: '#000000',
      secondary_color: '#FFFFFF',
      founded_year: 1948,
      stadium_name: 'Estadio Tres de Febrero',
      stadium_capacity: 1000,
      tier: 3
    },
    {
      name: 'Cañuelas FC',
      short_name: 'CAÑ',
      city: 'Cañuelas, Buenos Aires',
      primary_color: '#DF0000',
      secondary_color: '#FFFFFF',
      founded_year: 1911,
      stadium_name: 'Estadio Jorge Alfredo Arín',
      stadium_capacity: 2000,
      tier: 3
    },
    {
      name: 'Cipolletti',
      short_name: 'CIP',
      city: 'Cipolletti, Río Negro',
      primary_color: '#000000',
      secondary_color: '#FFFFFF',
      founded_year: 1926,
      stadium_name: 'Estadio La Visera de Cemento',
      stadium_capacity: 12000,
      tier: 3
    },
    {
      name: 'Juventud Antoniana',
      short_name: 'JAN',
      city: 'Salta, Salta',
      primary_color: '#75AADB',
      secondary_color: '#800020',
      founded_year: 1916,
      stadium_name: 'Estadio Fray Honorato Pistoia',
      stadium_capacity: 12000,
      tier: 3
    },
    {
      name: 'Gimnasia y Tiro de Salta',
      short_name: 'GTS',
      city: 'Salta, Salta',
      primary_color: '#75AADB',
      secondary_color: '#FFFFFF',
      founded_year: 1902,
      stadium_name: 'Estadio El Gigante del Norte',
      stadium_capacity: 25000,
      tier: 3
    },
    {
      name: 'Douglas Haig',
      short_name: 'DOU',
      city: 'Pergamino, Buenos Aires',
      primary_color: '#DF0000',
      secondary_color: '#000000',
      founded_year: 1918,
      stadium_name: 'Estadio Miguel Morales',
      stadium_capacity: 16000,
      tier: 3
    },
    {
      name: 'Villa Mitre',
      short_name: 'VMI',
      city: 'Bahía Blanca, Buenos Aires',
      primary_color: '#006633',
      secondary_color: '#000000',
      founded_year: 1924,
      stadium_name: 'Estadio El Fortín',
      stadium_capacity: 6000,
      tier: 3
    },
    {
      name: 'Santamarina de Tandil',
      short_name: 'SAN',
      city: 'Tandil, Buenos Aires',
      primary_color: '#FFD100',
      secondary_color: '#000000',
      founded_year: 1913,
      stadium_name: 'Estadio Municipal General San Martín',
      stadium_capacity: 8762,
      tier: 3
    },
    {
      name: 'Central Norte de Salta',
      short_name: 'CNO',
      city: 'Salta, Salta',
      primary_color: '#000000',
      secondary_color: '#FFFFFF',
      founded_year: 1921,
      stadium_name: 'Estadio Doctor Luis Güemes',
      stadium_capacity: 6000,
      tier: 3
    }
  ],

  // Tier 4: Primera C (Clubes del ascenso metropolitano con identidad de barrio)
  4: [
    {
      name: 'Ferrocarril Midland',
      short_name: 'MID',
      city: 'Libertad, Buenos Aires',
      primary_color: '#003399',
      secondary_color: '#FFFFFF',
      founded_year: 1914,
      stadium_name: 'Estadio Ciudad de Libertad',
      stadium_capacity: 6000,
      tier: 4
    },
    {
      name: 'San Martín de Burzaco',
      short_name: 'SMB',
      city: 'Burzaco, Buenos Aires',
      primary_color: '#003399',
      secondary_color: '#FFFFFF',
      founded_year: 1936,
      stadium_name: 'Estadio Francisco Boga',
      stadium_capacity: 5000,
      tier: 4
    },
    {
      name: 'El Porvenir',
      short_name: 'POR',
      city: 'Gerli, Buenos Aires',
      primary_color: '#000000',
      secondary_color: '#FFFFFF',
      founded_year: 1915,
      stadium_name: 'Estadio Gildo Francisco Ghersinich',
      stadium_capacity: 14000,
      tier: 4
    },
    {
      name: 'Berazategui',
      short_name: 'BER',
      city: 'Berazategui, Buenos Aires',
      primary_color: '#FF8C00',
      secondary_color: '#FFFFFF',
      founded_year: 1975,
      stadium_name: 'Estadio Norman Lee',
      stadium_capacity: 5500,
      tier: 4
    },
    {
      name: 'Luján',
      short_name: 'LUJ',
      city: 'Luján, Buenos Aires',
      primary_color: '#DF0000',
      secondary_color: '#FFFFFF',
      founded_year: 1936,
      stadium_name: 'Estadio 1° de Abril',
      stadium_capacity: 2000,
      tier: 4
    },
    {
      name: 'Ituzaingó',
      short_name: 'ITU',
      city: 'Ituzaingó, Buenos Aires',
      primary_color: '#006633',
      secondary_color: '#FFFFFF',
      founded_year: 1912,
      stadium_name: 'Estadio Carlos Alberto Sacaan',
      stadium_capacity: 5000,
      tier: 4
    },
    {
      name: 'J.J. de Urquiza',
      short_name: 'JJU',
      city: 'Loma Hermosa, Buenos Aires',
      primary_color: '#6CA0DC',
      secondary_color: '#FFFFFF',
      founded_year: 1936,
      stadium_name: 'Estadio Ramón Roque Martín',
      stadium_capacity: 2500,
      tier: 4
    },
    {
      name: 'General Lamadrid',
      short_name: 'LAM',
      city: 'Villa Devoto, Buenos Aires',
      primary_color: '#003399',
      secondary_color: '#FFFFFF',
      founded_year: 1950,
      stadium_name: 'Estadio Enrique Sexto',
      stadium_capacity: 3500,
      tier: 4
    },
    {
      name: 'Leandro N. Alem',
      short_name: 'ALE',
      city: 'General Rodríguez, Buenos Aires',
      primary_color: '#003399',
      secondary_color: '#FFD100',
      founded_year: 1925,
      stadium_name: 'Estadio Leandro N. Alem',
      stadium_capacity: 4000,
      tier: 4
    },
    {
      name: 'Victoriano Arenas',
      short_name: 'VAR',
      city: 'Valentín Alsina, Buenos Aires',
      primary_color: '#6CA0DC',
      secondary_color: '#FFFFFF',
      founded_year: 1928,
      stadium_name: 'Estadio Saturnino Moure',
      stadium_capacity: 1500,
      tier: 4
    },
    {
      name: 'Central Ballester',
      short_name: 'BAL',
      city: 'José León Suárez, Buenos Aires',
      primary_color: '#FFD100',
      secondary_color: '#003399',
      founded_year: 1974,
      stadium_name: 'Estadio Predio Cacique',
      stadium_capacity: 1500,
      tier: 4
    },
    {
      name: 'Yupanqui',
      short_name: 'YUP',
      city: 'Ciudad Evita, Buenos Aires',
      primary_color: '#DF0000',
      secondary_color: '#6CA0DC',
      founded_year: 1935,
      stadium_name: 'Estadio Ciudad Evita',
      stadium_capacity: 1000,
      tier: 4
    },
    {
      name: 'Sportivo Barracas',
      short_name: 'SBA',
      city: 'Barracas, Buenos Aires',
      primary_color: '#003399',
      secondary_color: '#FFFFFF',
      founded_year: 1913,
      stadium_name: 'Estadio Don León Kolbowski',
      stadium_capacity: 2000,
      tier: 4
    },
    {
      name: 'Atlas',
      short_name: 'ATS',
      city: 'General Rodríguez, Buenos Aires',
      primary_color: '#800020',
      secondary_color: '#6CA0DC',
      founded_year: 1951,
      stadium_name: 'Estadio Ricardo Puga',
      stadium_capacity: 2500,
      tier: 4
    },
    {
      name: 'Club Mercedes',
      short_name: 'CMR',
      city: 'Mercedes, Buenos Aires',
      primary_color: '#000000',
      secondary_color: '#FFFFFF',
      founded_year: 1875,
      stadium_name: 'Estadio Liga Mercedina',
      stadium_capacity: 5000,
      tier: 4
    },
    {
      name: 'Real Pilar',
      short_name: 'RPI',
      city: 'Pilar, Buenos Aires',
      primary_color: '#000000',
      secondary_color: '#FFFFFF',
      founded_year: 2017,
      stadium_name: 'Estadio Carlos Barraza',
      stadium_capacity: 10000,
      tier: 4
    },
    {
      name: 'Deportivo Camioneros',
      short_name: 'CAM',
      city: 'Esteban Echeverría, Buenos Aires',
      primary_color: '#006633',
      secondary_color: '#FFFFFF',
      founded_year: 2008,
      stadium_name: 'Estadio Hugo Moyano',
      stadium_capacity: 5000,
      tier: 4
    },
    {
      name: 'Juventud Unida de San Miguel',
      short_name: 'JUS',
      city: 'San Miguel, Buenos Aires',
      primary_color: '#DF0000',
      secondary_color: '#FFFFFF',
      founded_year: 1949,
      stadium_name: 'Estadio Ciudad de San Miguel',
      stadium_capacity: 3200,
      tier: 4
    },
    {
      name: 'Club Atlético Lugano',
      short_name: 'LUG',
      city: 'Tapiales, Buenos Aires',
      primary_color: '#FF8C00',
      secondary_color: '#FFFFFF',
      founded_year: 1915,
      stadium_name: 'Estadio José María Moraños',
      stadium_capacity: 2000,
      tier: 4
    },
    {
      name: 'Deportivo Paraguayo',
      short_name: 'DPG',
      city: 'González Catán, Buenos Aires',
      primary_color: '#DF0000',
      secondary_color: '#003399',
      founded_year: 1961,
      stadium_name: 'Estadio José María Moraños',
      stadium_capacity: 1500,
      tier: 4
    },
    {
      name: 'Centro Español',
      short_name: 'CES',
      city: 'Villa Sarmiento, Buenos Aires',
      primary_color: '#003399',
      secondary_color: '#FFD100',
      founded_year: 1934,
      stadium_name: 'Estadio José Manuel Moreno',
      stadium_capacity: 1500,
      tier: 4
    },
    {
      name: 'Muñiz',
      short_name: 'MUÑ',
      city: 'Muñiz, Buenos Aires',
      primary_color: '#DF0000',
      secondary_color: '#FFFFFF',
      founded_year: 1932,
      stadium_name: 'Estadio Ciudad de San Miguel',
      stadium_capacity: 2000,
      tier: 4
    },
    {
      name: 'Argentino de Rosario',
      short_name: 'ARO',
      city: 'Rosario, Santa Fe',
      primary_color: '#6CA0DC',
      secondary_color: '#FFFFFF',
      founded_year: 1912,
      stadium_name: 'Estadio José Martín Olaeta',
      stadium_capacity: 6800,
      tier: 4
    },
    {
      name: 'Central Córdoba de Rosario',
      short_name: 'CCR',
      city: 'Rosario, Santa Fe',
      primary_color: '#003399',
      secondary_color: '#DF0000',
      founded_year: 1906,
      stadium_name: 'Estadio Gabino Sosa',
      stadium_capacity: 10000,
      tier: 4
    },
    {
      name: 'Defensores de Cambaceres',
      short_name: 'DFC',
      city: 'Ensenada, Buenos Aires',
      primary_color: '#DF0000',
      secondary_color: '#FFFFFF',
      founded_year: 1921,
      stadium_name: 'Estadio 12 de Octubre',
      stadium_capacity: 8500,
      tier: 4
    },
    {
      name: 'Puerto Nuevo',
      short_name: 'PNU',
      city: 'Campana, Buenos Aires',
      primary_color: '#FFD100',
      secondary_color: '#003399',
      founded_year: 1939,
      stadium_name: 'Estadio Rubén Carlos Vallejos',
      stadium_capacity: 1000,
      tier: 4
    },
    {
      name: 'Claypole',
      short_name: 'CLP',
      city: 'Claypole, Buenos Aires',
      primary_color: '#000000',
      secondary_color: '#FFFFFF',
      founded_year: 1923,
      stadium_name: 'Estadio Rodolfo Capocasa',
      stadium_capacity: 3000,
      tier: 4
    },
    {
      name: 'Sportivo Italiano',
      short_name: 'SPI',
      city: 'Ciudad Evita, Buenos Aires',
      primary_color: '#003399',
      secondary_color: '#FFFFFF',
      founded_year: 1955,
      stadium_name: 'Estadio República de Italia',
      stadium_capacity: 8000,
      tier: 4
    }
  ],

  // Tier 5: Torneo Regional Amateur / Potrero Barrial
  5: [
    {
      name: 'Everton de La Plata',
      short_name: 'EVE',
      city: 'La Plata, Buenos Aires',
      primary_color: '#6CA0DC',
      secondary_color: '#FFD100',
      founded_year: 1905,
      stadium_name: 'Estadio Oscar Funes',
      stadium_capacity: 2500,
      tier: 5
    },
    {
      name: 'Kimberley de Mar del Plata',
      short_name: 'KIM',
      city: 'Mar del Plata, Buenos Aires',
      primary_color: '#006633',
      secondary_color: '#FFFFFF',
      founded_year: 1921,
      stadium_name: 'Estadio José Alberto Valle',
      stadium_capacity: 4000,
      tier: 5
    },
    {
      name: 'Gutiérrez Sport Club',
      short_name: 'GUT',
      city: 'General Gutiérrez, Mendoza',
      primary_color: '#6CA0DC',
      secondary_color: '#003399',
      founded_year: 1923,
      stadium_name: 'Estadio General Gutiérrez',
      stadium_capacity: 5000,
      tier: 5
    },
    {
      name: 'Deportivo Rincón',
      short_name: 'RIN',
      city: 'Rincón de los Sauces, Neuquén',
      primary_color: '#006633',
      secondary_color: '#FFD100',
      founded_year: 2012,
      stadium_name: 'Estadio Camping de los Petroleros',
      stadium_capacity: 3500,
      tier: 5
    },
    {
      name: 'Sol de Mayo',
      short_name: 'SDM',
      city: 'Viedma, Río Negro',
      primary_color: '#6CA0DC',
      secondary_color: '#000000',
      founded_year: 1920,
      stadium_name: 'Estadio Sol de Mayo',
      stadium_capacity: 5000,
      tier: 5
    },
    {
      name: 'Sarmiento de La Banda',
      short_name: 'SLA',
      city: 'La Banda, Santiago del Estero',
      primary_color: '#6CA0DC',
      secondary_color: '#FFFFFF',
      founded_year: 1909,
      stadium_name: 'Estadio Ciudad de La Banda',
      stadium_capacity: 8000,
      tier: 5
    },
    {
      name: 'Costa Brava de General Pico',
      short_name: 'CBR',
      city: 'General Pico, La Pampa',
      primary_color: '#DF0000',
      secondary_color: '#FFFFFF',
      founded_year: 1930,
      stadium_name: 'Estadio Nuevo Pacaembú',
      stadium_capacity: 6500,
      tier: 5
    },
    {
      name: 'Defensores de Formosa',
      short_name: 'DFF',
      city: 'Formosa, Formosa',
      primary_color: '#006633',
      secondary_color: '#FFFFFF',
      founded_year: 1952,
      stadium_name: 'Estadio Defensores de Evita',
      stadium_capacity: 3000,
      tier: 5
    },
    {
      name: 'Altos Hornos Zapla',
      short_name: 'AHZ',
      city: 'Palpalá, Jujuy',
      primary_color: '#000000',
      secondary_color: '#FFFFFF',
      founded_year: 1947,
      stadium_name: 'Estadio Emilio Fabrizzi',
      stadium_capacity: 18000,
      tier: 5
    },
    {
      name: 'Jorge Newbery de Comodoro',
      short_name: 'JNC',
      city: 'Comodoro Rivadavia, Chubut',
      primary_color: '#003399',
      secondary_color: '#FFFFFF',
      founded_year: 1924,
      stadium_name: 'Estadio La Madriguera',
      stadium_capacity: 6000,
      tier: 5
    },
    {
      name: 'Germinal de Rawson',
      short_name: 'GER',
      city: 'Rawson, Chubut',
      primary_color: '#006633',
      secondary_color: '#FFFFFF',
      founded_year: 1922,
      stadium_name: 'Estadio El Fortín',
      stadium_capacity: 10000,
      tier: 5
    },
    {
      name: 'Ciudad de Bolívar',
      short_name: 'CDB',
      city: 'San Carlos de Bolívar, Buenos Aires',
      primary_color: '#6CA0DC',
      secondary_color: '#003399',
      founded_year: 2002,
      stadium_name: 'Estadio Municipal Eva Perón',
      stadium_capacity: 4000,
      tier: 5
    },
    {
      name: 'Huracán de Comodoro Rivadavia',
      short_name: 'HCR',
      city: 'Comodoro Rivadavia, Chubut',
      primary_color: '#DF0000',
      secondary_color: '#FFFFFF',
      founded_year: 1927,
      stadium_name: 'Estadio César Muñoz',
      stadium_capacity: 6000,
      tier: 5
    },
    {
      name: 'Boxing Club de Río Gallegos',
      short_name: 'BOX',
      city: 'Río Gallegos, Santa Cruz',
      primary_color: '#006633',
      secondary_color: '#FFFFFF',
      founded_year: 1920,
      stadium_name: 'Estadio Emilio Pichón Guatti',
      stadium_capacity: 2000,
      tier: 5
    },
    {
      name: 'Guaraní de Paso de los Libres',
      short_name: 'GPL',
      city: 'Paso de los Libres, Corrientes',
      primary_color: '#DF0000',
      secondary_color: '#FFFFFF',
      founded_year: 1954,
      stadium_name: 'Estadio Agustín Faraldo',
      stadium_capacity: 2500,
      tier: 5
    },
    {
      name: 'Racing de Olavarría',
      short_name: 'RCO',
      city: 'Olavarría, Buenos Aires',
      primary_color: '#6CA0DC',
      secondary_color: '#FFFFFF',
      founded_year: 1916,
      stadium_name: 'Estadio José Buglione Martinese',
      stadium_capacity: 11000,
      tier: 5
    },
    {
      name: 'Atlético San Jorge',
      short_name: 'ASJ',
      city: 'San Jorge, Santa Fe',
      primary_color: '#006633',
      secondary_color: '#DF0000',
      founded_year: 1912,
      stadium_name: 'Estadio Parque 23 de Junio',
      stadium_capacity: 4000,
      tier: 5
    },
    {
      name: 'Coronel Aguirre',
      short_name: 'CAG',
      city: 'Villa Gobernador Gálvez, Santa Fe',
      primary_color: '#DF0000',
      secondary_color: '#006633',
      founded_year: 1924,
      stadium_name: 'Estadio Ezequiel Pocho Lavezzi',
      stadium_capacity: 4000,
      tier: 5
    },
    {
      name: 'Deportivo Mandiyú',
      short_name: 'MAN',
      city: 'Corrientes, Corrientes',
      primary_color: '#006633',
      secondary_color: '#FFFFFF',
      founded_year: 1952,
      stadium_name: 'Estadio José Antonio Romero Feris',
      stadium_capacity: 15000,
      tier: 5
    },
    {
      name: 'Huracán de Corrientes',
      short_name: 'HUC',
      city: 'Corrientes, Corrientes',
      primary_color: '#003399',
      secondary_color: '#DF0000',
      founded_year: 1918,
      stadium_name: 'Estadio José Antonio Romero Feris',
      stadium_capacity: 15000,
      tier: 5
    },
    {
      name: 'Sportivo Peñarol de San Juan',
      short_name: 'PEÑ',
      city: 'Chimbas, San Juan',
      primary_color: '#003399',
      secondary_color: '#DF0000',
      founded_year: 1918,
      stadium_name: 'Estadio Ramón Pablo Rojas',
      stadium_capacity: 4000,
      tier: 5
    },
    {
      name: 'Juventud Alianza de San Juan',
      short_name: 'ALI',
      city: 'Santa Lucía, San Juan',
      primary_color: '#6CA0DC',
      secondary_color: '#003399',
      founded_year: 1905,
      stadium_name: 'Estadio del Centenario',
      stadium_capacity: 9000,
      tier: 5
    },
    {
      name: 'Estudiantes de Resistencia',
      short_name: 'ERES',
      city: 'Resistencia, Chaco',
      primary_color: '#DF0000',
      secondary_color: '#000000',
      founded_year: 1932,
      stadium_name: 'Estadio de Estudiantes',
      stadium_capacity: 2000,
      tier: 5
    },
    {
      name: 'Bella Vista de Bahía Blanca',
      short_name: 'BVI',
      city: 'Bahía Blanca, Buenos Aires',
      primary_color: '#006633',
      secondary_color: '#FFFFFF',
      founded_year: 1921,
      stadium_name: 'Estadio Ignacio Nicolás',
      stadium_capacity: 4000,
      tier: 5
    },
    {
      name: 'Maronese de Neuquén',
      short_name: 'MRN',
      city: 'Neuquén, Neuquén',
      primary_color: '#000000',
      secondary_color: '#FFFFFF',
      founded_year: 1996,
      stadium_name: 'Estadio Ciudad de Neuquén',
      stadium_capacity: 3000,
      tier: 5
    },
    {
      name: 'Independiente de Chivilcoy',
      short_name: 'ICH',
      city: 'Chivilcoy, Buenos Aires',
      primary_color: '#DF0000',
      secondary_color: '#FFFFFF',
      founded_year: 1930,
      stadium_name: 'Estadio Raúl Orlando Lungarzo',
      stadium_capacity: 4000,
      tier: 5
    },
    {
      name: 'El Linqueño',
      short_name: 'ELQ',
      city: 'Lincoln, Buenos Aires',
      primary_color: '#003399',
      secondary_color: '#FFFFFF',
      founded_year: 1915,
      stadium_name: 'Estadio Leonardo Costa',
      stadium_capacity: 6000,
      tier: 5
    },
    {
      name: '9 de Julio de Rafaela',
      short_name: '9JR',
      city: 'Rafaela, Santa Fe',
      primary_color: '#DF0000',
      secondary_color: '#FFFFFF',
      founded_year: 1904,
      stadium_name: 'Estadio Germán Soltermam',
      stadium_capacity: 8000,
      tier: 5
    },
    {
      name: 'Huracán Las Heras',
      short_name: 'HLH',
      city: 'Las Heras, Mendoza',
      primary_color: '#DF0000',
      secondary_color: '#FFFFFF',
      founded_year: 1939,
      stadium_name: 'Estadio General San Martín',
      stadium_capacity: 10000,
      tier: 5
    },
    {
      name: 'Deportivo Central',
      short_name: 'DCE',
      city: 'Potrero Barrial, Buenos Aires',
      primary_color: '#006633',
      secondary_color: '#FFFFFF',
      founded_year: 1930,
      stadium_name: 'Cancha Social de la Estación',
      stadium_capacity: 1500,
      tier: 5
    }
  ]
}

/** Pozo aplanado con todos los clubes históricos del fútbol argentino */
export const ALL_HISTORICAL_CLUBS = Object.values(HISTORICAL_CLUBS_BY_TIER).flat()
