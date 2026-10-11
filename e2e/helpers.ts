import { readFileSync } from 'node:fs';
import type { Page, Route } from '@playwright/test';
import { parseQueryTag } from '../src/lib/sparql.ts';

const PORTRAIT = readFileSync('public/pwa-192x192.png');
const PAGES = JSON.parse(readFileSync('e2e/fixtures/wikipedia.json', 'utf8')) as Record<
  string,
  { title: string }
>;

export type QleverMode = 'fixtures' | 'fail' | 'empty';

/**
 * Answers QLever and Wikipedia from recorded fixtures and blocks every other outside request,
 * so tests never depend on the network.
 *
 * `qlever(kind)` decides per search: answer from fixtures (empty if none were recorded),
 * fail with 503, or answer with no rows.
 */
export async function offline(page: Page, qlever: (kind: string) => QleverMode = () => 'fixtures') {
  await page.route(
    (url) => url.hostname !== 'localhost',
    (route) => route.abort('blockedbyclient'),
  );
  await page.route('https://qlever.dev/**', (route) => answerQlever(route, qlever));
  await page.route('https://en.wikipedia.org/w/api.php**', answerWikipedia);
  await page.route('https://thumb.wikimedia.org/**', (route) =>
    route.fulfill({
      body: PORTRAIT,
      contentType: 'image/png',
      headers: { 'Access-Control-Allow-Origin': '*' },
    }),
  );
}

const CORS = { 'Access-Control-Allow-Origin': '*' };

async function answerQlever(route: Route, qlever: (kind: string) => QleverMode) {
  const query = new URL(route.request().url()).searchParams.get('query') ?? '';
  const tag = parseQueryTag(query);
  const mode = tag ? qlever(tag.kind) : 'empty';
  if (mode === 'fail') return route.fulfill({ status: 503, body: 'down', headers: CORS });
  let body = JSON.stringify({ head: { vars: [] }, results: { bindings: [] } });
  if (mode === 'fixtures' && tag) {
    try {
      body = readFileSync(`e2e/fixtures/qlever/${tag.mode}-${tag.age}-${tag.kind}.json`, 'utf8');
    } catch {
      // No recording for this age: an empty answer.
    }
  }
  return route.fulfill({ body, contentType: 'application/sparql-results+json', headers: CORS });
}

async function answerWikipedia(route: Route) {
  const titles = new URL(route.request().url()).searchParams.get('titles')?.split('|') ?? [];
  const pages = titles.map((title) => PAGES[title] ?? { title, missing: true });
  return route.fulfill({ json: { query: { pages } }, headers: CORS });
}

/** Waits until every search has answered. */
export async function waitForEdition(page: Page) {
  await page
    .getByRole('status')
    .filter({ hasText: /stories?\.|failed|did not answer/ })
    .first()
    .waitFor({ timeout: 20_000 });
}
