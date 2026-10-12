import { describe, expect, it } from 'vitest';
import type { Edition } from '../lib/edition.ts';
import { TEASERS } from '../lib/lines.ts';
import { KINDS } from '../lib/sparql.ts';
import { tickerItems } from './Ticker.tsx';

const edition = (mode: 'roast' | 'hype'): Edition => ({
  age: 24,
  mode,
  run: 1,
  status: 'done',
  printed: true,
  leadId: 'Q2',
  people: {},
  failures: {},
  desks: Object.fromEntries(KINDS.map((k) => [k, 'done'])) as Edition['desks'],
  stories: ['Q1', 'Q2'].map((id) => ({
    id,
    name: id === 'Q1' ? 'Michael Jackson' : 'Lionel Messi',
    fame: 100,
    born: { year: 1950, month: 1, day: 1, precision: 'year' },
    deeds: [
      {
        kind: 'work',
        thingId: 'T',
        thing: id === 'Q1' ? 'Thriller' : 'Ballon d’Or',
        verb: 'releases',
        date: { year: 1982, month: 1, day: 1, precision: 'year' },
        age: { years: id === 'Q1' ? 24 : 34, exact: true },
        thingFame: 1,
      },
    ],
  })),
});

describe('tickerItems', () => {
  it('shows jokes before there are stories', () => {
    expect(tickerItems('roast', undefined)).toEqual([...TEASERS.roast]);
  });

  it('loops the front page, lead first, with the right age per edition', () => {
    expect(tickerItems('roast', edition('roast'))).toEqual([
      'At 24, Lionel Messi releases ‘Ballon d’Or’',
      'At 24, Michael Jackson releases ‘Thriller’',
    ]);
    expect(tickerItems('hype', edition('hype'))[0]).toBe(
      'At 34, Lionel Messi releases ‘Ballon d’Or’',
    );
  });

  it('ignores an edition for the other paper', () => {
    expect(tickerItems('hype', edition('roast'))).toEqual([...TEASERS.hype]);
  });
});
