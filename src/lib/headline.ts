/**
 * Turns a deed into a newspaper headline: "Michael Jackson releases ‘Thriller’".
 *
 * Headlines use present tense and skip articles ("Bell Burnell discovers pulsar"), the way real
 * newspapers do. That also sidesteps "a/an/the" guesses we would get wrong.
 */
import { ageLabel, formatDate } from './dates.ts';
import { runway } from './lines.ts';
import type { Kind, Mode } from './sparql.ts';
import type { Deed } from './stories.ts';

export interface VerbHints {
  /** English labels of the thing's types, e.g. "album", "chemical element". */
  types: readonly string[];
  /** The person directed it (films). */
  directed?: boolean;
  /** The person was in the cast (films, series). */
  starred?: boolean;
  /** Year of the deed, for "composes" (old music) vs "releases" (recorded music). */
  year: number;
  /** The thing's label, for awards that are really lists ("Time 100"). */
  thing: string;
}

const firstMatch = (types: readonly string[], pattern: RegExp) =>
  types.some((type) => pattern.test(type));

const WORK_VERBS: [RegExp, (hints: VerbHints) => string][] = [
  [/\b(album|single|song|extended play|EP|audio track|mixtape)\b/i, () => 'releases'],
  [
    /(musical work|composition|symphon|concerto|sonata|opera|oratorio|cantata|requiem|suite|ballet)/i,
    (hints) => (hints.year < 1920 ? 'composes' : 'releases'),
  ],
  [
    /(film|movie|anime|documentary|television|tv series|sitcom|miniseries|video game)/i,
    () => 'makes',
  ],
  [
    /(novel|book|literary|written work|poem|poetry|\bplay\b|dramatic work|essay|treatise|monograph|manifesto|short story|dialogue|epic|thesis|article|memoir|autobiography|comic|manga)/i,
    () => 'publishes',
  ],
  [/(painting|fresco|portrait|mural|triptych)/i, () => 'paints'],
  [/(sculpture|statue)/i, () => 'sculpts'],
  [
    /(building|church|cathedral|basilica|bridge|tower|palace|house|museum|stadium)/i,
    () => 'designs',
  ],
];

const NATURAL =
  /(element|planet|moon|satellite|asteroid|comet|galaxy|nebula|\bstar\b|cluster|astronomical|pulsar|quasar|ice giant|gas giant|species|taxon|genus|mineral|particle|isotope|bacteri|virus|disease|phenomenon|effect|radiation|\bray\b|wave|\blaw\b|equation|theorem|constant|\bcell\b|gene|protein|vitamin|hormone|compound|molecule|fossil)/i;

export function verbFor(kind: Kind, hints: VerbHints): string {
  switch (kind) {
    case 'work': {
      if (hints.directed) return 'directs';
      if (hints.starred) return 'stars in';
      for (const [pattern, verb] of WORK_VERBS) {
        if (firstMatch(hints.types, pattern)) return verb(hints);
      }
      return 'creates';
    }
    case 'award': {
      if (/(Person|Man|Woman|Athlete|Player) of the Year/.test(hints.thing)) return 'is named';
      if (/\b100\b|30 Under 30/.test(hints.thing)) return 'makes';
      if (/Hall of Fame/i.test(hints.thing)) return 'enters';
      if (/\b(Order|Medal|Cross|Legion|Decoration)\b/.test(hints.thing)) return 'receives';
      if (
        /^(Fellow|Member|Honorary|Knight|Dame|Companion|Commander|Officer|Grand Cross)\b/.test(
          hints.thing,
        )
      )
        return 'becomes';
      return 'wins';
    }
    case 'position':
      return 'becomes';
    case 'founded':
      return 'founds';
    case 'discovered':
      return firstMatch(hints.types, NATURAL) ? 'discovers' : 'invents';
  }
}

/** Titles of works get quotes, like a newspaper would print them. */
export function thingText(kind: Kind, thing: string): string {
  return kind === 'work' ? `‘${thing}’` : thing;
}

export function headline(name: string, verb: string, kind: Kind, thing: string): string {
  return `${name} ${verb} ${thingText(kind, thing)}`;
}

/** "Nov 30, 1982. Age 24." or, in the hype edition, "1859. Age 50: 26 years of runway." */
export function dateline(deed: Deed, mode: Mode, age: number): string {
  const when = `${formatDate(deed.date)}. ${ageLabel(deed.age)}`;
  return mode === 'roast' ? `${when}.` : `${when}: ${runway(deed.age.years - age)}.`;
}
