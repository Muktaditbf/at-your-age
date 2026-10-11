/**
 * Wikidata dates and honest age math.
 *
 * Wikidata stores how precise a date is (day, month or year), but reading that through QLever
 * makes queries several times slower. In the simple values it returns, a year-only date is
 * written as YYYY-01-01 and a month-only date as YYYY-MM-01, so we read the precision from the
 * shape: day 1 means "the day may be unknown", and January 1 means "only the year may be known".
 * A real January 1 birthday then shows as "around", which errs on the honest side.
 *
 * Years before 1 AD use astronomical numbering, like Wikidata's RDF: year 0 is 1 BC.
 */
export type Precision = 'day' | 'month' | 'year';

export interface WikiDate {
  year: number;
  month: number;
  day: number;
  precision: Precision;
}

const DATE = /^([+-]?\d{1,6})-(\d{2})-(\d{2})/;

export function parseWikiDate(value: string): WikiDate | undefined {
  const match = DATE.exec(value);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  const precision: Precision = day !== 1 ? 'day' : month !== 1 ? 'month' : 'year';
  return { year, month, day, precision };
}

export interface Age {
  /** Whole years old. When not exact, the real age is this or one less. */
  years: number;
  exact: boolean;
}

/** How old someone born on `born` was on `on`. */
export function ageOn(born: WikiDate, on: WikiDate): Age {
  const yearDiff = on.year - born.year;
  if (born.precision === 'day' && on.precision === 'day') {
    const beforeBirthday = on.month < born.month || (on.month === born.month && on.day < born.day);
    return { years: yearDiff - (beforeBirthday ? 1 : 0), exact: true };
  }
  if (born.precision !== 'year' && on.precision !== 'year' && born.month !== on.month) {
    return { years: yearDiff - (on.month < born.month ? 1 : 0), exact: true };
  }
  return { years: yearDiff, exact: false };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatYear(year: number): string {
  return year > 0 ? String(year) : `${1 - year} BC`;
}

/** "Nov 30, 1982", "Nov 1982", "1982" or "48 BC", as precise as the data allows. */
export function formatDate(date: WikiDate): string {
  const year = formatYear(date.year);
  const month = MONTHS[date.month - 1];
  if (date.precision === 'day') return `${month} ${date.day}, ${year}`;
  if (date.precision === 'month') return `${month} ${year}`;
  return year;
}

/** "Age 24" or, when a date is only known to the year or month, "Around age 24". */
export function ageLabel(age: Age): string {
  return age.exact ? `Age ${age.years}` : `Around age ${age.years}`;
}
