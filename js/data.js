// Catálogo de ejercicios y rutinas. Todo sin equipo.
// t: pista de técnica que se muestra y se lee en voz alta.
const AREAS = {
  cuerpo:  { n: 'Cuerpo entero', c: '#3E7C6E' },
  abs:     { n: 'Abdominales',   c: '#D9925A' },
  espalda: { n: 'Espalda',       c: '#5B7FA6' },
  gluteos: { n: 'Glúteos',       c: '#B5697F' },
  piernas: { n: 'Piernas',       c: '#7A8F4E' },
  brazos:  { n: 'Brazos',        c: '#8B6BB0' },
  pecho:   { n: 'Pecho',         c: '#C4705A' },
  cardio:  { n: 'Cardio / HIIT', c: '#D0A13C' },
  estira:  { n: 'Estiramiento',  c: '#5FA3A0' }
};

const EX = {
  jj:   { n: 'Jumping jacks',            a: 'cardio',  t: 'Abre y cierra brazos y piernas con ritmo constante.' },
  hk:   { n: 'Rodillas al pecho',        a: 'cardio',  t: 'Corre en el sitio subiendo las rodillas a la cadera.' },
  mc:   { n: 'Escaladores',              a: 'cardio',  t: 'En plancha alta, lleva las rodillas al pecho alternando.' },
  bp:   { n: 'Burpees',                  a: 'cardio',  t: 'Baja al suelo, empuja y salta arriba. Ve a tu ritmo.' },
  sk:   { n: 'Patinador',                a: 'cardio',  t: 'Salta lateralmente aterrizando suave sobre una pierna.' },
  sb:   { n: 'Boxeo al aire',            a: 'cardio',  t: 'Golpes rápidos con giro de cadera y guardia arriba.' },
  sq:   { n: 'Sentadillas',              a: 'piernas', t: 'Pecho arriba, cadera atrás, rodillas siguen la punta del pie.' },
  lg:   { n: 'Zancadas alternas',        a: 'piernas', t: 'Da un paso largo y baja recto. Empuja con el talón.' },
  su:   { n: 'Sentadilla sumo',          a: 'piernas', t: 'Pies anchos, puntas hacia fuera, baja con la espalda recta.' },
  wl:   { n: 'Sentadilla en pared',      a: 'piernas', t: 'Espalda en la pared, muslos paralelos al suelo. Respira.' },
  cr:   { n: 'Elevación de talones',     a: 'piernas', t: 'Sube de puntillas despacio y baja con control.' },
  bs:   { n: 'Sentadilla búlgara',       a: 'piernas', t: 'Pie trasero sobre una silla. Cambia de pierna a mitad.' },
  gb:   { n: 'Puente de glúteos',        a: 'gluteos', t: 'Aprieta glúteos arriba y mantén un segundo.' },
  dk:   { n: 'Patada de glúteo',         a: 'gluteos', t: 'En cuatro apoyos, empuja el talón hacia el techo.' },
  fh:   { n: 'Apertura de cadera',       a: 'gluteos', t: 'En cuatro apoyos, abre la rodilla hacia el lado sin rotar el tronco.' },
  sgb:  { n: 'Puente a una pierna',      a: 'gluteos', t: 'Una pierna extendida. Cadera nivelada. Cambia a mitad.' },
  dp:   { n: 'Buenos días',              a: 'gluteos', t: 'Manos en la nuca, inclina el tronco con la espalda neutra.' },
  cu:   { n: 'Crunch abdominal',         a: 'abs',     t: 'Sube los hombros sin tirar del cuello.' },
  pl:   { n: 'Plancha',                  a: 'abs',     t: 'Cuerpo en línea recta, abdomen firme, respira normal.' },
  bc:   { n: 'Bicicleta',                a: 'abs',     t: 'Codo a rodilla contraria, movimiento lento y controlado.' },
  lr:   { n: 'Elevación de piernas',     a: 'abs',     t: 'Baja las piernas sin despegar la zona lumbar del suelo.' },
  rt:   { n: 'Giro ruso',                a: 'abs',     t: 'Tronco inclinado atrás, gira de lado a lado.' },
  db:   { n: 'Bicho muerto',             a: 'abs',     t: 'Brazo y pierna contrarios se estiran; lumbar pegada al suelo.' },
  sp:   { n: 'Plancha lateral',          a: 'abs',     t: 'Codo bajo el hombro, cadera arriba. Cambia de lado a mitad.' },
  sm:   { n: 'Superman',                 a: 'espalda', t: 'Boca abajo, eleva brazos y piernas y mantén un segundo.' },
  sw:   { n: 'Nadador',                  a: 'espalda', t: 'Boca abajo, alterna brazo y pierna contrarios.' },
  ytw:  { n: 'Y-T-W',                    a: 'espalda', t: 'Boca abajo, dibuja esas letras con los brazos.' },
  rw:   { n: 'Remo con toalla',          a: 'espalda', t: 'Tira de una toalla tensa hacia el pecho juntando escápulas.' },
  bd:   { n: 'Perro pájaro',             a: 'espalda', t: 'En cuatro apoyos, estira brazo y pierna contrarios.' },
  pu:   { n: 'Flexiones',                a: 'pecho',   t: 'Cuerpo recto, baja el pecho al suelo y empuja.' },
  kp:   { n: 'Flexiones de rodillas',    a: 'pecho',   t: 'Apoya las rodillas; mantén la línea hombros-rodillas.' },
  ip:   { n: 'Flexiones inclinadas',     a: 'pecho',   t: 'Manos sobre una silla o sofá firme.' },
  hp:   { n: 'Apertura de pecho',        a: 'pecho',   t: 'Junta las palmas frente al pecho y presiona con fuerza.' },
  dm:   { n: 'Flexiones diamante',       a: 'brazos',  t: 'Manos juntas formando un diamante. Codos pegados.' },
  td:   { n: 'Fondos en silla',          a: 'brazos',  t: 'Baja la cadera junto a la silla; codos hacia atrás.' },
  st:   { n: 'Plancha toque de hombro',  a: 'brazos',  t: 'En plancha alta, toca el hombro sin girar la cadera.' },
  ac:   { n: 'Círculos de brazos',       a: 'brazos',  t: 'Brazos extendidos, círculos pequeños y luego grandes.' },
  cv:   { n: 'Gato - vaca',              a: 'estira',  t: 'Alterna arquear y redondear la espalda con la respiración.' },
  ch:   { n: 'Postura del niño',         a: 'estira',  t: 'Cadera a los talones, brazos al frente, respira profundo.' },
  qs:   { n: 'Estiramiento de cuádriceps', a: 'estira', t: 'Lleva el talón al glúteo. Cambia de pierna a mitad.' },
  hs:   { n: 'Estiramiento de isquios',  a: 'estira',  t: 'Pierna extendida, inclínate con la espalda larga.' },
  bf:   { n: 'Mariposa',                 a: 'estira',  t: 'Sentado con plantas juntas, deja caer las rodillas.' },
  tr:   { n: 'Rotación torácica',        a: 'estira',  t: 'Mano en la nuca, abre el codo hacia el techo.' },
  co:   { n: 'Cobra',                    a: 'estira',  t: 'Boca abajo, empuja el pecho hacia arriba sin forzar la lumbar.' }
};

