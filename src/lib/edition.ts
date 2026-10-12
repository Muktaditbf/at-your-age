/**
 * Runs one "edition": the five searches for an age and mode, plus photos, bios and popularity.
 * Each desk's stories appear once Wikipedia has answered for them (or after a short wait), so
 * they arrive with their photo and in popularity order. Nothing is cached: every edition asks
 * Wikidata fresh.
 */
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { type FailureReason, QueryFailed, runLimited, runQuery } from './qlever.ts';
import { buildQuery, KINDS, type Kind, type Mode } from './sparql.ts';
import { compareStories, mergeStories, type Story, storiesFromRows } from './stories.ts';
import { fetchPeople, type PersonInfo, titleFromUrl } from './wikipedia.ts';

export type DeskStatus = 'waiting' | 'working' | 'done' | 'failed';

export interface Edition {
  age: number;
  mode: Mode;
  /** Changes on every run, so lines and animations can tell runs apart. */
  run: number;
  status: 'loading' | 'done';
  /** True once every desk has answered at least once; stays true while retrying failed desks. */
  printed: boolean;
  /** The lead story, picked when the page is first printed so it doesn't jump around later. */
  leadId?: string;
  stories: Story[];
  /** Photos and bios by Wikidata ID. Missing until Wikipedia answers (or if it doesn't). */
  people: Record<string, PersonInfo>;
  desks: Record<Kind, DeskStatus>;
  failures: Partial<Record<Kind, FailureReason>>;
}

type Action =
  | { type: 'start'; age: number; mode: Mode; run: number; kinds: readonly Kind[]; fresh: boolean }
  | { type: 'working'; run: number; kind: Kind }
  | { type: 'desk'; run: number; kind: Kind; stories: Story[] }
  | { type: 'failed'; run: number; kind: Kind; reason: FailureReason }
  | { type: 'people'; run: number; people: Record<string, PersonInfo> };

const allDesks = (status: DeskStatus) =>
  Object.fromEntries(KINDS.map((kind) => [kind, status])) as Record<Kind, DeskStatus>;

function settle(edition: Edition): Edition {
  const busy = KINDS.some((k) => edition.desks[k] === 'waiting' || edition.desks[k] === 'working');
  const printed = edition.printed || !busy;
  return {
    ...edition,
    status: busy ? 'loading' : 'done',
    printed,
    leadId: edition.leadId ?? (printed ? pickLead(edition.stories)?.id : undefined),
  };
}

/**
 * The most popular story leads the page, except politics: a sitting president as the "Roasted"
 * or "Still time" hero would put off half the readers, so offices stay in the list below.
 */
export function pickLead(stories: Story[]): Story | undefined {
  return stories.find((story) => story.deeds[0]?.kind !== 'position') ?? stories[0];
}

/** Stories in page order: the lead first, then everyone else by popularity. */
export function frontPage(edition: Edition): Story[] {
  const lead = edition.stories.find((story) => story.id === edition.leadId);
  return lead ? [lead, ...edition.stories.filter((story) => story !== lead)] : edition.stories;
}

/** Copies known page views onto the stories, so they can be ranked by them. */
export function withViews(stories: Story[], people: Record<string, PersonInfo> | undefined) {
  if (!people) return stories;
  return stories.map((story) => {
    const views = people[story.id]?.views;
    return views === undefined || story.views !== undefined ? story : { ...story, views };
  });
}

