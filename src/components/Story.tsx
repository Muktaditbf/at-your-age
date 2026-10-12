/** One person's story: a photo, a headline, the Wikipedia one-liner and when it happened. */
import { ExternalLink } from 'lucide-react';
import { m, useMotionValue, useSpring } from 'motion/react';
import { type CSSProperties, type PointerEvent, useState } from 'react';
import { dateline, headline, thingText } from '../lib/headline.ts';
import { DESK_TAGS } from '../lib/lines.ts';
import { POP_INDEX } from '../lib/pop.ts';
import type { Kind, Mode } from '../lib/sparql.ts';
import type { Deed, Story as StoryData } from '../lib/stories.ts';
import { type PersonInfo, photoSrcSet, photoUrl } from '../lib/wikipedia.ts';

interface StoryProps {
  story: StoryData;
  info: PersonInfo | undefined;
  mode: Mode;
  age: number;
}

export function Photo({
  info,
  name,
  sizes,
  eager = false,
  className = '',
}: {
  info: PersonInfo | undefined;
  name: string;
  sizes: string;
  eager?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const photo = info?.photo;
  const initials = name
    .split(/\s+/)
    .filter((part) => /^\p{Lu}/u.test(part))
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
  return (
    <div className={`photo ${className}`}>
      {photo && !failed ? (
        <img
          src={photoUrl(photo, 330)}
          srcSet={photoSrcSet(photo)}
          sizes={sizes}
          alt={`Portrait of ${name}`}
          crossOrigin="anonymous"
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          aria-hidden="true"
          className="display grid size-full place-items-center text-[clamp(2.5rem,9vw,4.5rem)] text-muted"
        >
          {initials || '?'}
        </div>
      )}
    </div>
  );
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Each desk has its own pop colour, used for the photo frame and the tag. */
export function popStyle(kind: Kind): CSSProperties {
  const n = POP_INDEX[kind];
  return { '--pop': `var(--pop-${n})`, '--on-pop': `var(--on-pop-${n})` } as CSSProperties;
}

function DeskTag({ kind }: { kind: Kind }) {
  return (
    <span className="inline-block rounded-full bg-[var(--pop)] px-2.5 py-0.5 text-[0.8rem] leading-5 font-bold text-[var(--on-pop)]">
      {DESK_TAGS[kind]}
    </span>
  );
}

function MoreDeeds({ deeds, mode, age }: { deeds: Deed[]; mode: Mode; age: number }) {
  const [open, setOpen] = useState(false);
  if (!deeds.length) return null;
  return (
    <div className="mt-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="min-h-11 p-0 text-[0.95rem] font-semibold text-accent-ink underline decoration-dotted decoration-2 underline-offset-4"
      >
        {open
          ? 'Show less'
          : `${deeds.length} more from that ${mode === 'roast' ? 'year' : 'life'}`}
      </button>
      {open && (
        <ul className="m-0 mt-2 list-none space-y-1.5 p-0 text-[0.95rem]">
          {deeds.map((deed) => (
            <li key={`${deed.kind}${deed.thingId}`} className="border-l-[3px] border-accent pl-2.5">
              <span>
                {capitalize(deed.verb)} {thingText(deed.kind, deed.thing)}
              </span>
              <span className="block text-sm text-muted">{dateline(deed, mode, age)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WikipediaLink({ story }: { story: StoryData }) {
  const href = story.article ?? `https://www.wikidata.org/wiki/${story.id}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-[0.95rem] font-semibold"
    >
      {story.article ? 'Read more on Wikipedia' : 'See the facts on Wikidata'}
      <ExternalLink size={15} strokeWidth={2.5} aria-hidden="true" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

export function StoryCard({ story, info, mode, age, index }: StoryProps & { index: number }) {
  const [best, ...rest] = story.deeds;
  if (!best) return null;
  return (
    <m.article
      layout="position"
      initial={{ opacity: 0, y: 28, rotate: index % 2 ? 1.5 : -1.5, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28, delay: Math.min(index, 8) * 0.04 }}
      style={popStyle(best.kind)}
      className="grid min-w-0 grid-cols-[6.75rem_minmax(0,1fr)] gap-x-4 sm:flex sm:flex-col"
    >
      <div className="relative self-start sm:self-auto">
        <Photo
          info={info}
          name={story.name}
          sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 7rem"
          className="aspect-[4/5] sm:aspect-[4/3]"
        />
        {mode === 'hype' && <AgeBadge years={best.age.years} exact={best.age.exact} />}
      </div>
      <div className="min-w-0">
        <div className="mb-1.5 sm:mt-4">
          <DeskTag kind={best.kind} />
        </div>
        <h3 className="display m-0 text-[1.45rem] leading-[1.02] [overflow-wrap:anywhere] sm:text-[1.75rem]">
          {headline(story.name, best.verb, best.kind, best.thing)}
        </h3>
        {info?.description && (
          <p className="m-0 mt-1.5 text-[0.95rem] leading-snug text-muted sm:text-base">
            {info.description}
          </p>
        )}
        <p className="m-0 mt-1.5 text-[0.95rem] font-semibold">{dateline(best, mode, age)}</p>
        <MoreDeeds deeds={rest} mode={mode} age={age} />
        <WikipediaLink story={story} />
      </div>
    </m.article>
  );
}

function AgeBadge({ years, exact }: { years: number; exact: boolean }) {
  return (
    <span className="stamp absolute -bottom-2.5 left-1.5 text-sm sm:-bottom-3 sm:left-3 sm:text-lg">
      {exact ? `At ${years}` : `At about ${years}`}
    </span>
  );
}

/** Tilts the lead photo a little towards the mouse. Touch and pens leave it flat. */
function useTilt() {
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 220, damping: 18 });
  const springY = useSpring(rotateY, { stiffness: 220, damping: 18 });
  return {
    style: { rotateX: springX, rotateY: springY, transformPerspective: 900 },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== 'mouse') return;
      const rect = event.currentTarget.getBoundingClientRect();
      rotateY.set(((event.clientX - rect.left) / rect.width - 0.5) * 10);
      rotateX.set(-((event.clientY - rect.top) / rect.height - 0.5) * 10);
    },
    onPointerLeave: () => {
      rotateX.set(0);
      rotateY.set(0);
    },
  };
}

export function LeadStory({ story, info, mode, age, line }: StoryProps & { line: string }) {
  const [best, ...rest] = story.deeds;
  const tilt = useTilt();
  if (!best) return null;
  return (
    <article
      style={popStyle(best.kind)}
      className="grid gap-x-8 gap-y-5 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]"
    >
      <m.div
        className="relative"
        style={tilt.style}
        onPointerMove={tilt.onPointerMove}
        onPointerLeave={tilt.onPointerLeave}
      >
        <Photo
          info={info}
          name={story.name}
          sizes="(min-width: 768px) 30rem, 92vw"
          eager
          className="lead-photo aspect-[4/5] max-h-[34rem] w-full"
        />
        <m.span
          initial={{ scale: 2.4, rotate: -24, opacity: 0 }}
          animate={{ scale: 1, rotate: mode === 'roast' ? -11 : -6, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 16, delay: 0.2 }}
          className="stamp absolute top-4 right-3 text-[clamp(1.6rem,7vw,2.6rem)]"
        >
          {mode === 'roast' ? 'Roasted' : 'Still time'}
        </m.span>
      </m.div>
      <div className="min-w-0">
        <DeskTag kind={best.kind} />
        <h3 className="display m-0 mt-2 text-[clamp(2.4rem,9.5vw,4.6rem)] leading-[0.95] [overflow-wrap:anywhere]">
          {headline(story.name, best.verb, best.kind, best.thing)}
        </h3>
        {info?.description && <p className="m-0 mt-3 text-xl text-muted">{info.description}</p>}
        <p className="m-0 mt-3 text-lg font-semibold">{dateline(best, mode, age)}</p>
        <p className="m-0 mt-5 border-l-[6px] border-accent bg-paper-2 py-3 pr-3 pl-4 text-xl leading-snug">
          {mode === 'roast' ? (
            <>
              <strong>Meanwhile, you:</strong> {line}
            </>
          ) : (
            line
          )}
        </p>
        <MoreDeeds deeds={rest} mode={mode} age={age} />
        <WikipediaLink story={story} />
      </div>
    </article>
  );
}

export function Classified({ title, body }: { title: string; body: string }) {
  return (
    <aside className="flex flex-col justify-center border-[3px] border-double border-rule bg-paper-2 p-5 in-data-[edition=hype]:rounded-3xl">
      <p className="display m-0 text-[1.9rem] leading-none">{title}</p>
      <p className="m-0 mt-2 text-lg leading-snug">{body}</p>
    </aside>
  );
}
