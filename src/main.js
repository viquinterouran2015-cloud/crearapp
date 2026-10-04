import './styles.css';
import { animSvg } from './anim.js';
import { registerSW } from 'virtual:pwa-register';
import { bodyMap } from './body.js';
import { AREAS, EX, LEVELS, GOALS, PROGRESSION } from './data.js';
import { DOW, dkey, addDays, mondayOf, sanitizeState, allWorkouts as allW, steps as stepsOf, exercisesFor, roundsFor, minutes as minutesOf, kcal, buildPlan as planFor, doneOn as doneOnLog, streak as streakOf, todaysPick as pickFor, planExpired, isTrackable, repsHistory, lastReps, trackedExercises, bestStreak, bestWeekMinutes, areasOf, generateWorkout } from './model.js';
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
  chev: 'M9 5l7 7-7 7', bolt: 'M13 3L5 14h6l-1 7 8-11h-6z', spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z', edit: 'M4 20l4-1 11-11-3-3L5 16zM14 6l3 3'
};
const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${IC[n]}"/></svg>`;


/* ---------- Estado (localStorage, sin cuentas) ---------- */
const KEY = 'fluir:v1';
let S;
try { S = sanitizeState(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch { S = sanitizeState(null); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* modo privado o sin espacio */ } };
const applyTheme = () => { const t = S.settings.theme; t === 'auto' ? document.documentElement.removeAttribute('data-theme') : document.documentElement.setAttribute('data-theme', t); };
applyTheme();

/* ---------- Modelo (envoltorios sobre model.js con el estado actual) ---------- */
const allWorkouts = () => allW(S.custom);
const getW = id => allWorkouts().find(w => w.id === id);
const steps = (w, lv) => stepsOf(w, lv, S.settings.rest);
const minutes = (w, lv) => minutesOf(w, lv, S.settings.rest);
const buildPlan = () => { S.plan = planFor(S.profile); save(); };
const doneOn = k => doneOnLog(S.log, k);
const streak = () => streakOf(S.log);
const todaysPick = () => pickFor(S);

/* ---------- UI base ---------- */
const view = $('#view'), overlay = $('#overlay');
let toastT;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const calmAnimations = root => { if (reduceMotion) root.querySelectorAll('svg.anim').forEach(s => s.pauseAnimations?.()); };
let lastFocus = null;
// Con un diálogo abierto, lo que queda detrás no debe ser alcanzable (teclado ni lector de pantalla)
function syncInert() {
  const player = document.querySelector('.player'), sheetOpen = !overlay.hidden;
  $('.app').inert = sheetOpen || !!player;
  if (player) player.inert = sheetOpen;
}
const FOCUSABLE = 'button:not([disabled]),input:not([disabled]),select,a[href],[tabindex]:not([tabindex="-1"])';
function sheet(html, onMount, { required = false } = {}) {
  if (overlay.hidden) lastFocus = document.activeElement;
  overlay.hidden = false;
  overlay.dataset.required = required ? '1' : '';
  overlay.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  const dlg = overlay.firstChild, title = dlg.querySelector('h1,h2');
  if (title) { title.id = 'dlg-title'; dlg.setAttribute('aria-labelledby', 'dlg-title'); }
  overlay.onclick = required ? null : e => { if (e.target === overlay) closeSheet(); };
  overlay.querySelectorAll('[data-close]').forEach(b => b.onclick = closeSheet);
  onMount && onMount(dlg);
  calmAnimations(dlg);
  syncInert();
  (dlg.querySelector('[data-close]') || dlg.querySelector(FOCUSABLE))?.focus({ preventScroll: true });
}
function closeSheet() {
  overlay.hidden = true; overlay.innerHTML = ''; overlay.style.zIndex = ''; overlay.dataset.required = '';
  syncInert();
  if (lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true });
  lastFocus = null;
}
addEventListener('keydown', e => {
  if (overlay.hidden) return;
  if (e.key === 'Escape' && !overlay.dataset.required) return closeSheet();
  if (e.key !== 'Tab') return;
  const f = [...overlay.querySelectorAll(FOCUSABLE)];
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

// Avisos discretos: actualización de la app e instalación
const bannerEl = $('#banner');
function banner(text, action, onAction) {
  bannerEl.innerHTML = `<span>${esc(text)}</span><button class="btn sm" type="button">${esc(action)}</button><button class="icon-btn" type="button" aria-label="Cerrar aviso" style="width:36px;height:36px">${ic('x')}</button>`;
  bannerEl.hidden = false;
  const [go, close] = bannerEl.querySelectorAll('button');
  go.onclick = () => { bannerEl.hidden = true; onAction(); };
  close.onclick = () => { bannerEl.hidden = true; };
}
const updateSW = registerSW({
  onNeedRefresh() { banner('Hay una versión nueva de Fluir.', 'Actualizar', () => updateSW(true)); },
  onOfflineReady() { toast('Lista para usar sin conexión'); }
});
let installEvt = null;
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; });
addEventListener('appinstalled', () => { installEvt = null; toast('¡Fluir instalada!'); });
async function installApp() {
  if (!installEvt) return;
  installEvt.prompt(); await installEvt.userChoice.catch(() => {}); installEvt = null;
}

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
// Clips reales de personas (opcionales): public/video/manifest.json lo genera `npm run video`
let VID = {};
const dataSaver = navigator.connection?.saveData === true;
function clipHtml(id, still = false) {
  const v = VID[id]; if (!v) return '';
  if (still) return `<img class="clip" src="${v.poster}" alt="" width="${v.w}" height="${v.h}" loading="lazy" decoding="async">`;
  return `<video class="clip" poster="${v.poster}" width="${v.w}" height="${v.h}" muted loop playsinline preload="${dataSaver ? 'none' : 'auto'}" aria-hidden="true" tabindex="-1" disablepictureinpicture disableremoteplayback><source src="${v.src}" type="video/mp4">${v.webm ? `<source src="${v.webm}" type="video/webm">` : ''}</video>`;
}
// Reproduce/pausa los clips visibles (autoplay solo si el usuario no pidió menos movimiento ni ahorro de datos)
function driveClips(root, playing) {
  root.querySelectorAll('video.clip').forEach(v => {
    v.muted = true;
    if (playing && !reduceMotion && !dataSaver) v.play().catch(() => {}); else v.pause();
  });
}
const loadCatalog = (url, set) => fetch(url).then(r => (r.ok ? r.json() : {})).then(j => {
  if (!Object.keys(j).length) return;
  set(j);
  if (overlay.hidden && !document.querySelector('.player')) route();
}).catch(() => {});
loadCatalog('img/manifest.json', j => { IMG = j; });
loadCatalog('video/manifest.json', j => { VID = j; });

