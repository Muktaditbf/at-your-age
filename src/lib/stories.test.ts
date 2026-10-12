import { describe, expect, it } from 'vitest';
import type { Row } from './qlever.ts';
import {
  ageFits,
  compareStories,
  mergeStories,
  popularity,
  type Story,
  storiesFromRows,
} from './stories.ts';

const uri = (q: string) => ({ type: 'uri', value: `http://www.wikidata.org/entity/${q}` });
const lit = (value: string | number) => ({ type: 'literal', value: String(value) });

function row(fields: {
  p: string;
  name: string;
  born: string;
  what: string;
  thing: string;
  date: string;
  links?: number;
  wl?: number;
  type?: string;
  directed?: boolean;
  starred?: boolean;
  article?: string;
}): Row {
  const r: Row = {
    p: uri(fields.p),
    pLabel: lit(fields.name),
    born: lit(fields.born),
    what: uri(fields.what),
    whatLabel: lit(fields.thing),
    date: lit(fields.date),
    links: lit(fields.links ?? 100),
    wl: lit(fields.wl ?? 20),
  };
  if (fields.type) r.typeLabel = lit(fields.type);
  if (fields.directed) r.directed = lit(1);
  if (fields.starred) r.starred = lit(1);
  if (fields.article) r.article = { type: 'uri', value: fields.article };
  return r;
}

const jackson = {
  p: 'Q2831',
  name: 'Michael Jackson',
  born: '1958-08-29T00:00:00Z',
  links: 322,
  article: 'https://en.wikipedia.org/wiki/Michael_Jackson',
};

describe('ageFits', () => {
  it('needs the exact age (or the "around" year) when roasting', () => {
    expect(ageFits('roast', 24, { years: 24, exact: true })).toBe(true);
    expect(ageFits('roast', 24, { years: 25, exact: true })).toBe(false);
    expect(ageFits('roast', 24, { years: 24, exact: false })).toBe(true);
  });

  it('needs a few years of runway when hyping', () => {
    expect(ageFits('hype', 24, { years: 26, exact: true })).toBe(false);
    expect(ageFits('hype', 24, { years: 27, exact: true })).toBe(true);
  });
});

