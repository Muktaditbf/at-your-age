/**
 * The age ruler: a measuring tape of years under a fixed needle.
 *
 * It's a real horizontal scroller with snap points, so swiping on a phone has native momentum
 * and lands on a whole year. A mouse can drag it, a wheel or trackpad scrolls it, a click jumps
 * to a year, and the keyboard works like any slider (arrows, Page Up/Down, Home/End).
 * Moving it only changes the age; searching still takes Enter or the button.
 */
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { type PointerEvent, useEffect, useLayoutEffect, useRef } from 'react';
import { ageFromScroll, DEFAULT_AGE, scrollForAge, stepAge, TICK } from '../lib/ruler.ts';
import { MAX_AGE, MIN_AGE } from '../lib/sparql.ts';

const AGES = Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => MIN_AGE + i);

export function AgeRuler({
  value,
  onChange,
  onCommit,
  describedBy,
}: {
  value: number | undefined;
  onChange: (age: number) => void;
  onCommit: () => void;
  describedBy?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  // True while the reader is moving the ruler, so our own scrolling isn't mistaken for theirs.
  const moving = useRef(false);
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined);
  const drag = useRef<{ x: number; scroll: number; moved: boolean } | undefined>(undefined);
  const reduceMotion = useReducedMotion();
  const shown = value ?? DEFAULT_AGE;

  // Start centred on the current age, without animation. Later changes glide (below).
  const initial = useRef(shown);
  useLayoutEffect(() => {
    if (scroller.current) scroller.current.scrollLeft = scrollForAge(initial.current);
  }, []);

  // When the age changes some other way (typing, keys), glide the ruler to it.
  useEffect(() => {
    const el = scroller.current;
    if (!el || moving.current || value === undefined) return;
    if (ageFromScroll(el.scrollLeft) === value) return;
    el.scrollTo({ left: scrollForAge(value), behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [value, reduceMotion]);

  const startMoving = () => {
    moving.current = true;
    clearTimeout(settle.current);
  };

  const onScroll = () => {
    const el = scroller.current;
    if (!el || !moving.current) return;
    const age = ageFromScroll(el.scrollLeft);
    if (age !== value) onChange(age);
    // Scrolling has stopped once no event arrives for a moment.
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      if (!drag.current) moving.current = false;
    }, 180);
  };

  // Keys, clicks and the end of a mouse drag set the age directly; the glide that follows is
  // ours, so its scroll events must not count as the reader moving the ruler.
  const goTo = (age: number) => {
    moving.current = false;
    clearTimeout(settle.current);
    onChange(age);
    scroller.current?.scrollTo({
      left: scrollForAge(age),
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  // Mouse drag (touch and pens scroll natively).
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    startMoving();
    if (event.pointerType !== 'mouse' || !scroller.current) return;
    drag.current = { x: event.clientX, scroll: scroller.current.scrollLeft, moved: false };
    scroller.current.setPointerCapture(event.pointerId);
    scroller.current.style.scrollSnapType = 'none';
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const el = scroller.current;
    if (!drag.current || !el) return;
    const dx = event.clientX - drag.current.x;
    if (Math.abs(dx) > 3) drag.current.moved = true;
    el.scrollLeft = drag.current.scroll - dx;
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const el = scroller.current;
    const current = drag.current;
    drag.current = undefined;
    if (!el || !current) return;
    el.releasePointerCapture(event.pointerId);
    el.style.scrollSnapType = '';
    if (current.moved) {
      goTo(ageFromScroll(el.scrollLeft));
    } else {
      // A click: jump to the year under the pointer.
      const rect = el.getBoundingClientRect();
      const offset = event.clientX - (rect.left + rect.width / 2);
      goTo(ageFromScroll(el.scrollLeft + offset));
    }
  };

  return (
    <div className="relative pt-[2.6rem] select-none">
      {/* The needle and the bubble with the current age. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center">
        <AnimatePresence initial={false} mode="popLayout">
          <m.span
            key={shown}
            initial={{ y: 8, scale: 0.6, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -6, scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 600, damping: 30 }}
            className={`display grid h-8 min-w-11 place-items-center rounded-full bg-accent px-2.5 text-lg leading-none text-on-accent ${value === undefined ? 'opacity-60' : ''}`}
          >
            {shown}
          </m.span>
        </AnimatePresence>
        <span className="h-0 w-0 border-x-[7px] border-t-[8px] border-x-transparent border-t-accent" />
        <span className="h-14 w-[3px] rounded-full bg-accent" />
      </div>

      <div
        ref={scroller}
        role="slider"
        tabIndex={0}
        aria-label="Your age"
        aria-describedby={describedBy}
        aria-valuemin={MIN_AGE}
        aria-valuemax={MAX_AGE}
        aria-valuenow={value}
        aria-valuetext={value === undefined ? 'Not picked yet' : `${value} years old`}
        aria-orientation="horizontal"
        onScroll={onScroll}
        onWheel={startMoving}
        onTouchStart={startMoving}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onCommit();
            return;
          }
          const next = stepAge(value, event.key);
          if (next === undefined) return;
          event.preventDefault();
          goTo(next);
        }}
        className="cursor-grab snap-x snap-mandatory overflow-x-auto rounded-xl border-2 border-rule bg-paper-2 [mask-image:linear-gradient(90deg,transparent,black_18%,black_82%,transparent)] [scrollbar-width:none] focus-visible:outline-3 focus-visible:outline-offset-4 active:cursor-grabbing in-data-[edition=roast]:rounded-none [&::-webkit-scrollbar]:hidden"
        style={{ paddingInline: `calc(50% - ${TICK / 2}px)` }}
      >
        <div className="flex h-[4.25rem] w-max">
          {AGES.map((age) => {
            const major = age % 5 === 0;
            const decade = age % 10 === 0;
            return (
              <span
                key={age}
                className="relative flex shrink-0 snap-center flex-col items-center pt-1.5"
                style={{ width: TICK }}
              >
                <span
                  className={`w-[2px] rounded-full ${age === shown ? 'bg-accent-ink' : 'bg-ink'} ${decade ? 'h-7' : major ? 'h-5' : 'h-3 opacity-60'}`}
                />
                {major && (
                  <span
                    className={`mt-1 text-[0.8rem] tabular-nums ${age === shown ? 'font-bold text-accent-ink' : 'text-muted'}`}
                  >
                    {age}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
