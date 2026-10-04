import { describe, it, expect } from 'vitest';
import { WORKOUTS, EX, AREAS, GOALS, LEVELS, PROGRESSION, NO_REPS } from '../src/data.js';
import { ANIM_IDS } from '../src/anim.js';
import { isTrackable, repsHistory, lastReps, bestStreak, bestWeekMinutes, areasOf, generateWorkout, dkey, mondayOf, steps, minutes, exercisesFor, roundsFor, kcal, buildPlan, planExpired, streak, todaysPick, sanitizeState, defaultState } from '../src/model.js';

const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h);

describe('catálogo', () => {
  it('cada rutina usa ejercicios y zonas existentes', () => {
    for (const w of WORKOUTS) {
      expect(AREAS[w.a], w.id).toBeTruthy();
      for (const id of w.ex) expect(EX[id], `${w.id}:${id}`).toBeTruthy();
    }
  });
  it('los planes por objetivo solo referencian rutinas reales', () => {
    const ids = new Set(WORKOUTS.map(w => w.id));
    for (const g of Object.values(GOALS)) for (const id of g.seq) expect(ids.has(id), id).toBe(true);
  });
  it('las listas por nivel usan ejercicios existentes', () => {
    for (const w of WORKOUTS) for (const lv of [1, 2, 3]) for (const id of exercisesFor(w, lv)) expect(EX[id], `${w.id}@${lv}:${id}`).toBeTruthy();
  });
  it('todo ejercicio tiene animación', () => {
    for (const id of Object.keys(EX)) expect(ANIM_IDS.includes(id), id).toBe(true);
  });
});

describe('fechas', () => {
  it('dkey usa la fecha local con ceros', () => expect(dkey(at(2026, 3, 5))).toBe('2026-03-05'));
  it('mondayOf devuelve el lunes de esa semana (domingo incluido)', () => {
    expect(dkey(mondayOf(at(2026, 9, 28)))).toBe('2026-09-28'); // lunes
    expect(dkey(mondayOf(at(2026, 10, 4)))).toBe('2026-09-28'); // domingo
  });
});

describe('sesión', () => {
  const w = WORKOUTS.find(x => x.id === 'cuerpo');
  it('genera ejercicios × rondas con el descanso del nivel', () => {
    const s = steps(w, 2);
    expect(s).toHaveLength(w.ex.length * w.r);
    expect(s[0]).toMatchObject({ work: 40, rest: 20, round: 1 });
  });
  it('respeta el descanso elegido por el usuario', () => expect(steps(w, 3, 30)[0].rest).toBe(30));
  it('minutos ≥ 1 y kcal menor en estiramiento', () => {
    expect(minutes(WORKOUTS.find(x => x.id === 'abs2'), 3)).toBeGreaterThanOrEqual(1);
    expect(kcal(10, { a: 'estira' })).toBeLessThan(kcal(10, { a: 'cardio' }));
  });
});

describe('niveles', () => {
  const trainable = WORKOUTS.filter(w => !w.gentle);
  it('la duración crece: Principiante < Intermedio < Avanzado', () => {
    for (const w of trainable.filter(x => x.id !== 'ini')) {
      const [a, b, c] = [1, 2, 3].map(lv => minutes(w, lv));
      expect(a, `${w.id} 1<2`).toBeLessThan(b);
      expect(b, `${w.id} 2<3`).toBeLessThan(c);
    }
  });
  it('cada nivel cambia los ejercicios (no solo los tiempos)', () => {
    for (const w of trainable.filter(x => x.id !== 'ini')) {
      const [a, b, c] = [1, 2, 3].map(lv => exercisesFor(w, lv).join());
      expect(new Set([a, b, c]).size, w.id).toBe(3);
    }
  });
  it('Avanzado tiene una ronda más y descansos más cortos que Principiante', () => {
    const w = WORKOUTS.find(x => x.id === 'cuerpo');
    expect(roundsFor(w, 3)).toBe(roundsFor(w, 1) + 1);
    expect(LEVELS[3].rest).toBeLessThan(LEVELS[1].rest);
    expect(LEVELS[3].w).toBeGreaterThan(LEVELS[1].w);
  });
  it('Principiante evita ejercicios de salto', () => {
    const jumps = ['js', 'jl', 'bpp', 'sk', 'bp'];
    for (const w of trainable) for (const id of exercisesFor(w, 1)) expect(jumps.includes(id), `${w.id}:${id}`).toBe(false);
  });
  it('rutinas propias y rápidas no cambian de rondas', () => {
    expect(roundsFor({ r: 1, fixed: true }, 3)).toBe(1);
  });
  it('las rutinas suaves solo alargan el sostén', () => {
    const w = WORKOUTS.find(x => x.id === 'est');
    expect(exercisesFor(w, 1)).toEqual(exercisesFor(w, 3));
    expect(steps(w, 3)[0].work).toBeGreaterThan(steps(w, 1)[0].work);
  });
});

