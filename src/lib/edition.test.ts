import { describe, expect, it } from 'vitest';
import { type Edition, reducer } from './edition.ts';
import { KINDS } from './sparql.ts';
import type { Story } from './stories.ts';

const story = (id: string, fame: number): Story => ({
  id,
  name: id,
  fame,
  born: { year: 1950, month: 1, day: 1, precision: 'year' },
  deeds: [],
});

function started(): Edition {
  const state = reducer(undefined, {
    type: 'start',
    age: 24,
    mode: 'roast',
    run: 1,
    kinds: KINDS,
    fresh: true,
  });
  if (!state) throw new Error('no state');
  return state;
}

describe('edition reducer', () => {
  it('starts with every desk waiting', () => {
    const state = started();
    expect(state.status).toBe('loading');
    expect(Object.values(state.desks)).toEqual(KINDS.map(() => 'waiting'));
  });

  it('adds stories as desks finish and is done when all have answered', () => {
    let state = started();
    state = reducer(state, {
      type: 'desk',
      run: 1,
      kind: 'work',
      stories: [story('Q1', 10)],
    }) as Edition;
    expect(state.status).toBe('loading');
    for (const kind of KINDS.slice(1, -1)) {
      state = reducer(state, { type: 'desk', run: 1, kind, stories: [story('Q2', 20)] }) as Edition;
    }
    state = reducer(state, {
      type: 'failed',
      run: 1,
      kind: 'discovered',
      reason: 'busy',
    }) as Edition;
    expect(state.status).toBe('done');
    expect(state.printed).toBe(true);
    expect(state.stories.map((s) => s.id)).toEqual(['Q2', 'Q1']);
    expect(state.failures).toEqual({ discovered: 'busy' });
  });

  it('ignores answers from an older run', () => {
    const state = started();
    expect(reducer(state, { type: 'desk', run: 99, kind: 'work', stories: [story('Q1', 1)] })).toBe(
      state,
    );
  });

  it('keeps stories when retrying only the failed desks', () => {
    let state = started();
    state = reducer(state, {
      type: 'desk',
      run: 1,
      kind: 'work',
      stories: [story('Q1', 10)],
    }) as Edition;
    state = reducer(state, { type: 'failed', run: 1, kind: 'award', reason: 'timeout' }) as Edition;
    state = reducer(state, {
      type: 'start',
      age: 24,
      mode: 'roast',
      run: 2,
      kinds: ['award'],
      fresh: false,
    }) as Edition;
    expect(state.stories).toHaveLength(1);
    expect(state.printed).toBe(false);
    expect(state.desks.work).toBe('done');
    expect(state.desks.award).toBe('waiting');
    expect(state.failures.award).toBeUndefined();
  });

  it('keeps the front page printed while retrying a failed desk', () => {
    let state = started();
    for (const kind of KINDS.slice(0, -1)) {
      state = reducer(state, { type: 'desk', run: 1, kind, stories: [story('Q1', 10)] }) as Edition;
    }
    state = reducer(state, {
      type: 'failed',
      run: 1,
      kind: 'discovered',
      reason: 'busy',
    }) as Edition;
    state = reducer(state, {
      type: 'start',
      age: 24,
      mode: 'roast',
      run: 2,
      kinds: ['discovered'],
      fresh: false,
    }) as Edition;
    expect(state.status).toBe('loading');
    expect(state.printed).toBe(true);
  });

  it('stores photos and bios', () => {
    const state = reducer(started(), {
      type: 'people',
      run: 1,
      people: { Q1: { description: 'Someone' } },
    });
    expect(state?.people.Q1?.description).toBe('Someone');
  });
});
