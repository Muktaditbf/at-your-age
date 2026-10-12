/** The math behind the age ruler, kept apart so it can be tested without a browser. */
import { MAX_AGE, MIN_AGE } from './sparql.ts';

/** Pixels per year on the ruler. */
export const TICK = 18;
/** Where the ruler rests before anyone has picked an age. */
export const DEFAULT_AGE = 24;

const clamp = (age: number) => Math.min(MAX_AGE, Math.max(MIN_AGE, age));

/** The age under the needle for a scroll position. */
export function ageFromScroll(scrollLeft: number, tick = TICK): number {
  return clamp(Math.round(scrollLeft / tick) + 1);
}

/** The scroll position that puts an age under the needle. */
export function scrollForAge(age: number, tick = TICK): number {
  return (clamp(age) - 1) * tick;
}

/** The slider keys: arrows ±1, Page Up/Down ±10, Home/End to the ends. Unknown keys: undefined. */
export function stepAge(current: number | undefined, key: string): number | undefined {
  const base = current ?? DEFAULT_AGE;
  switch (key) {
    case 'ArrowRight':
    case 'ArrowUp':
      return clamp(base + 1);
    case 'ArrowLeft':
    case 'ArrowDown':
      return clamp(base - 1);
    case 'PageUp':
      return clamp(base + 10);
    case 'PageDown':
      return clamp(base - 10);
    case 'Home':
      return MIN_AGE;
    case 'End':
      return MAX_AGE;
    default:
      return undefined;
  }
}
