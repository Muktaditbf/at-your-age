/**
 * Everything the paper says that isn't a fact. Jokes are about procrastination and modern life,
 * never about the famous people or about who you are. PRs with new lines are welcome.
 */
import type { Kind, Mode } from './sparql.ts';

/** Shown after "Meanwhile, you:" in the roast edition. */
export const ROASTS = [
  '47 tabs open, zero plans.',
  'still deciding what to watch. It has been 40 minutes.',
  'reheated the same coffee three times.',
  'refreshed your inbox like it owes you money.',
  'rehearsed a phone call, then texted instead.',
  'lost a staring contest with the laundry pile.',
  'started a to-do list. Then a list of to-do lists.',
  'watched a video about productivity. Twice.',
  'said “new week, new me”. It is Thursday.',
  'googled “how long do bananas last”.',
  'saved a file called Final_v3_REAL_final.docx.',
  'forgot why you walked into the kitchen.',
  'hit snooze with Olympic precision.',
  'ate cereal for dinner and called it a lifestyle.',
  'opened the fridge to check if anything new had appeared.',
  'bought a planner. It is still in the plastic.',
  'spent an hour choosing a profile picture.',
  'are “about to start”. Any minute now.',
  'won an argument in the shower. Against nobody.',
  'still know every word of an ad jingle from 2009.',
  'scrolled so far you found your own posts from 2016.',
  'checked the weather app instead of the window.',
  'renamed the Wi-Fi. Big week.',
  'practiced your autograph. Just in case.',
  'needed three alarms and a pep talk to get up.',
  'are reading this instead of doing the thing.',
  'built flat-pack furniture and have four screws left over.',
  'hold the record for “just one more episode”.',
  'saved 300 recipes. Made instant noodles.',
  'started learning a language. The owl misses you.',
  'took a nap to recover from your nap.',
  'charged your phone to 100% and yourself to 12%.',
  'had a brilliant idea at 3 a.m. and lost it by 3:01.',
  'nodded through a conversation about crypto. Understood none of it.',
  'cleaned your room by moving everything onto the chair.',
  'became an expert in a game nobody plays anymore.',
  'wrote half a novel in your head on the bus.',
  'made a playlist for working. Then listened to it instead.',
  'reorganized your apps. Productivity unlocked. Somewhere.',
  'have a drawer full of cables for devices you no longer own.',
] as const;

/** The hype edition's encouragement. */
export const HYPES = [
  'Plenty of time. Hydrate.',
  'Your big chapter has not been written yet. Good. More room.',
  'You are not behind. You are on your own schedule.',
  'Nobody hands out deadlines for being great.',
  'The best part of your story might not have happened yet.',
  'Slow cooking makes better food. Probably works for people too.',
  'Your timeline is not late. It is yours.',
  'Start small. Start today. Tomorrow also counts.',
  'History is full of people who were “too old” and did it anyway.',
  'You have more runway than you think.',
  'Some trees bloom late and still get all the photos.',
  'Peaking early is overrated. Ask anyone who peaked in school.',
  'Rome was not built in a day. Neither was anyone in it.',
  'Still loading. The good stuff usually takes longer.',
  'You are not late. You are building the backstory.',
  'Every expert was once a beginner who did not quit.',
  'One good decade can change everything.',
  'The second act is where the good stuff happens.',
  'You can start a new chapter on any page.',
  'Fine wine, aged cheese, you.',
  'Nobody remembers when you started. Only that you did.',
  'There is no age limit on figuring it out.',
  'Your best idea might not even exist yet.',
  'Comebacks are a whole genre for a reason.',
  'The calendar does not get a vote.',
  'Even legends had a “nothing yet” era. You are in it. It is fine.',
] as const;

/** Little boxes between stories, like the classifieds in a paper. */
export const CLASSIFIEDS: Record<Mode, readonly { title: string; body: string }[]> = {
  roast: [
    { title: 'Wanted', body: 'One (1) accomplishment. Any size. Contact: you.' },
    { title: 'Lost', body: 'Motivation. Last seen on a Monday. Answers to “tomorrow”.' },
    { title: 'For sale', body: 'Gym membership. Barely used. Like new.' },
    { title: 'Free to a good home', body: 'Several unfinished hobbies. Some assembly required.' },
    { title: 'Notice', body: 'The snooze button has asked for overtime pay.' },
    { title: 'Help wanted', body: 'Someone who reads the terms and conditions. Anyone.' },
  ],
  hype: [
    { title: 'Notice', body: 'Your timeline is not late. It is yours.' },
    { title: 'Weather', body: 'Clear skies ahead, with a strong chance of you doing the thing.' },
    { title: 'Found', body: 'One (1) second chance. Still works. Please collect.' },
    { title: 'Horoscope', body: 'All signs point to “start”.' },
    { title: 'Seeking', body: 'Late bloomers. Experience in waiting preferred.' },
    { title: 'Forecast', body: 'Your best years: still incoming.' },
  ],
};

/** Shown while the searches run. */
export const PRESS_LINES: Record<Mode, readonly string[]> = {
  roast: [
    'Interviewing Napoleon…',
    'Counting Mozart’s birthdays…',
    'Bribing a librarian…',
    'Checking the Nobel guest list…',
    'Measuring how far behind you are…',
    'Waking up the archive goblins…',
    'Asking Wikipedia nicely…',
    'Comparing birthdays across five centuries…',
    'Calling the Oscars…',
    'Inking the presses…',
  ],
  hype: [
    'Measuring your runway…',
    'Finding the late bloomers…',
    'Asking Wikipedia nicely…',
    'Counting second acts…',
    'Checking who started after you…',
    'Dusting off the comeback stories…',
    'Comparing birthdays across five centuries…',
    'Polishing the good news…',
    'Inking the presses…',
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

/** The line for the lead story. */
export function leadLine(mode: Mode, seed: number): string {
  return mode === 'roast' ? pick(ROASTS, seed) : pick(HYPES, seed);
}

/** "26 years of runway" */
export function runway(years: number): string {
  return years === 1 ? '1 year of runway' : `${years} years of runway`;
}
