/** Credits, honesty notes and the theme switch. */
import { Monitor, Moon, Sun } from 'lucide-react';
import { setTheme, type Theme, useTheme } from '../lib/theme.ts';

export function Footer() {
  return (
    <footer className="mx-auto mt-10 max-w-6xl px-4 pb-10 sm:px-6">
      <hr className="rule-heavy" />
      <div className="grid gap-8 pt-6 text-[0.95rem] text-muted md:grid-cols-[2fr_1fr]">
        <div className="space-y-3">
          <p>
            Facts come live from{' '}
            <a href="https://www.wikidata.org/" target="_blank" rel="noopener">
              Wikidata
            </a>{' '}
            through{' '}
            <a href="https://qlever.dev/wikidata" target="_blank" rel="noopener">
              QLever
            </a>
            , a fast public search engine for it from the University of Freiburg. Photos and
            one-line bios come from Wikipedia and Wikimedia Commons.
          </p>
          <p>
            Ages are worked out from the dates on Wikidata. When only the year (or month) is known,
            the paper says “around”. Wikidata is written by volunteers, so now and then a date is
            wrong: each story links to its source.
          </p>
          <p>
            Private by design: no accounts, no cookies, no tracking. The only thing sent anywhere is
            the age you type, inside the search, and the names in your results, to fetch photos.
          </p>
          <p>
            <a href="https://github.com/Muktaditbf/at-your-age" target="_blank" rel="noopener">
              Open source on GitHub
            </a>
            . Made by Muktaditbf.
          </p>
        </div>
        <ThemeSwitch />
      </div>
    </footer>
  );
}

function ThemeSwitch() {
  const theme = useTheme();
  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'system', label: 'Auto', icon: Monitor },
    { value: 'light', label: 'Day', icon: Sun },
    { value: 'dark', label: 'Night', icon: Moon },
  ];
  return (
    <fieldset className="m-0 self-start border-0 p-0">
      <legend className="mb-2 p-0 text-ink">Print</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(({ value, label, icon: Icon }) => (
          <label
            key={value}
            className="flex min-h-11 cursor-pointer items-center gap-1.5 border-2 border-rule px-3 text-ink has-checked:bg-ink has-checked:text-paper has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-ink in-data-[edition=hype]:rounded-full"
          >
            <input
              type="radio"
              name="theme"
              value={value}
              checked={theme === value}
              onChange={() => setTheme(value)}
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
