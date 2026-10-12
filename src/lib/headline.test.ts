import { describe, expect, it } from 'vitest';
import { parseWikiDate } from './dates.ts';
import { dateline, headline, thingText, verbFor } from './headline.ts';
import type { Deed } from './stories.ts';

const hints = (types: string[], extra: Partial<Parameters<typeof verbFor>[1]> = {}) => ({
  types,
  year: 1982,
  thing: 'Thing',
  ...extra,
});

describe('verbFor', () => {
  it('picks verbs for works from roles and types', () => {
    expect(verbFor('work', hints(['film'], { directed: true }))).toBe('directs');
    expect(verbFor('work', hints(['film'], { starred: true }))).toBe('stars in');
    expect(verbFor('work', hints(['film']))).toBe('makes');
    expect(verbFor('work', hints(['album']))).toBe('releases');
    expect(verbFor('work', hints(['literary work']))).toBe('publishes');
    expect(verbFor('work', hints(['painting']))).toBe('paints');
    expect(verbFor('work', hints(['video game']))).toBe('makes');
    expect(verbFor('work', hints([]))).toBe('creates');
  });

  it('composes old music and releases recorded music', () => {
    expect(verbFor('work', hints(['dramatico-musical work'], { year: 1787 }))).toBe('composes');
    expect(verbFor('work', hints(['musical work/composition'], { year: 1965 }))).toBe('releases');
  });

  it('handles awards that are really lists or memberships', () => {
    expect(verbFor('award', hints([], { thing: "Ballon d'Or" }))).toBe('wins');
    expect(verbFor('award', hints([], { thing: 'Time 100' }))).toBe('makes');
    expect(verbFor('award', hints([], { thing: 'Time Person of the Year' }))).toBe('is named');
    expect(verbFor('award', hints([], { thing: 'Fellow of the Royal Society' }))).toBe('becomes');
    expect(verbFor('award', hints([], { thing: 'Rock and Roll Hall of Fame' }))).toBe('enters');
    expect(verbFor('award', hints([], { thing: 'Order of the White Eagle' }))).toBe('receives');
    expect(verbFor('award', hints([], { thing: 'Presidential Medal of Freedom' }))).toBe(
      'receives',
    );
  });

  it('tells discoveries from inventions', () => {
    expect(verbFor('discovered', hints(['chemical element']))).toBe('discovers');
    expect(verbFor('discovered', hints(['dwarf planet']))).toBe('discovers');
    expect(verbFor('discovered', hints(['type of sport']))).toBe('invents');
    expect(verbFor('discovered', hints([]))).toBe('invents');
  });

  it('uses fixed verbs for offices and founding', () => {
    expect(verbFor('position', hints([]))).toBe('becomes');
    expect(verbFor('founded', hints([]))).toBe('founds');
  });
});

describe('headline', () => {
  it('quotes titles of works only', () => {
    expect(headline('Michael Jackson', 'releases', 'work', 'Thriller')).toBe(
      'Michael Jackson releases ‘Thriller’',
    );
    expect(thingText('award', "Ballon d'Or")).toBe("Ballon d'Or");
  });
});

describe('dateline', () => {
  const deed = (date: string, years: number, exact: boolean): Deed => ({
    kind: 'work',
    thingId: 'Q1',
    thing: 'Thing',
    verb: 'creates',
    date: parseWikiDate(date) ?? { year: 0, month: 1, day: 1, precision: 'year' },
    age: { years, exact },
    thingFame: 1,
  });

  it('says the date and age', () => {
    expect(dateline(deed('1982-11-30T00:00:00Z', 24, true), 'roast', 24)).toBe(
      'Nov 30, 1982. Age 24.',
    );
    expect(dateline(deed('1852-01-01T00:00:00Z', 24, false), 'roast', 24)).toBe(
      '1852. Around age 24.',
    );
  });

  it('adds the runway in the hype edition', () => {
    expect(dateline(deed('1859-11-24T00:00:00Z', 50, true), 'hype', 24)).toBe(
      'Nov 24, 1859. Age 50: 26 years of runway.',
    );
  });
});
