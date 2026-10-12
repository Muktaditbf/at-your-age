/**
 * Records real answers from QLever and Wikipedia for the end-to-end tests, so they run offline
 * and the same way every time.
 *
 *   npm run fixtures
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { buildQuery, KINDS, type Mode } from '../src/lib/sparql.ts';

const QLEVER = 'https://qlever.dev/api/wikidata';
const WIKIPEDIA = 'https://en.wikipedia.org/w/api.php';
const EDITIONS: { age: number; mode: Mode }[] = [
  { age: 24, mode: 'roast' },
  { age: 24, mode: 'hype' },
];

const titles = new Set<string>();
await mkdir('e2e/fixtures/qlever', { recursive: true });

for (const { age, mode } of EDITIONS) {
  for (const kind of KINDS) {
    const res = await fetch(`${QLEVER}?query=${encodeURIComponent(buildQuery(kind, mode, age))}`, {
      headers: { Accept: 'application/sparql-results+json' },
    });
    if (!res.ok) throw new Error(`${kind} ${mode} ${age}: ${res.status}`);
    const json = (await res.json()) as {
      head: unknown;
      results: { bindings: Record<string, { value: string }>[] };
    };
    for (const row of json.results.bindings) {
      const article = row.article?.value;
      if (article)
        titles.add(decodeURIComponent(article.split('/wiki/')[1] ?? '').replaceAll('_', ' '));
    }
    const file = `e2e/fixtures/qlever/${mode}-${age}-${kind}.json`;
    await writeFile(file, JSON.stringify({ head: json.head, results: json.results }));
    console.log(`✓ ${file} (${json.results.bindings.length} rows)`);
  }
}

// Photos and bios, keyed by title, as Wikipedia's "pages" objects.
const pages: Record<string, unknown> = {};
const list = [...titles];
for (let i = 0; i < list.length; i += 50) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    origin: '*',
    redirects: '1',
    prop: 'pageimages|description|pageviews',
    piprop: 'thumbnail|original',
    pithumbsize: '330',
    pilimit: '50',
    pvipdays: '30',
    titles: list.slice(i, i + 50).join('|'),
  });
  const json = (await (await fetch(`${WIKIPEDIA}?${params}`)).json()) as {
    query?: { pages?: { title: string }[] };
  };
  for (const page of json.query?.pages ?? []) pages[page.title] = page;
}
await writeFile('e2e/fixtures/wikipedia.json', JSON.stringify(pages));
console.log(`✓ e2e/fixtures/wikipedia.json (${Object.keys(pages).length} people)`);
