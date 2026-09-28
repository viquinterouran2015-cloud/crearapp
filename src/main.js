import './styles.css';
import { animSvg } from './anim.js';
import { AREAS, EX, WORKOUTS, LEVELS, GOALS } from './data.js';
/* ---------- Utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const IC = {
  home: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  compass: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.5 8.5l-2 5-5 2 2-5z',
  cal: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  play: 'M7 4l13 8-13 8z', pause: 'M8 5v14M16 5v14', next: 'M5 4l10 8-10 8zM19 5v14', prev: 'M19 4L9 12l10 8zM5 5v14',
  x: 'M6 6l12 12M18 6L6 18', check: 'M5 12.5l4.5 4.5L19 7.5', plus: 'M12 5v14M5 12h14',
  flame: 'M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2', gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19 12l2-1-1-3-2 .5-1.5-1.5.5-2-3-1-1 2h-2l-1-2-3 1 .5 2L6.5 8.5 4.5 8l-1 3 2 1v2l-2 1 1 3 2-.5L8 19.5l-.5 2 3 1 1-2h2l1 2 3-1-.5-2 1.5-1.5 2 .5 1-3-2-1z',
  bolt: 'M13 3L5 14h6l-1 7 8-11h-6z', edit: 'M4 20l4-1 11-11-3-3L5 16zM14 6l3 3'
};
const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${IC[n]}"/></svg>`;
// Un glifo simple por zona para las tarjetas y el reproductor
const GLYPH = {
  cuerpo: 'M12 4a2 2 0 1 0 0 .1M12 8v6M7 10l5-2 5 2M9 21l3-7 3 7',
  abs: 'M8 5h8v14H8zM8 9.5h8M8 14h8M12 5v14',
  espalda: 'M6 5c2 3 4 3 6 3s4 0 6-3M12 8v12M7 12l5 2 5-2',
  gluteos: 'M4 14c0-5 4-7 8-3 4-4 8-2 8 3s-4 6-8 2c-4 4-8 3-8-2z',
  piernas: 'M9 3l-2 9 2 9M15 3l2 9-2 9',
  brazos: 'M4 17l6-6 3 3 7-7M15 7h5v5',
  pecho: 'M4 8c4-2 6 0 8 2 2-2 4-4 8-2v5c-4 2-6 0-8-2-2 2-4 4-8 2z',
  cardio: 'M3 12h4l2-6 4 12 2-6h6',
  estira: 'M12 3v18M5 8c3 2 5 2 7 2s4 0 7-2M6 20c2-2 4-3 6-3s4 1 6 3'
};
const glyph = a => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${GLYPH[a]}" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const dkey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const mondayOf = d => addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -((d.getDay() + 6) % 7));
const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/* ---------- Estado (localStorage, sin cuentas) ---------- */
const KEY = 'fluir:v1';
const DEFAULT = { profile: { goal: 'tone', level: 1, days: 3, done: false },
  settings: { voice: true, sound: true, rest: 0, theme: 'dark', remind: '' },
  plan: null, log: [], weights: [], custom: [] };
let S;
try { S = Object.assign(structuredClone(DEFAULT), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { S = structuredClone(DEFAULT); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* modo privado */ } };
const applyTheme = () => { const t = S.settings.theme; t === 'auto' ? document.documentElement.removeAttribute('data-theme') : document.documentElement.setAttribute('data-theme', t); };
if (!S.settings.themeChosen) S.settings.theme = 'dark'; // nuevo diseño oscuro por defecto
applyTheme();

/* ---------- Modelo ---------- */
const allWorkouts = () => [...WORKOUTS, ...S.custom.map(c => ({ id: c.id, n: c.name, a: 'cuerpo', r: 1, ex: c.ex, custom: true }))];
const getW = id => allWorkouts().find(w => w.id === id);
function steps(w, lv) {
  const L = LEVELS[lv], rest = S.settings.rest || L.rest, work = w.gentle ? L.w + 10 : L.w, out = [];
  for (let r = 0; r < w.r; r++) w.ex.forEach(id => out.push({ id, work, rest, round: r + 1 }));
  return out;
}
const minutes = (w, lv) => { const s = steps(w, lv); return Math.max(1, Math.round(s.reduce((t, x) => t + x.work + x.rest, 0) / 60)); };
const kcal = (min, w) => Math.round(min * (w && w.a === 'estira' ? 3 : 7.5));

function buildPlan() {
  const { goal, days } = S.profile, seq = GOALS[goal].seq;
  const layouts = { 2: [1, 4], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5] };
  const idx = layouts[days] || layouts[3];
  let n = 0;
  const weeks = [0, 1, 2, 3].map(() => Array.from({ length: 7 }, (_, d) => idx.includes(d) ? seq[n++ % seq.length] : null));
  S.plan = { start: dkey(mondayOf(new Date())), weeks };
  save();
}
const doneOn = k => S.log.filter(l => l.date === k);
function streak() {
  let n = 0, d = new Date();
  if (!doneOn(dkey(d)).length) d = addDays(d, -1);
  while (doneOn(dkey(d)).length) { n++; d = addDays(d, -1); }
  return n;
}
function todaysPick() {
  if (S.plan) {
    const start = new Date(S.plan.start + 'T00:00'), diff = Math.floor((new Date() - start) / 864e5);
    const id = S.plan.weeks[Math.floor(diff / 7)]?.[diff % 7];
    if (id && getW(id)) return { w: getW(id), planned: true };
  }
  const seq = GOALS[S.profile.goal].seq;
  return { w: getW(seq[new Date().getDate() % seq.length]), planned: false };
}

