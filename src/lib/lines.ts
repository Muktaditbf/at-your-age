/**
 * Everything the paper says that isn't a fact. The voice: relatable modern life, with a little
 * Gen Z slang now and then (never a pile of it). Jokes are about habits, never about who you
 * are, and never about the famous people. PRs with new lines are welcome.
 */
import type { Kind, Mode } from './sparql.ts';

/** Shown after "Meanwhile, you:" in the roast edition. */
export const ROASTS = [
  '6 hours of screen time, 0 minutes on the thing you said you’d start.',
  'left the group chat on read for three business days.',
  'your Spotify Wrapped is the biggest thing you released this year.',
  'watched a “day in my life” video instead of having one.',
  'opened TikTok “for five minutes”. It has been two hours.',
  'rehearsed a voice note four times, then just sent “lol”.',
  'added 30 things to the cart, bought nothing, called it self-control.',
  'still deciding what to eat. It has been 40 minutes. No cap.',
  'said “new week, new me”. It is Thursday.',
  'it’s giving “I’ll start Monday” for the 12th Monday in a row.',
  'your main personality trait is iced coffee.',
  'hit snooze so many times your alarm filed a complaint.',
  'made a 2-hour study playlist. Studied for 9 minutes.',
  'typed “lol” with a completely straight face. Again.',
  'have 2,000 unread emails and one strong opinion about all of them.',
  'reorganized your apps and called it a productive day.',
  'your camera roll is 4,000 screenshots you will never open.',
  'watched a productivity video at 2x speed and felt accomplished.',
  'ordered delivery from a place you can see from your window.',
  'are lowkey the NPC of your own group chat.',
  'bought a planner. It is still in the plastic.',
  'checked your phone 96 times today. This makes 97.',
  'have 47 tabs open and zero plans.',
  'are “about to start”. Any minute now. Trust.',
  'won an argument in the shower. Against nobody.',
  'reread the same text from your crush for the 9th time.',
  'took a nap to recover from your nap.',
  'your phone is at 100%. You are at 12%.',
  'had a billion-dollar idea at 3 a.m. Forgot it by 3:01.',
  'said “I’m so tired” 14 times today. You woke up at noon.',
  'touched grass once. In 2021. For a photo.',
  'are in your “figuring it out” era. Season 6.',
  'saved 300 recipes. Made instant noodles.',
  'are famous in exactly one place: your mom’s Facebook comments.',
  'spent an hour picking a profile picture. Kept the old one.',
  'started learning a language. The owl is worried about you.',
  'your most consistent habit is checking who viewed your story.',
  'cleaned your room by moving everything onto the chair.',
  'are delulu that “next year” is the year. Again.',
  'watched someone’s 5 a.m. routine at 1 a.m. in bed.',
  'the only thing you launched this year was your phone across the bed.',
  'replied “omw” while still in bed. Iconic, not in a good way.',
  'your sleep schedule lives in a different time zone than you.',
  'built flat-pack furniture with four screws left over. Character arc.',
] as const;

/** The hype edition's encouragement. `{gap}` becomes the lead story's years of runway. */
export const HYPES = [
  'Main character energy. Your episode just airs later.',
  'Your glow-up has a {gap}-year runway. No cap.',
  'Delulu is the solulu: they started later too.',
  'You are not behind. You are on your own timeline, bestie.',
  'Late bloomers still bloom. Ask everyone on this page.',
  'Your era has not even started. That is the plot.',
  'Peaking early is overrated. Ask anyone who peaked in school.',
  'Plenty of time. Hydrate. Touch grass. Then start.',
  'They were older than you and still ate. You have time.',
  'Your comeback arc is loading: {gap} years of runway.',
  'The best part of your story has not dropped yet.',
  'Rome was not built in a day. Neither was anyone in it.',
  'Start small. Start today. Tomorrow also counts.',
  'Nobody remembers when you started. Only that you did.',
  'You are early to your own success story.',
  'One good decade can change everything. You have several.',
  'Being “late” is just being on time for your own plot.',
  'Fine wine, aged cheese, you. Respectfully.',
  'The calendar does not get a vote. You do.',
  'Every legend had a “nothing yet” era. You are in it. It is fine.',
  'Your best idea might not even exist yet.',
  'Comebacks are a whole genre for a reason.',
  'Slow and steady is still a speed.',
  'Season 1 is always the weakest. Keep renewing.',
  'It’s giving late bloomer, future legend.',
  'Your future self is already proud. Don’t make it weird.',
  'Plot twist: the late start was the origin story.',
  'The second act is where the good stuff happens.',
  'Your timeline is not late. It is limited edition.',
  'You don’t need to go viral. You need to begin.',
] as const;

