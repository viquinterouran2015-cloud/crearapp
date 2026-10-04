// Catálogo de ejercicios y rutinas. Todo sin equipo.
// t: pista de técnica que se muestra y se lee en voz alta.
const AREAS = {
  cuerpo:  { n: 'Cuerpo entero', c: '#4D8DFF' },
  abs:     { n: 'Abdominales',   c: '#22D3EE' },
  espalda: { n: 'Espalda',       c: '#8B7CFF' },
  gluteos: { n: 'Glúteos',       c: '#F472B6' },
  piernas: { n: 'Piernas',       c: '#34D399' },
  brazos:  { n: 'Brazos',        c: '#A78BFA' },
  pecho:   { n: 'Pecho',         c: '#FB7185' },
  cardio:  { n: 'Cardio / HIIT', c: '#FBBF24' },
  estira:  { n: 'Estiramiento',  c: '#2DD4BF' }
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
  js:   { n: 'Sentadilla con salto',      a: 'piernas', t: 'Baja a sentadilla y salta con fuerza; aterriza suave con las rodillas flexionadas.' },
  jl:   { n: 'Zancada con salto',         a: 'piernas', t: 'Desde la zancada, salta y cambia de pierna en el aire. Aterriza con control.' },
  csq:  { n: 'Sentadilla a la silla',     a: 'piernas', t: 'Siéntate en una silla sin dejarte caer y vuelve a levantarte empujando con los talones.' },
  bps:  { n: 'Burpee sin salto',          a: 'cardio',  t: 'Baja, lleva los pies atrás uno a uno y vuelve a subir. Sin saltar.' },
  bpp:  { n: 'Burpee con flexión',        a: 'cardio',  t: 'Baja, haz una flexión completa, recoge los pies y salta arriba.' },
  mrc:  { n: 'Marcha en el sitio',        a: 'cardio',  t: 'Sube las rodillas alternando, sin saltos y con los brazos activos.' },
  plk:  { n: 'Plancha de rodillas',       a: 'abs',     t: 'Apoya las rodillas; cuerpo en línea desde los hombros y abdomen firme.' },
  plt:  { n: 'Plancha con elevación de pierna', a: 'abs', t: 'En plancha, alterna elevando una pierna sin girar la cadera.' },
  dpu:  { n: 'Flexiones declinadas',      a: 'pecho',   t: 'Pies sobre una silla o sofá firme: más carga en pecho y hombros.' },
  co:   { n: 'Cobra',                    a: 'estira',  t: 'Boca abajo, empuja el pecho hacia arriba sin forzar la lumbar.' }
};

// r: rondas base · ex: ejercicios del nivel Intermedio ·
// lv: listas propias para Principiante (1) y Avanzado (3): variantes más suaves o más exigentes.
// Las rutinas "gentle" (estiramiento) solo cambian los tiempos de sostén.
const WORKOUTS = [
  { id: 'hiit',  n: 'HIIT quema grasa',      a: 'cardio',  r: 2, ex: ['jj', 'hk', 'sk', 'mc', 'bp', 'sb'],
    lv: { 1: ['mrc', 'sb', 'jj', 'bps', 'mc'], 3: ['jj', 'hk', 'sk', 'mc', 'bpp', 'js', 'sb'] } },
  { id: 'cuerpo',n: 'Cuerpo entero',         a: 'cuerpo',  r: 2, ex: ['sq', 'pu', 'lg', 'pl', 'gb', 'mc'],
    lv: { 1: ['csq', 'kp', 'lg', 'plk', 'gb'], 3: ['js', 'dm', 'jl', 'plt', 'sgb', 'mc', 'bpp'] } },
  { id: 'abs',   n: 'Abdominales definidos', a: 'abs',     r: 2, ex: ['cu', 'bc', 'lr', 'rt', 'db', 'pl'],
    lv: { 1: ['cu', 'db', 'bc', 'plk', 'lr'], 3: ['bc', 'lr', 'rt', 'sp', 'plt', 'cu', 'pl'] } },
  { id: 'abs2',  n: 'Core exprés',           a: 'abs',     r: 1, ex: ['pl', 'db', 'sp', 'bc'],
    lv: { 1: ['db', 'plk', 'cu'], 3: ['plt', 'sp', 'lr', 'rt', 'pl'] } },
  { id: 'glu',   n: 'Glúteos firmes',        a: 'gluteos', r: 2, ex: ['gb', 'dk', 'fh', 'su', 'sgb', 'dp'],
    lv: { 1: ['gb', 'dk', 'fh', 'dp', 'wl'], 3: ['sgb', 'dk', 'fh', 'js', 'bs', 'dp', 'su'] } },
  { id: 'pier',  n: 'Piernas fuertes',       a: 'piernas', r: 2, ex: ['sq', 'lg', 'wl', 'cr', 'su', 'bs'],
    lv: { 1: ['csq', 'wl', 'cr', 'lg', 'su'], 3: ['js', 'jl', 'bs', 'wl', 'su', 'cr', 'lg'] } },
  { id: 'esp',   n: 'Espalda y postura',     a: 'espalda', r: 2, ex: ['sm', 'sw', 'ytw', 'rw', 'bd', 'cv'],
    lv: { 1: ['cv', 'sm', 'bd', 'rw', 'ch'], 3: ['ytw', 'sw', 'sm', 'rw', 'bd', 'dp', 'st'] } },
  { id: 'bra',   n: 'Brazos tonificados',    a: 'brazos',  r: 2, ex: ['dm', 'td', 'st', 'ac', 'pu'],
    lv: { 1: ['ac', 'kp', 'hp', 'ip'], 3: ['dm', 'td', 'dpu', 'st', 'pu', 'plt', 'ac'] } },
  { id: 'pec',   n: 'Pecho y empuje',        a: 'pecho',   r: 2, ex: ['pu', 'ip', 'kp', 'hp', 'dm'],
    lv: { 1: ['ip', 'kp', 'hp', 'ac'], 3: ['dpu', 'dm', 'pu', 'st', 'hp', 'td'] } },
  { id: 'bras',  n: 'Quema rápida de brazos',a: 'brazos',  r: 1, ex: ['ac', 'st', 'td', 'dm'],
    lv: { 1: ['ac', 'kp', 'hp'], 3: ['dm', 'dpu', 'td', 'st', 'ac'] } },
  { id: 'est',   n: 'Estiramiento total',    a: 'estira',  r: 1, ex: ['cv', 'ch', 'qs', 'hs', 'bf', 'tr', 'co'], gentle: true },
  { id: 'mov',   n: 'Despertar 5 min',       a: 'estira',  r: 1, ex: ['cv', 'tr', 'ac', 'jj', 'sq'], gentle: true },
  { id: 'ini',   n: 'Primeros pasos',        a: 'cuerpo',  r: 1, ex: ['jj', 'sq', 'kp', 'gb', 'cu', 'cv'] }
];

