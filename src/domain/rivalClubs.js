/**
 * Rivales de cada liga: se sortean de un pozo grande de nombres de clubes barriales, de forma determinista por carrera,
 * así cada carrera tiene sus propios rivales (antes todas las ligas tenían los mismos 19 clubes).
 */
import { seededRandom } from './cupMatch'

export const RIVAL_POOL = [
  ['Deportivo Central', 'DCE'], ['Atlético Belgrano', 'ATB'], ['Defensores del Valle', 'DDV'], ['Juventud Unida', 'JUN'],
  ['Social y Deportivo Rivadavia', 'SDR'], ['Estudiantes del Norte', 'EDN'], ['Unión Ferroviaria', 'UFE'], ['Club Náutico Costanera', 'CNC'],
  ['San Martín Social', 'SMS'], ['Sportivo Balcarce', 'SPB'], ['Club Atlético Mitre', 'CAM'], ['Racing de la Pampa', 'RLP'],
  ['Tiro Federal Argentino', 'TFA'], ['Huracán del Sur', 'HDS'], ['Almagro Regional', 'ALM'], ['Independiente de la Ribera', 'IDR'],
  ['Talleres del Parque', 'TDP'], ['Club Barrio Jardín', 'CBJ'], ['Deportivo Sarmiento', 'DSA'],
  ['Villa Dálmine Unida', 'VDU'], ['Ferro del Oeste', 'FDO'], ['Argentino de la Costa', 'ADC'], ['Atlético Los Andes', 'ALA'],
  ['Club Social La Cantera', 'CSC'], ['Defensores de Belgrano Sur', 'DBS'], ['Excursionistas del Bajo', 'EDB'], ['Estrella Roja Barrial', 'ERB'],
  ['Sportivo Italiano Norte', 'SIN'], ['Midland Regional', 'MID'], ['Atlas de Villa Real', 'AVR'], ['Club Deportivo Armenio', 'CDA'],
  ['Juventud Antoniana', 'JAN'], ['San Telmo Atlético', 'STA'], ['Dock Sud Unido', 'DSU'], ['Laferrere Social', 'LAF'],
  ['Central Córdoba del Bajo', 'CCB'], ['Gimnasia del Sur', 'GDS'], ['Platense del Puerto', 'PDP'], ['Comunicaciones Unidas', 'COM'],
  ['Barracas del Riachuelo', 'BDR'], ['Victoriano Arenas FC', 'VAF'], ['Club Atlético Brown de Rosario', 'CBR'], ['Sacachispas del Pueblo', 'SDP'],
  ['Deportivo Merlo Oeste', 'DMO'], ['Fénix de Pilar', 'FEP'], ['Alvarado del Mar', 'ADM'], ['Crucero del Norte Chico', 'CNC2'],
  ['Defensa y Justicia Vecinal', 'DJV'], ['Sol de América Barrial', 'SAB'], ['Cañuelas Fútbol Club', 'CFC'], ['Juventud de Las Piedras', 'JLP'],
  ['Atlético Tembleque', 'TEM'], ['Club Los Sauces', 'SAU'], ['Unión de Sunchales', 'UDS'], ['General Lamadrid Social', 'GLS'],
  ['Estudiantes de Río Cuarto', 'ERC'], ['Belgrano de Zárate', 'BDZ'], ['Peñarol del Bajo Flores', 'PBF'], ['Racing de Olavarría Sur', 'ROS']
].map(([name, short_name]) => ({ name, short_name }))

/** `count` rivales distintos, siempre los mismos para la misma semilla y sin repetir nombres ni siglas */
export function pickRivalClubs(seed, count = 19, exclude = []) {
  const taken = new Set(exclude.map(n => String(n).toLowerCase()))
  const pool = RIVAL_POOL.filter(c => !taken.has(c.name.toLowerCase()))
  const rand = seededRandom(`rivals:${seed}`)
  // Fisher-Yates con semilla
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}
