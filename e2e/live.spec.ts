import { expect, test } from '@playwright/test';
import { BLOCKLIST } from '../src/data/blocklist.ts';
import { waitForEdition } from './helpers.ts';

// Talks to the real QLever and Wikipedia. Run with `npm run e2e:live`; skipped otherwise.
test.skip(!process.env.LIVE, 'live test: set LIVE=1');
test.setTimeout(120_000);

for (const [age, mode] of [
  [30, 'roast'],
  [19, 'hype'],
] as const) {
  test(`live: age ${age}, ${mode}`, async ({ page }) => {
    const started = Date.now();
    await page.goto(`./?age=${age}${mode === 'hype' ? '&mode=hype' : ''}`);
    await expect(page.locator('article').first()).toBeVisible({ timeout: 30_000 });
    const firstStory = Date.now() - started;
    await waitForEdition(page);
    const total = Date.now() - started;
    const count = await page.locator('article').count();
    console.log(
      `age ${age} ${mode}: first story ${firstStory} ms, all ${total} ms, ${count} on page`,
    );
    expect(count).toBeGreaterThan(10);
    // Headlines read "<name> <verb> …": none may be about someone on the blocklist.
    // (Matching the verb too keeps "Abraham Lincoln becomes …" from looking like "Abraham".)
    const verbs =
      /^ (directs|stars in|makes|releases|composes|publishes|paints|sculpts|designs|creates|wins|is named|becomes|founds|discovers|invents) /;
    const headlines = await page.locator('article h3').allTextContents();
    for (const text of headlines) {
      const hits = BLOCKLIST.filter(
        (p) => text.startsWith(p.name) && verbs.test(text.slice(p.name.length)),
      );
      expect(hits.map((p) => p.name)).toEqual([]);
    }
  });
}
