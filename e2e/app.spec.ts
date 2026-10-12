import { expect, test } from '@playwright/test';
import { offline, waitForEdition } from './helpers.ts';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('type an age, get roasted', async ({ page }) => {
  await offline(page);
  await page.goto('./');
  await expect(page.getByText('The Daily Disappointment')).toBeVisible();
  const age = page.getByRole('textbox', { name: 'Your age' });
  await age.fill('24');
  await age.press('Enter');

  await expect(page).toHaveURL(/\?age=24$/);
  await expect(page.getByRole('heading', { name: 'What famous people did at 24' })).toBeVisible();
  await waitForEdition(page);

  const lead = page.locator('article').first();
  await expect(lead.getByText('Roasted')).toBeVisible();
  await expect(lead.getByText('Meanwhile, you:')).toBeVisible();
  await expect(lead.getByRole('heading', { level: 3 })).toHaveText(/\w+ \w+/);
  await expect(lead.getByText(/Age 24\.|Around age 24\./)).toBeVisible();
  await expect(lead.getByRole('link', { name: /Read more on Wikipedia/ })).toHaveAttribute(
    'href',
    /^https:\/\/en\.wikipedia\.org\/wiki\//,
  );
  await expect(page).toHaveTitle('At 24… | The Daily Disappointment');
});

test('a shared link opens the hype edition straight away', async ({ page }) => {
  await offline(page);
  await page.goto('./?age=24&mode=hype');
  await expect(page.getByText('The Late Bloomer Times')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Who did their big thing after 24' }),
  ).toBeVisible();
  await waitForEdition(page);
  await expect(page.locator('article').first().getByText('Still time')).toBeVisible();
  await expect(page.getByText(/years of runway\./).first()).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Your age' })).toHaveValue('24');
});

test('switching editions keeps the age and asks again', async ({ page }) => {
  await offline(page);
  await page.goto('./?age=24');
  await waitForEdition(page);
  await page.getByText('Hype', { exact: true }).click();
  await expect(page).toHaveURL(/\?age=24&mode=hype$/);
  await expect(page.locator('html')).toHaveAttribute('data-edition', 'hype');
  await expect(page.getByRole('button', { name: 'Hype me' })).toBeVisible();
  await waitForEdition(page);
  await expect(page.getByText(/years of runway\./).first()).toBeVisible();
});

test('the back button goes back to the previous age', async ({ page }) => {
  await offline(page);
  await page.goto('./?age=24');
  await waitForEdition(page);
  const age = page.getByRole('textbox', { name: 'Your age' });
  await age.fill('40');
  await age.press('Enter');
  await expect(page).toHaveURL(/\?age=40$/);
  await page.goBack();
  await expect(page).toHaveURL(/\?age=24$/);
  await expect(age).toHaveValue('24');
});

test('an age with nothing famous gets a friendly empty page', async ({ page }) => {
  await offline(page);
  await page.goto('./');
  const age = page.getByRole('textbox', { name: 'Your age' });
  await age.fill('65');
  await age.press('Enter');
  await waitForEdition(page);
  await expect(page.getByText('Nothing to report')).toBeVisible();
  await expect(page.getByText('0 stories.')).toBeVisible();
});

test('the ruler picks an age, and the button says it has changed', async ({ page }) => {
  await offline(page);
  await page.goto('./?age=24');
  await waitForEdition(page);
  const ruler = page.getByRole('slider', { name: 'Your age' });
  await expect(ruler).toHaveAttribute('aria-valuenow', '24');
  await ruler.focus();
  await page.keyboard.press('ArrowRight');
  await expect(ruler).toHaveAttribute('aria-valuenow', '25');
  await expect(page.getByRole('textbox', { name: 'Your age' })).toHaveValue('25');
  // The old results stay until the reader asks again.
  await expect(page).toHaveURL(/\?age=24$/);
  await expect(page.getByRole('button', { name: 'Roast me at 25' })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\?age=25$/);
});