export function reducer(state: Edition | undefined, action: Action): Edition | undefined {
  if (action.type === 'start') {
    const keep = !action.fresh && state && state.age === action.age && state.mode === action.mode;
    const desks = keep ? { ...state.desks } : allDesks('waiting');
    const failures = keep ? { ...state.failures } : {};
    for (const kind of action.kinds) {
      desks[kind] = 'waiting';
      delete failures[kind];
    }
    return {
      age: action.age,
      mode: action.mode,
      run: action.run,
      status: 'loading',
      printed: keep ? state.printed : false,
      leadId: keep ? state.leadId : undefined,
      stories: keep ? state.stories : [],
      people: keep ? state.people : {},
      desks,
      failures,
    };
  }
  if (!state || action.run !== state.run) return state;
  switch (action.type) {
    case 'working':
      return { ...state, desks: { ...state.desks, [action.kind]: 'working' } };
    case 'desk':
      return settle({
        ...state,
        stories: mergeStories(state.stories, action.stories),
        desks: { ...state.desks, [action.kind]: 'done' },
      });
    case 'failed':
      return settle({
        ...state,
        desks: { ...state.desks, [action.kind]: 'failed' },
        failures: { ...state.failures, [action.kind]: action.reason },
      });
    case 'people':
      return {
        ...state,
        people: { ...state.people, ...action.people },
        stories: withViews(state.stories, action.people).sort(compareStories),
      };
  }
}

let runCounter = 0;

/** How long a desk waits for Wikipedia before printing its stories without photos. */
export const WIKIPEDIA_WAIT_MS = 2500;

/** Runs the edition for `age` + `mode` whenever they change. */
export function useEdition(age: number | undefined, mode: Mode) {
  const [edition, dispatch] = useReducer(reducer, undefined);
  const controller = useRef<AbortController | undefined>(undefined);
  const askedWikipedia = useRef(new Set<string>());

  const start = useCallback(
    (kinds: readonly Kind[], fresh: boolean, carried: readonly Story[] = []) => {
      if (age === undefined) return;
      controller.current?.abort();
      const abort = new AbortController();
      controller.current = abort;
      const run = ++runCounter;
      if (fresh) askedWikipedia.current = new Set();
      dispatch({ type: 'start', age, mode, run, kinds, fresh });

      const lookUpPeople = async (stories: Story[]) => {
        const wanted = new Map<string, string>();
        for (const story of stories) {
          const title = story.article ? titleFromUrl(story.article) : undefined;
          if (!title || askedWikipedia.current.has(story.id)) continue;
          askedWikipedia.current.add(story.id);
          wanted.set(title, story.id);
        }
        if (!wanted.size) return {};
        try {
          const found = await fetchPeople([...wanted.keys()], abort.signal);
          const people: Record<string, PersonInfo> = {};
          for (const [title, info] of found) {
            const id = wanted.get(title);
            if (id) people[id] = info;
          }
          dispatch({ type: 'people', run, people });
          return people;
        } catch {
          // Photos and bios are a bonus. Stories still work without them.
          for (const id of wanted.values()) askedWikipedia.current.delete(id);
          return {};
        }
      };

      // Stories kept from an earlier run may still be missing their photos.
      if (carried.length) void lookUpPeople([...carried]);

      const tasks = kinds.map((kind) => async () => {
        if (abort.signal.aborted) return;
        dispatch({ type: 'working', run, kind });
        try {
          const rows = await runQuery(buildQuery(kind, mode, age), { signal: abort.signal });
          const stories = storiesFromRows(kind, rows, mode, age);
          // Wait a moment for photos and popularity, so stories arrive complete and in order.
          const people = await Promise.race([
            lookUpPeople(stories),
            new Promise<undefined>((resolve) => setTimeout(resolve, WIKIPEDIA_WAIT_MS)),
          ]);
          if (abort.signal.aborted) return;
          dispatch({ type: 'desk', run, kind, stories: withViews(stories, people) });
        } catch (error) {
          if (abort.signal.aborted) return;
          const reason = error instanceof QueryFailed ? error.reason : 'server';
          dispatch({ type: 'failed', run, kind, reason });
        }
      });
      void runLimited(tasks);
    },
    [age, mode],
  );

  useEffect(() => {
    start(KINDS, true);
    return () => controller.current?.abort();
  }, [start]);

  /** Asks again for the desks that failed, keeping the stories already on the page. */
  const retryFailed = useCallback(() => {
    if (!edition) return;
    const failed = KINDS.filter((kind) => edition.desks[kind] === 'failed');
    const fresh = !failed.length || failed.length === KINDS.length;
    start(fresh ? KINDS : failed, fresh, fresh ? [] : edition.stories);
  }, [edition, start]);

  return { edition: age === undefined ? undefined : edition, retryFailed };
}
