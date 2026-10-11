import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { AgeForm } from './components/AgeForm.tsx';
import { Footer } from './components/Footer.tsx';
import { Masthead, PAPERS } from './components/Masthead.tsx';
import { Results } from './components/Results.tsx';
import type { Mode } from './lib/sparql.ts';
import { useSearch } from './lib/useSearch.ts';

export function App() {
  const [search, navigate] = useSearch();
  const [focusToken, setFocusToken] = useState(0);
  const paper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.dataset.edition = search.mode;
    document.title =
      search.age === undefined
        ? 'At Your Age… What had famous people done by your age?'
        : `At ${search.age}… | ${PAPERS[search.mode].name}`;
  }, [search.age, search.mode]);

  // Switching editions flips the whole paper over (unless the reader prefers less motion).
  const switchMode = async (mode: Mode) => {
    if (mode === search.mode) return;
    const page = paper.current;
    const flip =
      page &&
      typeof page.animate === 'function' &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches;
    let away: Animation | undefined;
    if (flip) {
      page.style.transformOrigin = `50% ${window.scrollY + window.innerHeight / 2}px`;
      away = page.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(90deg)' }], {
        duration: 200,
        easing: 'ease-in',
        fill: 'forwards',
      });
      await away.finished.catch(() => {});
    }
    flushSync(() => {
      document.documentElement.dataset.edition = mode;
      navigate({ ...search, mode });
    });
    if (flip) {
      away?.cancel();
      await page
        .animate([{ transform: 'rotateY(-90deg)' }, { transform: 'rotateY(0deg)' }], {
          duration: 260,
          easing: 'ease-out',
        })
        .finished.catch(() => {});
    }
  };

  return (
    <div className="[perspective:2400px]">
      <div ref={paper} className="min-h-dvh [backface-visibility:hidden]">
        <Masthead mode={search.mode} onModeChange={switchMode} />
        <main id="main">
          <h1 className="sr-only">At Your Age: what had famous people done by your age?</h1>
          <AgeForm
            age={search.age}
            mode={search.mode}
            onSubmit={(age) => {
              navigate({ age, mode: search.mode });
              setFocusToken((token) => token + 1);
            }}
          />
          {search.age !== undefined && (
            <Results age={search.age} mode={search.mode} focusToken={focusToken} />
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}
