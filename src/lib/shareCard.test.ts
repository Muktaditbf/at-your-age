import { describe, expect, it } from 'vitest';
import { wrapText } from './shareCard.ts';

// One unit per character keeps the arithmetic obvious.
const measure = (text: string) => text.length;

describe('wrapText', () => {
  it('wraps on spaces to fit the width', () => {
    expect(wrapText(measure, 'one two three four', 9, 5)).toEqual(['one two', 'three', 'four']);
  });

  it('adds an ellipsis when it runs out of lines', () => {
    expect(wrapText(measure, 'one two three four five', 9, 2)).toEqual(['one two', 'three…']);
  });

  it('keeps a single long word on its own line rather than looping', () => {
    expect(wrapText(measure, 'supercalifragilistic', 5, 3)).toEqual(['supercalifragilistic']);
  });
});