/** Little boxes between stories, like the classifieds in a paper. */
export const CLASSIFIEDS: Record<Mode, readonly { title: string; body: string }[]> = {
  roast: [
    { title: 'Wanted', body: 'One (1) accomplishment. Any size. DM me.' },
    { title: 'Lost', body: 'Motivation. Last seen Monday, 9 a.m. Answers to “tomorrow”.' },
    { title: 'For sale', body: 'Gym membership. Barely used. Like new. No cap.' },
    { title: 'Free to a good home', body: 'Several unfinished hobbies. Some assembly required.' },
    { title: 'Notice', body: 'Your screen time report would like a word.' },
    { title: 'Help wanted', body: 'Someone who reads the terms and conditions. Anyone.' },
  ],
  hype: [
    { title: 'Notice', body: 'Your timeline is not late. It is limited edition.' },
    { title: 'Weather', body: 'Clear skies ahead, with a strong chance of you doing the thing.' },
    { title: 'Found', body: 'One (1) second chance. Still works. Please collect.' },
    { title: 'Horoscope', body: 'All signs point to “start”. Even Mercury agrees.' },
    { title: 'Seeking', body: 'Late bloomers. Experience in waiting preferred.' },
    { title: 'Forecast', body: 'Your best years: still loading.' },
  ],
};

/** Shown while the searches run. */
export const PRESS_LINES: Record<Mode, readonly string[]> = {
  roast: [
    'Asking the group chat…',
    'Checking everyone’s screen time…',
    'Loading their main character arcs…',
    'Interviewing Napoleon. He is busy…',
    'Counting Mozart’s birthdays…',
    'Comparing your Wrapped to theirs…',
    'Bribing a librarian with iced coffee…',
    'Finding the receipts…',
    'Measuring how far behind you are…',
    'Inking the presses…',
  ],
  hype: [
    'Measuring your runway…',
    'Finding the late bloomers…',
    'Loading comeback arcs…',
    'Checking who started after you…',
    'Manifesting…',
    'Dusting off the glow-ups…',
    'Asking Wikipedia nicely…',
    'Polishing the good news…',
    'Inking the presses…',
  ],
};

/** Jokey ticker items shown before any stories are in. */
export const TEASERS: Record<Mode, readonly string[]> = {
  roast: [
    'Local person opens 47th tab, calls it research',
    'Group chat still waiting for a reply',
    'Snooze button files for overtime',
    'Your screen time report would like a word',
    'Area resident “about to start”, sources say',
  ],
  hype: [
    'Your timeline officially declared not late',
    'Comeback arcs trending worldwide',
    'Late bloomers spotted blooming',
    'Experts confirm: it is not too late to start',
    'Your era: loading',
  ],
};

/** The five searches, as the newsroom desks that run them. */
export const DESKS: Record<Kind, string> = {
  work: 'Books, films and music',
  award: 'Awards',
  position: 'Crowns and offices',
  founded: 'Companies and bands',
  discovered: 'Discoveries and inventions',
};

/** Short desk names for the tag on each story. */
export const DESK_TAGS: Record<Kind, string> = {
  work: 'Music & film',
  award: 'Awards',
  position: 'Crowns & offices',
  founded: 'Business',
  discovered: 'Science',
};

/** A small, fast hash so the same search always picks the same lines. */
export function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pick<T>(list: readonly T[], seed: number, offset = 0): T {
  const item = list[(seed + offset) % list.length];
  if (item === undefined) throw new Error('pick() needs a non-empty list');
  return item;
}

/**
 * The line for the lead story. `gap` is how many years of runway the lead story gives (hype);
 * lines that need it are skipped when it isn't known.
 */
export function leadLine(mode: Mode, seed: number, gap?: number): string {
  if (mode === 'roast') return pick(ROASTS, seed);
  const usable = gap !== undefined && gap > 0 ? HYPES : HYPES.filter((l) => !l.includes('{gap}'));
  return pick(usable, seed).replace('{gap}', String(gap));
}

/** "26 years of runway" */
export function runway(years: number): string {
  return years === 1 ? '1 year of runway' : `${years} years of runway`;
}
