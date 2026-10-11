/** The search lives in the URL (?age=24&mode=roast), so links and the Back button just work. */
import { MAX_AGE, MIN_AGE, type Mode } from './sparql.ts';

export interface Search {
  age?: number;
  mode: Mode;
}

export function parseAge(text: string | null | undefined): number | undefined {
  if (!text || !/^\d{1,3}$/.test(text.trim())) return undefined;
  const age = Number(text.trim());
  return age >= MIN_AGE && age <= MAX_AGE ? age : undefined;
}

export function readSearch(search: string): Search {
  const params = new URLSearchParams(search);
  return {
    age: parseAge(params.get('age')),
    mode: params.get('mode') === 'hype' ? 'hype' : 'roast',
  };
}

export function searchString({ age, mode }: Search): string {
  const params = new URLSearchParams();
  if (age !== undefined) params.set('age', String(age));
  if (mode === 'hype') params.set('mode', 'hype');
  const text = params.toString();
  return text ? `?${text}` : '';
}

/** The public link for a search, for sharing. */
export function shareUrl(search: Search, origin = location.origin, path = location.pathname) {
  return `${origin}${path}${searchString(search)}`;
}