// w: segundos de trabajo · rest: descanso · gw: sostén en rutinas suaves · extra: rondas adicionales
const LEVELS = {
  1: { n: 'Principiante', w: 30, rest: 30, gw: 35, extra: 0, d: 'Bajo impacto, variantes más suaves y descansos largos.' },
  2: { n: 'Intermedio',   w: 40, rest: 20, gw: 40, extra: 0, d: 'Ritmo constante con los ejercicios completos.' },
  3: { n: 'Avanzado',     w: 50, rest: 10, gw: 50, extra: 1, d: 'Alta intensidad: saltos, variantes difíciles, una ronda más y descansos cortos.' }
};

const GOALS = {
  fat:    { n: 'Perder grasa',   seq: ['hiit', 'abs', 'cuerpo', 'pier', 'hiit', 'glu'] },
  muscle: { n: 'Ganar músculo',  seq: ['pec', 'pier', 'bra', 'esp', 'glu', 'abs'] },
  tone:   { n: 'Tonificar',      seq: ['cuerpo', 'glu', 'abs', 'bra', 'pier', 'est'] },
  health: { n: 'Sentirme mejor', seq: ['ini', 'est', 'abs2', 'esp', 'mov', 'pier'] }
};


// Variante más fácil / más difícil de cada ejercicio (se muestra en la ficha de técnica)
const PROGRESSION = {
  sq: { easier: 'csq', harder: 'js' }, csq: { harder: 'sq' }, js: { easier: 'sq' },
  lg: { harder: 'jl' }, jl: { easier: 'lg' },
  pu: { easier: 'kp', harder: 'dpu' }, kp: { easier: 'ip', harder: 'pu' }, ip: { harder: 'kp' },
  dm: { easier: 'pu' }, dpu: { easier: 'pu', harder: 'dm' },
  pl: { easier: 'plk', harder: 'plt' }, plk: { harder: 'pl' }, plt: { easier: 'pl' },
  bp: { easier: 'bps', harder: 'bpp' }, bps: { harder: 'bp' }, bpp: { easier: 'bp' },
  hk: { easier: 'mrc' }, mrc: { harder: 'hk' },
  gb: { harder: 'sgb' }, sgb: { easier: 'gb' },
  su: { easier: 'csq' }, wl: { harder: 'bs' }, bs: { easier: 'wl' }
};

// Ejercicios por tiempo o isométricos: no se registran por repeticiones
const NO_REPS = ['pl', 'plk', 'plt', 'sp', 'wl', 'hp', 'ac'];

export { AREAS, EX, WORKOUTS, LEVELS, GOALS, PROGRESSION, NO_REPS };
