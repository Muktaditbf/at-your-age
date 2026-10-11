/**
 * The hero: the app's name is the form. "At [your age]…" — type a number where it says
 * "your age", and the headline becomes "At 24…".
 */
import { Minus, Plus } from 'lucide-react';
import { type FormEvent, useEffect, useId, useState } from 'react';
import { MAX_AGE, MIN_AGE, type Mode } from '../lib/sparql.ts';
import { parseAge } from '../lib/url.ts';
import { warmUp } from '../lib/warmUp.ts';

const QUICK_PICKS = [18, 21, 25, 30, 40, 50, 65];

const COPY: Record<Mode, { intro: string; submit: string }> = {
  roast: {
    intro: 'Type your age. See what famous people had already done by then.',
    submit: 'Roast me',
  },
  hype: {
    intro: 'Type your age. See who did their big thing later than that.',
    submit: 'Hype me',
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
  const hintId = useId();
  const errorId = useId();

  // Back/forward or a shared link changed the age: show it.
  useEffect(() => {
    setValue(age === undefined ? '' : String(age));
    setError(false);
  }, [age]);

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

  const step = (delta: number) => {
    const current = parseAge(value) ?? (delta > 0 ? MIN_AGE - 1 : MAX_AGE + 1);
    const next = Math.min(MAX_AGE, Math.max(MIN_AGE, current + delta));
    setValue(String(next));
    setError(false);
  };

  const onFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit(value);
  };

  return (
    <form
      onSubmit={onFormSubmit}
      noValidate
      className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(19rem,1fr)] lg:items-end lg:gap-x-14"
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
              onFocus={warmUp}
              onChange={(event) => {
                setValue(event.target.value.replace(/\D/g, '').slice(0, 3));
                setError(false);
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  step(1);
                } else if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  step(-1);
                }
              }}
              className="display absolute inset-0 h-full w-full min-w-0 border-0 border-b-[0.055em] border-dashed border-accent-ink bg-transparent px-[0.04em] py-0 leading-[1.04] text-accent-ink caret-accent-ink outline-none placeholder:text-accent-ink placeholder:opacity-55 focus-visible:border-solid focus-visible:bg-paper-2"
            />
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

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="display inline-flex min-h-14 items-center bg-accent px-7 text-[1.65rem] leading-none text-on-accent shadow-[4px_4px_0_var(--rule)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_var(--rule)] in-data-[edition=hype]:rounded-full"
          >
            {COPY[mode].submit}
          </button>
          <div className="flex gap-1.5">
            <StepButton label="One year younger" onClick={() => step(-1)}>
              <Minus size={20} strokeWidth={2.75} aria-hidden="true" />
            </StepButton>
            <StepButton label="One year older" onClick={() => step(1)}>
              <Plus size={20} strokeWidth={2.75} aria-hidden="true" />
            </StepButton>
          </div>
        </div>

        <fieldset className="m-0 mt-5 border-0 p-0">
          <legend className="mb-2 p-0 text-sm text-muted">Or pick one</legend>
          <div className="flex flex-wrap gap-2">
            {QUICK_PICKS.map((pick) => (
              <button
                key={pick}
                type="button"
                onClick={() => submit(String(pick))}
                aria-pressed={age === pick}
                className="min-h-11 min-w-12 border-2 border-rule px-3 text-lg font-semibold tabular-nums text-ink hover:bg-paper-2 aria-pressed:bg-ink aria-pressed:text-paper in-data-[edition=hype]:rounded-full"
              >
                {pick}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </form>
  );
}

function StepButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-12 place-items-center border-2 border-rule text-ink hover:bg-paper-2 in-data-[edition=hype]:rounded-full"
    >
      {children}
    </button>
  );
}
