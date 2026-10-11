import { describe, expect, it } from 'vitest';
import {
  ageCondition,
  buildQuery,
  clampAge,
  KINDS,
  MAX_AGE,
  MIN_AGE,
  parseQueryTag,
} from './sparql.ts';

describe('ageCondition', () => {
  it('allows the year difference N or N+1 when roasting (birthdays later in the year)', () => {
    expect(ageCondition(24, 'roast')).toBe('(?yd = 24 || ?yd = 25)');
  });

  it('looks later in life when hyping', () => {
    expect(ageCondition(24, 'hype')).toBe('(?yd >= 27 && ?yd <= 84)');
  });
});

describe('clampAge', () => {
  it('keeps ages in range and whole', () => {
    expect(clampAge(0)).toBe(MIN_AGE);
    expect(clampAge(500)).toBe(MAX_AGE);
    expect(clampAge(24.4)).toBe(24);
    expect(clampAge(Number.NaN)).toBe(MIN_AGE);
  });
});

describe('buildQuery', () => {
  it.each(KINDS)('builds a tagged, filtered query for %s', (kind) => {
    const query = buildQuery(kind, 'roast', 24);
    expect(parseQueryTag(query)).toEqual({ kind, mode: 'roast', age: 24 });
    expect(query).toContain('?p wdt:P31 wd:Q5');
    expect(query).toContain('(?yd = 24 || ?yd = 25)');
    // Nothing dated after the person died.
    expect(query).toContain('(!BOUND(?died) || ?date <= ?died)');
    // QLever needs the numeric filters in one FILTER after the BIND.
    expect(query.indexOf('BIND(YEAR(?date) - YEAR(?born) AS ?yd)')).toBeLessThan(
      query.indexOf('FILTER((?yd'),
    );
    expect(query).toContain('LIMIT 60');
  });

  it('asks for verb hints only where they are used', () => {
    expect(buildQuery('work', 'roast', 30)).toContain('BIND(1 AS ?directed)');
    expect(buildQuery('discovered', 'roast', 30)).toContain('?typeLabel');
    expect(buildQuery('award', 'roast', 30)).not.toContain('?typeLabel');
  });

  it('wants more famous people in the hype edition', () => {
    const roast = buildQuery('work', 'roast', 30);
    const hype = buildQuery('work', 'hype', 30);
    const minLinks = (q: string) => Number(/\?links >= (\d+)/.exec(q)?.[1]);
    expect(minLinks(hype)).toBeGreaterThan(minLinks(roast));
  });
});

describe('parseQueryTag', () => {
  it('ignores queries without a valid tag', () => {
    expect(parseQueryTag('SELECT * WHERE {}')).toBeUndefined();
    expect(parseQueryTag('#ayg kind=nope mode=roast age=3')).toBeUndefined();
    expect(parseQueryTag('#ayg kind=work mode=nope age=3')).toBeUndefined();
  });
});
