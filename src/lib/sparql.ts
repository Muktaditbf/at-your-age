/**
 * Builds the SPARQL queries sent to QLever (a fast public Wikidata endpoint).
 *
 * One query per kind of achievement. Each query:
 * - finds people (humans with a birth date) and a dated thing they did,
 * - keeps rows whose year difference fits the age (roast: N or N+1, hype: later in life),
 * - keeps famous people and famous things (Wikipedia language editions = "sitelinks"),
 * - drops anything dated after the person's death (posthumous releases, honorary awards),
 * - sorts by fame and limits inside a subquery, then adds labels, the Wikipedia link and hints
 *   for picking a verb ("directed", "released", ...).
 *
 * Things learned the hard way (QLever, October 2026):
 * - Numeric filters must sit in ONE FILTER after the BIND, otherwise it silently returns nothing.
 * - Reading date precision (psv:/pqv: value nodes) made queries ~6x slower, so precision is
 *   read from the date's shape instead (see dates.ts).
 * - `?p NOT IN (...)` together with the death-date filter crashes the engine, so the blocklist is
 *   applied in JavaScript.
 */

export const KINDS = ['work', 'award', 'position', 'founded', 'discovered'] as const;
export type Kind = (typeof KINDS)[number];
export type Mode = 'roast' | 'hype';

export const MIN_AGE = 1;
export const MAX_AGE = 120;

/** In hype mode we look for things people did at least this many years later than you. */
export const HYPE_MIN_GAP = 3;
export const HYPE_MAX_GAP = 60;

interface KindSpec {
  /** Binds ?p (person), ?what (the thing) and ?date. */
  pattern: string;
  /** Minimum sitelinks for the person, per mode. */
  person: Record<Mode, number>;
  /** Minimum sitelinks for the thing. */
  thing: number;
  /** Extra hints joined on the few rows that survive, for picking the verb. */
  hints?: string;
}

const TYPE_HINT =
  'OPTIONAL { ?what wdt:P31 ?type . ?type rdfs:label ?typeLabel . FILTER(LANG(?typeLabel) = "en") }';

const SPECS: Record<Kind, KindSpec> = {
  work: {
    pattern: '?p wdt:P800 ?what . ?what wdt:P577 ?date .',
    person: { roast: 50, hype: 120 },
    thing: 15,
    hints: `${TYPE_HINT}
  OPTIONAL { ?what wdt:P57 ?p . BIND(1 AS ?directed) }
  OPTIONAL { ?what wdt:P161 ?p . BIND(1 AS ?starred) }`,
  },
  award: {
    pattern: '?p p:P166 ?st . ?st ps:P166 ?what ; pq:P585 ?date .',
    person: { roast: 40, hype: 100 },
    thing: 35,
  },
  position: {
    pattern: '?p p:P39 ?st . ?st ps:P39 ?what ; pq:P580 ?date . ?what wdt:P1001 ?where .',
    person: { roast: 60, hype: 120 },
    thing: 30,
  },
  founded: {
    pattern: '?what wdt:P112 ?p ; wdt:P571 ?date .',
    person: { roast: 40, hype: 100 },
    thing: 30,
  },
  discovered: {
    pattern: '?what wdt:P61 ?p ; wdt:P575 ?date .',
    person: { roast: 30, hype: 60 },
    thing: 75,
    hints: TYPE_HINT,
  },
};

const PREFIXES = `PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX schema: <http://schema.org/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX p: <http://www.wikidata.org/prop/>
PREFIX ps: <http://www.wikidata.org/prop/statement/>
PREFIX pq: <http://www.wikidata.org/prop/qualifier/>`;

export const ROW_LIMIT = 60;

export function clampAge(age: number): number {
  if (!Number.isFinite(age)) return MIN_AGE;
  return Math.min(MAX_AGE, Math.max(MIN_AGE, Math.round(age)));
}

/** The year-difference condition for an age and mode. */
export function ageCondition(age: number, mode: Mode): string {
  const n = clampAge(age);
  return mode === 'roast'
    ? `(?yd = ${n} || ?yd = ${n + 1})`
    : `(?yd >= ${n + HYPE_MIN_GAP} && ?yd <= ${n + HYPE_MAX_GAP})`;
}

/** A comment on the first line lets tests and tools tell queries apart. */
export function queryTag(kind: Kind, mode: Mode, age: number): string {
  return `#ayg kind=${kind} mode=${mode} age=${clampAge(age)}`;
}

export function parseQueryTag(query: string): { kind: Kind; mode: Mode; age: number } | undefined {
  const match = /^#ayg kind=(\w+) mode=(\w+) age=(\d+)/.exec(query);
  if (!match) return undefined;
  const [, kind, mode, age] = match;
  if (!KINDS.includes(kind as Kind) || (mode !== 'roast' && mode !== 'hype')) return undefined;
  return { kind: kind as Kind, mode, age: Number(age) };
}

export function buildQuery(kind: Kind, mode: Mode, age: number): string {
  const spec = SPECS[kind];
  return `${queryTag(kind, mode, age)}
${PREFIXES}
SELECT * WHERE {
  {
    SELECT ?p ?born ?what ?date ?links ?wl WHERE {
      ${spec.pattern}
      ?p wdt:P31 wd:Q5 ; wdt:P569 ?born ; wikibase:sitelinks ?links .
      ?what wikibase:sitelinks ?wl .
      OPTIONAL { ?p wdt:P570 ?died }
      BIND(YEAR(?date) - YEAR(?born) AS ?yd)
      FILTER(${ageCondition(age, mode)} && ?links >= ${spec.person[mode]} && ?wl >= ${spec.thing} && (!BOUND(?died) || ?date <= ?died))
    } ORDER BY DESC(?links) DESC(?wl) LIMIT ${ROW_LIMIT}
  }
  ?p rdfs:label ?pLabel . FILTER(LANG(?pLabel) = "en")
  ?what rdfs:label ?whatLabel . FILTER(LANG(?whatLabel) = "en")
  OPTIONAL { ?article schema:about ?p ; schema:isPartOf <https://en.wikipedia.org/> . }
  ${spec.hints ?? ''}
}`;
}
