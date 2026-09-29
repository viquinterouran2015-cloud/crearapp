// Lógica pura (sin DOM ni localStorage): fechas, rutinas, plan, racha y validación del estado guardado.
import { EX, WORKOUTS, LEVELS, GOALS } from './data.js';

export const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
export const STATE_VERSION = 2;
const REST_OPTIONS = [0, 10, 20, 30];
const THEMES = ['dark', 'light', 'auto'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/* ---------- Fechas (siempre en hora local) ---------- */
export const dkey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const mondayOf = d => addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -((d.getDay() + 6) % 7));
export const fromKey = k => new Date(`${k}T00:00`);
const dayDiff = (a, b) => Math.round((fromKey(dkey(a)) - fromKey(dkey(b))) / 864e5); // robusto ante cambio de hora

/* ---------- Rutinas ---------- */
export const customToWorkout = c => ({ id: c.id, n: c.name, a: 'cuerpo', r: 1, ex: c.ex, custom: true });
export const allWorkouts = (custom = []) => [...WORKOUTS, ...custom.map(customToWorkout)];

export function steps(w, lv, restOverride = 0) {
  const L = LEVELS[lv], rest = restOverride || L.rest, work = w.gentle ? L.w + 10 : L.w, out = [];
  for (let r = 0; r < w.r; r++) w.ex.forEach(id => out.push({ id, work, rest, round: r + 1 }));
  return out;
}
export const minutes = (w, lv, restOverride = 0) =>
  Math.max(1, Math.round(steps(w, lv, restOverride).reduce((t, x) => t + x.work + x.rest, 0) / 60));
// Estimación orientativa: ~7,5 kcal/min en ejercicio general y ~3 en estiramiento (persona de 70 kg)
export const kcal = (min, w) => Math.round(min * (w && w.a === 'estira' ? 3 : 7.5));

/* ---------- Plan de 4 semanas ---------- */
const LAYOUTS = { 2: [1, 4], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5] };
export function buildPlan({ goal, days }, now = new Date()) {
  const seq = (GOALS[goal] || GOALS.tone).seq, idx = LAYOUTS[days] || LAYOUTS[3];
  let n = 0;
  const weeks = [0, 1, 2, 3].map(() => Array.from({ length: 7 }, (_, d) => (idx.includes(d) ? seq[n++ % seq.length] : null)));
  return { start: dkey(mondayOf(now)), weeks };
}

export const planExpired = (plan, now = new Date()) => dayDiff(now, fromKey(plan.start)) >= 28;

export const doneOn = (log, key) => log.filter(l => l.date === key);
export function streak(log, now = new Date()) {
  const days = new Set(log.map(l => l.date));
  let n = 0, d = now;
  if (!days.has(dkey(d))) d = addDays(d, -1); // hoy aún no cuenta como día roto
  while (days.has(dkey(d))) { n++; d = addDays(d, -1); }
  return n;
}

// Rutina de hoy: la del plan si existe; si no, una sugerencia rotativa según el objetivo
export function todaysPick(state, now = new Date()) {
  const all = allWorkouts(state.custom), get = id => all.find(w => w.id === id);
  if (state.plan) {
    const diff = dayDiff(now, fromKey(state.plan.start)), id = diff >= 0 ? state.plan.weeks[Math.floor(diff / 7)]?.[diff % 7] : null;
    if (id && get(id)) return { w: get(id), planned: true };
  }
  const seq = (GOALS[state.profile.goal] || GOALS.tone).seq;
  return { w: get(seq[now.getDate() % seq.length]), planned: false };
}

/* ---------- Estado guardado: valores por defecto y saneamiento ---------- */
export const defaultState = () => ({
  v: STATE_VERSION,
  profile: { goal: 'tone', level: 1, days: 3, done: false },
  settings: { voice: true, sound: true, rest: 0, theme: 'dark', themeChosen: false, installDismissed: false, remind: '' },
  plan: null, log: [], weights: [], custom: []
});

const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const num = (v, lo, hi) => (typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi ? v : null);

// Nunca confía en lo guardado: descarta lo inválido y conserva lo aprovechable.
export function sanitizeState(raw) {
  const s = defaultState();
  if (!isObj(raw)) return s;
  const p = isObj(raw.profile) ? raw.profile : {}, t = isObj(raw.settings) ? raw.settings : {};
  if (GOALS[p.goal]) s.profile.goal = p.goal;
  if (LEVELS[p.level]) s.profile.level = p.level;
  if (LAYOUTS[p.days]) s.profile.days = p.days;
  s.profile.done = p.done === true;
  s.settings.voice = t.voice !== false;
  s.settings.sound = t.sound !== false;
  if (REST_OPTIONS.includes(t.rest)) s.settings.rest = t.rest;
  s.settings.themeChosen = t.themeChosen === true;
  s.settings.installDismissed = t.installDismissed === true;
  if (s.settings.themeChosen && THEMES.includes(t.theme)) s.settings.theme = t.theme;
  if (typeof t.remind === 'string' && /^\d{2}:\d{2}$/.test(t.remind)) s.settings.remind = t.remind;

  s.custom = (Array.isArray(raw.custom) ? raw.custom : [])
    .filter(c => isObj(c) && typeof c.id === 'string' && typeof c.name === 'string' && Array.isArray(c.ex))
    .map(c => ({ id: c.id.slice(0, 40), name: c.name.slice(0, 60), ex: c.ex.filter(id => EX[id]) }))
    .filter(c => c.ex.length >= 2);
  const known = new Set([...WORKOUTS.map(w => w.id), ...s.custom.map(c => c.id)]);

  const pl = raw.plan;
  if (isObj(pl) && DATE_RE.test(pl.start) && Array.isArray(pl.weeks) && pl.weeks.length === 4 &&
      pl.weeks.every(w => Array.isArray(w) && w.length === 7)) {
    s.plan = { start: pl.start, weeks: pl.weeks.map(w => w.map(id => (known.has(id) ? id : null))) };
  }
  s.log = (Array.isArray(raw.log) ? raw.log : [])
    .filter(l => isObj(l) && DATE_RE.test(l.date) && num(l.min, 0, 600) !== null)
    .map(l => ({ date: l.date, wid: known.has(l.wid) ? l.wid : 'ini', name: String(l.name || '').slice(0, 60), min: l.min, kcal: num(l.kcal, 0, 5000) ?? 0 }))
    .slice(-2000);
  s.weights = (Array.isArray(raw.weights) ? raw.weights : [])
    .filter(w => isObj(w) && DATE_RE.test(w.date) && num(w.kg, 20, 400) !== null)
    .map(w => ({ date: w.date, kg: w.kg })).slice(-1000);
  return s;
}
