/**
 * Renders public/og.png, the 1200×630 preview shown when the link is shared on WhatsApp,
 * Facebook, X and friends. Uses the app's own fonts, so a server must be running:
 *
 *   npm run dev            # in one terminal (or npm run preview)
 *   npm run og             # in another
 */
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173/at-your-age/';
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.goto(BASE);
await page.waitForSelector('#age');
await page.evaluate(() => {
  document.documentElement.dataset.edition = 'roast';
  document.body.innerHTML = `
  <div style="display:grid;grid-template-columns:1fr 1fr;width:1200px;height:630px;overflow:hidden">
    <section style="background:#f6f5f1;color:#000;padding:44px 40px 0 56px;position:relative">
      <div style="background:#d6000f;color:#fff;margin:-44px -40px 0 -56px;padding:24px 40px 20px 56px;font:700 47px UnifrakturCook;white-space:nowrap">The Daily Disappointment</div>
      <p style="margin:40px 0 0;font:400 150px/0.86 Anton;text-transform:uppercase">At 24…</p>
      <p style="margin:26px 0 0;font:400 40px/1.02 Anton;text-transform:uppercase;max-width:470px">Michael Jackson releases ‘Thriller’</p>
      <p style="margin:18px 0 0;font:500 24px/1.35 'Newsreader Variable';border-left:7px solid #d6000f;background:#e9e7e1;padding:10px 14px;max-width:460px"><b>Meanwhile, you:</b> 47 tabs open, zero plans.</p>
      <span style="position:absolute;right:40px;bottom:96px;transform:rotate(-11deg);font:400 44px Anton;color:#c2000e;border:6px solid #c2000e;background:rgba(246,245,241,.85);padding:4px 14px 0;letter-spacing:.04em">ROASTED</span>
      <p style="position:absolute;left:56px;bottom:30px;margin:0;font:650 24px 'Newsreader Variable'">muktaditbf.github.io/at-your-age</p>
    </section>
    <section style="background:#fff3c4;color:#0f3d2e;padding:44px 56px 0 48px;position:relative">
      <div style="border-top:5px solid #0f3d2e;border-bottom:5px solid #0f3d2e;padding:12px 0 10px;margin-top:-14px;font:800 40px 'Fraunces Variable';font-variation-settings:'SOFT' 100;white-space:nowrap">The Late Bloomer Times</div>
      <p style="margin:40px 0 0;font:750 124px/0.86 'Fraunces Variable';font-variation-settings:'SOFT' 100;letter-spacing:-.015em;white-space:nowrap">At 24…</p>
      <p style="margin:30px 0 0;font:750 35px/1.1 'Fraunces Variable';font-variation-settings:'SOFT' 100;max-width:480px">Charles Darwin publishes ‘On the Origin of Species’</p>
      <p style="margin:16px 0 0;font:650 24px/1.3 'Newsreader Variable'">Age 50: 26 years of runway.</p>
      <span style="position:absolute;right:48px;bottom:96px;transform:rotate(-6deg);font:800 34px 'Fraunces Variable';background:#f2a900;border-radius:999px;padding:6px 20px">Still time</span>
      <p style="position:absolute;left:48px;bottom:30px;margin:0;font:500 24px 'Newsreader Variable'">Type your age. Get roasted, or get hyped.</p>
    </section>
  </div>`;
});
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);
await page.screenshot({ path: 'public/og.png' });
await browser.close();
console.log('✓ public/og.png');
