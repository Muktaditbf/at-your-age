/**
 * The hero: the app's name is the form. "At [your age]…": type a number where it says
 * "your age", or slide the ruler, and the headline becomes "At 24…" with the digits rolling.
 */
import { m } from 'motion/react';
import { type FormEvent, useEffect, useId, useState } from 'react';
import { stepAge } from '../lib/ruler.ts';
import { MAX_AGE, MIN_AGE, type Mode } from '../lib/sparql.ts';
import { parseAge } from '../lib/url.ts';
import { warmUp } from '../lib/warmUp.ts';
import { AgeRuler } from './AgeRuler.tsx';
import { RollingNumber } from './RollingNumber.tsx';

const COPY: Record<Mode, { intro: string; submit: string }> = {
  roast: {
    intro: 'Pick your age. See what famous people had already done by then. Brace yourself.',
    submit: 'Roast me',
  },
  hype: {
    intro: 'Pick your age. See who did their big thing later than that. You have time, bestie.',
    submit: 'Hype me up',
  },
};

export function AgeForm({
  age,
  mode,
  onSubmit,
}: {
  age: number | undefined;
  mode: Mode;
  onSubmit: (age: number) => void;
}) {
  const [value, setValue] = useState(age === undefined ? '' : String(age));
  const [error, setError] = useState(false);
  const [typing, setTyping] = useState(false);
  const hintId = useId();
  const errorId = useId();

  // Back/forward or a shared link changed the age: show it.
  useEffect(() => {
    setValue(age === undefined ? '' : String(age));
    setError(false);
  }, [age]);

  const picked = parseAge(value);
  // The age on screen differs from the results below: say so on the button.
  const pending = age !== undefined && picked !== undefined && picked !== age;

  const submit = (text: string) => {
    const parsed = parseAge(text);
    if (parsed === undefined) {
      setError(true);
      document.getElementById('age')?.focus();
      return;
    }
    setError(false);
    setValue(String(parsed));
    onSubmit(parsed);
  };

  const pick = (next: number) => {
    setValue(String(next));
    setError(false);
    warmUp();
  };

  const onFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit(value);
  };

  return (
    <form
      onSubmit={onFormSubmit}
      noValidate
      className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(20rem,1fr)] lg:items-end lg:gap-x-14"
    >
      <p className="display m-0 text-[clamp(3.6rem,19vw,10.5rem)] leading-[0.9] lg:text-[8.5rem]">
        <span aria-hidden="true">At </span>
        <span className="inline-flex items-baseline whitespace-nowrap">
          <span className="relative inline-block">
            <span
              aria-hidden="true"
              className="invisible block h-[1.04em] whitespace-pre px-[0.04em] leading-[1.04]"
            >
              {value || 'your age'}
            </span>
            <input
              id="age"
              name="age"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              enterKeyHint="search"
              maxLength={3}
              placeholder="your age"
              aria-label="Your age"
              aria-describedby={error ? `${hintId} ${errorId}` : hintId}
              aria-invalid={error || undefined}
              value={value}
              onFocus={() => {
                setTyping(true);
                warmUp();
              }}
              onBlur={() => setTyping(false)}
              onChange={(event) => {
                setValue(event.target.value.replace(/\D/g, '').slice(0, 3));
                setError(false);
              }}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
                event.preventDefault();
                const next = stepAge(parseAge(value), event.key);
                if (next !== undefined) pick(next);
              }}
              className={`display absolute inset-0 h-full w-full min-w-0 border-0 border-b-[0.055em] border-dashed border-accent-ink bg-transparent px-[0.04em] py-0 leading-[1.04] caret-accent-ink outline-none placeholder:text-accent-ink placeholder:opacity-55 focus-visible:border-solid focus-visible:bg-paper-2 ${typing || !value ? 'text-accent-ink' : 'text-transparent'}`}
            />
            {/* While not typing, the digits roll when the age changes. */}
            {!typing && value && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 block px-[0.04em] leading-[1.04] text-accent-ink"
              >
                <RollingNumber value={value} />
              </span>
            )}
          </span>
          <span aria-hidden="true">…</span>
        </span>
      </p>

      <div className="lg:pb-2">
        <p id={hintId} className="mt-5 mb-0 max-w-[34rem] text-lg text-muted sm:text-xl lg:mt-0">
          {COPY[mode].intro}
        </p>
        {error && (
          <p id={errorId} role="alert" className="mt-2 mb-0 font-semibold text-accent-ink">
            Type an age from {MIN_AGE} to {MAX_AGE}, in whole years.
          </p>
        )}

        <div className="mt-5">
          <AgeRuler
            value={picked}
            onChange={pick}
            onCommit={() => submit(value)}
            describedBy={hintId}
          />
        </div>

        <m.button
          type="submit"
          whileTap={{ scale: 0.96, x: 2, y: 2 }}
          animate={pending ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={pending ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } : undefined}
          className="display mt-6 inline-flex min-h-14 items-center bg-accent px-7 text-[1.65rem] leading-none text-on-accent shadow-[4px_4px_0_var(--rule)] in-data-[edition=hype]:rounded-full"
        >
          {pending ? `${COPY[mode].submit} at ${picked}` : COPY[mode].submit}
        </m.button>
      </div>
    </form>
  );
}
