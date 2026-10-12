import { describe, expect, it } from 'vitest';
import {
  CLASSIFIEDS,
  DESK_TAGS,
  DESKS,
  HYPES,
  hash,
  leadLine,
  PRESS_LINES,
  pick,
  ROASTS,
  runway,
  TEASERS,
} from './lines.ts';
import { KINDS } from './sparql.ts';

describe('lines', () => {
  it('has plenty of lines and no duplicates', () => {
    for (const list of [ROASTS, HYPES]) {
      expect(list.length).toBeGreaterThanOrEqual(25);
      expect(new Set(list).size).toBe(list.length);
    }
  });

  it('keeps lines short enough for the share image', () => {
    for (const line of [...ROASTS, ...HYPES.map((l) => l.replace('{gap}', '100'))]) {
      expect(line.length).toBeLessThanOrEqual(80);
    }
  });

  it('fills in the runway, and skips runway lines when there is none', () => {
    for (let seed = 0; seed < HYPES.length; seed++) {
      expect(leadLine('hype', seed, 26)).not.toContain('{gap}');
      expect(leadLine('hype', seed)).not.toContain('{gap}');
      expect(leadLine('hype', seed)).not.toContain('undefined');
    }
    expect(HYPES.some((l) => l.includes('{gap}'))).toBe(true);
  });

  it('has classifieds and press lines for both editions, and a desk for every search', () => {
    expect(CLASSIFIEDS.roast.length).toBeGreaterThan(2);
    expect(CLASSIFIEDS.hype.length).toBeGreaterThan(2);
    expect(PRESS_LINES.roast.length).toBeGreaterThan(4);
    expect(PRESS_LINES.hype.length).toBeGreaterThan(4);
    for (const kind of KINDS) {
      expect(DESKS[kind]).toBeTruthy();
      expect(DESK_TAGS[kind]).toBeTruthy();
    }
    expect(TEASERS.roast.length).toBeGreaterThan(2);
    expect(TEASERS.hype.length).toBeGreaterThan(2);
  });

  it('picks the same line for the same search', () => {
    expect(hash('roast:24:3')).toBe(hash('roast:24:3'));
    expect(leadLine('roast', 7)).toBe(leadLine('roast', 7));
    expect(ROASTS).toContain(leadLine('roast', hash('x')));
    expect(HYPES).toContain(leadLine('hype', hash('x')));
    expect(pick(['a', 'b', 'c'], 4, 1)).toBe('c');
  });

  it('says runway in plain words', () => {
    expect(runway(1)).toBe('1 year of runway');
    expect(runway(26)).toBe('26 years of runway');
  });
});
