import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const KEY = 'fluir:v1';
const ready = async (page, state) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  if (state) await page.addInitScript(([k, s]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify(s)); }, [KEY, state]); // solo la primera vez: sobrevive a recargas
  return errors;
};
const onboarded = { profile: { goal: 'fat', level: 1, days: 3, done: true } };

test('primer arranque: elige plan y llega a Hoy en un paso', async ({ page }) => {
  const errors = await ready(page);
  await page.goto('/');
  await expect(page.getByRole('dialog')).toContainText('Crea tu plan');
  await page.keyboard.press('Escape'); // el primer arranque no se puede saltar
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Empezar', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¿Listo para moverte?' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Empezar ahora/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test('el tema es oscuro por defecto', async ({ page }) => {
  await ready(page, onboarded);
  await page.goto('/');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(13, 14, 16)');
});

test('navegación completa entre las 4 pestañas', async ({ page }) => {
  const errors = await ready(page, onboarded);
  await page.goto('/');
  for (const [tab, heading] of [['Explorar', 'Explorar'], ['Plan', 'Tu plan de 4 semanas'], ['Progreso', 'Tu progreso'], ['Hoy', '¿Listo para moverte?']]) {
    await page.getByRole('link', { name: tab }).click();
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    await expect(page).toHaveTitle(`${tab} · Fluir`);
  }
  expect(errors).toEqual([]);
});

test('explorar: filtra, busca y abre el detalle con nivel', async ({ page }) => {
  await ready(page, onboarded);
  await page.goto('/#/explorar');
  await page.getByRole('button', { name: 'Abdominales', exact: true }).click();
  await expect(page.locator('article.wcard')).toHaveCount(2);
  await page.getByRole('searchbox').fill('core');
  await expect(page.locator('article.wcard')).toHaveCount(1);
  await page.getByRole('button', { name: 'Ver Core exprés' }).click();
  const dlg = page.getByRole('dialog');
  await expect(dlg).toContainText('Core exprés');
  await dlg.getByRole('button', { name: 'Avanzado' }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Avanzado' })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('los niveles cambian la rutina: más ejercicios, más duración y variantes distintas', async ({ page }) => {
  await ready(page, onboarded);
  await page.goto('/#/explorar');
  await page.getByRole('button', { name: 'Ver Cuerpo entero' }).click();
  const dlg = page.getByRole('dialog');
  const items = dlg.locator('ol.xlist li');
  await expect(items).toHaveCount(5); // Principiante
  await expect(items.first()).toContainText('Sentadilla a la silla');
  await expect(dlg.locator('#meta')).toContainText('10 min');
  await dlg.getByRole('button', { name: 'Intermedio' }).click();
  await expect(items).toHaveCount(6);
  await expect(items.first()).toContainText('Sentadillas');
  await expect(dlg.locator('#meta')).toContainText('12 min');
  await dlg.getByRole('button', { name: 'Avanzado' }).click();
  await expect(items).toHaveCount(7);
  await expect(items.first()).toContainText('Sentadilla con salto');
  await expect(dlg.locator('#meta')).toContainText('3 rondas');
  await expect(dlg.locator('#meta')).toContainText('21 min');
});

test('constructor: crea una rutina propia y persiste tras recargar', async ({ page }) => {
  await ready(page, onboarded);
  await page.goto('/#/explorar');
  await page.getByRole('button', { name: 'Crear mi rutina' }).click();
  await page.getByRole('textbox').fill('Lunes de prueba');
  await page.getByRole('button', { name: /Sentadillas/ }).click();
  await page.getByRole('button', { name: 'Pecho Flexiones', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar rutina' }).click();
  await expect(page.locator('article.wcard', { hasText: 'Lunes de prueba' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Mis rutinas' }).click();
  await expect(page.locator('article.wcard', { hasText: 'Lunes de prueba' })).toBeVisible();
});

test('reproductor: cuenta atrás, pausa, siguiente y salir sin guardar', async ({ page }) => {
  await page.clock.install();
  const errors = await ready(page, onboarded);
  await page.goto('/');
  await page.getByRole('button', { name: /Empezar ahora/ }).click();
  const player = page.getByRole('dialog', { name: /Entrenamiento/ });
  await expect(player.getByRole('heading', { name: 'Prepárate' })).toBeVisible();
  await page.clock.fastForward(5500);
  await expect(player.getByRole('heading', { level: 1 })).not.toHaveText('Prepárate');
  await player.getByRole('button', { name: 'Pausar' }).click();
  await expect(player.getByRole('button', { name: 'Reanudar' })).toBeVisible();
  await player.getByRole('button', { name: 'Siguiente' }).click();
  await expect(player.getByRole('heading', { name: 'Descanso' })).toBeVisible();
  await player.getByRole('button', { name: 'Salir' }).click();
  await page.getByRole('button', { name: 'Salir sin guardar' }).click();
  await expect(player).toHaveCount(0);
  expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)).log?.length ?? 0, KEY)).toBe(0);
  expect(errors).toEqual([]);
});

test('ejercicio con clip real: el video se reproduce y se detiene al pausar', async ({ page }) => {
  await ready(page, { profile: { goal: 'fat', level: 2, days: 3, done: true } }); // Sentadillas abre el nivel Intermedio
  await page.goto('/#/explorar');
  await page.getByRole('button', { name: 'Empezar Cuerpo entero' }).click();
  const player = page.getByRole('dialog', { name: /Entrenamiento/ });
  await expect(player.locator('video.clip')).toHaveCount(1); // Sentadillas tiene clip
  await expect.poll(() => player.locator('video.clip').evaluate(v => v.currentTime), { timeout: 8000 }).toBeGreaterThan(0.2);
  await player.getByRole('button', { name: 'Pausar' }).click();
  expect(await player.locator('video.clip').evaluate(v => v.paused)).toBe(true);
  await player.getByRole('button', { name: 'Reanudar' }).click();
  await expect.poll(() => player.locator('video.clip').evaluate(v => v.paused)).toBe(false);
});

test('entrenamiento completo: se registra, se anotan repeticiones y aparece el progreso', async ({ page }) => {
  await page.clock.install();
  await ready(page, onboarded);
  await page.goto('/#/explorar');
  await page.getByRole('button', { name: 'Empezar Despertar 5 min' }).click();
  const player = page.getByRole('dialog', { name: /Entrenamiento/ });
  for (let n = 0; n < 40 && !(await page.getByRole('heading', { name: '¡Lo lograste!' }).count()); n++) await page.clock.fastForward(20000);
  await expect(page.getByRole('heading', { name: '¡Lo lograste!' })).toBeVisible();
  // «Previa» vacía la primera vez; subimos de 10 a 12 repeticiones
  await expect(page.getByText('Previa: —')).toBeVisible();
  await page.getByRole('button', { name: /Una repetición más en Sentadillas/ }).click({ clickCount: 2 });
  await expect(page.locator('#r-sq')).toHaveText('12');
  await page.getByRole('button', { name: 'Guardar y salir' }).click();
  await expect(player).toHaveCount(0);
  await page.getByRole('link', { name: 'Hoy' }).click();
  await expect(page.getByText('1 día de racha')).toBeVisible();
  await page.getByRole('link', { name: 'Progreso' }).click();
  await expect(page.locator('.stat').first()).toContainText('1');
  await page.getByRole('button', { name: /Sentadillas/ }).click();
  const dlg = page.getByRole('dialog');
  await expect(dlg).toContainText('Mejor serie');
  await expect(dlg).toContainText('12 repeticiones');
  await expect(dlg.getByRole('img', { name: /Evolución de repeticiones/ })).toBeVisible();
});

test('la segunda vez muestra la «previa» y se puede salir sin registrar', async ({ page }) => {
  await page.clock.install();
  const today = new Date().toISOString().slice(0, 10);
  await ready(page, { ...onboarded, reps: [{ date: '2026-01-01', ex: 'sq', reps: 15 }] });
  await page.goto('/#/explorar');
  await page.getByRole('button', { name: 'Empezar Despertar 5 min' }).click();
  for (let n = 0; n < 40 && !(await page.getByRole('heading', { name: '¡Lo lograste!' }).count()); n++) await page.clock.fastForward(20000);
  await expect(page.getByText('Previa: 15')).toBeVisible();
  await expect(page.locator('#r-sq')).toHaveText('15'); // parte de la última marca
  await page.getByRole('button', { name: 'Sin registrar' }).click();
  expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)).reps.length, KEY)).toBe(1);
  expect(today).toBeTruthy();
});