describe('storiesFromRows', () => {
  it('keeps deeds at the exact age and folds repeated rows together', () => {
    const rows = [
      row({
        ...jackson,
        what: 'Q44320',
        thing: 'Thriller',
        date: '1982-11-30T00:00:00Z',
        wl: 65,
        type: 'album',
      }),
      row({
        ...jackson,
        what: 'Q44320',
        thing: 'Thriller',
        date: '1982-11-30T00:00:00Z',
        wl: 65,
        type: 'studio album',
      }),
      // Year difference 25, but before his birthday: he was 24. Kept.
      row({
        ...jackson,
        what: 'Q1',
        thing: 'Beat It',
        date: '1983-02-14T00:00:00Z',
        wl: 40,
        type: 'single',
      }),
      // After his 25th birthday: not 24 any more. Dropped.
      row({
        ...jackson,
        what: 'Q2',
        thing: 'Later Song',
        date: '1983-10-01T00:00:00Z',
        type: 'single',
      }),
    ];
    const [story, ...rest] = storiesFromRows('work', rows, 'roast', 24);
    expect(rest).toHaveLength(0);
    expect(story?.name).toBe('Michael Jackson');
    expect(story?.article).toBe('https://en.wikipedia.org/wiki/Michael_Jackson');
    expect(story?.deeds.map((d) => [d.thing, d.verb, d.age])).toEqual([
      ['Thriller', 'releases', { years: 24, exact: true }],
      ['Beat It', 'releases', { years: 24, exact: true }],
    ]);
  });

  it('uses "around" ages for year-only dates', () => {
    const rows = [
      row({
        p: 'Q7243',
        name: 'Leo Tolstoy',
        born: '1828-09-09T00:00:00Z',
        what: 'Q1',
        thing: 'Childhood',
        date: '1852-01-01T00:00:00Z',
        type: 'literary work',
      }),
      // Year difference 25 with a year-only date could be 24 or 25: not shown as 24.
      row({
        p: 'Q7243',
        name: 'Leo Tolstoy',
        born: '1828-09-09T00:00:00Z',
        what: 'Q2',
        thing: 'Boyhood',
        date: '1853-01-01T00:00:00Z',
      }),
    ];
    const [story] = storiesFromRows('work', rows, 'roast', 24);
    expect(story?.deeds).toHaveLength(1);
    expect(story?.deeds[0]?.age).toEqual({ years: 24, exact: false });
  });

  it('leaves out blocked people and things without English names', () => {
    const rows = [
      row({
        p: 'Q352',
        name: 'Adolf Hitler',
        born: '1889-04-20T00:00:00Z',
        what: 'Q1',
        thing: 'Book',
        date: '1925-07-18T00:00:00Z',
      }),
      row({
        p: 'Q9458',
        name: 'Muhammad',
        born: '0570-04-26T00:00:00Z',
        what: 'Q2',
        thing: 'Thing',
        date: '0610-05-01T00:00:00Z',
      }),
      row({
        p: 'Q5',
        name: 'Someone',
        born: '1900-05-05T00:00:00Z',
        what: 'Q123',
        thing: 'Q123',
        date: '1936-06-06T00:00:00Z',
      }),
    ];
    expect(storiesFromRows('work', rows, 'hype', 20)).toEqual([]);
  });

  it('picks the right verb from roles', () => {
    const rows = [
      row({
        p: 'Q1',
        name: 'A Director',
        born: '1950-05-05T00:00:00Z',
        what: 'Q9',
        thing: 'A Film',
        date: '1980-06-06T00:00:00Z',
        type: 'film',
        directed: true,
      }),
    ];
    expect(storiesFromRows('work', rows, 'roast', 30)[0]?.deeds[0]?.verb).toBe('directs');
  });

  it('sorts people by fame', () => {
    const rows = [
      row({
        p: 'Q1',
        name: 'Less Famous',
        born: '1950-05-05T00:00:00Z',
        what: 'Q9',
        thing: 'X',
        date: '1980-06-06T00:00:00Z',
        links: 50,
      }),
      row({
        p: 'Q2',
        name: 'More Famous',
        born: '1950-05-05T00:00:00Z',
        what: 'Q8',
        thing: 'Y',
        date: '1980-06-06T00:00:00Z',
        links: 90,
      }),
    ];
    expect(storiesFromRows('founded', rows, 'roast', 30).map((s) => s.name)).toEqual([
      'More Famous',
      'Less Famous',
    ]);
  });
});

describe('mergeStories', () => {
  const story = (id: string, fame: number, things: string[]): Story => ({
    id,
    name: id,
    fame,
    born: { year: 1950, month: 1, day: 1, precision: 'year' },
    deeds: things.map((thing, i) => ({
      kind: 'work',
      thingId: thing,
      thing,
      verb: 'creates',
      date: { year: 1980, month: 1, day: 1, precision: 'year' },
      age: { years: 30, exact: false },
      thingFame: 10 - i,
    })),
  });

  it('adds new people, adds new deeds to known people, and keeps fame order', () => {
    const merged = mergeStories(
      [story('Q1', 10, ['a'])],
      [story('Q2', 50, ['b']), story('Q1', 10, ['a', 'c'])],
    );
    expect(merged.map((s) => s.id)).toEqual(['Q2', 'Q1']);
    expect(merged[1]?.deeds.map((d) => d.thingId)).toEqual(['a', 'c']);
  });
});

describe('popularity', () => {
  const person = (id: string, fame: number, views?: number): Story => ({
    id,
    name: id,
    fame,
    views,
    born: { year: 1950, month: 1, day: 1, precision: 'year' },
    deeds: [],
  });

  it('ranks by page views when known', () => {
    const king = person('King', 120, 8_000);
    const star = person('Star', 80, 300_000);
    expect([king, star].sort(compareStories).map((s) => s.id)).toEqual(['Star', 'King']);
  });

  it('falls back to language editions when views are unknown', () => {
    expect(popularity(person('A', 100))).toBe(50_000);
    expect(popularity(person('B', 100, 7))).toBe(7);
  });
});
