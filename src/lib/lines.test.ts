import { describe, expect, it } from 'vitest';
import {
  CLASSIFIEDS,
  DESKS,
  HYPES,
  hash,
  leadLine,
  PRESS_LINES,
  pick,
  ROASTS,
  runway,
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
    for (const line of [...ROASTS, ...HYPES]) expect(line.length).toBeLessThanOrEqual(80);
  });

  it('has classifieds and press lines for both editions, and a desk for every search', () => {
    expect(CLASSIFIEDS.roast.length).toBeGreaterThan(2);
    expect(CLASSIFIEDS.hype.length).toBeGreaterThan(2);
    expect(PRESS_LINES.roast.length).toBeGreaterThan(4);
    expect(PRESS_LINES.hype.length).toBeGreaterThan(4);
    for (const kind of KINDS) expect(DESKS[kind]).toBeTruthy();
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