test('rutina a tu medida: elige zona y tiempo, guarda y empieza', async ({ page }) => {
  await ready(page, onboarded);
  await page.goto('/#/explorar');
  await page.getByRole('button', { name: /Rutina a tu medida/ }).click();
  const dlg = page.getByRole('dialog');
  await dlg.getByRole('button', { name: 'Cuerpo entero' }).click(); // sigue seleccionado (mínimo una zona)
  await dlg.getByRole('button', { name: 'Abdominales' }).click();
  await dlg.getByRole('button', { name: '20 min' }).click();
  await expect(dlg.getByRole('button', { name: 'Abdominales' })).toHaveAttribute('aria-pressed', 'true');
  const names = await dlg.locator('ol.xlist li b').allInnerTexts();
  expect(names.length).toBeGreaterThanOrEqual(3);
  await dlg.getByRole('button', { name: 'Guardar' }).click();
  await page.getByRole('button', { name: 'Mis rutinas' }).click();
  await expect(page.locator('article.wcard', { hasText: 'A tu medida · 20 min' })).toBeVisible();
  await page.getByRole('button', { name: /Rutina a tu medida/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Empezar/ }).click();
  await expect(page.getByRole('dialog', { name: /Entrenamiento/ })).toBeVisible();
});

test('técnica: desde la rutina y desde el reproductor, con variantes más fácil / difícil', async ({ page }) => {
  await ready(page, { profile: { goal: 'fat', level: 2, days: 3, done: true } });
  await page.goto('/#/explorar');
  await page.getByRole('button', { name: 'Ver Cuerpo entero' }).click();
  await page.getByRole('button', { name: 'Ver técnica: Sentadillas' }).click();
  let dlg = page.getByRole('dialog');
  await expect(dlg).toContainText('Pecho arriba, cadera atrás');
  await dlg.getByRole('button', { name: /Más fácil: Sentadilla a la silla/ }).click();
  await expect(page.getByRole('dialog')).toContainText('Sentadilla a la silla');
  await page.getByRole('button', { name: /Volver/ }).click();
  await expect(page.getByRole('dialog')).toContainText('Cuerpo entero'); // vuelve a la rutina
  await page.getByRole('dialog').getByRole('button', { name: 'Empezar', exact: true }).click();
  const player = page.getByRole('dialog', { name: /Entrenamiento/ });
  await player.getByRole('button', { name: 'Ver técnica' }).click();
  await expect(page.locator('#overlay [role=dialog]')).toContainText('Sentadillas');
});