test('after a roast, "Hype me up" opens the hype edition for the same age', async ({ page }) => {
  await offline(page);
  await page.goto('./?age=24');
  await waitForEdition(page);
  const card = page.getByRole('complementary', { name: 'Switch to the hype edition' });
  await expect(card.getByText('Okay, that one hurt.')).toBeVisible();
  await card.getByRole('button', { name: 'Hype me up' }).click();
  await expect(page).toHaveURL(/\?age=24&mode=hype$/);
  await expect(page.getByText('The Late Bloomer Times')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Who did their big thing after 24' }),
  ).toBeFocused();
  await waitForEdition(page);
  await expect(page.getByRole('complementary', { name: 'Switch to the hype edition' })).toHaveCount(
    0,
  );
});

test('the floating "Hype me up" pill follows the roast down the page', async ({ page }) => {
  await offline(page);
  await page.goto('./?age=24');
  await waitForEdition(page);
  const pill = page.getByText('Feeling roasted?');
  await expect(pill).toBeHidden();
  await page.mouse.wheel(0, 4000);
  await expect(pill).toBeVisible();
  await pill.locator('..').getByRole('button', { name: 'Hype me up' }).click();
  await expect(page).toHaveURL(/\?age=24&mode=hype$/);
});

test('the ticker runs the front page headlines', async ({ page }) => {
  await offline(page);
  await page.goto('./?age=24');
  await expect(page.getByText('Breaking', { exact: true })).toBeVisible();
  await waitForEdition(page);
  await expect(page.getByText(/^At 24, /).first()).toBeAttached();
});

test('impossible ages are explained, not searched', async ({ page }) => {
  await offline(page);
  await page.goto('./');
  await page.getByRole('textbox', { name: 'Your age' }).fill('0');
  await page.getByRole('button', { name: 'Roast me' }).click();
  await expect(page.getByRole('alert')).toHaveText('Type an age from 1 to 120, in whole years.');
  await expect(page).toHaveURL(/at-your-age\/$/);
});

test('when the server is down, Try again recovers', async ({ page }) => {
  let down = true;
  await offline(page, () => (down ? 'fail' : 'fixtures'));
  await page.goto('./?age=24');
  await expect(page.getByText('The press jammed')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('The search failed.')).toBeVisible();
  down = false;
  await page.getByRole('button', { name: 'Try again' }).click();
  await waitForEdition(page);
  await expect(page.locator('article').first().getByText('Roasted')).toBeVisible();
  await expect(page.getByText('The press jammed')).toBeHidden();
});

test('one failed desk keeps the other stories and can be retried', async ({ page }) => {
  let awardsDown = true;
  await offline(page, (kind) => (kind === 'award' && awardsDown ? 'fail' : 'fixtures'));
  await page.goto('./?age=24');
  await expect(page.getByText('One desk did not answer: Awards.')).toBeVisible({
    timeout: 30_000,
  });
  const before = await page.locator('article').count();
  expect(before).toBeGreaterThan(5);
  awardsDown = false;
  await page.getByRole('button', { name: 'Try it again' }).click();
  await expect(page.getByText('One desk did not answer')).toBeHidden({ timeout: 30_000 });
  await expect(page.getByRole('status').filter({ hasText: /^\d+ stories\.$/ })).toBeVisible();
});

test('shows more stories on request', async ({ page }) => {
  await offline(page);
  await page.goto('./?age=24');
  await waitForEdition(page);
  const before = await page.locator('article').count();
  await page.getByRole('button', { name: /Show \d+ more stories/ }).click();
  await expect.poll(() => page.locator('article').count()).toBeGreaterThan(before);
});

test('the share image can be downloaded and the link copied', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await offline(page);
  await page.goto('./?age=24');
  await waitForEdition(page);
  await expect(page.getByRole('img', { name: 'Your front page, ready to share' })).toBeVisible({
    timeout: 15_000,
  });
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download image' }).click();
  expect((await download).suggestedFilename()).toBe('at-24-roasted.png');

  await page.getByRole('button', { name: 'Copy link' }).click();
  await expect(page.getByRole('button', { name: 'Link copied' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(
    /\/at-your-age\/\?age=24$/,
  );
});

test('the night print is remembered', async ({ page }) => {
  await offline(page);
  await page.goto('./');
  await page.getByText('Night', { exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByText('Auto', { exact: true }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
});