describe('plan', () => {
  it('4 semanas de 7 días con los días de entreno pedidos', () => {
    for (const days of [2, 3, 4, 5, 6]) {
      const p = buildPlan({ goal: 'fat', days }, at(2026, 9, 30));
      expect(p.start).toBe('2026-09-28');
      expect(p.weeks).toHaveLength(4);
      for (const wk of p.weeks) { expect(wk).toHaveLength(7); expect(wk.filter(Boolean)).toHaveLength(days); }
    }
  });
  it('hoy toma la rutina planificada; fuera del plan sugiere una', () => {
    const state = defaultState();
    state.plan = buildPlan(state.profile, at(2026, 9, 28));
    const expected = state.plan.weeks[0][0];
    expect(todaysPick(state, at(2026, 9, 28))).toMatchObject({ planned: true, w: { id: expected } });
    expect(todaysPick(state, at(2027, 1, 15)).planned).toBe(false);
  });
});

describe('vigencia del plan', () => {
  const plan = buildPlan({ goal: 'tone', days: 3 }, at(2026, 9, 28));
  it('vigente durante 28 días', () => { expect(planExpired(plan, at(2026, 10, 25))).toBe(false); });
  it('vence el día 29', () => { expect(planExpired(plan, at(2026, 10, 26))).toBe(true); });
  it('no depende del cambio de hora', () => { expect(planExpired(buildPlan({ goal: 'tone', days: 3 }, at(2026, 10, 19)), at(2026, 11, 15))).toBe(false); });
});

describe('racha', () => {
  const day = (y, m, d) => ({ date: dkey(at(y, m, d)), min: 5 });
  it('cuenta días consecutivos hasta hoy', () => expect(streak([day(2026, 9, 27), day(2026, 9, 28), day(2026, 9, 29)], at(2026, 9, 29))).toBe(3));
  it('si hoy aún no entrenó, la racha de ayer sigue viva', () => expect(streak([day(2026, 9, 27), day(2026, 9, 28)], at(2026, 9, 29))).toBe(2));
  it('se rompe con un día de hueco', () => expect(streak([day(2026, 9, 25), day(2026, 9, 28)], at(2026, 9, 29))).toBe(1));
  it('sin registros es 0', () => expect(streak([], at(2026, 9, 29))).toBe(0));
});

describe('sanitizeState', () => {
  it('basura → estado por defecto', () => {
    for (const bad of [null, undefined, 5, 'x', [], { profile: 3, settings: [] }]) expect(sanitizeState(bad)).toEqual(defaultState());
  });
  it('descarta registros inválidos y conserva los buenos', () => {
    const s = sanitizeState({
      profile: { goal: 'nope', level: 9, days: 4, done: true },
      log: [{ date: '2026-09-28', wid: 'hiit', min: 10, kcal: 70 }, { date: 'ayer', min: 5 }, { date: '2026-09-27', min: -3 }, null],
      weights: [{ date: '2026-09-28', kg: 70.5 }, { date: '2026-09-28', kg: 'x' }, { date: '2026-09-28', kg: 9999 }],
      custom: [{ id: 'c1', name: 'Mi rutina', ex: ['sq', 'zzz', 'pu'] }, { id: 'c2', name: 'Vacía', ex: ['zzz'] }]
    });
    expect(s.profile).toEqual({ goal: 'tone', level: 1, days: 4, done: true });
    expect(s.log).toHaveLength(1);
    expect(s.weights).toEqual([{ date: '2026-09-28', kg: 70.5 }]);
    expect(s.custom).toEqual([{ id: 'c1', name: 'Mi rutina', ex: ['sq', 'pu'] }]);
  });
  it('el tema solo se respeta si el usuario lo eligió', () => {
    expect(sanitizeState({ settings: { theme: 'light' } }).settings.theme).toBe('dark');
    expect(sanitizeState({ settings: { theme: 'light', themeChosen: true } }).settings.theme).toBe('light');
  });
  it('un plan con rutinas desconocidas las limpia', () => {
    const weeks = Array.from({ length: 4 }, () => ['hiit', 'fantasma', null, null, null, null, null]);
    expect(sanitizeState({ plan: { start: '2026-09-28', weeks } }).plan.weeks[0].slice(0, 2)).toEqual(['hiit', null]);
  });
});

describe('progresiones', () => {
  it('apuntan a ejercicios existentes y son recíprocas', () => {
    for (const [id, p] of Object.entries(PROGRESSION)) {
      expect(EX[id], id).toBeTruthy();
      for (const other of [p.easier, p.harder].filter(Boolean)) expect(EX[other], `${id}→${other}`).toBeTruthy();
    }
    expect(NO_REPS.every(id => EX[id])).toBe(true);
  });
});