test('explorar: cambiar el nivel actualiza las tarjetas', async ({ page }) => {
  await ready(page, onboarded);
  await page.goto('/#/explorar');
  const card = page.locator('article.wcard', { hasText: 'Cuerpo entero' }).first();
  await expect(card).toContainText('5 ejercicios');
  await page.getByRole('group', { name: 'Nivel' }).getByRole('button', { name: 'Avanzado' }).click();
  await expect(page.locator('article.wcard', { hasText: 'Cuerpo entero' }).first()).toContainText('7 ejercicios');
  await expect(page.locator('article.wcard', { hasText: 'Cuerpo entero' }).first()).toContainText('3 rondas');
});

test('datos guardados corruptos no rompen la app', async ({ page }) => {
  const errors = await ready(page);
  await page.addInitScript(k => localStorage.setItem(k, '{"profile":5,"log":[{"date":"x"}],"plan":{"weeks":7}}'), KEY);
  await page.goto('/');
  await expect(page.getByRole('dialog')).toContainText('Crea tu plan');
  expect(errors).toEqual([]);
});

test('accesibilidad (axe) en progreso con repeticiones y en la ficha de un ejercicio', async ({ page }) => {
  const reps = [['2026-09-01', 8], ['2026-09-08', 10], ['2026-09-15', 14]].map(([date, r]) => ({ date, ex: 'pu', reps: r }));
  await ready(page, { ...onboarded, reps, log: [{ date: '2026-09-15', wid: 'hiit', name: 'HIIT', min: 10, kcal: 70 }] });
  await page.goto('/#/progreso');
  await expect(page.getByRole('button', { name: /Flexiones/ })).toBeVisible();
  let { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(violations.map(v => `${v.id}: ${v.nodes.map(n => n.target).join(' | ')}`)).toEqual([]);
  await page.getByRole('button', { name: /Flexiones/ }).click();
  await page.waitForTimeout(300);
  ({ violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze());
  expect(violations.map(v => `${v.id}: ${v.nodes.map(n => n.target).join(' | ')}`)).toEqual([]);
});

for (const tab of ['hoy', 'explorar', 'plan', 'progreso']) {
  test(`accesibilidad (axe) en ${tab}`, async ({ page }) => {
    await ready(page, onboarded);
    await page.goto(`/#/${tab}`);
    await page.waitForTimeout(300);
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(violations.map(v => `${v.id}: ${v.nodes.map(n => n.target).join(' | ')}`)).toEqual([]);
  });
}