/* ---------- Tarjetas ---------- */
function wcard(w) {
  const lv = S.profile.level, mins = minutes(w, lv), c = AREAS[w.a].c;
  // Tarjeta = botón principal (abre el detalle) + botón ▶ hermano (empieza directo): sin interactivos anidados
  return `<article class="card wcard" style="--c:${c}" data-name="${esc(w.n)}">
    <button class="wmain" data-w="${w.id}" type="button" aria-label="Ver ${esc(w.n)}">
      <span class="art ${IMG[w.a] ? 'has-photo' : ''}">${bodyMap(areasOf(w, lv))}${photo(w.a, '(min-width:760px) 300px, 50vw')}</span>
      <span class="body"><span class="tags"><span class="tag">${w.custom ? 'Mi rutina' : AREAS[w.a].n}</span><span class="lvtag">${LEVELS[lv].n}</span></span><h3>${esc(w.n)}</h3>
      <span class="pill">${ic('clock')} ${mins} min · ${exercisesFor(w, lv).length} ejercicios · ${roundsFor(w, lv)} ${roundsFor(w, lv) > 1 ? 'rondas' : 'ronda'}</span></span>
    </button>
    <button class="go" data-go="${w.id}" type="button" aria-label="Empezar ${esc(w.n)}">${ic('play')}</button></article>`;
}
function bindCards(root) {
  root.querySelectorAll('[data-w]').forEach(el => { el.onclick = () => detail(el.dataset.w); });
  root.querySelectorAll('[data-go]').forEach(el => { el.onclick = () => startWorkout(el.dataset.go); });
}