/* ---------- UI base ---------- */
const view = $('#view'), overlay = $('#overlay');
let toastT;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
function sheet(html, onMount) {
  overlay.hidden = false;
  overlay.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  overlay.onclick = e => { if (e.target === overlay) closeSheet(); };
  overlay.querySelectorAll('[data-close]').forEach(b => b.onclick = closeSheet);
  onMount && onMount(overlay.firstChild);
}
function closeSheet() { overlay.hidden = true; overlay.innerHTML = ''; }
addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) closeSheet(); });

const NAV = [['hoy', 'Hoy', 'home'], ['explorar', 'Explorar', 'compass'], ['plan', 'Plan', 'cal'], ['progreso', 'Progreso', 'chart']];
function renderNav(cur) {
  $('#nav').innerHTML = `<div class="brand"><i></i>Fluir</div>` +
    NAV.map(([k, n, i]) => `<a href="#/${k}" ${k === cur ? 'aria-current="page"' : ''}>${ic(i)}<span>${n}</span></a>`).join('');
}

/* ---------- Fotos optimizadas (opcionales) ---------- */
let IMG = {};
function photo(key, sizes, eager = false) {
  const p = IMG[key]; if (!p) return '';
  return `<img class="photo" alt="" src="${p.src}" srcset="${p.srcset}" sizes="${sizes}" style="background-image:url(${p.lqip})" decoding="async" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'}>`;
}
fetch('img/manifest.json').then(r => (r.ok ? r.json() : {})).then(j => {
  if (!Object.keys(j).length) return;
  IMG = j;
  if (overlay.hidden && !document.querySelector('.player')) route();
}).catch(() => {});

/* ---------- Tarjetas ---------- */
function wcard(w) {
  const lv = S.profile.level, m = minutes(w, lv), c = AREAS[w.a].c;
  return `<article class="card wcard" style="--c:${c}" tabindex="0" data-w="${w.id}" role="button" aria-label="Ver ${esc(w.n)}">
    <div class="art ${IMG[w.a] ? 'has-photo' : ''}">${glyph(w.a)}${photo(w.a, '(min-width:760px) 300px, 50vw')}</div>
    <button class="go" data-go="${w.id}" aria-label="Empezar ${esc(w.n)}">${ic('play')}</button>
    <div class="body"><span class="tag">${w.custom ? 'Mi rutina' : AREAS[w.a].n}</span><h3>${esc(w.n)}</h3>
    <span class="pill">${ic('clock')} ${m} min · ${w.ex.length} ejercicios</span></div></article>`;
}
function bindCards(root) {
  root.querySelectorAll('[data-w]').forEach(el => {
    el.onclick = e => { const g = e.target.closest('[data-go]'); g ? startWorkout(g.dataset.go) : detail(el.dataset.w); };
    el.onkeydown = e => { if (e.key === 'Enter' && e.target === el) detail(el.dataset.w); };
  });
}

