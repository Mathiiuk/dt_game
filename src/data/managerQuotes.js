/**
 * Frases de la Home. Nunca se escriben dentro del componente: salen de acá.
 *
 * Regla de publicación: sólo se muestran las que tienen `verified` y `approvedForProduction` en true.
 * - `historical`: la dijo un DT real. Exige autor, medio y URL de una fuente periodística que la cite textual.
 *   Ante una atribución dudosa o una redacción que cambia según quién la copie: NO se publica.
 * - `original`: frase propia de Vestuario. No lleva autor y jamás se atribuye a una persona real.
 *
 * @typedef {Object} ManagerQuote
 * @property {string} id
 * @property {string} text
 * @property {string} [manager]        Sólo en las históricas
 * @property {string} [country]
 * @property {string} [era]            Cuándo y dónde la dijo
 * @property {string} [sourceUrl]
 * @property {string} [sourceName]
 * @property {string} [note]           Por qué está pendiente, o si es un fragmento de una frase más larga
 * @property {boolean} verified
 * @property {boolean} approvedForProduction
 * @property {'historical'|'original'} type
 */

/** @type {ManagerQuote[]} */
export const MANAGER_QUOTES = [
  {
    id: 'bielsa-exito-deformante',
    text: 'El éxito es deformante, relaja, engaña, nos vuelve peores…',
    manager: 'Marcelo Bielsa',
    country: 'Argentina',
    era: 'Charla en el Colegio Sagrado Corazón de Rosario, 2000',
    sourceName: 'La Nación',
    sourceUrl: 'https://www.lanacion.com.ar/deportes/futbol/bielsa-guardiola-nid2466908/',
    note: 'Fragmento inicial de la frase; se corta con puntos suspensivos.',
    verified: true,
    approvedForProduction: true,
    type: 'historical'
  },
  {
    id: 'scaloni-sale-el-sol',
    text: 'Mañana sale el sol, ganes o pierdas.',
    manager: 'Lionel Scaloni',
    country: 'Argentina',
    era: 'Conferencia tras Argentina–México, Mundial de Qatar, 26/11/2022',
    sourceName: 'Infobae',
    sourceUrl: 'https://www.infobae.com/deportes/2022/11/26/la-conferencia-de-lionel-scaloni-en-vivo-segui-la-palabra-del-entrenador-de-la-seleccion-argentina-tras-el-triunfo-ante-mexico/',
    note: 'Fragmento final de la frase original.',
    verified: true,
    approvedForProduction: true,
    type: 'historical'
  },
  {
    id: 'sabella-la-gloria',
    text: 'El campeón es la gloria, y la gloria no tiene precio.',
    manager: 'Alejandro Sabella',
    country: 'Argentina',
    era: 'Festejos del título con Estudiantes, 2010',
    sourceName: 'La Nación',
    sourceUrl: 'https://www.lanacion.com.ar/deportes/futbol/las-mejores-frases-de-alejandro-sabella-nid1893369/',
    verified: true,
    approvedForProduction: true,
    type: 'historical'
  },

  // Pendientes: quedan registradas para no volver a investigarlas, pero NO se publican.
  {
    id: 'menotti-eficacia-belleza',
    text: 'El fútbol se juega para lograr eficacia. La belleza aparece de las cosas bien hechas.',
    manager: 'César Luis Menotti',
    country: 'Argentina',
    sourceName: 'ESPN (recopilación)',
    sourceUrl: 'https://www.espn.com.ve/futbol/argentina/nota/_/id/13617957/ideario-y-filosofia-futbolistica-de-cesar-luis-menotti',
    note: 'Sólo aparece en recopilaciones, sin la entrevista original. Falta fuente primaria.',
    verified: false,
    approvedForProduction: false,
    type: 'historical'
  },
  {
    id: 'cruyff-futbol-sencillo',
    text: 'Jugar al fútbol es muy sencillo, pero jugar un fútbol sencillo es lo más difícil que hay.',
    manager: 'Johan Cruyff',
    country: 'Países Bajos',
    note: 'Traducción con tres redacciones distintas según el medio y sin fuente primaria.',
    verified: false,
    approvedForProduction: false,
    type: 'historical'
  },

  // Frases propias de Vestuario (sin atribución)
  { id: 'vestuario-decisiones', text: 'Las decisiones también juegan.', verified: true, approvedForProduction: true, type: 'original' },
  { id: 'vestuario-pitazo', text: 'Cada partido empieza antes del pitazo.', verified: true, approvedForProduction: true, type: 'original' },
  { id: 'vestuario-banco', text: 'El equipo juega en la cancha. La historia se decide desde el banco.', verified: true, approvedForProduction: true, type: 'original' },
  { id: 'vestuario-empieza-aca', text: 'Tu carrera empieza acá.', verified: true, approvedForProduction: true, type: 'original' }
]

// Si por error el dataset queda sin frases publicables, la Home igual muestra una propia.
export const FALLBACK_QUOTE = { id: 'vestuario-fallback', text: 'Las decisiones también juegan.', verified: true, approvedForProduction: true, type: 'original' }
