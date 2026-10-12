/**
 * Turns query rows into stories: one story per person, holding the deeds that match the age.
 */
import { isBlocked } from '../data/blocklist.ts';
import { type Age, ageOn, parseWikiDate, type WikiDate } from './dates.ts';
import { verbFor } from './headline.ts';
import type { Row } from './qlever.ts';
import { HYPE_MIN_GAP, type Kind, type Mode } from './sparql.ts';

export interface Deed {
  kind: Kind;
  thingId: string;
  thing: string;
  verb: string;
  date: WikiDate;
  age: Age;
  /** How many Wikipedias have an article about the thing. */
  thingFame: number;
}

export interface Story {
  id: string;
  name: string;
  /** How many Wikipedias have an article about the person. */
  fame: number;
  born: WikiDate;
  /** English Wikipedia article URL, when there is one. */
  article?: string;
  /** English Wikipedia page views over the last 30 days, once known. */
  views?: number;
  /** Best first. */
  deeds: Deed[];
}

const qid = (uri: string | undefined) => uri?.slice(uri.lastIndexOf('/') + 1) ?? '';
const num = (term: { value: string } | undefined) => Number(term?.value ?? 0) || 0;

/** Whether a deed at this age belongs in the edition for `age`. */
export function ageFits(mode: Mode, age: number, deedAge: Age): boolean {
  if (mode === 'roast') return deedAge.years === age;
  return deedAge.years >= age + HYPE_MIN_GAP;
}

interface Draft {
  story: Omit<Story, 'deeds'>;
  deed: Omit<Deed, 'verb'>;
  types: Set<string>;
  directed: boolean;
  starred: boolean;
}

/** Rows for one kind → stories (one per person), keeping only deeds that really fit the age. */
export function storiesFromRows(kind: Kind, rows: Row[], mode: Mode, age: number): Story[] {
  // Rows repeat when a thing has several types; fold them together first.
  const drafts = new Map<string, Draft>();
  for (const row of rows) {
    const id = qid(row.p?.value);
    const thingId = qid(row.what?.value);
    const name = row.pLabel?.value.trim();
    const thing = row.whatLabel?.value.trim();
    const born = parseWikiDate(row.born?.value ?? '');
    const date = parseWikiDate(row.date?.value ?? '');
    if (!id || !thingId || !name || !thing || !born || !date || isBlocked(id)) continue;
    // A thing named after its own Q-number has no real English name.
    if (/^Q\d+$/.test(thing) || /^Q\d+$/.test(name)) continue;
    const deedAge = ageOn(born, date);
    if (!ageFits(mode, age, deedAge)) continue;

    const key = `${id}|${thingId}|${row.date?.value}`;
    let draft = drafts.get(key);
    if (!draft) {
      draft = {
        story: { id, name, fame: num(row.links), born, article: row.article?.value },
        deed: { kind, thingId, thing, date, age: deedAge, thingFame: num(row.wl) },
        types: new Set(),
        directed: false,
        starred: false,
      };
      drafts.set(key, draft);
    }
    if (row.typeLabel?.value) draft.types.add(row.typeLabel.value);
    if (row.directed) draft.directed = true;
    if (row.starred) draft.starred = true;
    if (!draft.story.article && row.article?.value) draft.story.article = row.article.value;
  }

  const stories = new Map<string, Story>();
  for (const draft of drafts.values()) {
    const verb = verbFor(kind, {
      types: [...draft.types],
      directed: draft.directed,
      starred: draft.starred,
      year: draft.deed.date.year,
      thing: draft.deed.thing,
    });
    const deed: Deed = { ...draft.deed, verb };
    const story = stories.get(draft.story.id);
    if (story) story.deeds.push(deed);
    else stories.set(draft.story.id, { ...draft.story, deeds: [deed] });
  }
  for (const story of stories.values()) story.deeds.sort(compareDeeds);
  return [...stories.values()].sort(compareStories);
}

/** Most famous thing first; exact ages before "around" ones when equally famous. */
export function compareDeeds(a: Deed, b: Deed): number {
  return b.thingFame - a.thingFame || Number(b.age.exact) - Number(a.age.exact);
}

/**
 * How well readers will know this person. Page views say who people care about now; until
 * those are known (or when there's no English article) the number of Wikipedia language
 * editions stands in, scaled to roughly the same range.
 */
export function popularity(story: Story): number {
  return story.views ?? story.fame * 500;
}

export function compareStories(a: Story, b: Story): number {
  return popularity(b) - popularity(a) || b.fame - a.fame || a.name.localeCompare(b.name);
}

/**
 * Adds new stories to the ones already on the page. People who are already there get the new
 * deeds; the list is re-sorted by fame.
 */
export function mergeStories(existing: readonly Story[], incoming: readonly Story[]): Story[] {
  const byId = new Map(existing.map((story) => [story.id, story]));
  for (const story of incoming) {
    const current = byId.get(story.id);
    if (!current) {
      byId.set(story.id, story);
      continue;
    }
    const known = new Set(current.deeds.map((deed) => `${deed.kind}|${deed.thingId}`));
    const extra = story.deeds.filter((deed) => !known.has(`${deed.kind}|${deed.thingId}`));
    if (extra.length) {
      byId.set(story.id, {
        ...current,
        article: current.article ?? story.article,
        views: current.views ?? story.views,
        deeds: [...current.deeds, ...extra].sort(compareDeeds),
      });
    }
  }
  return [...byId.values()].sort(compareStories);
}
