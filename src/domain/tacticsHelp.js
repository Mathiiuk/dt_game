// Textos de ayuda de la pizarra (los muestra el botón "?" en el celular, donde no hay lugar para dejarlos a la vista).
export const HELP = {
  board: {
    topic: 'la pizarra',
    title: 'Cómo usar la pizarra',
    body: [
      'Tocá una ficha para elegirla. Después podés tocar otra para intercambiarlas, o “Cambiar jugador” para elegir quién juega en ese puesto.',
      'Para ubicar a un jugador donde quieras, tocá “Editar”: arrastrá la ficha o tocá un lugar de la cancha.',
      'Cuando cambiás algo aparece “Guardar”: hasta que lo toques, el equipo que juega es el anterior.'
    ]
  },
  stats: {
    topic: 'el nivel, la química y los símbolos',
    title: 'Nivel, química y símbolos',
    body: [
      'Nivel: el promedio de lo que rinde cada titular en el puesto donde está (un arquero de delantero casi no suma).',
      'Química: qué tan bien se conocen y encajan los once. Se ve en las líneas entre fichas: verde, buena; amarilla, regular; roja, mala.',
      'Fuera de puesto: jugadores en un lugar que no es el suyo. Rinden menos y se nota en el nivel del equipo.'
    ],
    legend: true
  },
  formation: {
    topic: 'la formación',
    title: 'Formación',
    body: ['Cuántos jugadores hay en defensa, mitad y ataque (por ejemplo 4-4-2). Cambiarla reubica a los once; “Auto-alinear” arma el mejor once posible con tu plantel.']
  },
  mentality: {
    topic: 'la mentalidad',
    title: 'Mentalidad',
    body: ['Cuánto riesgo asume el equipo en cada zona de la cancha. Es lo que más pesa en cómo juega: más ofensiva genera más ocasiones pero deja más espacios atrás.']
  },
  presets: {
    topic: 'los estilos listos',
    title: 'Estilos listos',
    body: ['Un toque y quedan fijadas las cuatro instrucciones (mentalidad, pase, ritmo y presión). Después podés ajustar lo que quieras.']
  },
  fine: {
    topic: 'los ajustes finos',
    title: 'Ajustes finos',
    body: ['Pase, ritmo y presión cambian poco el partido, pero afinan el estilo y el desgaste físico.']
  },
  passing: { topic: 'el estilo de pase', title: 'Estilo de pase', body: ['Cómo construye el juego el equipo con la pelota: pase corto y paciente, directo o por las bandas.'] },
  tempo: { topic: 'el ritmo de juego', title: 'Ritmo de juego', body: ['Qué tan rápido juega el equipo. Un ritmo alto da más ocasiones pero cansa más y aumenta el riesgo de lesión.'] },
  pressing: { topic: 'la presión', title: 'Intensidad de presión', body: ['Qué tan arriba se presiona al rival sin la pelota. Más presión recupera antes pero cuesta desgaste físico.'] },
  more: {
    topic: 'los especialistas',
    title: 'Especialistas y química',
    body: ['Quién cobra las pelotas paradas (tiros libres, córners y penales) y cómo se llevan los once: los vínculos más flojos aparecen listados para que puedas mejorarlos.']
  }
}