/* ---------- Vistas ---------- */
const VIEWS = {
  hoy() {
    const { w, planned } = todaysPick(), lv = S.profile.level, st = streak(), t = dkey(), doneToday = doneOn(t).length > 0;
    const monday = mondayOf(new Date()), h = new Date().getHours();
    const hi = h < 6 ? 'Buenas noches' : h < 13 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
    const weekHtml = DOW.map((d, i) => { const k = dkey(addDays(monday, i)); return `<div class="${doneOn(k).length ? 'on' : ''} ${k === t ? 'today' : ''}">${d}<b>${doneOn(k).length ? ic('check') : ''}</b></div>`; }).join('');
    const quick = [5, 10, 15].map(m => `<button class="chip" data-quick="${m}">${ic('bolt')} ${m} min</button>`).join('') + `<button class="chip" data-gen>${ic('spark')} A tu medida</button>`;
    const recent = [...new Map(S.log.slice().reverse().map(l => [l.wid, l])).values()].slice(0, 4).map(l => getW(l.wid)).filter(Boolean);
    return `<div class="stack"><div class="row between"><div><p class="muted small">${hi}</p><h1>¿Listo para moverte?</h1></div>
      <button class="icon-btn" data-settings aria-label="Ajustes">${ic('gear')}</button></div>
      <section class="card hero ${IMG.hero ? 'has-photo' : ''}" style="--c:#fff">${photo('hero', '(min-width:760px) 720px, 100vw', true)}<p class="small muted">${doneToday ? '¡Hoy ya cumpliste! ¿Uno más?' : planned ? 'Tu plan de hoy' : 'Sugerencia para hoy'}</p>
        <h2 style="font-size:1.5rem;margin:4px 0 6px">${esc(w.n)}</h2>
        <p class="muted small row" style="gap:6px">${ic('clock')} ${minutes(w, lv)} min · ${LEVELS[lv].n} · ~${kcal(minutes(w, lv), w)} kcal</p>
        <div class="row" style="margin-top:18px"><button class="btn" data-start="${w.id}">${ic('play')} Empezar ahora</button>
        <button class="btn line sm" data-detail="${w.id}">Ver ejercicios</button></div></section>
      <div class="card streak row between"><div class="row">${ic('flame')}<div><b>${st} ${st === 1 ? 'día' : 'días'} de racha</b><p class="small muted">${st ? 'Sigue así, lo estás logrando.' : 'Un entrenamiento hoy empieza tu racha.'}</p></div></div></div>
      <div class="card"><div class="week">${weekHtml}</div></div></div>
      <section class="sec"><h2>Rápido: elige tu tiempo</h2><div class="chips" style="flex-wrap:wrap;overflow:visible">${quick}</div></section>
      ${installEvt && !isStandalone() && !S.settings.installDismissed ? `<div class="card row between" style="margin-top:20px"><div><b>Instala Fluir</b><p class="small muted">Ábrela como una app, sin navegador y sin conexión.</p></div><div class="row"><button class="btn sm" data-install>Instalar</button><button class="icon-btn" data-nodismiss aria-label="No mostrar más" style="width:36px;height:36px">${ic('x')}</button></div></div>` : ''}
      ${recent.length ? `<section class="sec"><h2>Repite tus favoritas</h2><div class="grid">${recent.map(wcard).join('')}</div></section>` : ''}`;
  },

  explorar() {
    const f = VIEWS._f || (VIEWS._f = { area: 'all', q: '', dur: 'all' });
    const list = allWorkouts().filter(w => (f.area === 'all' || w.a === f.area || (f.area === 'mine' && w.custom)) &&
      (!f.q || w.n.toLowerCase().includes(f.q.toLowerCase())) &&
      (f.dur === 'all' || (f.dur === 'short' ? minutes(w, S.profile.level) <= 8 : minutes(w, S.profile.level) > 8)));
    const chip = (k, n) => `<button class="chip" data-area="${k}" aria-pressed="${f.area === k}">${n}</button>`;
    const lvl = S.profile.level;
    return `<h1>Explorar</h1><p class="muted" style="margin:4px 0 16px">Todo a un toque. Sin registros ni pagos.</p>
      <button class="card cta" id="gen" type="button">${ic('spark')}<span><b>Rutina a tu medida</b><span class="small muted">Elige zona y tiempo; la armamos con tu nivel.</span></span>${ic('chev')}</button>
      <div class="seg" role="group" aria-label="Nivel" style="margin:14px 0 12px">${[1, 2, 3].map(n => `<button data-glv="${n}" aria-pressed="${n === lvl}">${LEVELS[n].n}</button>`).join('')}</div>
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
    const tracked = trackedExercises(S.reps).map(id => ({ id, h: repsHistory(S.reps, id) })).sort((a, b) => b.h.at(-1).date.localeCompare(a.h.at(-1).date));
    const strengthList = tracked.length ? `<div class="stack">${tracked.map(({ id, h }) => {
      const best = Math.max(...h.map(p => p.reps)), gain = h.at(-1).reps - h[0].reps;
      return `<button class="card prow" type="button" data-prog="${id}"><span><b>${esc(EX[id].n)}</b><span class="small muted">Mejor serie: ${best} rep · ${h.length} ${h.length > 1 ? 'sesiones' : 'sesión'}</span></span>
        <span class="delta ${gain > 0 ? 'up' : ''}">${h.length > 1 ? (gain > 0 ? `▲ +${gain}` : gain < 0 ? `▼ ${gain}` : '= igual') : 'Nuevo'}</span></button>`;
    }).join('')}</div>` : `<div class="card"><p class="muted">Al terminar un entrenamiento podrás anotar tus repeticiones. Aquí verás cómo mejoras en cada ejercicio, con tus récords personales.</p></div>`;
    return `<div class="row between"><h1>Tu progreso</h1><button class="icon-btn" data-settings aria-label="Ajustes">${ic('gear')}</button></div>
      <div class="stats sec"><div class="card stat"><b>${S.log.length}</b><span class="small muted">entrenos</span></div>
        <div class="card stat"><b>${total}</b><span class="small muted">minutos</span></div>
        <div class="card stat"><b>${kc}</b><span class="small muted">kcal aprox.</span></div></div>
      <div class="stats"><div class="card stat"><b>${bestStreak(S.log)}</b><span class="small muted">racha récord</span></div>
        <div class="card stat"><b>${bestWeekMinutes(S.log)}</b><span class="small muted">mejor semana (min)</span></div>
        <div class="card stat"><b>${trackedExercises(S.reps).length}</b><span class="small muted">ejercicios medidos</span></div></div>
      <section class="sec"><h2>Tu fuerza</h2>${strengthList}</section>
      <section class="sec"><h2>Últimos 7 días</h2><div class="card"><div class="bars">${bars.map(([d, v]) => `<div><i style="height:${(v / mx) * 78}%" title="${v} min"></i>${d}</div>`).join('')}</div></div></section>
      <section class="sec"><h2>${t.toLocaleDateString('es', { month: 'long', year: 'numeric' })}</h2><div class="card"><div class="cal">${cal}</div></div></section>
      <section class="sec"><h2>Peso corporal</h2><div class="card"><div class="row between"><div><b style="font-size:1.6rem">${last ? last.kg + ' kg' : '—'}</b>
        ${diff !== null ? `<p class="small muted">${diff > 0 ? '+' : ''}${diff} kg desde el inicio</p>` : ''}</div></div>${spark}
        <form class="field" id="wf" style="margin-top:14px"><input type="number" step="0.1" min="20" max="400" placeholder="Hoy pesas… (kg)" required aria-label="Peso en kg"><button class="btn sm">Guardar</button></form></div></section>`;
  }
};

/* ---------- Router ---------- */
const TITLES = { hoy: 'Hoy', explorar: 'Explorar', plan: 'Plan', progreso: 'Progreso' };
function route(moved = false) {
  const [path, qs] = (location.hash.slice(2) || 'hoy').split('?');
  const name = TITLES[path] ? path : 'hoy';
  if (S.plan && planExpired(S.plan)) buildPlan(); // el ciclo de 4 semanas terminó: se renueva
  document.title = `${TITLES[name]} · Fluir`;
  renderNav(name);
  view.innerHTML = VIEWS[name]();
  bindView(name);
  calmAnimations(view);
  if (moved === true) { scrollTo(0, 0); view.focus({ preventScroll: true }); }
  if (!S.profile.done) onboarding();
  else if (qs === 'go=1') { history.replaceState(null, '', '#/hoy'); startWorkout(todaysPick().w.id); }
}
addEventListener('hashchange', () => route(true));

function bindView(name) {
  bindCards(view);
  view.querySelectorAll('[data-settings]').forEach(b => b.onclick = settings);
  view.querySelectorAll('[data-start]').forEach(b => b.onclick = () => startWorkout(b.dataset.start));
  view.querySelectorAll('[data-detail]').forEach(b => b.onclick = () => detail(b.dataset.detail));
  view.querySelectorAll('[data-install]').forEach(b => b.onclick = async () => { await installApp(); route(); });
  view.querySelectorAll('[data-nodismiss]').forEach(b => b.onclick = () => { S.settings.installDismissed = true; save(); route(); });
  view.querySelectorAll('[data-gen]').forEach(b => b.onclick = () => generator());
  view.querySelectorAll('[data-quick]').forEach(b => b.onclick = () => quickWorkout(+b.dataset.quick));
  if (name === 'explorar') {
    const f = VIEWS._f, redraw = () => { view.innerHTML = VIEWS.explorar(); bindView('explorar'); };
    view.querySelectorAll('[data-area]').forEach(b => b.onclick = () => { f.area = b.dataset.area; redraw(); });
    view.querySelectorAll('[data-dur]').forEach(b => b.onclick = () => { f.dur = b.dataset.dur; redraw(); });
    $('#q').oninput = e => { f.q = e.target.value; const p = e.target.selectionStart; redraw(); const q = $('#q'); q.focus(); q.setSelectionRange(p, p); };
    $('#newW').onclick = () => builder();
    $('#gen').onclick = () => generator();
    view.querySelectorAll('[data-glv]').forEach(b => b.onclick = () => { S.profile.level = +b.dataset.glv; save(); redraw(); });
  }
  if (name === 'plan') $('#editPlan').onclick = () => onboarding(true);
  if (name === 'progreso') view.querySelectorAll('[data-prog]').forEach(b => b.onclick = () => exerciseProgress(b.dataset.prog));
  if (name === 'progreso') $('#wf').onsubmit = e => {
    e.preventDefault(); const kg = parseFloat(e.target.firstChild.value);
    if (!kg) return; S.weights.push({ date: dkey(), kg }); save(); route(); toast('Peso guardado');
  };
}

/* ---------- Hojas ---------- */
function detail(id, lv = S.profile.level) {
  const w = getW(id); if (!w) return;
  const list = steps(w, lv).slice(0, exercisesFor(w, lv).length), rounds = roundsFor(w, lv), L = LEVELS[lv];
  sheet(`<div class="row between"><span class="tag" style="--c:${AREAS[w.a].c}">${w.custom ? 'Mi rutina' : AREAS[w.a].n}</span><button class="icon-btn" data-close aria-label="Cerrar">${ic('x')}</button></div>
    <div class="row between" style="align-items:flex-end"><h1 style="margin:10px 0 4px">${esc(w.n)}</h1><div class="bm-wrap">${bodyMap(areasOf(w, lv))}</div></div>
    <p class="muted small" id="meta">${minutes(w, lv)} min · ${rounds} ${rounds > 1 ? 'rondas' : 'ronda'} · ~${kcal(minutes(w, lv), w)} kcal</p>
    <div class="seg" style="margin:14px 0 8px">${[1, 2, 3].map(n => `<button data-lv="${n}" aria-pressed="${n === lv}">${LEVELS[n].n}</button>`).join('')}</div>
    <p class="small muted" style="margin-bottom:14px">${esc(L.d)} ${w.gentle ? '' : `${list[0].work} s de trabajo · ${list[0].rest} s de descanso.`}</p>
    <ol class="xlist">${list.map((s, i) => `<li><button class="xitem" type="button" data-tech="${s.id}" aria-label="Ver técnica: ${esc(EX[s.id].n)}"><div class="thumb ${VID[s.id] ? 'real' : ''}">${VID[s.id] ? clipHtml(s.id, true) : animSvg(s.id)}</div><div><b>${i + 1}. ${esc(EX[s.id].n)}</b><p class="small muted">${esc(EX[s.id].t)}</p></div></button></li>`).join('')}</ol>
    <div class="row" style="margin-top:18px"><button class="btn block" id="go">${ic('play')} Empezar</button>${w.custom ? '<button class="btn line" id="del" aria-label="Eliminar rutina">Eliminar</button>' : ''}</div>`,
  el => {
    el.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => detail(id, +b.dataset.lv));
    $('#go', el).onclick = () => startWorkout(id, lv);
    el.querySelectorAll('[data-tech]').forEach(b => b.onclick = () => technique(b.dataset.tech, () => detail(id, lv)));
    const d = $('#del', el); if (d) d.onclick = () => { S.custom = S.custom.filter(c => c.id !== id); save(); closeSheet(); route(); toast('Rutina eliminada'); };
  });
}

/* ---------- Progreso de un ejercicio ---------- */
function lineChart(h) {
  const W = 300, H = 150, pad = 22, vals = h.map(p => p.reps), lo = Math.min(...vals), hi = Math.max(...vals), span = Math.max(1, hi - lo);
  const x = i => (h.length === 1 ? W / 2 : pad + (i / (h.length - 1)) * (W - 2 * pad)), y = v => H - pad - ((v - lo) / span) * (H - 2 * pad - 14);
  const pts = h.map((p, i) => `${x(i).toFixed(1)},${y(p.reps).toFixed(1)}`), line = pts.join(' ');
  const iMin = vals.indexOf(lo), iMax = vals.lastIndexOf(hi);
  const badge = (i, v, cls) => `<g class="pb ${cls}"><circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="6"/><text x="${x(i).toFixed(1)}" y="${(y(v) + (cls === 'max' ? -11 : 17)).toFixed(1)}" text-anchor="middle">${v}</text></g>`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución de repeticiones: de ${vals[0]} a ${vals.at(-1)}, mejor ${hi}">
    <defs><linearGradient id="gfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--pri)" stop-opacity=".35"/><stop offset="1" stop-color="var(--pri)" stop-opacity="0"/></linearGradient></defs>
    ${h.length > 1 ? `<polygon points="${x(0).toFixed(1)},${H - pad} ${line} ${x(h.length - 1).toFixed(1)},${H - pad}" fill="url(#gfill)"/><polyline points="${line}" fill="none" stroke="var(--pri)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
    ${h.length > 1 ? badge(iMin, lo, 'min') : ''}${badge(iMax, hi, 'max')}</svg>`;
}
function exerciseProgress(id) {
  const e = EX[id], h = repsHistory(S.reps, id); if (!h.length) return;
  const best = Math.max(...h.map(p => p.reps)), last = h.at(-1), first = h[0];
  const fmt = d => new Date(d + 'T00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' });
  sheet(`<div class="row between"><button class="btn ghost sm" id="back" type="button">← Volver</button><button class="icon-btn" data-close aria-label="Cerrar">${ic('x')}</button></div>
    <h1 style="margin:10px 0 2px">${esc(e.n)}</h1>
    <p class="muted small">Mejor serie por día · ${fmt(first.date)} – ${fmt(last.date)}</p>
    <div class="card" style="margin:14px 0">${lineChart(h)}</div>
    <h2 style="font-size:1rem;margin-bottom:8px">Tus récords personales</h2>
    <div class="stack"><div class="card row between"><span>Mejor serie</span><b>${best} repeticiones</b></div>
      <div class="card row between"><span>Última vez</span><b>${last.reps} repeticiones</b></div>
      <div class="card row between"><span>Desde el inicio</span><b>${last.reps - first.reps >= 0 ? '+' : ''}${last.reps - first.reps}</b></div></div>
    <button class="btn line block" id="tec" type="button" style="margin-top:14px">Ver técnica</button>`,
  el => {
    $('#back', el).onclick = closeSheet;
    $('#tec', el).onclick = () => technique(id, () => exerciseProgress(id));
  });
}

/* ---------- Técnica de un ejercicio ---------- */
function technique(id, back) {
  const e = EX[id]; if (!e) return;
  const pr = repsHistory(S.reps, id), best = pr.length ? Math.max(...pr.map(p => p.reps)) : null;
  const chip = (label, other) => other ? `<button class="chip" data-var="${other}" type="button">${label}: ${esc(EX[other].n)}</button>` : '';
  const pg = PROGRESSION[id] || {};
  sheet(`<div class="row between"><button class="btn ghost sm" id="back" type="button">← Volver</button><button class="icon-btn" data-close aria-label="Cerrar">${ic('x')}</button></div>
    <div class="techmedia" style="--c:${AREAS[e.a].c}">${VID[id] ? clipHtml(id) : animSvg(id)}</div>
    <span class="tag" style="--c:${AREAS[e.a].c}">${AREAS[e.a].n}</span>
    <h1 style="margin:8px 0 6px">${esc(e.n)}</h1>
    <p>${esc(e.t)}</p>
    ${best ? `<p class="small muted" style="margin-top:8px">Tu mejor serie: <b>${best} repeticiones</b></p>` : ''}
    ${pg.easier || pg.harder ? `<h2 style="font-size:1rem;margin:16px 0 8px">¿Muy fácil o muy difícil?</h2><div class="chips" style="flex-wrap:wrap;overflow:visible;margin:0;padding-inline:0">${chip('Más fácil', pg.easier)}${chip('Más difícil', pg.harder)}</div>` : ''}`,
  el => {
    $('#back', el).onclick = () => (back ? back() : closeSheet());
    el.querySelectorAll('[data-var]').forEach(b => b.onclick = () => technique(b.dataset.var, back));
    driveClips(el, true);
  });
}

/* ---------- Rutina a tu medida ---------- */
function generator() {
  const lv = S.profile.level, picks = new Set(['cuerpo']);
  let minutes = 10, w = null;
  const make = () => { w = generateWorkout({ areas: [...picks], minutes, level: lv, restOverride: S.settings.rest }); };
  const draw = () => {
    const real = minutesOf(w, lv, S.settings.rest), areas = Object.entries(AREAS);
    sheet(`<div class="row between"><h1>Rutina a tu medida</h1><button class="icon-btn" data-close aria-label="Cerrar">${ic('x')}</button></div>
      <p class="muted small" style="margin:4px 0 14px">Nivel ${LEVELS[lv].n.toLowerCase()}: ${esc(LEVELS[lv].d)}</p>
      <h2 style="font-size:1rem">¿Qué quieres trabajar?</h2>
      <div class="chips" style="flex-wrap:wrap;overflow:visible;margin:8px 0 14px;padding-inline:0">${areas.map(([k, a]) => `<button class="chip" data-pick="${k}" aria-pressed="${picks.has(k)}">${a.n}</button>`).join('')}</div>
      <h2 style="font-size:1rem">¿Cuánto tiempo tienes?</h2>
      <div class="seg" style="margin:8px 0 16px">${[5, 10, 15, 20, 30].map(m => `<button data-min="${m}" aria-pressed="${m === minutes}">${m} min</button>`).join('')}</div>
      <div class="row between"><b>Tu rutina · ${real} min</b><button class="btn ghost sm" id="again" type="button">Otra combinación</button></div>
      <ol class="xlist" style="margin-top:10px">${w.ex.map((id, i) => `<li><div class="thumb ${VID[id] ? 'real' : ''}">${VID[id] ? clipHtml(id, true) : animSvg(id)}</div><div><b>${i + 1}. ${esc(EX[id].n)}</b><p class="small muted">${esc(AREAS[EX[id].a].n)}</p></div></li>`).join('')}</ol>
      <div class="row" style="margin-top:16px;flex-wrap:wrap"><button class="btn" id="gostart" style="flex:1">${ic('play')} Empezar</button><button class="btn line" id="gosave" type="button">Guardar</button></div>`,
    el => {
      el.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => {
        const k = b.dataset.pick;
        if (k === 'cuerpo') { picks.clear(); picks.add('cuerpo'); }
        else { picks.delete('cuerpo'); picks.has(k) ? picks.delete(k) : picks.add(k); if (!picks.size) picks.add('cuerpo'); }
        make(); draw();
      });
      el.querySelectorAll('[data-min]').forEach(b => b.onclick = () => { minutes = +b.dataset.min; make(); draw(); });
      $('#again', el).onclick = () => { make(); draw(); };
      $('#gostart', el).onclick = () => startWorkout(null, lv, w);
      $('#gosave', el).onclick = () => {
        S.custom.push({ id: 'c' + Date.now(), name: w.n, ex: Array.from({ length: w.r }, () => w.ex).flat() });
        save(); closeSheet(); toast('Guardada en «Mis rutinas»'); route();
      };
    });
  };
  make(); draw();
}

function onboarding(edit = false) {
  const p = { ...S.profile };
  const draw = () => sheet(`<h1>${edit ? 'Ajusta tu plan' : 'Crea tu plan en 10 segundos'}</h1>
    <p class="muted" style="margin:4px 0 18px">${edit ? '' : 'Sin cuentas ni correos. Puedes cambiarlo cuando quieras.'}</p>
    <h2 style="font-size:1rem">Mi objetivo</h2><div class="opts" style="margin:8px 0 18px">${Object.entries(GOALS).map(([k, g]) => `<button class="opt" data-g="${k}" aria-pressed="${p.goal === k}">${g.n}</button>`).join('')}</div>
    <h2 style="font-size:1rem">Mi nivel</h2><div class="seg" style="margin:8px 0 6px">${[1, 2, 3].map(n => `<button data-l="${n}" aria-pressed="${p.level === n}">${LEVELS[n].n}</button>`).join('')}</div>
    <p class="small muted" style="margin-bottom:18px">${esc(LEVELS[p.level].d)}</p>
    <h2 style="font-size:1rem">Días por semana</h2><div class="seg" style="margin:8px 0 16px">${[2, 3, 4, 5, 6].map(n => `<button data-d="${n}" aria-pressed="${p.days === n}">${n}</button>`).join('')}</div>
    <p class="small muted" style="margin-bottom:14px">Fluir ofrece rutinas generales de ejercicio, no consejo médico. Si tienes una condición de salud, una lesión o estás embarazada, consulta a un profesional antes de empezar.</p>
    <button class="btn block" id="ok">${edit ? 'Guardar' : 'Empezar'}</button>${edit ? '<button class="btn line block" data-close style="margin-top:8px">Cancelar</button>' : ''}`,
  el => {
    el.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { p.goal = b.dataset.g; draw(); });
    el.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { p.level = +b.dataset.l; draw(); });
    el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { p.days = +b.dataset.d; draw(); });
    $('#ok', el).onclick = () => { S.profile = { ...p, done: true }; buildPlan(); closeSheet(); route(); toast('Plan listo'); };
  }, { required: !edit });
  draw();
}

function settings() {
  const s = S.settings, sw = (k, n, d) => `<label class="switch"><span><b>${n}</b><br><span class="small muted">${d}</span></span><input type="checkbox" data-s="${k}" ${s[k] ? 'checked' : ''}></label>`;
  sheet(`<div class="row between"><h1>Ajustes</h1><button class="icon-btn" data-close aria-label="Cerrar">${ic('x')}</button></div>
    <div class="card" style="margin:14px 0">${sw('voice', 'Guía por voz', 'Anuncia cada ejercicio y la cuenta atrás')}${sw('sound', 'Sonidos', 'Pitidos al cambiar de fase')}</div>
    <div class="card stack"><div><b>Descanso entre ejercicios</b><div class="seg" style="margin-top:8px">${[[0, 'Auto'], [10, '10 s'], [20, '20 s'], [30, '30 s']].map(([v, n]) => `<button data-rest="${v}" aria-pressed="${s.rest === v}">${n}</button>`).join('')}</div></div>
      <div><b>Tema</b><div class="seg" style="margin-top:8px">${[['dark', 'Oscuro'], ['light', 'Claro'], ['auto', 'Sistema']].map(([v, n]) => `<button data-theme="${v}" aria-pressed="${s.theme === v}">${n}</button>`).join('')}</div></div>
      <div><b>Recordatorio diario</b><p class="small muted">Se avisa mientras la app está abierta o instalada.</p><div class="field" style="margin-top:8px"><input type="time" id="rem" value="${esc(s.remind)}"><button class="btn ghost sm" id="remOk">Guardar</button></div></div></div>
    <div class="row" style="margin-top:14px;flex-wrap:wrap"><button class="btn ghost sm" id="plan2">Cambiar objetivo / plan</button>${installEvt && !isStandalone() ? '<button class="btn sm" id="inst">Instalar app</button>' : ''}<button class="btn line sm" id="exp">Exportar datos</button><button class="btn line sm" id="imp">Importar datos</button><input type="file" id="impf" accept="application/json" hidden><button class="btn line sm" id="rst" style="color:var(--danger)">Borrar todo</button></div>
    ${isIOS && !isStandalone() ? '<p class="small muted" style="margin-top:14px">Para instalarla en iPhone: botón Compartir → «Añadir a pantalla de inicio».</p>' : ''}
    <div class="card" style="margin-top:18px"><b>Acerca de Fluir</b>
      <p class="small muted" style="margin-top:6px">Versión ${__APP_VERSION__}. Sin anuncios, sin cuentas y sin rastreo: tus datos viven solo en este dispositivo (exporta una copia si cambias de teléfono).</p>
      <p class="small muted" style="margin-top:6px">Las rutinas son orientativas y las calorías, estimaciones. No sustituyen el consejo de un profesional de la salud.</p></div>`,
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
    const inst = $('#inst', el); if (inst) inst.onclick = async () => { await installApp(); closeSheet(); };
    $('#exp', el).onclick = () => {
      const a = document.createElement('a'), url = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }));
      a.href = url; a.download = `fluir-datos-${dkey()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    $('#imp', el).onclick = () => $('#impf', el).click();
    $('#impf', el).onchange = async e => {
      const file = e.target.files[0]; if (!file) return;
      try {
        if (file.size > 5e6) throw new Error('grande');
        const next = sanitizeState(JSON.parse(await file.text()));
        if (!confirm(`¿Reemplazar tus datos actuales por la copia (${next.log.length} entrenos)?`)) return;
        S = next; save(); applyTheme(); closeSheet(); route(); toast('Datos importados');
      } catch { toast('No se pudo leer ese archivo'); }
    };
    $('#rst', el).onclick = () => { if (confirm('¿Borrar todo tu progreso y ajustes?')) { localStorage.removeItem(KEY); location.reload(); } };
  });
}

