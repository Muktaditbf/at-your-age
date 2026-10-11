/**
 * Makes the README images from recorded answers (so they don't change between runs) with
 * real Wikimedia photos.
 *
 *   npm run build && npm run preview     # in one terminal
 *   npm run screenshots                  # in another
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { type Browser, chromium, type Page } from '@playwright/test';
import { parseQueryTag } from '../src/lib/sparql.ts';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/at-your-age/';
const OUT = 'docs/screenshots';
const PAGES = JSON.parse(await readFile('e2e/fixtures/wikipedia.json', 'utf8')) as Record<
  string,
  unknown
>;

async function newPage(
  browser: Browser,
  opts: { dark?: boolean; width?: number; height?: number },
) {
  const context = await browser.newContext({
    viewport: { width: opts.width ?? 390, height: opts.height ?? 844 },
    deviceScaleFactor: 2,
    colorScheme: opts.dark ? 'dark' : 'light',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.route('https://qlever.dev/**', async (route) => {
    const tag = parseQueryTag(new URL(route.request().url()).searchParams.get('query') ?? '');
    const body = tag
      ? await readFile(`e2e/fixtures/qlever/${tag.mode}-${tag.age}-${tag.kind}.json`, 'utf8')
      : '{"results":{"bindings":[]}}';
    await route.fulfill({ body, headers: { 'Access-Control-Allow-Origin': '*' } });
  });
  await page.route('https://en.wikipedia.org/w/api.php**', async (route) => {
    const titles = new URL(route.request().url()).searchParams.get('titles')?.split('|') ?? [];
    await route.fulfill({
      json: { query: { pages: titles.map((t) => PAGES[t] ?? { title: t, missing: true }) } },
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  });
  return page;
}

async function openEdition(page: Page, search: string) {
  await page.goto(`${BASE}${search}`);
  await page
    .getByRole('status')
    .filter({ hasText: /stories?\./ })
    .first()
    .waitFor();
  await page.getByAltText('Your front page, ready to share').waitFor({ timeout: 20_000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
}

async function shot(page: Page, name: string, scrollTo?: string) {
  await page.evaluate((selector) => {
    if (!selector) return window.scrollTo(0, 0);
    document.querySelector(selector)?.scrollIntoView({ block: 'start' });
    window.scrollBy(0, -20);
  }, scrollTo);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`✓ ${name}.png`);
}

async function saveCard(page: Page, name: string) {
  const base64 = await page.evaluate(async () => {
    const img = document.querySelector<HTMLImageElement>(
      'img[alt="Your front page, ready to share"]',
    );
    const blob = await (await fetch(img?.src ?? '')).blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
      reader.readAsDataURL(blob);
    });
  });
  await writeFile(`${OUT}/${name}.png`, Buffer.from(base64, 'base64'));
  console.log(`✓ ${name}.png`);
}

const dataUrl = async (name: string) =>
  `data:image/png;base64,${(await readFile(`${OUT}/${name}.png`)).toString('base64')}`;

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM_PATH || undefined,
});

const roast = await newPage(browser, {});
await openEdition(roast, '?age=24');
await shot(roast, 'home');
await shot(roast, 'roast', '#results-title');
await saveCard(roast, 'card-roast');

const hype = await newPage(browser, {});
await openEdition(hype, '?age=24&mode=hype');
await shot(hype, 'hype', '#results-title');
await saveCard(hype, 'card-hype');

const night = await newPage(browser, { dark: true });
await openEdition(night, '?age=24');
await shot(night, 'night', 'article:nth-of-type(1)');

const desktop = await newPage(browser, { width: 1280, height: 860 });
await openEdition(desktop, '?age=24');
await shot(desktop, 'desktop', '#results-title');

// The banner: three phones on the paper.
const poster = await newPage(browser, { width: 1800, height: 820 });
await poster.goto(BASE);
const phones = await Promise.all(['roast', 'hype', 'card-roast'].map(dataUrl));
await poster.evaluate((images) => {
  const [roastShot, hypeShot, card] = images;
  document.body.innerHTML = `
  <div style="height:100vh;display:flex;align-items:center;gap:56px;padding:0 80px;box-sizing:border-box;background:#f6f5f1;overflow:hidden">
    <div style="flex:1;min-width:0">
      <div style="display:inline-block;background:#d6000f;color:#fff;font:700 44px UnifrakturCook;padding:12px 24px 10px;white-space:nowrap">The Daily Disappointment</div>
      <p style="margin:28px 0 0;font:400 150px/0.88 Anton;text-transform:uppercase">At your age…</p>
      <p style="margin:28px 0 0;font:500 32px/1.35 'Newsreader Variable';max-width:600px">Type your age. See what famous people had done by then. Get roasted, or get hyped.</p>
    </div>
    <img src="${roastShot}" style="width:250px;border:4px solid #000;transform:rotate(-3deg)">
    <img src="${hypeShot}" style="width:250px;border:4px solid #0f3d2e;transform:rotate(2deg) translateY(30px)">
    <img src="${card}" style="width:290px;border:4px solid #000;transform:rotate(-2deg)">
  </div>`;
}, phones);
await poster.evaluate(() => document.fonts.ready);
await poster.waitForTimeout(600);
await poster.screenshot({ path: 'docs/banner.png' });
console.log('✓ docs/banner.png');

await browser.close();
