// Lógica pura (sin DOM ni localStorage): fechas, rutinas, plan, racha y validación del estado guardado.
import { EX, WORKOUTS, LEVELS, GOALS, NO_REPS } from './data.js';

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
export const customToWorkout = c => ({ id: c.id, n: c.name, a: 'cuerpo', r: 1, ex: c.ex, custom: true, fixed: true });
export const allWorkouts = (custom = []) => [...WORKOUTS, ...custom.map(customToWorkout)];

// Ejercicios y rondas dependen del nivel: Principiante = variantes suaves, Avanzado = más exigentes y una ronda extra
export const exercisesFor = (w, lv) => (w.lv && w.lv[lv]) || w.ex;
export const roundsFor = (w, lv) => (w.gentle || w.fixed ? w.r : w.r + LEVELS[lv].extra);

export function steps(w, lv, restOverride = 0) {
  const L = LEVELS[lv], rest = restOverride || (w.gentle ? 10 : L.rest), work = w.gentle ? L.gw : L.w, out = [];
  const list = exercisesFor(w, lv), rounds = roundsFor(w, lv);
  for (let r = 0; r < rounds; r++) list.forEach(id => out.push({ id, work, rest, round: r + 1 }));
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

/* ---------- Repeticiones y récords ---------- */
// Se registran repeticiones solo en ejercicios de fuerza contables (no cardio, estiramientos ni isométricos)
export const isTrackable = id => !!EX[id] && EX[id].a !== 'cardio' && EX[id].a !== 'estira' && !NO_REPS.includes(id);

// Mejor serie de cada día para un ejercicio, en orden cronológico
export function repsHistory(reps, ex) {
  const byDay = new Map();
  for (const r of reps) if (r.ex === ex) byDay.set(r.date, Math.max(byDay.get(r.date) ?? 0, r.reps));
  return [...byDay].map(([date, n]) => ({ date, reps: n })).sort((a, b) => a.date.localeCompare(b.date));
}
export const lastReps = (reps, ex) => repsHistory(reps, ex).at(-1)?.reps ?? null;
export const trackedExercises = reps => [...new Set(reps.map(r => r.ex))].filter(id => EX[id]);

// Racha más larga de días consecutivos con entrenamiento
export function bestStreak(log) {
  const days = [...new Set(log.map(l => l.date))].sort();
  let best = 0, run = 0, prev = null;
  for (const k of days) {
    run = prev && dayDiff(fromKey(k), fromKey(prev)) === 1 ? run + 1 : 1;
    best = Math.max(best, run); prev = k;
  }
  return best;
}
// Minutos de la mejor semana (lunes a domingo)
export function bestWeekMinutes(log) {
  const weeks = new Map();
  for (const l of log) { const k = dkey(mondayOf(fromKey(l.date))); weeks.set(k, (weeks.get(k) ?? 0) + l.min); }
  return Math.max(0, ...weeks.values());
}

// Zonas que trabaja una rutina en un nivel (para el mapa muscular)
export const areasOf = (w, lv) => new Set(exercisesFor(w, lv).map(id => EX[id].a));

/* ---------- Rutina a tu medida ---------- */
// Elige ejercicios de las zonas pedidas (en la versión del nivel), alternando zonas, hasta llegar a los minutos
export function generateWorkout({ areas = [], minutes: target = 10, level = 1, restOverride = 0, rand = Math.random }) {
  const L = LEVELS[level], wantAll = areas.length === 0 || areas.includes('cuerpo');
  const onlyStretch = areas.length > 0 && areas.every(a => a === 'estira');
  const pool = new Set();
  for (const w of WORKOUTS) for (const id of exercisesFor(w, level)) {
    const a = EX[id].a;
    if (a === 'estira' ? areas.includes('estira') : wantAll || areas.includes(a)) pool.add(id);
  }
  const shuffle = arr => { const x = [...arr]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
  const groups = new Map();
  for (const id of shuffle(pool)) { const a = EX[id].a; groups.set(a, [...(groups.get(a) ?? []), id]); }
  const queues = shuffle([...groups.values()]), order = [];
  while (queues.some(q => q.length)) for (const q of queues) if (q.length) order.push(q.shift());
  const perExercise = (onlyStretch ? L.gw + (restOverride || 10) : L.w + (restOverride || L.rest)) / 60;
  const count = Math.max(3, Math.round(target / perExercise));
  const ex = order.slice(0, count);
  const r = Math.max(1, Math.round(count / ex.length));
  return { id: 'gen', n: `A tu medida · ${target} min`, a: areas.length === 1 ? areas[0] : 'cuerpo', r, ex, fixed: true, gentle: onlyStretch };
}

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
  plan: null, log: [], weights: [], custom: [], reps: []
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
  s.reps = (Array.isArray(raw.reps) ? raw.reps : [])
    .filter(r => isObj(r) && DATE_RE.test(r.date) && EX[r.ex] && num(r.reps, 1, 500) !== null)
    .map(r => ({ date: r.date, ex: r.ex, reps: Math.round(r.reps) })).slice(-3000);
  s.weights = (Array.isArray(raw.weights) ? raw.weights : [])
    .filter(w => isObj(w) && DATE_RE.test(w.date) && num(w.kg, 20, 400) !== null)
    .map(w => ({ date: w.date, kg: w.kg })).slice(-1000);
  return s;
}