let builderName = ''; // nombre a medio escribir mientras se redibuja la hoja
function builder() {
  const sel = [];
  const draw = () => sheet(`<div class="row between"><h1>Nueva rutina</h1><button class="icon-btn" data-close aria-label="Cerrar">${ic('x')}</button></div>
    <input type="text" id="nm" placeholder="Nombre (ej. Lunes de piernas)" style="width:100%;margin:12px 0" value="${esc(builderName)}">
    <p class="small muted" style="margin-bottom:8px">Toca para añadir en orden · ${sel.length} elegidos</p>
    ${Object.entries(EX).map(([id, e]) => `<button class="pick" data-x="${id}" aria-pressed="${sel.includes(id)}"><span class="tag" style="--c:${AREAS[e.a].c}">${AREAS[e.a].n}</span><b>${esc(e.n)}</b>${sel.includes(id) ? `<span style="margin-left:auto" class="muted">#${sel.indexOf(id) + 1}</span>` : ''}</button>`).join('')}
    <button class="btn block" id="sv" style="position:sticky;bottom:0" ${sel.length < 2 ? 'disabled' : ''}>Guardar rutina</button>`,
  el => {
    el.querySelectorAll('[data-x]').forEach(b => b.onclick = () => {
      builderName = $('#nm', el).value; const i = sel.indexOf(b.dataset.x);
      i < 0 ? sel.push(b.dataset.x) : sel.splice(i, 1);
      const top = $('.sheet', overlay).scrollTop; draw(); $('.sheet', overlay).scrollTop = top;
    });
    $('#sv', el).onclick = () => {
      const name = $('#nm', el).value.trim() || 'Mi rutina';
      S.custom.push({ id: 'c' + Date.now(), name, ex: sel.slice() }); builderName = ''; save(); closeSheet(); VIEWS._f.area = 'mine'; route(); toast('Rutina guardada');
    };
  });
  draw();
}