/* ---------- Vistas ---------- */
const VIEWS = {
  hoy() {
    const { w, planned } = todaysPick(), lv = S.profile.level, st = streak(), t = dkey();
    const monday = mondayOf(new Date()), h = new Date().getHours();
    const hi = h < 6 ? 'Buenas noches' : h < 13 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
    const weekHtml = DOW.map((d, i) => { const k = dkey(addDays(monday, i)); return `<div class="${doneOn(k).length ? 'on' : ''} ${k === t ? 'today' : ''}">${d}<b>${doneOn(k).length ? ic('check') : ''}</b></div>`; }).join('');
    const quick = [5, 10, 15].map(m => `<button class="chip" data-quick="${m}">${ic('bolt')} ${m} min</button>`).join('');
    const recent = [...new Map(S.log.slice().reverse().map(l => [l.wid, l])).values()].slice(0, 4).map(l => getW(l.wid)).filter(Boolean);
    return `<div class="stack"><div class="row between"><div><p class="muted small">${hi}</p><h1>¿Listo para moverte?</h1></div>
      <button class="icon-btn" data-settings aria-label="Ajustes">${ic('gear')}</button></div>
      <section class="card hero ${IMG.hero ? 'has-photo' : ''}" style="--c:#fff">${photo('hero', '(min-width:760px) 720px, 100vw', true)}<p class="small muted">${planned ? 'Tu plan de hoy' : 'Sugerencia para hoy'}</p>
        <h2 style="font-size:1.5rem;margin:4px 0 6px">${esc(w.n)}</h2>
        <p class="muted small row" style="gap:6px">${ic('clock')} ${minutes(w, lv)} min · ${LEVELS[lv].n} · ~${kcal(minutes(w, lv), w)} kcal</p>
        <div class="row" style="margin-top:18px"><button class="btn" data-start="${w.id}">${ic('play')} Empezar ahora</button>
        <button class="btn line sm" data-detail="${w.id}">Ver ejercicios</button></div></section>
      <div class="card streak row between"><div class="row">${ic('flame')}<div><b>${st} ${st === 1 ? 'día' : 'días'} de racha</b><p class="small muted">${st ? 'Sigue así, lo estás logrando.' : 'Un entrenamiento hoy empieza tu racha.'}</p></div></div></div>
      <div class="card"><div class="week">${weekHtml}</div></div></div>
      <section class="sec"><h2>Rápido: elige tu tiempo</h2><div class="chips" style="flex-wrap:wrap;overflow:visible">${quick}</div></section>
      ${recent.length ? `<section class="sec"><h2>Repite tus favoritas</h2><div class="grid">${recent.map(wcard).join('')}</div></section>` : ''}`;
  },

  explorar() {
    const f = VIEWS._f || (VIEWS._f = { area: 'all', q: '', dur: 'all' });
    const list = allWorkouts().filter(w => (f.area === 'all' || w.a === f.area || (f.area === 'mine' && w.custom)) &&
      (!f.q || w.n.toLowerCase().includes(f.q.toLowerCase())) &&
      (f.dur === 'all' || (f.dur === 'short' ? minutes(w, S.profile.level) <= 8 : minutes(w, S.profile.level) > 8)));
    const chip = (k, n) => `<button class="chip" data-area="${k}" aria-pressed="${f.area === k}">${n}</button>`;
    return `<h1>Explorar</h1><p class="muted" style="margin:4px 0 16px">Todo a un toque. Sin registros ni pagos.</p>
      <input class="search" type="search" placeholder="Buscar rutina…" value="${esc(f.q)}" aria-label="Buscar" id="q">
      <div class="chips">${chip('all', 'Todas')}${Object.entries(AREAS).map(([k, a]) => chip(k, a.n)).join('')}${S.custom.length ? chip('mine', 'Mis rutinas') : ''}</div>
      <div class="chips"><button class="chip" data-dur="all" aria-pressed="${f.dur === 'all'}">Cualquier duración</button>
        <button class="chip" data-dur="short" aria-pressed="${f.dur === 'short'}">≤ 8 min</button>
        <button class="chip" data-dur="long" aria-pressed="${f.dur === 'long'}">+ 8 min</button></div>
      <div class="grid" style="margin-top:8px">${list.map(wcard).join('')}
        <button class="card wcard new" id="newW">${ic('plus')}Crear mi rutina</button></div>
      ${list.length ? '' : '<p class="muted" style="text-align:center;margin-top:24px">Sin resultados. Prueba otro filtro.</p>'}`;
  },

  plan() {
    if (!S.plan) buildPlan();
    const start = new Date(S.plan.start + 'T00:00'), t = dkey();
    const weeks = S.plan.weeks.map((wk, wi) => {
      const cells = wk.map((id, di) => {
        const d = addDays(start, wi * 7 + di), k = dkey(d), w = id && getW(id), done = doneOn(k).length;
        return `<button class="day ${w ? 'train' : ''} ${done ? 'done' : ''} ${k === t ? 'today' : ''}" ${w ? `data-detail="${id}"` : 'disabled'} aria-label="${DOW[di]} ${d.getDate()} ${w ? esc(w.n) : 'descanso'}">${DOW[di]}<b>${done ? '✓' : d.getDate()}</b>${w ? '' : 'zzz'}</button>`;
      }).join('');
      const kc = wk.reduce((s, id) => s + (id ? kcal(minutes(getW(id), S.profile.level), getW(id)) : 0), 0);
      return `<div class="card plan-week"><div class="row between"><h3>Semana ${wi + 1}</h3><span class="pill">${ic('flame')} ${kc} kcal</span></div><div class="days">${cells}</div></div>`;
    }).join('');
    return `<div class="row between"><div><h1>Tu plan de 4 semanas</h1><p class="muted">${GOALS[S.profile.goal].n} · ${S.profile.days} días/sem · ${LEVELS[S.profile.level].n}</p></div></div>
      <div class="row" style="margin:16px 0"><button class="btn ghost sm" id="editPlan">${ic('edit')} Ajustar plan</button></div>${weeks}
      <p class="muted small">Toca un día para ver o cambiar la rutina. Los días de descanso también cuentan.</p>`;
  },

  progreso() {
    const t = new Date(), m0 = new Date(t.getFullYear(), t.getMonth(), 1), dim = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
    const total = S.log.reduce((s, l) => s + l.min, 0), kc = S.log.reduce((s, l) => s + l.kcal, 0);
    const bars = Array.from({ length: 7 }, (_, i) => { const d = addDays(t, i - 6), mins = doneOn(dkey(d)).reduce((s, l) => s + l.min, 0); return [DOW[(d.getDay() + 6) % 7], mins]; });
    const mx = Math.max(10, ...bars.map(b => b[1]));
    const cal = Array.from({ length: (m0.getDay() + 6) % 7 }, () => '<span style="background:none"></span>').join('') +
      Array.from({ length: dim }, (_, i) => `<span class="${doneOn(dkey(new Date(t.getFullYear(), t.getMonth(), i + 1))).length ? 'on' : ''}">${i + 1}</span>`).join('');
    const ws = S.weights.slice(-12), last = ws[ws.length - 1];
    let spark = '';
    if (ws.length > 1) {
      const lo = Math.min(...ws.map(w => w.kg)) - 1, hi = Math.max(...ws.map(w => w.kg)) + 1;
      const pts = ws.map((w, i) => `${(i / (ws.length - 1)) * 280 + 10},${70 - ((w.kg - lo) / (hi - lo)) * 60}`).join(' ');
      spark = `<svg viewBox="0 0 300 80" style="width:100%;margin-top:10px" role="img" aria-label="Evolución del peso"><polyline points="${pts}" fill="none" stroke="var(--pri)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }
    const diff = ws.length > 1 ? (last.kg - ws[0].kg).toFixed(1) : null;
    return `<div class="row between"><h1>Tu progreso</h1><button class="icon-btn" data-settings aria-label="Ajustes">${ic('gear')}</button></div>
      <div class="stats sec"><div class="card stat"><b>${S.log.length}</b><span class="small muted">entrenos</span></div>
        <div class="card stat"><b>${total}</b><span class="small muted">minutos</span></div>
        <div class="card stat"><b>${kc}</b><span class="small muted">kcal aprox.</span></div></div>
      <section class="sec"><h2>Últimos 7 días</h2><div class="card"><div class="bars">${bars.map(([d, v]) => `<div><i style="height:${(v / mx) * 78}%" title="${v} min"></i>${d}</div>`).join('')}</div></div></section>
      <section class="sec"><h2>${t.toLocaleDateString('es', { month: 'long', year: 'numeric' })}</h2><div class="card"><div class="cal">${cal}</div></div></section>
      <section class="sec"><h2>Peso corporal</h2><div class="card"><div class="row between"><div><b style="font-size:1.6rem">${last ? last.kg + ' kg' : '—'}</b>
        ${diff !== null ? `<p class="small muted">${diff > 0 ? '+' : ''}${diff} kg desde el inicio</p>` : ''}</div></div>${spark}
        <form class="field" id="wf" style="margin-top:14px"><input type="number" step="0.1" min="20" max="400" placeholder="Hoy pesas… (kg)" required aria-label="Peso en kg"><button class="btn sm">Guardar</button></form></div></section>`;
  }
};

/* ---------- Router ---------- */
function route() {
  const [path, qs] = (location.hash.slice(2) || 'hoy').split('?');
  const name = VIEWS[path] && !path.startsWith('_') ? path : 'hoy';
  renderNav(name);
  view.innerHTML = VIEWS[name]();
  bindView(name);
  scrollTo(0, 0);
  if (!S.profile.done) onboarding();
  else if (qs === 'go=1') { history.replaceState(null, '', '#/hoy'); startWorkout(todaysPick().w.id); }
}
addEventListener('hashchange', route);

function bindView(name) {
  bindCards(view);
  view.querySelectorAll('[data-settings]').forEach(b => b.onclick = settings);
  view.querySelectorAll('[data-start]').forEach(b => b.onclick = () => startWorkout(b.dataset.start));
  view.querySelectorAll('[data-detail]').forEach(b => b.onclick = () => detail(b.dataset.detail));
  view.querySelectorAll('[data-quick]').forEach(b => b.onclick = () => quickWorkout(+b.dataset.quick));
  if (name === 'explorar') {
    const f = VIEWS._f, redraw = () => { view.innerHTML = VIEWS.explorar(); bindView('explorar'); };
    view.querySelectorAll('[data-area]').forEach(b => b.onclick = () => { f.area = b.dataset.area; redraw(); });
    view.querySelectorAll('[data-dur]').forEach(b => b.onclick = () => { f.dur = b.dataset.dur; redraw(); });
    $('#q').oninput = e => { f.q = e.target.value; const p = e.target.selectionStart; redraw(); const q = $('#q'); q.focus(); q.setSelectionRange(p, p); };
    $('#newW').onclick = () => builder();
  }
  if (name === 'plan') $('#editPlan').onclick = () => onboarding(true);
  if (name === 'progreso') $('#wf').onsubmit = e => {
    e.preventDefault(); const kg = parseFloat(e.target.firstChild.value);
    if (!kg) return; S.weights.push({ date: dkey(), kg }); save(); route(); toast('Peso guardado');
  };
}

/* ---------- Hojas ---------- */
function detail(id, lv = S.profile.level) {
  const w = getW(id); if (!w) return;
  const list = steps(w, lv).slice(0, w.ex.length);
  sheet(`<div class="row between"><span class="tag" style="--c:${AREAS[w.a].c}">${w.custom ? 'Mi rutina' : AREAS[w.a].n}</span><button class="icon-btn" data-close aria-label="Cerrar">${ic('x')}</button></div>
    <h1 style="margin:10px 0 4px">${esc(w.n)}</h1>
    <p class="muted small" id="meta">${minutes(w, lv)} min · ${w.r} ${w.r > 1 ? 'rondas' : 'ronda'} · ~${kcal(minutes(w, lv), w)} kcal</p>
    <div class="seg" style="margin:14px 0">${[1, 2, 3].map(n => `<button data-lv="${n}" aria-pressed="${n === lv}">${LEVELS[n].n}</button>`).join('')}</div>
    <ol class="xlist">${list.map((s, i) => `<li><div class="thumb">${animSvg(s.id)}</div><div><b>${i + 1}. ${esc(EX[s.id].n)}</b><p class="small muted">${esc(EX[s.id].t)}</p></div></li>`).join('')}</ol>
    <div class="row" style="margin-top:18px"><button class="btn block" id="go">${ic('play')} Empezar</button>${w.custom ? '<button class="btn line" id="del" aria-label="Eliminar rutina">Eliminar</button>' : ''}</div>`,
  el => {
    el.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => detail(id, +b.dataset.lv));
    $('#go', el).onclick = () => startWorkout(id, lv);
    const d = $('#del', el); if (d) d.onclick = () => { S.custom = S.custom.filter(c => c.id !== id); save(); closeSheet(); route(); toast('Rutina eliminada'); };
  });
}

function onboarding(edit = false) {
  const p = { ...S.profile };
  const draw = () => sheet(`<h1>${edit ? 'Ajusta tu plan' : 'Crea tu plan en 10 segundos'}</h1>
    <p class="muted" style="margin:4px 0 18px">${edit ? '' : 'Sin cuentas ni correos. Puedes cambiarlo cuando quieras.'}</p>
    <h3>Mi objetivo</h3><div class="opts" style="margin:8px 0 18px">${Object.entries(GOALS).map(([k, g]) => `<button class="opt" data-g="${k}" aria-pressed="${p.goal === k}">${g.n}</button>`).join('')}</div>
    <h3>Mi nivel</h3><div class="seg" style="margin:8px 0 18px">${[1, 2, 3].map(n => `<button data-l="${n}" aria-pressed="${p.level === n}">${LEVELS[n].n}</button>`).join('')}</div>
    <h3>Días por semana</h3><div class="seg" style="margin:8px 0 22px">${[2, 3, 4, 5, 6].map(n => `<button data-d="${n}" aria-pressed="${p.days === n}">${n}</button>`).join('')}</div>
    <button class="btn block" id="ok">${edit ? 'Guardar' : 'Empezar'}</button>${edit ? '<button class="btn line block" data-close style="margin-top:8px">Cancelar</button>' : ''}`,
  el => {
    el.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { p.goal = b.dataset.g; draw(); });
    el.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { p.level = +b.dataset.l; draw(); });
    el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { p.days = +b.dataset.d; draw(); });
    $('#ok', el).onclick = () => { S.profile = { ...p, done: true }; buildPlan(); closeSheet(); route(); toast('Plan listo'); };
    if (!edit) overlay.onclick = null; // el primer arranque no se cierra tocando fuera
  });
  draw();
}

function settings() {
  const s = S.settings, sw = (k, n, d) => `<label class="switch"><span><b>${n}</b><br><span class="small muted">${d}</span></span><input type="checkbox" data-s="${k}" ${s[k] ? 'checked' : ''}></label>`;
  sheet(`<div class="row between"><h1>Ajustes</h1><button class="icon-btn" data-close aria-label="Cerrar">${ic('x')}</button></div>
    <div class="card" style="margin:14px 0">${sw('voice', 'Guía por voz', 'Anuncia cada ejercicio y la cuenta atrás')}${sw('sound', 'Sonidos', 'Pitidos al cambiar de fase')}</div>
    <div class="card stack"><div><b>Descanso entre ejercicios</b><div class="seg" style="margin-top:8px">${[[0, 'Auto'], [10, '10 s'], [20, '20 s'], [30, '30 s']].map(([v, n]) => `<button data-rest="${v}" aria-pressed="${s.rest === v}">${n}</button>`).join('')}</div></div>
      <div><b>Tema</b><div class="seg" style="margin-top:8px">${[['dark', 'Oscuro'], ['light', 'Claro'], ['auto', 'Sistema']].map(([v, n]) => `<button data-theme="${v}" aria-pressed="${s.theme === v}">${n}</button>`).join('')}</div></div>
      <div><b>Recordatorio diario</b><p class="small muted">Se avisa mientras la app está abierta o instalada.</p><div class="field" style="margin-top:8px"><input type="time" id="rem" value="${esc(s.remind)}"><button class="btn ghost sm" id="remOk">Guardar</button></div></div></div>
    <div class="row" style="margin-top:14px;flex-wrap:wrap"><button class="btn ghost sm" id="plan2">Cambiar objetivo / plan</button><button class="btn line sm" id="exp">Exportar datos</button><button class="btn line sm" id="rst" style="color:var(--danger)">Borrar todo</button></div>
    <p class="small muted" style="margin-top:16px">Tus datos viven solo en este dispositivo.</p>`,
  el => {
    el.querySelectorAll('[data-s]').forEach(i => i.onchange = () => { s[i.dataset.s] = i.checked; save(); });
    el.querySelectorAll('[data-rest]').forEach(b => b.onclick = () => { s.rest = +b.dataset.rest; save(); settings(); });
    el.querySelectorAll('[data-theme]').forEach(b => b.onclick = () => { s.theme = b.dataset.theme; s.themeChosen = true; save(); applyTheme(); settings(); });
    $('#remOk', el).onclick = async () => {
      s.remind = $('#rem', el).value; save();
      if (s.remind && 'Notification' in window && Notification.permission === 'default') await Notification.requestPermission();
      toast(s.remind ? `Recordatorio a las ${s.remind}` : 'Recordatorio desactivado');
    };
    $('#plan2', el).onclick = () => onboarding(true);
    $('#exp', el).onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' })); a.download = 'fluir-datos.json'; a.click(); };
    $('#rst', el).onclick = () => { if (confirm('¿Borrar todo tu progreso y ajustes?')) { localStorage.removeItem(KEY); location.reload(); } };
  });
}

function builder() {
  const sel = [];
  const draw = () => sheet(`<div class="row between"><h1>Nueva rutina</h1><button class="icon-btn" data-close aria-label="Cerrar">${ic('x')}</button></div>
    <input type="text" id="nm" placeholder="Nombre (ej. Lunes de piernas)" style="width:100%;margin:12px 0" value="${esc(builder.name || '')}">
    <p class="small muted" style="margin-bottom:8px">Toca para añadir en orden · ${sel.length} elegidos</p>
    ${Object.entries(EX).map(([id, e]) => `<button class="pick" data-x="${id}" aria-pressed="${sel.includes(id)}"><span class="tag" style="--c:${AREAS[e.a].c}">${AREAS[e.a].n}</span><b>${esc(e.n)}</b>${sel.includes(id) ? `<span style="margin-left:auto" class="muted">#${sel.indexOf(id) + 1}</span>` : ''}</button>`).join('')}
    <button class="btn block" id="sv" style="position:sticky;bottom:0" ${sel.length < 2 ? 'disabled' : ''}>Guardar rutina</button>`,
  el => {
    el.querySelectorAll('[data-x]').forEach(b => b.onclick = () => {
      builder.name = $('#nm', el).value; const i = sel.indexOf(b.dataset.x);
      i < 0 ? sel.push(b.dataset.x) : sel.splice(i, 1);
      const top = $('.sheet', overlay).scrollTop; draw(); $('.sheet', overlay).scrollTop = top;
    });
    $('#sv', el).onclick = () => {
      const name = $('#nm', el).value.trim() || 'Mi rutina';
      S.custom.push({ id: 'c' + Date.now(), name, ex: sel.slice() }); builder.name = ''; save(); closeSheet(); VIEWS._f.area = 'mine'; route(); toast('Rutina guardada');
    };
  });
  draw();
}

function quickWorkout(min) {
  // Rutina a medida: mezcla ejercicios de tu objetivo hasta llegar a los minutos pedidos
  const lv = S.profile.level, L = LEVELS[lv], per = (L.w + (S.settings.rest || L.rest)) / 60;
  const pool = GOALS[S.profile.goal].seq.flatMap(id => getW(id).ex);
  const uniq = [...new Set(pool)].sort(() => Math.random() - .5);
  const count = Math.max(3, Math.round(min / per));
  const ex = Array.from({ length: count }, (_, i) => uniq[i % uniq.length]);
  startWorkout(null, lv, { id: 'quick', n: `Rápido · ${min} min`, a: 'cuerpo', r: 1, ex });
}

/* ---------- Reproductor ---------- */
let audio;
function beep(f = 880, d = .12) {
  if (!S.settings.sound) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.frequency.value = f; g.gain.value = .12; o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime + d);
  } catch { /* sin audio */ }
}
function say(t) {
  if (!S.settings.voice || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'es-ES'; u.rate = 1.05; speechSynthesis.speak(u);
}

function startWorkout(id, lv = S.profile.level, custom) {
  closeSheet();
  const w = custom || getW(id); if (!w) return;
  const list = steps(w, lv), R = 2 * Math.PI * 44;
  let i = 0, phase = 'ready', left = 5, paused = false, wake, total = 0, tick;
  const el = document.createElement('div'); el.className = 'player'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Entrenamiento');
  document.body.appendChild(el);
  try { navigator.wakeLock?.request('screen').then(l => wake = l).catch(() => {}); } catch { /* opcional */ }

  const dur = () => phase === 'ready' ? 5 : phase === 'work' ? list[i].work : list[i].rest;
  function enter(p) {
    phase = p; left = dur(); paused = false;
    const s = list[i], nxt = list[i + 1];
    if (p === 'ready') say(`Prepárate. Primero, ${EX[s.id].n}`);
    if (p === 'work') { beep(1046, .25); say(EX[s.id].n); }
    if (p === 'rest') { beep(520, .2); say(nxt ? `Descansa. Siguiente, ${EX[nxt.id].n}` : 'Descansa'); }
    draw();
  }
  function advance() {
    if (phase === 'ready') return enter('work');
    if (phase === 'work') { if (i === list.length - 1) return finish(); return enter('rest'); }
    i++; enter('work');
  }
  function back() { if (phase === 'work' && list[i].work - left > 3 || i === 0) return enter('work'); i--; enter('work'); }
  function draw() {
    const s = list[i], e = EX[s.id], a = AREAS[e.a], nxt = list[i + 1];
    el.classList.toggle('rest', phase === 'rest'); el.classList.toggle('paused', paused);
    const label = phase === 'ready' ? 'Prepárate' : phase === 'work' ? e.n : 'Descanso';
    el.innerHTML = `<div class="top"><button class="icon-btn" id="quit" aria-label="Salir">${ic('x')}</button>
      <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${list.length}" aria-valuenow="${i}"><i style="width:${(i + (phase === 'rest' ? 1 : 0)) / list.length * 100}%"></i></div>
      <span class="small muted">${i + 1}/${list.length}</span></div>
      <div class="stage"><p class="small muted">${w.r > 1 ? `Ronda ${s.round} de ${w.r} · ` : ''}${esc(w.n)}</p>
        <h1>${esc(label)}</h1>
        <div class="ring" style="--c:${a.c}"><svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="44"/><circle class="fg" id="fg" cx="50" cy="50" r="44" stroke-dasharray="${R}" stroke-dashoffset="0"/></svg>
          <div class="core has-anim">${animSvg(phase === 'rest' && nxt ? nxt.id : s.id)}</div></div>
        <div class="time" id="tm" aria-live="off">${left}</div>
        <p class="muted" style="max-width:34ch">${phase === 'rest' ? (nxt ? `Siguiente: <b>${esc(EX[nxt.id].n)}</b>` : 'Último ejercicio completado') : esc(e.t)}</p></div>
      <div class="controls"><button class="side" id="pv" aria-label="Anterior">${ic('prev')}</button>
        <button class="big" id="pp" aria-label="${paused ? 'Reanudar' : 'Pausar'}">${ic(paused ? 'play' : 'pause')}</button>
        <button class="side" id="nx" aria-label="Siguiente">${ic('next')}</button></div>
      ${phase === 'rest' ? '<button class="btn ghost" id="more" style="margin-top:16px">+20 s</button>' : '<div style="height:64px"></div>'}`;
    $('#quit', el).onclick = quit; $('#pp', el).onclick = () => { paused = !paused; draw(); };
    $('#nx', el).onclick = advance; $('#pv', el).onclick = back;
    const m = $('#more', el); if (m) m.onclick = () => { left += 20; draw(); };
    if (paused) el.querySelector('svg.anim')?.pauseAnimations();
    paint();
  }
  const dt = 250; let last = performance.now(), acc = 0;
  function paint() {
    const t = $('#tm', el), fg = $('#fg', el); if (!t) return;
    t.textContent = Math.ceil(left); fg.style.strokeDashoffset = R * (1 - left / Math.max(dur(), left));
  }
  tick = setInterval(() => {
    const now = performance.now(), d = (now - last) / 1000; last = now;
    if (paused || !el.isConnected) return;
    const before = Math.ceil(left); left -= d; if (phase === 'work') total += d;
    if (Math.ceil(left) !== before && left > 0 && left <= 3) { beep(660, .08); say(String(Math.ceil(left))); }
    if (phase === 'work' && before > Math.ceil(left) && Math.ceil(left) === Math.floor(list[i].work / 2) && list[i].work >= 30) say('Mitad');
    if (left <= 0) advance(); else paint();
  }, dt);

  function cleanup() { clearInterval(tick); wake?.release?.(); window.speechSynthesis?.cancel(); el.remove(); }
  function quit() {
    if (i === 0 && phase === 'ready') return cleanup();
    paused = true; draw();
    sheet(`<h2>¿Terminar aquí?</h2><p class="muted" style="margin:6px 0 16px">Llevas ${Math.round(total / 60) || '<1'} min de ejercicio.</p>
      <button class="btn block" id="cont">Seguir entrenando</button>
      <button class="btn line block" id="fin" style="margin-top:8px">Guardar y salir</button>
      <button class="btn line block" id="out" style="margin-top:8px;color:var(--danger)">Salir sin guardar</button>`,
    s => { $('#cont', s).onclick = () => { closeSheet(); paused = false; draw(); };
      $('#fin', s).onclick = () => { closeSheet(); total > 30 ? finish() : cleanup(); };
      $('#out', s).onclick = () => { closeSheet(); cleanup(); }; });
    overlay.style.zIndex = 70;
  }
  function finish() {
    clearInterval(tick); window.speechSynthesis?.cancel();
    const min = Math.max(1, Math.round(total / 60)), kc = kcal(min, w);
    if (w.id !== 'quick' || total > 30) S.log.push({ date: dkey(), wid: w.id === 'quick' ? 'ini' : w.id, name: w.n, min, kcal: kc });
    save(); beep(1200, .4); say('¡Muy bien! Entrenamiento completado');
    el.classList.remove('rest'); el.classList.remove('paused');
    el.innerHTML = `<div class="stage"><div class="done-badge">${ic('check')}</div><h1>¡Lo lograste!</h1>
      <p class="muted">${esc(w.n)}</p>
      <div class="stats" style="width:100%"><div class="card stat"><b>${min}</b><span class="small muted">min</span></div><div class="card stat"><b>${kc}</b><span class="small muted">kcal</span></div><div class="card stat"><b>${streak()}</b><span class="small muted">racha</span></div></div>
      <p class="small muted">Estira un poco y bebe agua.</p></div>
      <button class="btn block" id="end" style="max-width:560px">Listo</button>`;
    $('#end', el).onclick = () => { cleanup(); route(); };
  }
  enter('ready');
}

/* ---------- Recordatorio (solo con la app abierta) ---------- */
setInterval(() => {
  const r = S.settings.remind, now = new Date(), hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  if (r && r === hm && !doneOn(dkey()).length && sessionStorage.getItem('rem') !== dkey()) {
    sessionStorage.setItem('rem', dkey());
    if ('Notification' in window && Notification.permission === 'granted') new Notification('Fluir', { body: 'Es hora de tu entrenamiento de hoy 💪', icon: '/icons/icon-192.png' });
    else toast('Es hora de tu entrenamiento');
  }
}, 30000);

/* ---------- Arranque ---------- */
route();