// r: rondas. m: minutos aprox. se calcula.
const WORKOUTS = [
  { id: 'hiit',  n: 'HIIT quema grasa',      a: 'cardio',  r: 2, ex: ['jj', 'hk', 'sk', 'mc', 'bp', 'sb'] },
  { id: 'cuerpo',n: 'Cuerpo entero',         a: 'cuerpo',  r: 2, ex: ['sq', 'pu', 'lg', 'pl', 'gb', 'mc'] },
  { id: 'abs',   n: 'Abdominales definidos', a: 'abs',     r: 2, ex: ['cu', 'bc', 'lr', 'rt', 'db', 'pl'] },
  { id: 'abs2',  n: 'Core exprés',           a: 'abs',     r: 1, ex: ['pl', 'db', 'sp', 'bc'] },
  { id: 'glu',   n: 'Glúteos firmes',        a: 'gluteos', r: 2, ex: ['gb', 'dk', 'fh', 'su', 'sgb', 'dp'] },
  { id: 'pier',  n: 'Piernas fuertes',       a: 'piernas', r: 2, ex: ['sq', 'lg', 'wl', 'cr', 'su', 'bs'] },
  { id: 'esp',   n: 'Espalda y postura',     a: 'espalda', r: 2, ex: ['sm', 'sw', 'ytw', 'rw', 'bd', 'cv'] },
  { id: 'bra',   n: 'Brazos tonificados',    a: 'brazos',  r: 2, ex: ['dm', 'td', 'st', 'ac', 'pu'] },
  { id: 'pec',   n: 'Pecho y empuje',        a: 'pecho',   r: 2, ex: ['pu', 'ip', 'kp', 'hp', 'dm'] },
  { id: 'bras',  n: 'Quema rápida de brazos',a: 'brazos',  r: 1, ex: ['ac', 'st', 'td', 'dm'] },
  { id: 'est',   n: 'Estiramiento total',    a: 'estira',  r: 1, ex: ['cv', 'ch', 'qs', 'hs', 'bf', 'tr', 'co'], gentle: true },
  { id: 'mov',   n: 'Despertar 5 min',       a: 'estira',  r: 1, ex: ['cv', 'tr', 'ac', 'jj', 'sq'], gentle: true },
  { id: 'ini',   n: 'Primeros pasos',        a: 'cuerpo',  r: 1, ex: ['jj', 'sq', 'kp', 'gb', 'cu', 'cv'] }
];

const LEVELS = {
  1: { n: 'Principiante', w: 30, rest: 20 },
  2: { n: 'Intermedio',   w: 40, rest: 15 },
  3: { n: 'Avanzado',     w: 45, rest: 10 }
};

const GOALS = {
  fat:    { n: 'Perder grasa',   seq: ['hiit', 'abs', 'cuerpo', 'pier', 'hiit', 'glu'] },
  muscle: { n: 'Ganar músculo',  seq: ['pec', 'pier', 'bra', 'esp', 'glu', 'abs'] },
  tone:   { n: 'Tonificar',      seq: ['cuerpo', 'glu', 'abs', 'bra', 'pier', 'est'] },
  health: { n: 'Sentirme mejor', seq: ['ini', 'est', 'abs2', 'esp', 'mov', 'pier'] }
};
