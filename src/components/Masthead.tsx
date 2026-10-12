/** The nameplate at the top, plus the switch between the two editions. */
import { Flame, Sprout } from 'lucide-react';
import type { Mode } from '../lib/sparql.ts';

export const PAPERS: Record<Mode, { name: string; motto: string }> = {
  roast: {
    name: 'The Daily Disappointment',
    motto: 'Comparing you to legends since the day you were born',
  },
  hype: {
    name: 'The Late Bloomer Times',
    motto: 'Good news for people who are just getting started',
  },
};

const today = new Intl.DateTimeFormat('en', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}).format(new Date());

export function Masthead({
  mode,
  onModeChange,
}: {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}) {
  const paper = PAPERS[mode];
  return (
    <header className="mx-auto max-w-6xl px-4 pt-3 sm:px-6 sm:pt-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pb-2 text-sm text-muted">
        <p className="m-0">{today}</p>
        <EditionSwitch mode={mode} onChange={onModeChange} />
      </div>
      <div
        className={
          mode === 'roast'
            ? 'bg-accent px-3 pt-2 pb-3 text-on-accent sm:px-5'
            : 'border-y-[6px] border-double border-rule py-3'
        }
      >
        <p className="nameplate m-0 text-[clamp(2.1rem,9.6vw,5.4rem)]">{paper.name}</p>
      </div>
      <p className="m-0 border-b-[1.5px] border-rule py-1.5 text-sm text-muted">{paper.motto}</p>
    </header>
  );
}

function EditionSwitch({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  const options = [
    { value: 'roast' as const, label: 'Roast', icon: Flame },
    { value: 'hype' as const, label: 'Hype', icon: Sprout },
  ];
  return (
    <fieldset className="m-0 flex border-0 p-0">
      <legend className="sr-only">Edition</legend>
      <div className="flex rounded-full border-2 border-rule p-0.5">
        {options.map(({ value, label, icon: Icon }) => (
          <label
            key={value}
            className="relative flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[0.95rem] font-semibold text-ink has-checked:bg-ink has-checked:text-paper has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-ink"
          >
            <input
              type="radio"
              name="edition"
              value={value}
              checked={mode === value}
              onChange={() => onChange(value)}
              className="sr-only"
            />
            <Icon size={16} strokeWidth={2.5} aria-hidden="true" />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
