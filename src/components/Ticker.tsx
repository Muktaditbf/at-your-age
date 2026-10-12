/**
 * The breaking-news strip under the masthead. It loops the current front page's headlines (or
 * jokes before there are any), slows to a crawl under the pointer so a headline can be read,
 * and stands still for readers who prefer less motion.
 *
 * It's decoration: hidden from screen readers, since every headline is also a story below.
 */
import { m, useAnimationFrame, useMotionValue, useReducedMotion } from 'motion/react';
import { useMemo, useRef } from 'react';
import { type Edition, frontPage } from '../lib/edition.ts';
import { headline } from '../lib/headline.ts';
import { TEASERS } from '../lib/lines.ts';
import type { Mode } from '../lib/sparql.ts';

/** Pixels per second at full speed. */
const SPEED = 60;

export function tickerItems(mode: Mode, edition: Edition | undefined): string[] {
  const stories = edition && edition.mode === mode ? frontPage(edition).slice(0, 12) : [];
  const items = stories.flatMap((story) => {
    const deed = story.deeds[0];
    if (!deed) return [];
    const at = mode === 'roast' ? edition?.age : deed.age.years;
    return [`At ${at}, ${headline(story.name, deed.verb, deed.kind, deed.thing)}`];
  });
  return items.length ? items : [...TEASERS[mode]];
}

export function Ticker({ mode, edition }: { mode: Mode; edition: Edition | undefined }) {
  const items = useMemo(() => tickerItems(mode, edition), [mode, edition]);
  const x = useMotionValue(0);
  const track = useRef<HTMLDivElement>(null);
  const slow = useRef(false);
  const reduceMotion = useReducedMotion();

  useAnimationFrame((_, delta) => {
    const width = (track.current?.scrollWidth ?? 0) / 2;
    if (reduceMotion || !width) return;
    const speed = slow.current ? SPEED * 0.12 : SPEED;
    let next = x.get() - (speed * delta) / 1000;
    if (next <= -width) next += width;
    x.set(next);
  });

  const label = mode === 'roast' ? 'Breaking' : 'Good news';
  // Two copies side by side make the loop seamless.
  const loop = [...items, ...items];

  return (
    <div
      aria-hidden="true"
      className="mx-auto mt-2 flex max-w-6xl items-stretch overflow-hidden px-4 sm:px-6"
      onPointerEnter={() => {
        slow.current = true;
      }}
      onPointerLeave={() => {
        slow.current = false;
      }}
    >
      <span className="display z-10 flex shrink-0 items-center bg-accent px-3 py-1 text-[1.05rem] leading-none text-on-accent in-data-[edition=hype]:rounded-l-full">
        {label}
      </span>
      <div className="relative min-w-0 flex-1 overflow-hidden border-y-2 border-rule bg-paper-2 [mask-image:linear-gradient(90deg,transparent,black_2rem,black_calc(100%-2rem),transparent)]">
        <m.div
          ref={track}
          style={{ x }}
          className="flex w-max items-center py-1.5 whitespace-nowrap"
        >
          {loop.map((item, index) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: the loop repeats items on purpose.
              key={index}
              className="flex items-center text-[0.95rem] font-semibold"
            >
              <span className="px-4">{item}</span>
              <span className="text-accent-ink">✦</span>
            </span>
          ))}
        </m.div>
      </div>
    </div>
  );
}
