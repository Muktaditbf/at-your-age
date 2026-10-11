import { describe, expect, it } from 'vitest';
import { parseAge, readSearch, searchString, shareUrl } from './url.ts';

describe('url', () => {
  it('reads valid ages only', () => {
    expect(parseAge('24')).toBe(24);
    expect(parseAge(' 7 ')).toBe(7);
    expect(parseAge('0')).toBeUndefined();
    expect(parseAge('121')).toBeUndefined();
    expect(parseAge('2.5')).toBeUndefined();
    expect(parseAge('abc')).toBeUndefined();
    expect(parseAge(null)).toBeUndefined();
  });

  it('round-trips the search', () => {
    expect(readSearch('?age=24')).toEqual({ age: 24, mode: 'roast' });
    expect(readSearch('?age=30&mode=hype')).toEqual({ age: 30, mode: 'hype' });
    expect(readSearch('?mode=weird')).toEqual({ age: undefined, mode: 'roast' });
    expect(searchString({ age: 24, mode: 'roast' })).toBe('?age=24');
    expect(searchString({ age: 30, mode: 'hype' })).toBe('?age=30&mode=hype');
    expect(searchString({ mode: 'roast' })).toBe('');
  });

  it('builds share links', () => {
    expect(
      shareUrl({ age: 24, mode: 'hype' }, 'https://muktaditbf.github.io', '/at-your-age/'),
    ).toBe('https://muktaditbf.github.io/at-your-age/?age=24&mode=hype');
  });
});
