import { describe, expect, it } from 'vitest';
import { ageLabel, ageOn, formatDate, formatYear, parseWikiDate } from './dates.ts';

const d = (value: string) => {
  const parsed = parseWikiDate(value);
  if (!parsed) throw new Error(`bad date ${value}`);
  return parsed;
};

describe('parseWikiDate', () => {
  it('reads full dates as day precision', () => {
    expect(parseWikiDate('1982-11-30T00:00:00Z')).toEqual({
      year: 1982,
      month: 11,
      day: 30,
      precision: 'day',
    });
  });

  it('treats the 1st of a month as month precision, and January 1 as year precision', () => {
    expect(d('1983-09-01T00:00:00Z').precision).toBe('month');
    expect(d('1852-01-01T00:00:00Z').precision).toBe('year');
  });

  it('reads years before 1 AD (astronomical numbering)', () => {
    expect(d('-0099-07-12T00:00:00Z')).toMatchObject({ year: -99, month: 7, day: 12 });
    expect(d('+1790-02-03T00:00:00Z').year).toBe(1790);
  });

  it('rejects things that are not dates', () => {
    expect(parseWikiDate('')).toBeUndefined();
    expect(parseWikiDate('yesterday')).toBeUndefined();
    expect(parseWikiDate('1982-13-01T00:00:00Z')).toBeUndefined();
    expect(parseWikiDate('1982-00-10T00:00:00Z')).toBeUndefined();
  });
});

describe('ageOn', () => {
  const jackson = d('1958-08-29T00:00:00Z');

  it('is exact when both dates have days', () => {
    expect(ageOn(jackson, d('1982-11-30T00:00:00Z'))).toEqual({ years: 24, exact: true });
  });

  it('counts the birthday itself and the day before it correctly', () => {
    expect(ageOn(jackson, d('1982-08-29T00:00:00Z'))).toEqual({ years: 24, exact: true });
    expect(ageOn(jackson, d('1982-08-28T00:00:00Z'))).toEqual({ years: 23, exact: true });
  });

  it('is exact with month precision when the months differ', () => {
    expect(ageOn(d('1958-08-16T00:00:00Z'), d('1983-09-01T00:00:00Z'))).toEqual({
      years: 25,
      exact: true,
    });
    expect(ageOn(d('1812-02-07T00:00:00Z'), d('1836-04-01T00:00:00Z'))).toEqual({
      years: 24,
      exact: true,
    });
  });

  it('is not exact in the birth month, or with year-only dates', () => {
    expect(ageOn(d('1958-08-16T00:00:00Z'), d('1983-08-01T00:00:00Z')).exact).toBe(false);
    expect(ageOn(d('1828-09-09T00:00:00Z'), d('1852-01-01T00:00:00Z'))).toEqual({
      years: 24,
      exact: false,
    });
  });

  it('works across 1 AD', () => {
    // Caesar: born 12 July 100 BC (-0099), consul in 59 BC (-0058) → around 41.
    expect(ageOn(d('-0099-07-12T00:00:00Z'), d('-0058-01-01T00:00:00Z'))).toEqual({
      years: 41,
      exact: false,
    });
  });
});

describe('formatting', () => {
  it('formats dates as precisely as known', () => {
    expect(formatDate(d('1982-11-30T00:00:00Z'))).toBe('Nov 30, 1982');
    expect(formatDate(d('1983-09-01T00:00:00Z'))).toBe('Sep 1983');
    expect(formatDate(d('1852-01-01T00:00:00Z'))).toBe('1852');
  });

  it('formats years before 1 AD as BC', () => {
    expect(formatYear(-99)).toBe('100 BC');
    expect(formatYear(0)).toBe('1 BC');
    expect(formatYear(33)).toBe('33');
  });

  it('labels ages honestly', () => {
    expect(ageLabel({ years: 24, exact: true })).toBe('Age 24');
    expect(ageLabel({ years: 24, exact: false })).toBe('Around age 24');
  });
});
