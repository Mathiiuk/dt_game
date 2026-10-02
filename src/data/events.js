export const gameEvents = [
  {
    id: 'late_star',
    title: 'Indisciplina',
    description: 'Tu máxima figura llegó 40 minutos tarde al entrenamiento y con olor a fiesta. La prensa está atenta.',
    options: [
      { text: 'Multarlo y al banco', effects: { board: 5, squad: -10, fans: 5 } },
      { text: 'Hacer la vista gorda', effects: { board: -10, squad: 10, fans: -5 } }
    ]
  },
  {
    id: 'board_pressure',
    title: 'Ultimátum',
    description: 'El presidente baja al vestuario. Quiere que pongas de titular al hijo de un inversor importante.',
    options: [
      { text: 'Aceptar (Cuidar el puesto)', effects: { board: 15, squad: -15, fans: -5 } },
      { text: 'Rechazar (El equipo es mío)', effects: { board: -20, squad: 15, fans: 10 } }
    ]
  },
  {
    id: 'press_conference',
    title: 'Conferencia Picante',
    description: 'Un periodista te pregunta si tu equipo juega a colgarse del travesaño.',
    options: [
      { text: 'Atacar al periodista', effects: { board: -5, squad: 10, fans: 15 } },
      { text: 'Responder con altura', effects: { board: 10, squad: -5, fans: -5 } }
    ]
  },
  {
    id: 'derby_offer',
    title: 'Oferta Tentadora',
    description: 'El eterno rival te ofrece el doble de sueldo para que asumas la próxima temporada.',
    options: [
      { text: 'Guiñar el ojo a la oferta', effects: { board: -15, squad: -5, fans: -25 } },
      { text: 'Rechazar públicamente', effects: { board: 5, squad: 5, fans: 20 } }
    ]
  },
  {
    id: 'injured_captain',
    title: 'Lesión del Capitán',
    description: 'Tu capitán se lesionó. Exige jugar infiltrado el clásico, pero el médico no lo recomienda.',
    options: [
      { text: 'Que juegue infiltrado', effects: { board: 10, squad: 15, fans: 10 } },
      { text: 'Cuidar su salud', effects: { board: -5, squad: -10, fans: -5 } }
    ]
  },
  {
    id: 'squad_dinner',
    title: 'Cena de Plantel',
    description: 'Los jugadores organizan un asado de camaradería e invitan al cuerpo técnico.',
    options: [
      { text: 'Asistir y pagar la cuenta', effects: { board: -5, squad: 20, fans: 5 } },
      { text: 'Darles privacidad', effects: { board: 5, squad: 5, fans: 0 } }
    ]
  },
  {
    id: 'tactical_leak',
    title: 'Filtración',
    description: 'Alguien del club filtró tu táctica a la prensa antes de un partido clave.',
    options: [
      { text: 'Cacería de brujas', effects: { board: -5, squad: -15, fans: -5 } },
      { text: 'Cambiar el esquema a último minuto', effects: { board: 5, squad: 5, fans: 5 } }
    ]
  },
  {
    id: 'fan_protest',
    title: 'Banderazo en contra',
    description: 'Un grupo de hinchas radicales frena tu auto a la salida del entrenamiento exigiendo actitud.',
    options: [
      { text: 'Bajarse a hablar', effects: { board: 5, squad: 5, fans: 20 } },
      { text: 'Acelerar e irse', effects: { board: -5, squad: -5, fans: -15 } }
    ]
  },
  {
    id: 'wonderkid_debut',
    title: 'Pibe Maravilla',
    description: 'El pibe de 16 años la está rompiendo en inferiores. La hinchada pide que debute ya.',
    options: [
      { text: 'Tirarlo a la cancha', effects: { board: 5, squad: -5, fans: 15 } },
      { text: 'Llevarlo de a poco', effects: { board: 10, squad: 5, fans: -10 } }
    ]
  },
  {
    id: 'budget_cut',
    title: 'Crisis Financiera',
    description: 'El club está en rojo. La directiva te pide que recortes premios o despidas a tu preparador físico.',
    options: [
      { text: 'Recortar premios de jugadores', effects: { board: 15, squad: -20, fans: -5 } },
      { text: 'Renunciar a parte de tu sueldo', effects: { board: 20, squad: 15, fans: 15 } }
    ]
  }
]
