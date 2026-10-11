import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { offline, waitForEdition } from './helpers.ts';

const editions = ['roast', 'hype'] as const;
const schemes = ['light', 'dark'] as const;

for (const mode of editions) {
  for (const colorScheme of schemes) {
    test(`no accessibility problems: ${mode}, ${colorScheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await offline(page);
      await page.goto(`./?age=24${mode === 'hype' ? '&mode=hype' : ''}`);
      await waitForEdition(page);
      await expect(page.getByRole('img', { name: 'Your front page, ready to share' })).toBeVisible({
        timeout: 15_000,
      });
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([]);
    });
  }
}

test('the home page has no accessibility problems', async ({ page }) => {
  await offline(page);
  await page.goto('./');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([]);
});

for (const width of [320, 390]) {
  test(`nothing scrolls sideways at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await offline(page);
    await page.goto('./?age=24');
    await waitForEdition(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
}

test('the form works with the keyboard alone', async ({ page }) => {
  await offline(page);
  await page.goto('./');
  const age = page.getByRole('textbox', { name: 'Your age' });
  await age.focus();
  await page.keyboard.type('30');
  await page.keyboard.press('ArrowUp');
  await expect(age).toHaveValue('31');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Roast me' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\?age=31$/);
  // The results heading takes focus so screen readers land on the news.
  await expect(page.getByRole('heading', { name: 'What famous people did at 31' })).toBeFocused();
});