function quickWorkout(min) {
  // Rutina a medida: mezcla ejercicios de tu objetivo (en la versión de tu nivel) hasta llegar a los minutos pedidos
  const lv = S.profile.level, L = LEVELS[lv], per = (L.w + (S.settings.rest || L.rest)) / 60;
  const pool = GOALS[S.profile.goal].seq.flatMap(id => exercisesFor(getW(id), lv));
  const uniq = [...new Set(pool)].sort(() => Math.random() - .5);
  const count = Math.max(3, Math.round(min / per));
  const ex = Array.from({ length: count }, (_, i) => uniq[i % uniq.length]);
  startWorkout(null, lv, { id: 'quick', n: `Rápido · ${min} min`, a: 'cuerpo', r: 1, ex, fixed: true });
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
  let i = 0, phase = 'ready', left = 5, paused = false, wake, total = 0, tick, finished = false;
  const el = document.createElement('div'); el.className = 'player'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', `Entrenamiento: ${w.n}`);
  document.body.appendChild(el);
  syncInert();
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
    const shownId = phase === 'rest' && nxt ? nxt.id : s.id, clip = clipHtml(shownId);
    const label = phase === 'ready' ? 'Prepárate' : phase === 'work' ? e.n : 'Descanso';
    el.innerHTML = `<div class="top"><button class="icon-btn" id="quit" aria-label="Salir">${ic('x')}</button>
      <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${list.length}" aria-valuenow="${i}"><i style="width:${(i + (phase === 'rest' ? 1 : 0)) / list.length * 100}%"></i></div>
      <span class="small muted">${i + 1}/${list.length}</span></div>
      <div class="stage ${clip ? 'with-clip' : ''}"><p class="small muted">${list[list.length - 1].round > 1 ? `Ronda ${s.round} de ${list[list.length - 1].round} · ` : ''}${esc(w.n)}</p>
        <h1>${esc(label)}</h1>
        ${clip ? `<div class="clipwrap" style="--c:${a.c}">${clip}<div class="clipfoot"><span class="time" id="tm" aria-live="off">${left}</span></div><div class="bar"><i id="bar"></i></div></div>` : `<div class="ring" style="--c:${a.c}"><svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="44"/><circle class="fg" id="fg" cx="50" cy="50" r="44" stroke-dasharray="${R}" stroke-dashoffset="0"/></svg>
          <div class="core has-anim">${animSvg(shownId)}</div></div>
        <div class="time" id="tm" aria-live="off">${left}</div>`}
        <p class="muted" style="max-width:34ch">${phase === 'rest' ? (nxt ? `Siguiente: <b>${esc(EX[nxt.id].n)}</b>` : 'Último ejercicio completado') : esc(e.t)}</p></div>
      <div class="controls"><button class="side" id="pv" aria-label="Anterior">${ic('prev')}</button>
        <button class="big" id="pp" aria-label="${paused ? 'Reanudar' : 'Pausar'}">${ic(paused ? 'play' : 'pause')}</button>
        <button class="side" id="nx" aria-label="Siguiente">${ic('next')}</button></div>
      <div class="row" style="margin-top:16px;justify-content:center;min-height:44px">${phase === 'rest' ? '<button class="btn ghost sm" id="more" type="button">+20 s</button>' : ''}<button class="btn ghost sm" id="tech" type="button">Ver técnica</button></div>`;
    $('#quit', el).onclick = quit; $('#pp', el).onclick = () => { paused = !paused; draw(); };
    $('#nx', el).onclick = advance; $('#pv', el).onclick = back;
    const m = $('#more', el); if (m) m.onclick = () => { left += 20; draw(); };
    $('#tech', el).onclick = () => {
      paused = true; draw();
      technique(shownId, () => { closeSheet(); }); overlay.style.zIndex = 70;
    };
    if (paused || reduceMotion) el.querySelector('svg.anim')?.pauseAnimations();
    driveClips(el, !paused);
    announce();
    paint();
  }
  const dt = 250; let last = performance.now();
  function paint() {
    const t = $('#tm', el); if (!t) return;
    const spent = 1 - left / Math.max(dur(), left), fg = $('#fg', el), bar = $('#bar', el);
    t.textContent = Math.ceil(left);
    if (fg) fg.style.strokeDashoffset = R * spent;
    if (bar) bar.style.width = `${(1 - spent) * 100}%`;
  }
  tick = setInterval(() => {
    const now = performance.now(), d = (now - last) / 1000; last = now;
    if (paused || !el.isConnected) return;
    const before = Math.ceil(left); left -= d; if (phase === 'work') total += d;
    if (Math.ceil(left) !== before && left > 0 && left <= 3) { beep(660, .08); say(String(Math.ceil(left))); }
    if (phase === 'work' && before > Math.ceil(left) && Math.ceil(left) === Math.floor(list[i].work / 2) && list[i].work >= 30) say('Mitad');
    if (left <= 0) advance(); else paint();
  }, dt);

  // Anuncio para lectores de pantalla (región persistente #live), solo al cambiar de fase
  let said = '';
  function announce() {
    const s = list[i], nxt = list[i + 1];
    const t = phase === 'work' ? `${EX[s.id].n}, ${s.work} segundos` : phase === 'rest' ? `Descanso. Siguiente: ${nxt ? EX[nxt.id].n : 'fin'}` : `Prepárate: ${EX[s.id].n}`;
    if (t !== said) { said = t; $('#live').textContent = t; }
  }
  const onVisibility = () => {
    if (finished) return;
    if (document.hidden) { if (!paused) { paused = true; draw(); } }
    else if (!wake || wake.released) navigator.wakeLock?.request('screen').then(l => wake = l).catch(() => {});
  };
  const onKey = e => {
    if (finished || !overlay.hidden || /^(BUTTON|INPUT|SELECT|A)$/.test(document.activeElement?.tagName) && e.key === ' ') return;
    if (e.key === ' ') { e.preventDefault(); paused = !paused; draw(); }
    else if (e.key === 'ArrowRight') advance();
    else if (e.key === 'ArrowLeft') back();
    else if (e.key === 'Escape') quit();
  };
  document.addEventListener('visibilitychange', onVisibility);
  document.addEventListener('keydown', onKey);
  function cleanup() {
    clearInterval(tick); wake?.release?.(); window.speechSynthesis?.cancel(); el.remove(); syncInert();
    document.removeEventListener('visibilitychange', onVisibility); document.removeEventListener('keydown', onKey);
    $('#live').textContent = '';
  }
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
    finished = true;
    clearInterval(tick); window.speechSynthesis?.cancel();
    const min = Math.max(1, Math.round(total / 60)), kc = kcal(min, w), adhoc = w.id === 'quick' || w.id === 'gen';
    if (!adhoc || total > 30) S.log.push({ date: dkey(), wid: adhoc ? 'ini' : w.id, name: w.n, min, kcal: kc });
    save(); beep(1200, .4); say('¡Muy bien! Entrenamiento completado');
    el.classList.remove('rest'); el.classList.remove('paused');
    // Registro de repeticiones (opcional): ejercicios de fuerza realizados, con la «previa» de la última vez
    const upto = phase === 'ready' ? i : i + 1;
    const rows = [...new Set(list.slice(0, upto).map(x => x.id))].filter(isTrackable).map(id => {
      const prev = lastReps(S.reps, id); return { id, prev, now: prev ?? 10 };
    });
    const logger = rows.length ? `<section class="card replog" aria-labelledby="rl"><b id="rl">Registra tus repeticiones</b><p class="small muted">Por serie. Opcional: así verás tu progreso.</p>
      ${rows.map(r => `<div class="rrow"><div><b>${esc(EX[r.id].n)}</b><span class="small muted">Previa: ${r.prev ?? '—'}</span></div>
        <div class="stepper"><button type="button" data-dec="${r.id}" aria-label="Una repetición menos en ${esc(EX[r.id].n)}">−</button><output id="r-${r.id}" aria-live="polite">${r.now}</output><button type="button" data-inc="${r.id}" aria-label="Una repetición más en ${esc(EX[r.id].n)}">+</button></div></div>`).join('')}
      </section>` : '';
    el.innerHTML = `<div class="stage summary"><div class="done-badge">${ic('check')}</div><h1>¡Lo lograste!</h1>
      <p class="muted">${esc(w.n)}</p>
      <div class="stats" style="width:100%"><div class="card stat"><b>${min}</b><span class="small muted">min</span></div><div class="card stat"><b>${kc}</b><span class="small muted">kcal</span></div><div class="card stat"><b>${streak()}</b><span class="small muted">racha</span></div></div>
      ${logger}
      <p class="small muted">Estira un poco y bebe agua.</p></div>
      <div class="row" style="width:100%;max-width:560px;flex-wrap:wrap;gap:8px">${rows.length ? '<button class="btn" id="saveReps" style="flex:1">Guardar y salir</button><button class="btn line" id="end" type="button">Sin registrar</button>' : '<button class="btn block" id="end">Listo</button>'}</div>`;
    const val = id => $(`#r-${id}`, el);
    el.querySelectorAll('[data-inc],[data-dec]').forEach(b => b.onclick = () => {
      const id = b.dataset.inc || b.dataset.dec, o = val(id);
      o.textContent = Math.min(300, Math.max(1, +o.textContent + (b.dataset.inc ? 1 : -1)));
    });
    const sr = $('#saveReps', el);
    if (sr) sr.onclick = () => {
      for (const r of rows) S.reps.push({ date: dkey(), ex: r.id, reps: +val(r.id).textContent });
      save(); toast('Repeticiones guardadas'); cleanup(); route();
    };
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
