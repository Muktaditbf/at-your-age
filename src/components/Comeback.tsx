/**
 * The way out of a roast: a patch of the hype paper right after the lead story, and a pill that
 * follows the reader down the page once that card has scrolled away. Both switch to the hype
 * edition for the same age.
 */
import { Sprout } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import { type MouseEvent, type RefObject, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type HypeMeUp = (from: { x: number; y: number }) => void;

/** Where on screen the click came from, so the petals burst out of the button. */
function origin(event: MouseEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function HypeButton({ onClick, compact = false }: { onClick: HypeMeUp; compact?: boolean }) {
  return (
    <m.button
      type="button"
      onClick={(event) => onClick(origin(event))}
      whileHover={{ rotate: [-2, 2, -1, 0], transition: { duration: 0.4 } }}
      whileTap={{ scale: 0.94 }}
      className={`display inline-flex items-center gap-2 rounded-full bg-accent text-on-accent shadow-[3px_3px_0_var(--rule)] ${compact ? 'min-h-11 px-4 text-[1.15rem]' : 'min-h-14 px-6 text-[1.5rem]'}`}
    >
      <Sprout size={compact ? 18 : 22} strokeWidth={2.5} aria-hidden="true" />
      Hype me up
    </m.button>
  );
}

export function ComebackCard({
  age,
  onHypeMeUp,
  cardRef,
}: {
  age: number;
  onHypeMeUp: HypeMeUp;
  cardRef: RefObject<HTMLElement | null>;
}) {
  return (
    <m.aside
      ref={cardRef}
      aria-label="Switch to the hype edition"
      initial={{ opacity: 0, y: 24, rotate: -1 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="hype-colors my-2 flex flex-col gap-4 rounded-3xl border-[3px] border-rule p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7"
    >
      <div>
        <p className="display m-0 text-[clamp(1.9rem,6.5vw,2.8rem)] leading-none">
          Okay, that one hurt.
        </p>
        <p className="m-0 mt-2 max-w-[34rem] text-lg">
          Now see who did their big thing <em>after</em> {age}. Spoiler: lots of legends were late.
        </p>
      </div>
      <div className="shrink-0">
        <HypeButton onClick={onHypeMeUp} />
      </div>
    </m.aside>
  );
}

/**
 * True once `target` has scrolled up past the top of the screen, false while it is visible or
 * still below. (A scroll listener, because a fast jump can skip the card entirely, and an
 * IntersectionObserver only reports crossings.)
 */
function useScrolledPast(target: RefObject<HTMLElement | null>) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      const el = target.current;
      setPast(Boolean(el) && (el?.getBoundingClientRect().bottom ?? 0) < 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [target]);
  return past;
}

function useInViewport(target: RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) =>
      setInView(Boolean(entry?.isIntersecting)),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);
  return inView;
}

export function ComebackPill({
  onHypeMeUp,
  cardRef,
  endRef,
}: {
  onHypeMeUp: HypeMeUp;
  cardRef: RefObject<HTMLElement | null>;
  endRef: RefObject<HTMLElement | null>;
}) {
  const pastCard = useScrolledPast(cardRef);
  const atEnd = useInViewport(endRef);
  const show = pastCard && !atEnd;
  return createPortal(
    <AnimatePresence>
      {show && (
        <m.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="hype-colors fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[min(26rem,calc(100%-2rem))] items-center justify-between gap-3 rounded-full border-[3px] border-rule py-1.5 pr-1.5 pl-5 shadow-[0_10px_30px_rgb(0_0_0/0.25)]"
        >
          <span className="font-semibold">Feeling roasted?</span>
          <HypeButton onClick={onHypeMeUp} compact />
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
