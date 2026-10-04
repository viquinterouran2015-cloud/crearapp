// Mapa muscular: silueta frontal y posterior con las zonas que trabaja una rutina resaltadas.
// "on" = zona trabajada · "dim" = trabajo general (cardio / estiramiento) · "off" = no trabajada.
const FULL = { pecho: ['chest'], abs: ['abs'], brazos: ['arms'], espalda: ['back'], gluteos: ['glutes'], piernas: ['legs'],
  cuerpo: ['chest', 'abs', 'arms', 'back', 'glutes', 'legs'] };
const SOFT = { cardio: ['legs', 'arms', 'abs'], estira: ['chest', 'abs', 'arms', 'back', 'glutes', 'legs'] };

function stateOf(areas) {
  const st = {};
  for (const a of areas) for (const p of SOFT[a] || []) st[p] ??= 'dim';
  for (const a of areas) for (const p of FULL[a] || []) st[p] = 'on';
  return st;
}

// Una figura en coordenadas locales de 50 × 105
const figure = (back, st) => {
  const c = part => st[part] || 'off';
  const arms = `<path class="l ${c('arms')}" d="M11 21L7 42" stroke-width="7"/><path class="l ${c('arms')}" d="M7 43L5 64" stroke-width="5.5"/>
    <path class="l ${c('arms')}" d="M39 21L43 42" stroke-width="7"/><path class="l ${c('arms')}" d="M43 43L45 64" stroke-width="5.5"/>`;
  const legs = `<path class="l ${c('legs')}" d="M19 58L18 83" stroke-width="10"/><path class="l ${c('legs')}" d="M31 58L32 83" stroke-width="10"/>
    <path class="l ${c('legs')}" d="M18 85L18 102" stroke-width="6.5"/><path class="l ${c('legs')}" d="M32 85L32 102" stroke-width="6.5"/>`;
  const body = '<path class="s base" d="M12 19Q25 14 38 19L35 55Q25 59 15 55Z"/>';
  const front = `<ellipse class="s ${c('chest')}" cx="19" cy="26" rx="6.2" ry="4.8"/><ellipse class="s ${c('chest')}" cx="31" cy="26" rx="6.2" ry="4.8"/>
    <rect class="s ${c('abs')}" x="19.5" y="34" width="11" height="17" rx="3.5"/>`;
  const rear = `<path class="s ${c('back')}" d="M14.5 20Q25 16.5 35.5 20L33 44Q25 48 17 44Z"/>
    <ellipse class="s ${c('glutes')}" cx="19.5" cy="52" rx="6.3" ry="5.2"/><ellipse class="s ${c('glutes')}" cx="30.5" cy="52" rx="6.3" ry="5.2"/>`;
  return `${legs}${arms}${body}${back ? rear : front}<circle class="s base" cx="25" cy="8" r="5.8"/>`;
};

export function bodyMap(areas, label = '') {
  const st = stateOf(areas);
  const on = Object.keys(st).filter(k => st[k] === 'on');
  return `<svg class="bm" viewBox="0 0 120 108" role="img" aria-label="${label || (on.length ? 'Zonas trabajadas' : 'Trabajo general')}" focusable="false">
    <g transform="translate(5 2)">${figure(false, st)}</g><g transform="translate(65 2)">${figure(true, st)}</g></svg>`;
}