describe('repeticiones y récords', () => {
  const reps = [
    { date: '2026-09-01', ex: 'pu', reps: 8 }, { date: '2026-09-01', ex: 'pu', reps: 10 },
    { date: '2026-09-08', ex: 'pu', reps: 12 }, { date: '2026-09-08', ex: 'sq', reps: 20 }
  ];
  it('solo se registran ejercicios de fuerza contables', () => {
    expect(isTrackable('pu') && isTrackable('sq')).toBe(true);
    for (const id of ['jj', 'cv', 'pl', 'sp', 'wl', 'bp', 'nope']) expect(isTrackable(id), id).toBe(false);
  });
  it('historial: mejor serie por día y en orden cronológico', () => {
    expect(repsHistory(reps, 'pu')).toEqual([{ date: '2026-09-01', reps: 10 }, { date: '2026-09-08', reps: 12 }]);
    expect(lastReps(reps, 'sq')).toBe(20);
    expect(lastReps(reps, 'lg')).toBeNull();
  });
  it('racha más larga y mejor semana', () => {
    const log = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-07', '2026-09-08'].map(date => ({ date, min: 10 }));
    expect(bestStreak(log)).toBe(3);
    expect(bestStreak([])).toBe(0);
    expect(bestWeekMinutes(log)).toBe(30); // 31-ago→6-sep: días 1,2,3 = 30 min
  });
  it('sanitizeState conserva repeticiones válidas y descarta basura', () => {
    const s = sanitizeState({ reps: [{ date: '2026-09-01', ex: 'pu', reps: 12.4 }, { date: 'x', ex: 'pu', reps: 5 }, { date: '2026-09-01', ex: 'zzz', reps: 5 }, { date: '2026-09-01', ex: 'pu', reps: 9999 }] });
    expect(s.reps).toEqual([{ date: '2026-09-01', ex: 'pu', reps: 12 }]);
  });
});

describe('mapa muscular', () => {
  it('areasOf devuelve las zonas de los ejercicios del nivel', () => {
    const w = WORKOUTS.find(x => x.id === 'abs');
    expect([...areasOf(w, 1)]).toContain('abs');
  });
});

describe('rutina a tu medida', () => {
  const seeded = seed => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  it('respeta zonas y se acerca a los minutos pedidos', () => {
    for (const minutes of [5, 10, 20, 30]) for (const level of [1, 2, 3]) {
      const w = generateWorkout({ areas: ['piernas', 'abs'], minutes, level, rand: seeded(7) });
      expect(w.ex.every(id => ['piernas', 'abs'].includes(EX[id].a)), `${minutes}/${level}`).toBe(true);
      const real = Math.round(steps(w, level).reduce((t, x) => t + x.work + x.rest, 0) / 60);
      expect(Math.abs(real - minutes), `${minutes}/${level} → ${real}`).toBeLessThanOrEqual(Math.max(3, minutes * 0.35));
    }
  });
  it('Principiante nunca recibe ejercicios de salto', () => {
    const jumps = ['js', 'jl', 'bpp', 'sk', 'bp'];
    for (let s = 1; s <= 20; s++) expect(generateWorkout({ areas: ['cuerpo'], minutes: 20, level: 1, rand: seeded(s) }).ex.some(id => jumps.includes(id))).toBe(false);
  });
  it('sin zonas = cuerpo entero (sin estiramientos); solo estiramiento es suave', () => {
    expect(generateWorkout({ minutes: 10, level: 2, rand: seeded(3) }).ex.some(id => EX[id].a === 'estira')).toBe(false);
    const st = generateWorkout({ areas: ['estira'], minutes: 5, level: 2, rand: seeded(3) });
    expect(st.gentle).toBe(true);
    expect(st.ex.every(id => EX[id].a === 'estira')).toBe(true);
  });
  it('es determinista con la misma semilla y cambia con otra', () => {
    const a = generateWorkout({ areas: ['cuerpo'], minutes: 10, level: 2, rand: seeded(5) }).ex.join();
    expect(generateWorkout({ areas: ['cuerpo'], minutes: 10, level: 2, rand: seeded(5) }).ex.join()).toBe(a);
    expect(generateWorkout({ areas: ['cuerpo'], minutes: 10, level: 2, rand: seeded(99) }).ex.join()).not.toBe(a);
  });
  it('no repite ejercicios dentro de una ronda y no cambia de rondas por nivel', () => {
    const w = generateWorkout({ areas: ['cuerpo'], minutes: 15, level: 3, rand: seeded(11) });
    expect(new Set(w.ex).size).toBe(w.ex.length);
    expect(roundsFor(w, 3)).toBe(w.r);
  });
});
