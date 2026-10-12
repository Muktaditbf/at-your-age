import { describe, expect, it } from 'vitest';
import { type Edition, frontPage, pickLead, reducer, withViews } from './edition.ts';
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

describe('popularity and the lead story', () => {
  const deed = (kind: 'work' | 'position') => ({
    kind,
    thingId: 'T',
    thing: 'Thing',
    verb: 'does',
    date: { year: 1980, month: 1, day: 1, precision: 'year' as const },
    age: { years: 30, exact: false },
    thingFame: 1,
  });
  const person = (id: string, fame: number, kind: 'work' | 'position' = 'work'): Story => ({
    ...story(id, fame),
    deeds: [deed(kind)],
  });

  it('copies page views onto stories', () => {
    const [a, b] = withViews([person('Q1', 10), person('Q2', 10)], { Q1: { views: 99 } });
    expect(a?.views).toBe(99);
    expect(b?.views).toBeUndefined();
  });

  it('re-sorts when page views arrive', () => {
    let state = started();
    state = reducer(state, {
      type: 'desk',
      run: 1,
      kind: 'work',
      stories: [person('Q1', 100), person('Q2', 50)],
    }) as Edition;
    state = reducer(state, {
      type: 'people',
      run: 1,
      people: { Q2: { views: 1_000_000 } },
    }) as Edition;
    expect(state.stories.map((s) => s.id)).toEqual(['Q2', 'Q1']);
  });

  it('never leads with politics when there is anything else', () => {
    expect(pickLead([person('President', 300, 'position'), person('Singer', 100)])?.id).toBe(
      'Singer',
    );
    expect(pickLead([person('President', 300, 'position')])?.id).toBe('President');
  });

  it('pins the lead once printed and puts it first', () => {
    let state = started();
    for (const kind of KINDS) {
      state = reducer(state, {
        type: 'desk',
        run: 1,
        kind,
        stories:
          kind === 'work' ? [person('President', 300, 'position'), person('Singer', 100)] : [],
      }) as Edition;
    }
    expect(state.leadId).toBe('Singer');
    expect(frontPage(state).map((s) => s.id)).toEqual(['Singer', 'President']);
    // Later popularity changes don't move the lead.
    state = reducer(state, {
      type: 'people',
      run: 1,
      people: { President: { views: 9e9 } },
    }) as Edition;
    expect(frontPage(state)[0]?.id).toBe('Singer');
  });
});
