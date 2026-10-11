/** The front page for one age: the press room while searching, then the stories. */
import { Check, LoaderCircle, RotateCcw, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { type DeskStatus, useEdition } from '../lib/edition.ts';
import { CLASSIFIEDS, DESKS, hash, leadLine, PRESS_LINES, pick } from '../lib/lines.ts';
import type { FailureReason } from '../lib/qlever.ts';
import { KINDS, type Kind, type Mode } from '../lib/sparql.ts';
import { ShareBar } from './ShareBar.tsx';
import { Classified, LeadStory, StoryCard } from './Story.tsx';

const PAGE = 24;
const CLASSIFIED_EVERY = 9;

const FAILURES: Record<FailureReason, string> = {
  busy: 'The Wikidata search server is busy right now.',
  timeout: 'The Wikidata search server took too long to answer.',
  offline: 'Your device seems to be offline.',
  server: 'The Wikidata search server had a problem.',
  'bad-response': 'The Wikidata search server sent an answer we could not read.',
};

export function Results({
  age,
  mode,
  focusToken,
}: {
  age: number;
  mode: Mode;
  focusToken: number;
}) {
  const { edition, retryFailed } = useEdition(age, mode);
  const current = edition && edition.age === age && edition.mode === mode ? edition : undefined;
  // How many stories are visible; a new search starts again from the first page.
  const searchKey = `${mode}:${age}`;
  const [paging, setPaging] = useState({ key: searchKey, shown: PAGE });
  const shown = paging.key === searchKey ? paging.shown : PAGE;
  const heading = useRef<HTMLHeadingElement>(null);

  // After the reader submits an age, bring the results into view.
  useEffect(() => {
    if (!focusToken || !heading.current) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    heading.current.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    heading.current.focus({ preventScroll: true });
  }, [focusToken]);

  const stories = current?.stories ?? [];
  const done = current?.status === 'done';
  const failed = KINDS.filter((kind) => current?.desks[kind] === 'failed');
  const allFailed = done && failed.length === KINDS.length;
  const seed = hash(`${mode}:${age}:${current?.run ?? 0}`);
  // The lead story is chosen once the whole front page is in, then stays put during retries.
  const [lead, ...others] = current?.printed ? stories : [undefined, ...stories];
  const visible = others.slice(0, shown);
  const classifieds = CLASSIFIEDS[mode];

  const title =
    mode === 'roast' ? `What famous people did at ${age}` : `Who did their big thing after ${age}`;

  return (
    <section
      aria-labelledby="results-title"
      className="mx-auto mt-10 max-w-6xl scroll-mt-4 px-4 pb-6 sm:mt-14 sm:px-6"
    >
      <hr className="rule-heavy" />
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
        <h2
          id="results-title"
          ref={heading}
          tabIndex={-1}
          className="display m-0 text-[clamp(1.6rem,5.5vw,2.4rem)] leading-tight outline-none"
        >
          {title}
        </h2>
        <p className="m-0 text-muted" role="status" aria-live="polite">
          {statusText(stories.length, done, failed)}
        </p>
      </div>
      <hr className="rule-thin" />

      {!done && <PressRoom mode={mode} desks={current?.desks} />}

      {allFailed && current && (
        <Jammed reason={Object.values(current.failures)[0] ?? 'server'} onRetry={retryFailed} />
      )}

      {done && !allFailed && stories.length === 0 && <EmptyEdition age={age} mode={mode} />}

      {lead && (
        <div className="py-6 sm:py-8">
          <LeadStory
            story={lead}
            info={current?.people[lead.id]}
            mode={mode}
            age={age}
            line={leadLine(mode, seed)}
          />
        </div>
      )}

      {visible.length > 0 && (
        <>
          {lead && <hr className="rule-heavy" />}
          <div className="grid gap-x-7 gap-y-7 py-7 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-3">
            {visible.flatMap((story, index) => {
              const items = [
                story && (
                  <StoryCard
                    key={story.id}
                    story={story}
                    info={current?.people[story.id]}
                    mode={mode}
                    age={age}
                  />
                ),
              ];
              const slot = index + 1;
              if (done && slot % CLASSIFIED_EVERY === 0 && slot / CLASSIFIED_EVERY <= 3) {
                const ad = pick(classifieds, seed, slot / CLASSIFIED_EVERY);
                items.push(<Classified key={`ad${slot}`} title={ad.title} body={ad.body} />);
              }
              return items;
            })}
          </div>
        </>
      )}

      {others.length > shown && (
        <div className="pb-6">
          <button
            type="button"
            onClick={() => setPaging({ key: searchKey, shown: shown + PAGE })}
            className="min-h-12 w-full border-2 border-rule px-5 text-lg font-semibold hover:bg-paper-2 sm:w-auto in-data-[edition=hype]:rounded-full"
          >
            Show {Math.min(PAGE, others.length - shown)} more stories
          </button>
        </div>
      )}

      {done && failed.length > 0 && !allFailed && (
        <div className="mb-6 flex flex-col gap-3 border-2 border-dashed border-rule p-4 sm:flex-row sm:items-center">
          <p className="m-0 flex-1">
            {failed.length === 1 ? 'One desk' : `${failed.length} desks`} did not answer:{' '}
            {failed.map((kind) => DESKS[kind]).join(', ')}.
          </p>
          <RetryButton onClick={retryFailed}>
            Try {failed.length === 1 ? 'it' : 'them'} again
          </RetryButton>
        </div>
      )}

      {done && stories.length > 0 && current && (
        <ShareBar edition={current} line={leadLine(mode, seed)} />
      )}
    </section>
  );
}

function statusText(count: number, done: boolean, failed: Kind[]): string {
  const stories = count === 1 ? '1 story' : `${count} stories`;
  if (!done) return count ? `${stories} so far. Still searching…` : 'Searching Wikidata…';
  if (failed.length === KINDS.length) return 'The search failed.';
  return failed.length ? `${stories}. Some desks did not answer.` : `${stories}.`;
}

function PressRoom({ mode, desks }: { mode: Mode; desks: Record<Kind, DeskStatus> | undefined }) {
  const lines = PRESS_LINES[mode];
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1800);
    return () => clearInterval(timer);
  }, []);
  const finished = desks
    ? KINDS.filter((k) => desks[k] === 'done' || desks[k] === 'failed').length
    : 0;

  return (
    <div className="my-6 border-[3px] border-rule p-5 sm:p-7 in-data-[edition=hype]:rounded-3xl">
      <p className="display m-0 text-[clamp(2rem,8vw,3.4rem)] leading-none">Stop the presses!</p>
      <p className="m-0 mt-2 min-h-[1.6em] text-xl text-muted" aria-hidden="true">
        {lines[tick % lines.length]}
      </p>
      <div
        className="mt-4 h-2.5 overflow-hidden bg-paper-2 in-data-[edition=hype]:rounded-full"
        role="progressbar"
        aria-label="Desks finished"
        aria-valuemin={0}
        aria-valuemax={KINDS.length}
        aria-valuenow={finished}
      >
        <div
          className="h-full bg-accent transition-[width] duration-500"
          style={{ width: `${Math.max(6, (finished / KINDS.length) * 100)}%` }}
        />
      </div>
      <ul className="m-0 mt-4 grid list-none gap-x-6 gap-y-1.5 p-0 sm:grid-cols-2">
        {KINDS.map((kind) => (
          <li key={kind} className="flex items-center gap-2">
            <DeskIcon status={desks?.[kind] ?? 'waiting'} />
            <span>{DESKS[kind]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeskIcon({ status }: { status: DeskStatus }) {
  if (status === 'done')
    return <Check size={18} strokeWidth={3} className="text-ink" aria-label="done" role="img" />;
  if (status === 'failed')
    return (
      <X size={18} strokeWidth={3} className="text-accent-ink" aria-label="no answer" role="img" />
    );
  if (status === 'working')
    return (
      <LoaderCircle
        size={18}
        strokeWidth={2.5}
        className="animate-spin text-muted"
        aria-label="searching"
        role="img"
      />
    );
  return (
    <span
      className="inline-block size-[18px] rounded-full border-2 border-dotted border-muted"
      aria-label="waiting"
      role="img"
    />
  );
}

function Jammed({ reason, onRetry }: { reason: FailureReason; onRetry: () => void }) {
  return (
    <div className="my-8 border-[3px] border-rule p-5 sm:p-7 in-data-[edition=hype]:rounded-3xl">
      <p className="display m-0 text-[clamp(2rem,8vw,3.4rem)] leading-none">The press jammed</p>
      <p className="m-0 mt-3 text-xl">{FAILURES[reason]}</p>
      <p className="m-0 mt-1 text-muted">
        Nothing is saved, so trying again asks Wikidata fresh. It usually works on the second go.
      </p>
      <div className="mt-5">
        <RetryButton onClick={onRetry}>Try again</RetryButton>
      </div>
    </div>
  );
}

function RetryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-12 items-center gap-2 bg-ink px-5 text-lg font-semibold text-paper in-data-[edition=hype]:rounded-full"
    >
      <RotateCcw size={18} strokeWidth={2.5} aria-hidden="true" />
      {children}
    </button>
  );
}

function EmptyEdition({ age, mode }: { age: number; mode: Mode }) {
  const roast =
    age < 10
      ? 'Most legends were busy learning to tie their shoes.'
      : age > 95
        ? `At ${age}, you have outlasted most of history. That counts.`
        : 'You win by default.';
  return (
    <div className="my-8 border-[3px] border-rule p-5 sm:p-7 in-data-[edition=hype]:rounded-3xl">
      <p className="display m-0 text-[clamp(2rem,8vw,3.4rem)] leading-none">Nothing to report</p>
      <p className="m-0 mt-3 text-xl">
        {mode === 'roast'
          ? `Wikidata has no famous achievements dated to age ${age}. ${roast}`
          : `Nobody famous in Wikidata did their big thing after ${age}. The record is yours to set.`}
      </p>
      <p className="m-0 mt-1 text-muted">Try another age above.</p>
    </div>
  );
}
