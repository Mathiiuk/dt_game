/**
 * Nombres de los jugadores rivales: cada club y cada jugador tienen el suyo (siempre el mismo para el mismo club).
 * Hay más de diez mil combinaciones y, dentro de un mismo once, no se repite ni el nombre ni el apellido.
 */

export const FIRST_NAMES = [...new Set([
  'Lucas', 'Matías', 'Nicolás', 'Facundo', 'Joaquín', 'Franco', 'Gonzalo', 'Ezequiel', 'Brian', 'Maximiliano', 'Tomás', 'Agustín',
  'Leandro', 'Cristian', 'Emanuel', 'Santiago', 'Mateo', 'Thiago', 'Bautista', 'Lautaro', 'Valentín', 'Ignacio', 'Federico', 'Rodrigo',
  'Sebastián', 'Martín', 'Diego', 'Pablo', 'Gabriel', 'Hernán', 'Máximo', 'Ramiro', 'Ariel', 'Walter', 'Claudio', 'Damián',
  'Alan', 'Axel', 'Kevin', 'Jonatan', 'Marcos', 'Julián', 'Esteban', 'Gastón', 'Nahuel', 'Iván', 'Cristóbal', 'Lisandro',
  'Fabián', 'Rubén', 'Ángel', 'Sergio', 'Alejo', 'Benjamín', 'Dante', 'Enzo', 'Fernando', 'Guillermo', 'Horacio', 'Ismael',
  'Jeremías', 'Luciano', 'Manuel', 'Néstor', 'Óscar', 'Patricio', 'Quique', 'Raúl', 'Salvador', 'Tobías', 'Ulises', 'Vicente',
  'Elías', 'Bruno', 'Camilo', 'Darío', 'Emiliano', 'Germán', 'Hugo', 'Isaías', 'Jorge', 'Luis', 'Nelson'
])]

export const LAST_NAMES = [...new Set([
  'Acuña', 'Barrios', 'Cabral', 'Domínguez', 'Escobar', 'Figueroa', 'Godoy', 'Herrera', 'Ibarra', 'Juárez', 'Luna', 'Medina',
  'Núñez', 'Ojeda', 'Paredes', 'Quiroga', 'Rojas', 'Sandoval', 'Toledo', 'Vera', 'Aguirre', 'Bustos', 'Cardozo', 'Delgado',
  'Echeverría', 'Fernández', 'Gallardo', 'Heredia', 'Insaurralde', 'Jiménez', 'Kuhn', 'Leiva', 'Maidana', 'Navarro', 'Olivera', 'Peralta',
  'Quintana', 'Ramos', 'Salinas', 'Tapia', 'Urquiza', 'Vargas', 'Williams', 'Ybarra', 'Zárate', 'Arias', 'Benítez', 'Coronel',
  'Duarte', 'Espinosa', 'Franco', 'Giménez', 'Hidalgo', 'Ledesma', 'Maldonado', 'Nieva', 'Orellana', 'Pereyra', 'Quinteros', 'Romero',
  'Sosa', 'Torres', 'Ugarte', 'Villalba', 'Zalazar', 'Alvarado', 'Britos', 'Campos', 'Díaz', 'Enríquez', 'Funes', 'Guerrero',
  'Hermosilla', 'Iglesias', 'Lezcano', 'Montenegro', 'Nogueira', 'Ocampo', 'Palacios', 'Rivero', 'Suárez', 'Trejo', 'Ustariz', 'Velázquez',
  'Aranda', 'Bogado', 'Cuello', 'Dávalos', 'Ferreyra', 'Garay', 'Haedo', 'Irala', 'Lencina', 'Mansilla', 'Noguera', 'Ortigoza',
  'Pizarro', 'Roldán', 'Segovia', 'Tévez', 'Uriarte', 'Videla', 'Yáñez', 'Zabala', 'Arrieta', 'Bermúdez', 'Carrizo', 'Dorrego',
  'Elizondo', 'Farías', 'Galeano', 'Heinze', 'Insúa', 'Jara', 'Lamas', 'Molina', 'Ortiz', 'Pavón', 'Ríos',
  'Salvatierra', 'Taborda', 'Valdez', 'Zapata', 'Albornoz', 'Bianchi', 'Chávez', 'Diez', 'Escalante', 'Fleitas', 'Gaitán', 'Huerta',
  'Isasi', 'Juncos', 'Lagos', 'Machado', 'Neira', 'Olmos', 'Prieto', 'Quevedo', 'Rizzo', 'Silva', 'Tello', 'Vallejos'
])]

const hash = (str) => {
  let h = 7
  for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) >>> 0
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return (h ^ (h >>> 16)) >>> 0
}

/**
 * Nombres para un once: uno por jugador, sin repetir nombre ni apellido dentro del equipo.
 * @param {string|number} seed identidad del club
 * @param {number} count cuántos nombres
 * @returns {Array<{ first_name: string, last_name: string }>}
 */
export function rivalNames(seed, count = 11) {
  const usedFirst = new Set()
  const usedLast = new Set()
  const names = []
  for (let idx = 0; idx < count; idx++) {
    let f = hash(`${seed}:n:${idx}`) % FIRST_NAMES.length
    while (usedFirst.has(f)) f = (f + 1) % FIRST_NAMES.length
    let l = hash(`${seed}:a:${idx}`) % LAST_NAMES.length
    while (usedLast.has(l) || LAST_NAMES[l] === FIRST_NAMES[f]) l = (l + 1) % LAST_NAMES.length
    usedFirst.add(f)
    usedLast.add(l)
    names.push({ first_name: FIRST_NAMES[f], last_name: LAST_NAMES[l] })
  }
  return names
}
