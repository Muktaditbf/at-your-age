/**
 * Runs the real queries against QLever and prints what comes back. For tuning thresholds.
 *
 *   npm run probe -- 24 roast            # all kinds for one age
 *   npm run probe -- 24 hype work        # one kind
 *   npm run probe -- --blocklist         # check blocklist IDs still match their names
 */
import { BLOCKLIST } from '../src/data/blocklist.ts';
import { buildQuery, KINDS, type Kind, type Mode } from '../src/lib/sparql.ts';

const ENDPOINT = 'https://qlever.dev/api/wikidata';

async function run(query: string) {
  const started = performance.now();
  const response = await fetch(`${ENDPOINT}?query=${encodeURIComponent(query)}`, {
    headers: { Accept: 'application/sparql-results+json' },
  });
  const ms = Math.round(performance.now() - started);
  if (!response.ok) throw new Error(`${response.status} after ${ms} ms: ${await response.text()}`);
  const json = (await response.json()) as {
    results: { bindings: Record<string, { value: string }>[] };
  };
  return { ms, rows: json.results.bindings };
}

const args = process.argv.slice(2);
if (args[0] === '--blocklist') {
  const values = BLOCKLIST.map((b) => `wd:${b.qid}`).join(' ');
  const { rows } = await run(`PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?q ?l WHERE { VALUES ?q { ${values} } ?q rdfs:label ?l . FILTER(LANG(?l) = "en") }`);
  const labels = new Map(rows.map((r) => [r.q?.value.split('/').pop(), r.l?.value]));
  let bad = 0;
  for (const b of BLOCKLIST) {
    const label = labels.get(b.qid);
    if (label !== b.name) {
      bad++;
      console.log(`✗ ${b.qid}: expected "${b.name}", Wikidata says "${label}"`);
    }
  }
  console.log(bad ? `${bad} mismatches` : `✓ all ${BLOCKLIST.length} blocklist IDs match`);
} else {
  const age = Number(args[0] ?? 24);
  const mode = (args[1] ?? 'roast') as Mode;
  const kinds = (args[2] ? [args[2]] : KINDS) as Kind[];
  for (const kind of kinds) {
    try {
      const { ms, rows } = await run(buildQuery(kind, mode, age));
      const seen = new Set<string>();
      console.log(`\n== ${kind} (${mode} ${age}): ${ms} ms, ${rows.length} rows`);
      for (const r of rows) {
        const who = r.pLabel?.value ?? '?';
        if (seen.has(who)) continue;
        seen.add(who);
        if (seen.size > 14) break;
        const yd = Number(r.date?.value.slice(0, 5)) - Number(r.born?.value.slice(0, 5));
        console.log(
          `  ${who} (${r.links?.value}) · ${r.whatLabel?.value} (${r.wl?.value}) · ${r.date?.value.slice(0, 10)} · born ${r.born?.value.slice(0, 10)} · yd ${yd} · ${r.typeLabel?.value ?? ''}${r.directed ? ' dir' : ''}${r.starred ? ' cast' : ''}`,
        );
      }
    } catch (error) {
      console.log(`\n== ${kind}: FAILED ${(error as Error).message.slice(0, 300)}`);
    }
  }
}
