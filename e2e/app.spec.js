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

test('entrenamiento completo: se registra y sube la racha', async ({ page }) => {
  await page.clock.install();
  await ready(page, onboarded);
  await page.goto('/#/explorar');
  await page.getByRole('button', { name: 'Empezar Despertar 5 min' }).click();
  const player = page.getByRole('dialog', { name: /Entrenamiento/ });
  for (let n = 0; n < 40 && !(await page.getByRole('heading', { name: '¡Lo lograste!' }).count()); n++) await page.clock.fastForward(20000);
  await expect(page.getByRole('heading', { name: '¡Lo lograste!' })).toBeVisible();
  await page.getByRole('button', { name: 'Listo' }).click();
  await expect(player).toHaveCount(0);
  await page.getByRole('link', { name: 'Hoy' }).click();
  await expect(page.getByText('1 día de racha')).toBeVisible();
  await page.getByRole('link', { name: 'Progreso' }).click();
  await expect(page.locator('.stat').first()).toContainText('1');
});

test('datos guardados corruptos no rompen la app', async ({ page }) => {
  const errors = await ready(page);
  await page.addInitScript(k => localStorage.setItem(k, '{"profile":5,"log":[{"date":"x"}],"plan":{"weeks":7}}'), KEY);
  await page.goto('/');
  await expect(page.getByRole('dialog')).toContainText('Crea tu plan');
  expect(errors).toEqual([]);
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
